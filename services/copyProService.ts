/**
 * CopyPro Service - Platform-Aware Content Generation
 * 
 * This service chains:
 * 1. Platform Doctrine (e.g., LinkedIn rules) - Applied FIRST
 * 2. CopyPro (platform-agnostic writing intelligence)
 * 3. SourcePack (evidence base)
 * 
 * Flow: Platform Doctrine → CopyPro → Content
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  CopyProConfig, 
  CopyProMode, 
  CopyProTone, 
  CopyProFormat,
  Platform,
  CopyProValidation,
  LearningContext,
  buildCopyProPrompt 
} from '../prompts/copyPro';
import { 
  SourceMaterial, 
  SourcePack, 
  buildExtractionPrompt, 
  formatSourcePackForPrompt,
  createEmptySourcePack,
  parseSourcePackResponse,
  SOURCEPACK_MERGER_PROMPT
} from '../prompts/sourcePackBuilder';
import { getPlatformDoctrine } from '../prompts/platforms';
import { fetchTranscript } from './apifyService';
import { extractPdfContent } from './geminiService';
import { db } from '../db/db';

// ============================================================================
// TYPES
// ============================================================================

export interface CopyProOutput {
  content: string;
  validation?: CopyProValidation;
  iteration: number;
  sourcePack: SourcePack;
  config: CopyProConfig;
  platform: Platform;
}

export interface RefinementRequest {
  previousOutput: string;
  rating: number;
  feedback: string;
  sourcePack: SourcePack;
  config: CopyProConfig;
  iteration: number;
}

// ============================================================================
// AI CLIENT
// ============================================================================

const getAI = () => {
  // Support both old process.env and new import.meta.env patterns
  // Vite config maps these from .env.local
  const apiKey = 
    import.meta.env.VITE_API_KEY || 
    import.meta.env.VITE_GEMINI_API_KEY || 
    (typeof process !== 'undefined' && process.env?.API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    '';
    
  if (!apiKey) {
    console.warn("WARNING: No Gemini API Key detected for CopyPro. Ensure API_KEY is set in .env.local");
  }
  return new GoogleGenerativeAI(apiKey);
};

// ============================================================================
// LEARNING CONTEXT (from past ratings)
// ============================================================================

/**
 * Fetch learning context from past content ratings
 * Returns successful examples (4-5 stars) and patterns to avoid (1-2 stars)
 */
export async function getLearningContext(
  platform: Platform,
  format: CopyProFormat
): Promise<LearningContext> {
  try {
    // Get all ratings for this platform/format, sorted by rating
    const allRatings = await db.contentRatings
      .where('platform')
      .equals(platform)
      .and(r => r.format === format)
      .reverse()
      .sortBy('createdAt');

    // Get successful examples (4-5 stars with finalOutput)
    const successfulExamples = allRatings
      .filter(r => r.rating >= 4 && r.finalOutput)
      .slice(0, 5)
      .map(r => ({
        output: r.finalOutput!,
        feedback: r.feedback
      }));

    // Get patterns to avoid (1-2 stars)
    const patternsToAvoid = allRatings
      .filter(r => r.rating <= 2 && r.feedback)
      .slice(0, 5)
      .map(r => ({
        output: r.outputSample,
        feedback: r.feedback
      }));

    console.log(`[CopyPro Learning] Found ${successfulExamples.length} success examples, ${patternsToAvoid.length} patterns to avoid`);

    return {
      successfulExamples,
      patternsToAvoid
    };
  } catch (error) {
    console.error('Failed to fetch learning context:', error);
    return {
      successfulExamples: [],
      patternsToAvoid: []
    };
  }
}

// ============================================================================
// SOURCE INGESTION
// ============================================================================

/**
 * Ingest a single source and extract its content
 * Uses Apify for URL/video scraping (more reliable than Gemini's google_search)
 */
export async function ingestSource(source: SourceMaterial): Promise<SourceMaterial> {
  try {
    let content = '';

    switch (source.type) {
      case 'url':
      case 'video':
        // Use Apify for reliable web scraping
        console.log(`[CopyPro] Ingesting URL via Apify: ${source.source}`);
        const result = await fetchTranscript(source.source);
        content = result.transcriptText;
        
        // Add title/author metadata if available
        if (result.title) {
          content = `TITLE: ${result.title}\n${result.author ? `AUTHOR: ${result.author}\n` : ''}\n---\n\n${content}`;
        }
        break;
      
      case 'pdf':
        // Use Gemini Vision API to extract text from PDF
        console.log(`[CopyPro] Extracting PDF via Gemini Vision: ${source.source}`);
        content = await extractPdfContent(source.content, source.source);
        break;
      
      case 'file':
      case 'text':
        // Text files and manual notes are already readable
        content = source.content;
        break;
      
      default:
        content = source.content;
    }

    return {
      ...source,
      content,
      status: 'ready',
      extractedAt: Date.now()
    };
  } catch (error) {
    console.error(`Failed to ingest source ${source.source}:`, error);
    return {
      ...source,
      status: 'error',
      content: `Error: ${(error as Error).message}`
    };
  }
}

/**
 * Ingest multiple sources in parallel
 */
export async function ingestAllSources(
  sources: SourceMaterial[],
  onProgress?: (sourceId: string, status: SourceMaterial['status']) => void
): Promise<SourceMaterial[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      onProgress?.(source.id, 'processing');
      const result = await ingestSource(source);
      onProgress?.(source.id, result.status);
      return result;
    })
  );
  return results;
}

// ============================================================================
// SOURCEPACK BUILDING
// ============================================================================

/**
 * Build a SourcePack from ingested sources
 */
export async function buildSourcePack(sources: SourceMaterial[]): Promise<SourcePack> {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const readySources = sources.filter(s => s.status === 'ready');
  
  if (readySources.length === 0) {
    return createEmptySourcePack();
  }

  const combinedContent = readySources
    .map((s, i) => `--- SOURCE ${i + 1}: ${s.source} ---\n${s.content}`)
    .join('\n\n');

  const prompt = buildExtractionPrompt(combinedContent);

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseSourcePackResponse(responseText);

    // If parsing failed (empty object), create fallback SourcePack from raw sources
    if (Object.keys(parsed).length === 0 && readySources.length > 0) {
      console.warn('[CopyPro] SourcePack parsing failed, using raw sources as fallback');
      return {
        ...createEmptySourcePack(),
        rawSources: readySources,
        quality: 'weak',
        qualityNotes: 'Auto-extraction failed. Using raw source content for generation.',
        // Extract basic content snippets as facts
        verifiedFacts: readySources
          .slice(0, 5)
          .map(s => s.content.substring(0, 300).trim())
          .filter(Boolean)
      };
    }

    const sourcePack: SourcePack = {
      ...createEmptySourcePack(),
      ...parsed,
      rawSources: readySources
    };

    return sourcePack;
  } catch (error) {
    console.error('Failed to build SourcePack:', error);
    return {
      ...createEmptySourcePack(),
      rawSources: readySources,
      quality: 'weak',
      qualityNotes: `Extraction failed: ${(error as Error).message}`
    };
  }
}

/**
 * Merge multiple SourcePacks into one
 */
export async function mergeSourcePacks(packs: SourcePack[]): Promise<SourcePack> {
  if (packs.length === 0) return createEmptySourcePack();
  if (packs.length === 1) return packs[0];

  const genAI = getAI();
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const packsJson = packs.map(p => JSON.stringify(p, null, 2)).join('\n\n---\n\n');
  const prompt = SOURCEPACK_MERGER_PROMPT + '\n\nSOURCEPACKS TO MERGE:\n' + packsJson;

  try {
    const result = await model.generateContent(prompt);
    const parsed = parseSourcePackResponse(result.response.text());
    return {
      ...createEmptySourcePack(),
      ...parsed,
      rawSources: packs.flatMap(p => p.rawSources)
    };
  } catch (error) {
    console.error('Failed to merge SourcePacks:', error);
    return {
      ...packs[0],
      rawSources: packs.flatMap(p => p.rawSources)
    };
  }
}

// ============================================================================
// CONTENT GENERATION (Platform-Aware)
// ============================================================================

/**
 * Generate content using Platform Doctrine + CopyPro
 * 
 * Flow:
 * 1. Get platform doctrine (e.g., LinkedIn rules)
 * 2. Build prompt with doctrine FIRST, then CopyPro
 * 3. Generate content
 */
export async function generateContent(
  sourcePack: SourcePack,
  config: CopyProConfig
): Promise<CopyProOutput> {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Get platform-specific doctrine
  const platformDoctrine = getPlatformDoctrine(config.platform, config.format);
  
  // Format SourcePack for prompt
  const sourcePackText = formatSourcePackForPrompt(sourcePack);
  
  // Fetch learning context from past ratings
  const learningContext = await getLearningContext(config.platform, config.format);
  
  // Log doctrine and SourcePack usage for debugging
  console.log(`[CopyPro] Generating ${config.format} for ${config.platform}`);
  console.log(`[CopyPro] Platform doctrine loaded: ${platformDoctrine.length} chars`);
  console.log(`[CopyPro] SourcePack: ${sourcePack.verifiedFacts?.length || 0} facts, ${sourcePack.quotes?.length || 0} quotes, quality: ${sourcePack.quality || 'unknown'}`);
  console.log(`[CopyPro] Learning context: ${learningContext.successfulExamples.length} successes, ${learningContext.patternsToAvoid.length} avoid patterns`);
  
  // Build prompt: Platform Doctrine FIRST, then CopyPro, then Learning Context
  const prompt = buildCopyProPrompt(config, platformDoctrine, sourcePackText, undefined, undefined, learningContext);

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const validation = extractValidation(content);

    return {
      content: cleanContent(content),
      validation,
      iteration: 1,
      sourcePack,
      config,
      platform: config.platform
    };
  } catch (error) {
    console.error('CopyPro generation failed:', error);
    throw new Error(`Content generation failed: ${(error as Error).message}`);
  }
}

/**
 * Refine content based on user feedback
 */
export async function refineContent(request: RefinementRequest): Promise<CopyProOutput> {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Get platform doctrine
  const platformDoctrine = getPlatformDoctrine(request.config.platform, request.config.format);
  
  // Fetch learning context from past ratings
  const learningContext = await getLearningContext(request.config.platform, request.config.format);
  
  const sourcePackText = formatSourcePackForPrompt(request.sourcePack);
  const prompt = buildCopyProPrompt(
    request.config, 
    platformDoctrine,
    sourcePackText, 
    request.previousOutput,
    { rating: request.rating, feedback: request.feedback },
    learningContext
  );

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const validation = extractValidation(content);

    return {
      content: cleanContent(content),
      validation,
      iteration: request.iteration + 1,
      sourcePack: request.sourcePack,
      config: request.config,
      platform: request.config.platform
    };
  } catch (error) {
    console.error('CopyPro refinement failed:', error);
    throw new Error(`Content refinement failed: ${(error as Error).message}`);
  }
}

// ============================================================================
// IDEATION (Platform-Aware)
// ============================================================================

/**
 * Generate ideas/angles from SourcePack for a specific platform
 */
export async function ideate(
  sourcePack: SourcePack,
  tone: CopyProTone,
  platform: Platform
): Promise<string> {
  const config: CopyProConfig = {
    mode: 'ideate',
    tone,
    format: 'post',
    platform
  };

  const output = await generateContent(sourcePack, config);
  return output.content;
}

// ============================================================================
// DIAGNOSIS (Platform-Aware)
// ============================================================================

/**
 * Diagnose existing content against platform doctrine + CopyPro standards
 */
export async function diagnoseContent(
  content: string,
  platform: Platform,
  sourcePack?: SourcePack
): Promise<string> {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const config: CopyProConfig = {
    mode: 'diagnose',
    tone: 'market-timing',
    format: 'post',
    platform
  };

  const platformDoctrine = getPlatformDoctrine(platform, 'post');
  const sourcePackText = sourcePack 
    ? formatSourcePackForPrompt(sourcePack) 
    : 'No SourcePack provided - diagnose based on content alone.';

  const prompt = buildCopyProPrompt(config, platformDoctrine, sourcePackText, content);

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('CopyPro diagnosis failed:', error);
    throw new Error(`Content diagnosis failed: ${(error as Error).message}`);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract validation block from CopyPro output
 */
function extractValidation(content: string): CopyProValidation | undefined {
  const validationMatch = content.match(/VALIDATION:[\s\S]*?1\.\s*(.+?)[\n\r].*?2\.\s*(.+?)[\n\r].*?3\.\s*(.+?)[\n\r---]/i);
  
  if (validationMatch) {
    return {
      assumptionInvalidated: validationMatch[1].trim(),
      dataSupport: validationMatch[2].trim(),
      decisionToReconsider: validationMatch[3].trim()
    };
  }
  
  return undefined;
}

/**
 * Clean content by removing validation block for display
 * Strips out all variations of the FINAL OUTPUT VALIDATION section
 */
function cleanContent(content: string): string {
  return content
    // Remove dashed validation blocks
    .replace(/---[\s\S]*?VALIDATION:[\s\S]*?---/gi, '')
    // Remove markdown-style FINAL OUTPUT VALIDATION headers and content
    .replace(/\*\*FINAL OUTPUT VALIDATION:\*\*[\s\S]*$/gi, '')
    .replace(/## FINAL OUTPUT VALIDATION[\s\S]*$/gi, '')
    .replace(/# FINAL OUTPUT VALIDATION[\s\S]*$/gi, '')
    // Remove Quality Gate sections that appear in output
    .replace(/\*\*Quality Gate[\s\S]*?actionable advice\.\*/gi, '')
    // Remove numbered validation lists (1. **Quality Gate... 3. **Would a smart...)
    .replace(/\d+\.\s*\*\*Quality Gate.*?(?=\n\n|\n$|$)/gis, '')
    .replace(/\d+\.\s*\*\*Universal Content Formula.*?(?=\n\n|\n$|$)/gis, '')
    .replace(/\d+\.\s*\*\*Would a smart professional.*?(?=\n\n|\n$|$)/gis, '')
    // Remove any stray validation patterns
    .replace(/\*\s*Would a serious professional save this\?[\s\S]*?(?=\n\n|\n$|$)/gi, '')
    .replace(/\*\s*Does this earn attention[\s\S]*?(?=\n\n|\n$|$)/gi, '')
    .replace(/\*\s*Does it invite experience[\s\S]*?(?=\n\n|\n$|$)/gi, '')
    .replace(/\*\s*ATTENTION:[\s\S]*?ACTION:[\s\S]*?(?=\n\n|\n$|$)/gis, '')
    // Clean up any trailing whitespace or empty lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Get quality color for UI
 */
export function getQualityColor(quality: SourcePack['quality']): string {
  switch (quality) {
    case 'strong': return 'text-emerald-400';
    case 'adequate': return 'text-amber-400';
    case 'weak': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

/**
 * Get quality badge styles
 */
export function getQualityBadge(quality: SourcePack['quality']): { bg: string; border: string; text: string } {
  switch (quality) {
    case 'strong':
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' };
    case 'adequate':
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
    case 'weak':
      return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
    default:
      return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };
  }
}
