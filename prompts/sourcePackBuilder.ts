/**
 * SourcePack Builder - Evidence & Signal Intake System
 * 
 * This module handles the extraction and structuring of source material
 * into the SourcePack format required by CopyPro.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SourceMaterial {
  id: string;
  type: 'url' | 'pdf' | 'text' | 'video' | 'file';
  content: string;
  source: string; // URL or filename
  status: 'pending' | 'processing' | 'ready' | 'error';
  extractedAt?: number;
}

export interface SourcePack {
  contextHeader: {
    topic: string;
    assetClass: string;
    markets: string[];
    timeHorizon: string;
    intendedOutput: string;
  };
  verifiedFacts: string[];
  operatingFundamentals: string[];
  capitalSignals: string[];
  supplyPipeline: string[];
  quotes: string[];
  mechanicalImplications: string[];
  commonMisreads: string[];
  investorQuestions: string[];
  rawSources: SourceMaterial[];
  quality: 'strong' | 'adequate' | 'weak';
  qualityNotes: string;
}

// ============================================================================
// SOURCEPACK EXTRACTION PROMPT
// ============================================================================

export const SOURCEPACK_EXTRACTION_PROMPT = `
# SourcePack Extraction Task

You are extracting structured evidence from raw source material to build a SourcePack for CopyPro.

## PURPOSE

SourcePack exists to prevent vague content.
SourcePack defines what exists. CopyPro defines what it means.

## EXTRACTION RULES

1. Extract FACTS ONLY. No adjectives. No conclusions.
2. Each fact must include: metric, timeframe, geography, source reference when available.
3. Quotes must be VERBATIM. No paraphrasing.
4. If data is missing, leave the section empty rather than inventing.
5. Be ruthlessly factual.

## OUTPUT FORMAT (JSON)

Extract the following sections from the provided source material:

{
  "contextHeader": {
    "topic": "Main topic/thesis identified",
    "assetClass": "Real estate asset class (multifamily, office, industrial, etc.)",
    "markets": ["List of geographic markets mentioned"],
    "timeHorizon": "Time period discussed (e.g., '2024-2025', 'Q1 2024')",
    "intendedOutput": "Best suited output type based on content depth"
  },
  "verifiedFacts": [
    "Fact with metric + timeframe + geography + source",
    "Example: Cap rates expanded ~150–250 bps from 2021–2024 across Top-20 MSAs (Source: Research PDF)"
  ],
  "operatingFundamentals": [
    "Occupancy data",
    "Rent trends",
    "NOI behavior",
    "Delinquencies if mentioned"
  ],
  "capitalSignals": [
    "Debt costs",
    "DSCR thresholds",
    "Refinance viability",
    "Leverage constraints",
    "Transaction failure points"
  ],
  "supplyPipeline": [
    "Starts data",
    "Deliveries",
    "Financing constraints",
    "Vacancy projections"
  ],
  "quotes": [
    "Exact verbatim quote from source - Speaker Name",
    "Another exact quote - Source"
  ],
  "mechanicalImplications": [
    "Fact X constrains Y because Z",
    "This eliminates strategy A due to B"
  ],
  "commonMisreads": [
    "Prevailing belief: X | Why incomplete: Y | Contradicting data: Z"
  ],
  "investorQuestions": [
    "Does this fail due to demand or structure?",
    "What assumption no longer clears underwriting?"
  ],
  "quality": "strong|adequate|weak",
  "qualityNotes": "Assessment of SourcePack completeness"
}

## QUALITY ASSESSMENT

Ask: "Could an investment committee vote with this alone?"

- STRONG: Yes, sufficient data for decision
- ADEQUATE: Enough for commentary, not for decisions
- WEAK: Opinion-level only, narrow output scope

## SOURCE MATERIAL TO EXTRACT FROM:

`;

// ============================================================================
// SOURCEPACK MERGER PROMPT
// ============================================================================

export const SOURCEPACK_MERGER_PROMPT = `
# SourcePack Merge Task

You have multiple extracted SourcePacks from different sources. Merge them into a single, unified SourcePack.

## MERGE RULES

1. Combine facts from all sources, noting source conflicts
2. Deduplicate similar data points
3. Preserve all verbatim quotes with attribution
4. If sources conflict, note both positions
5. Quality = weakest common denominator (conservative)

## OUTPUT

Return a single merged SourcePack JSON following the same schema.
`;

// ============================================================================
// SOURCEPACK QUALITY CHECK PROMPT
// ============================================================================

export const SOURCEPACK_QUALITY_PROMPT = `
# SourcePack Quality Assessment

Review this SourcePack and assess its completeness.

## MANDATORY SECTIONS FOR MARKET COMMENTARY

The following MUST have data for credible output:
1. Capital & Structure Signals (debt costs, DSCR, leverage)
2. At least 3 verified facts with sources
3. At least 1 verbatim quote

## QUALITY LEVELS

STRONG:
- All sections populated
- Multiple data points per section
- Clear source attribution
- Investment committee could vote

ADEQUATE:
- Core sections populated
- Some data gaps
- Good for commentary, not decisions

WEAK:
- Many empty sections
- Thin data
- CopyPro must narrow scope

## RECOMMENDATIONS

If quality is WEAK, recommend:
1. Additional sources needed
2. Specific data gaps to fill
3. Suggested scope narrowing

Return JSON:
{
  "quality": "strong|adequate|weak",
  "missingCritical": ["list of missing critical data"],
  "recommendations": ["specific actions to improve"],
  "scopeRecommendation": "If weak, suggest narrower content angle"
}
`;

// ============================================================================
// HELPER: Build Extraction Prompt
// ============================================================================

export function buildExtractionPrompt(sourceContent: string): string {
  return SOURCEPACK_EXTRACTION_PROMPT + sourceContent;
}

// ============================================================================
// HELPER: Format SourcePack for CopyPro
// ============================================================================

export function formatSourcePackForPrompt(sourcePack: SourcePack): string {
  const sections: string[] = [];

  // Context Header
  sections.push(`## 1. CONTEXT HEADER
- Topic: ${sourcePack.contextHeader.topic}
- Asset Class: ${sourcePack.contextHeader.assetClass}
- Markets: ${sourcePack.contextHeader.markets.join(', ')}
- Time Horizon: ${sourcePack.contextHeader.timeHorizon}
- Intended Output: ${sourcePack.contextHeader.intendedOutput}`);

  // Verified Facts
  if (sourcePack.verifiedFacts.length > 0) {
    sections.push(`## 2. VERIFIED FACTS
${sourcePack.verifiedFacts.map(f => `- ${f}`).join('\n')}`);
  }

  // Operating Fundamentals
  if (sourcePack.operatingFundamentals.length > 0) {
    sections.push(`## 3. OPERATING FUNDAMENTALS
${sourcePack.operatingFundamentals.map(f => `- ${f}`).join('\n')}`);
  }

  // Capital Signals
  if (sourcePack.capitalSignals.length > 0) {
    sections.push(`## 4. CAPITAL & STRUCTURE SIGNALS
${sourcePack.capitalSignals.map(f => `- ${f}`).join('\n')}`);
  }

  // Supply Pipeline
  if (sourcePack.supplyPipeline.length > 0) {
    sections.push(`## 5. SUPPLY PIPELINE
${sourcePack.supplyPipeline.map(f => `- ${f}`).join('\n')}`);
  }

  // Quotes
  if (sourcePack.quotes.length > 0) {
    sections.push(`## 6. QUOTES (VERBATIM)
${sourcePack.quotes.map(q => `"${q}"`).join('\n')}`);
  }

  // Mechanical Implications
  if (sourcePack.mechanicalImplications.length > 0) {
    sections.push(`## 7. MECHANICAL IMPLICATIONS
${sourcePack.mechanicalImplications.map(f => `- ${f}`).join('\n')}`);
  }

  // Common Misreads
  if (sourcePack.commonMisreads.length > 0) {
    sections.push(`## 8. COMMON MISREADS
${sourcePack.commonMisreads.map(f => `- ${f}`).join('\n')}`);
  }

  // Investor Questions
  if (sourcePack.investorQuestions.length > 0) {
    sections.push(`## 9. INVESTOR-RELEVANT QUESTIONS
${sourcePack.investorQuestions.map(q => `- ${q}`).join('\n')}`);
  }

  // Quality Assessment
  sections.push(`## SOURCEPACK QUALITY: ${sourcePack.quality.toUpperCase()}
${sourcePack.qualityNotes}`);

  return sections.join('\n\n');
}

// ============================================================================
// HELPER: Create Empty SourcePack
// ============================================================================

export function createEmptySourcePack(): SourcePack {
  return {
    contextHeader: {
      topic: '',
      assetClass: '',
      markets: [],
      timeHorizon: '',
      intendedOutput: ''
    },
    verifiedFacts: [],
    operatingFundamentals: [],
    capitalSignals: [],
    supplyPipeline: [],
    quotes: [],
    mechanicalImplications: [],
    commonMisreads: [],
    investorQuestions: [],
    rawSources: [],
    quality: 'weak',
    qualityNotes: 'No sources processed yet'
  };
}

// ============================================================================
// HELPER: Parse SourcePack from AI Response
// ============================================================================

export function parseSourcePackResponse(jsonString: string): Partial<SourcePack> {
  try {
    console.log('[SourcePack] Parsing response, length:', jsonString.length);
    
    // Extract JSON block from response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    
    let cleanJson = jsonMatch[0];
    
    // Sanitize common JSON issues from AI responses:
    cleanJson = cleanJson
      .replace(/,(\s*[}\]])/g, '$1')           // Trailing commas
      .replace(/:\s*0+(\d+)/g, ': $1')         // Leading zeros (077 → 77)
      .replace(/:\s*(NaN|Infinity|-Infinity)/gi, ': null')  // Invalid numbers
      .replace(/[\x00-\x1F\x7F]/g, ' ');       // Control characters
    
    const parsed = JSON.parse(cleanJson);
    console.log('[SourcePack] Parsed successfully:', Object.keys(parsed));
    return parsed;
    
  } catch (e) {
    console.error('[SourcePack] Parse failed:', e);
    console.error('[SourcePack] Response preview:', jsonString.substring(0, 1000));
    return {};
  }
}

