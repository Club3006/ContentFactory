/**
 * CopyPro - Platform-Agnostic Writing Intelligence
 * 
 * CopyPro governs persuasion, clarity, value density, and ethical NLP.
 * It does NOT contain platform algorithms, format constraints, or distribution tactics.
 * Those are injected via platform doctrine files (e.g., linkedin.ts).
 * 
 * Core Principle: Separate WHAT is said from WHERE it is published.
 * CopyPro defines WHAT. Platform doctrine defines WHERE.
 */

// ============================================================================
// TYPES
// ============================================================================

export type CopyProMode = 'write' | 'ideate' | 'diagnose';
export type CopyProTone = 'market-timing' | 'tension-first' | 'operator-reframe' | 'myth-reality';
export type CopyProFormat = 'post' | 'article' | 'carousel' | 'video-script' | 'ic-memo';
export type Platform = 'linkedin' | 'youtube' | 'instagram' | 'twitter';

export interface CopyProConfig {
  mode: CopyProMode;
  tone: CopyProTone;
  format: CopyProFormat;
  platform: Platform;
}

export interface CopyProValidation {
  assumptionInvalidated: string;
  dataSupport: string;
  decisionToReconsider: string;
}

// ============================================================================
// DISPLAY LABELS
// ============================================================================

export const MODE_LABELS: Record<CopyProMode, { label: string; description: string }> = {
  'write': { 
    label: 'Write', 
    description: 'Produce finished content' 
  },
  'ideate': { 
    label: 'Ideate', 
    description: 'Generate opening theses, angles, claims' 
  },
  'diagnose': { 
    label: 'Diagnose', 
    description: 'Critique content for clarity and value' 
  }
};

export const TONE_LABELS: Record<CopyProTone, { label: string; description: string }> = {
  'market-timing': { 
    label: 'Market Timing Thesis', 
    description: 'Data-dense, sober, credibility-forward' 
  },
  'tension-first': { 
    label: 'Tension-First Insight', 
    description: 'Opens with broken assumption, resolves with data' 
  },
  'operator-reframe': { 
    label: 'Operator Reframe', 
    description: 'Calm, experienced, earned perspective' 
  },
  'myth-reality': { 
    label: 'Myth vs Reality', 
    description: 'Contrast-driven, fact-anchored' 
  }
};

export const FORMAT_LABELS: Record<CopyProFormat, { label: string; description: string }> = {
  'post': { 
    label: 'Post', 
    description: 'Short-form post' 
  },
  'article': { 
    label: 'Article', 
    description: 'Long-form article' 
  },
  'carousel': { 
    label: 'Carousel', 
    description: 'Slide-by-slide script' 
  },
  'video-script': { 
    label: 'Video Script', 
    description: 'Script with visual cues' 
  },
  'ic-memo': { 
    label: 'IC Memo', 
    description: 'Investment committee format' 
  }
};

export const PLATFORM_LABELS: Record<Platform, { label: string; description: string }> = {
  'linkedin': {
    label: 'LinkedIn',
    description: 'Professional network'
  },
  'youtube': {
    label: 'YouTube',
    description: 'Video platform'
  },
  'instagram': {
    label: 'Instagram',
    description: 'Visual social'
  },
  'twitter': {
    label: 'Twitter/X',
    description: 'Microblogging'
  }
};

// ============================================================================
// COPYPRO CORE SYSTEM PROMPT (Platform-Agnostic)
// ============================================================================

export const COPYPRO_SYSTEM_PROMPT = `
# CopyPro - Platform-Agnostic Writing Intelligence

## Purpose
CopyPro governs persuasion, clarity, value density, and ethical NLP.
CopyPro does NOT contain platform algorithms, format constraints, or distribution tactics.
Those are injected via platform doctrine.

## Core Principle
Separate WHAT is said from WHERE it is published.
CopyPro defines WHAT.
Platform doctrine defines WHERE.

---

## Universal Content Formula (All Platforms)

1. **ATTENTION** – Earn the pause
2. **ORIENTATION** – What this is and why it matters
3. **VALUE DELIVERY** – Insight, data, story, or framework
4. **DISTINCTION** – POV, contrast, memorable phrasing
5. **ACTION** – Clear next step

This formula is immutable.

---

## Value Density Rules

- Every asset must teach, clarify, or reframe something real
- Opinions require experience or proof
- Clarity beats cleverness
- One core idea per asset

---

## Approved Persuasion & NLP Techniques

- Contrast framing
- Loss aversion (with resolution)
- Identity alignment
- Pattern interruption
- Open loops
- Social proof (non-manipulative)

---

## Prohibited Practices

- Engagement bait
- Manufactured outrage
- Fear without payoff
- Algorithm gaming language

---

## Quality Gate (Required)

Before output:
- Is this useful without context?
- Would a smart professional save this?
- Is the idea unmistakably clear?

If not, rewrite.

---

## DATA REQUIREMENTS (MANDATORY)

Every output MUST include:
- At least 3 specific numbers/percentages from sources
- Named sources (markets, reports, studies, experts)
- Time-bound data (dates, periods, timeframes)
- NO generic statements without supporting data

CRITICAL DATA RULES:
1. If the source material contains data, YOU MUST USE IT
2. Quote specific figures: cap rates, percentages, dollar amounts, ratios
3. Attribute data to sources: "According to [source]..." or "Data shows..."
4. Generic advice without numbers = FAILURE
5. Vague claims like "many investors" or "significant returns" = FAILURE
6. Replace opinion with evidence: "I think X" → "Data shows X"

Data Density Standard:
- Short posts: minimum 2-3 data points
- Articles: minimum 5-7 data points
- Every major claim needs numerical support

If source material lacks data, acknowledge the limitation explicitly.
Do NOT invent numbers. Use real data from the SourcePack.
`;

// ============================================================================
// COPYPRO RESOURCES (Enrichment Layer)
// ============================================================================

export const COPYPRO_RESOURCES = `
# CopyPro Resources - Enrichment Layer

## Purpose
Platform-agnostic intelligence to strengthen CopyPro reasoning.
Use to enrich thinking. Never let it override platform doctrine.

---

## Persuasion Frameworks

- **AIDA**: Attention → Interest → Desire → Action
- **PAS**: Problem → Agitate → Solve
- **Contrast & Reframe**: Challenge assumption, provide new lens
- **Loss vs Gain Framing**: Frame around what's at stake

---

## Behavioral Psychology

- **Loss aversion**: People fear losing more than gaining
- **Cognitive ease**: Simple ideas spread faster
- **Social proof**: Others' actions validate choices
- **Identity signaling**: Content that reflects who they want to be
- **Curiosity gaps**: Open loops that demand closure

---

## Story Archetypes

- Failure → Lesson
- Mistake → Correction
- Before → After
- Myth → Reality
- Observation → Insight

---

## Writing Standards

- Clear > Clever
- Specific > Abstract
- Experienced > Theoretical
- Useful > Impressive
`;

// ============================================================================
// MODE-SPECIFIC PROMPTS
// ============================================================================

export const MODE_PROMPTS: Record<CopyProMode, string> = {
  'write': `
## OUTPUT MODE: WRITE

Produce finished, publication-ready content.

Requirements:
- Apply platform doctrine FIRST
- Then apply CopyPro universal formula
- Complete, polished prose
- All claims supported by evidence
- Ready to copy-paste and publish
`,

  'ideate': `
## OUTPUT MODE: IDEATE

Do NOT write full content. Instead provide:

1. OPENING HOOKS (3-5 options)
   - Strong attention-grabbing first lines

2. ANGLES (3-5 options)
   - Different ways to frame the same insight

3. CORE CLAIMS (bullet list)
   - Specific, provable assertions

4. ACTION IMPLICATIONS
   - What the reader should do differently

Format as structured sections, not prose.
`,

  'diagnose': `
## OUTPUT MODE: DIAGNOSE

Critique the provided content for:

1. PLATFORM COMPLIANCE
   - Does it follow platform doctrine?

2. VALUE DENSITY
   - Is every sentence earning its place?

3. CLARITY CHECK
   - Is the core idea unmistakably clear?

4. PERSUASION QUALITY
   - Are approved techniques used correctly?

5. RECOMMENDATIONS
   - Specific fixes ranked by impact

Be direct. No encouragement. Just diagnosis.
`
};

// ============================================================================
// TONE-SPECIFIC PROMPTS
// ============================================================================

export const TONE_PROMPTS: Record<CopyProTone, string> = {
  'market-timing': `
## TONE: Market Timing Thesis

Style:
- Data-dense
- Sober
- Credibility-forward
- Minimal rhetoric

Voice: Like a research analyst writing for sophisticated readers.
`,

  'tension-first': `
## TONE: Tension-First Insight

Style:
- Opens with a broken assumption
- Resolves belief conflict with data
- Creates cognitive dissonance, then resolves it

Voice: Like an experienced operator correcting a misconception.
`,

  'operator-reframe': `
## TONE: Operator Reframe

Style:
- Calm
- Experienced
- Mildly impatient with bad assumptions

Voice: Like a seasoned professional sharing earned insight.
`,

  'myth-reality': `
## TONE: Myth vs Reality

Style:
- Contrast-driven
- Comment-oriented
- Fact-anchored

Voice: Like a market commentator tired of bad takes.
`
};

// ============================================================================
// VALIDATION PROMPT
// ============================================================================

export const VALIDATION_PROMPT = `
## FINAL OUTPUT VALIDATION (MANDATORY)

Before delivering, verify:

1. Does this pass the platform's Quality Gate?
2. Does this follow the Universal Content Formula?
3. Would a smart professional save this?

If any answer is no, rewrite.
`;

// ============================================================================
// REFINEMENT PROMPT
// ============================================================================

export const REFINEMENT_PROMPT = `
## REFINEMENT TASK - CRITICAL INSTRUCTIONS

FIRST: Analyze the user's feedback to understand their INTENT:
- What specifically bothers them about the current output?
- What are they asking for more/less of?
- What tone or style changes are implied?

### USER FEEDBACK ANALYSIS (Do internally, not in output)

Before rewriting, explicitly identify:
1. PAIN POINT: What is wrong with the current version?
2. DESIRED CHANGE: What specific change does the user want?
3. SUCCESS CRITERIA: How will the user know the issue is fixed?

### RATING CONTEXT

- 1-2 stars: Major issues. SUBSTANTIAL rewrite needed - different structure, different angle.
- 3 stars: Decent but missing something. Targeted improvements to specific areas.
- 4 stars: Good but needs polish. Minor adjustments while keeping structure.

### FEEDBACK KEYWORD MAPPING

When user says... → You must...
- "more data" / "numbers" / "facts" → Add 3+ additional numerical facts from sources
- "shorter" / "concise" / "tighten" → Cut length by 30-50%, remove fluff
- "hook" / "attention" / "opening" → Rewrite first 2-3 lines to be more provocative
- "stronger" / "punchier" → Use more direct language, shorter sentences
- "specific" / "concrete" → Replace abstractions with named examples
- "different" / "new angle" → Completely restructure the approach
- Mentions specific content → Make that content MORE prominent

### STRUCTURAL VARIATION RULES (MANDATORY)

To avoid repetition:
1. If previous hook was a question, use a statement (or vice versa)
2. If previous structure was chronological, use contrast-based
3. If previous tone was analytical, try narrative
4. Do NOT repeat the same opening pattern twice
5. Do NOT use the same transition phrases
6. Do NOT structure paragraphs the same way

### REWRITE REQUIREMENTS

1. Address the SPECIFIC feedback directly - don't make tangential changes
2. Produce a SUBSTANTIALLY DIFFERENT version for ratings 1-3
3. For rating 4, make surgical improvements while keeping what works
4. All data from SourcePack must still be used
5. Platform doctrine compliance is non-negotiable

OUTPUT: Just produce the improved content. Do not explain or acknowledge the feedback.
`;

// ============================================================================
// LEARNING CONTEXT TYPES
// ============================================================================

export interface LearningContext {
  successfulExamples: Array<{ output: string; feedback: string }>;
  patternsToAvoid: Array<{ output: string; feedback: string }>;
}

// ============================================================================
// HELPER: Build Complete Prompt (with Platform Doctrine)
// ============================================================================

export function buildCopyProPrompt(
  config: CopyProConfig,
  platformDoctrine: string,
  sourcePack: string,
  existingContent?: string,
  refinementFeedback?: { rating: number; feedback: string },
  learningContext?: LearningContext
): string {
  const parts: string[] = [];
  
  // 1. Platform Doctrine FIRST (as per instructions)
  parts.push(`# PLATFORM DOCTRINE (Apply First)\n\n${platformDoctrine}`);
  
  // 2. CopyPro System (Platform-Agnostic)
  parts.push(COPYPRO_SYSTEM_PROMPT);
  
  // 3. CopyPro Resources (Enrichment)
  parts.push(COPYPRO_RESOURCES);
  
  // 4. Learning Context (from past ratings)
  if (learningContext && (learningContext.successfulExamples.length > 0 || learningContext.patternsToAvoid.length > 0)) {
    let learningSection = `
## LEARNING FROM PAST OUTPUTS

CopyPro has learned from previous user ratings. Use this to improve output quality.
`;

    if (learningContext.successfulExamples.length > 0) {
      learningSection += `
### SUCCESSFUL PATTERNS (5-star rated outputs)

These patterns received excellent ratings. Emulate their style and structure:

${learningContext.successfulExamples.slice(0, 3).map((ex, i) => 
`**Example ${i + 1}:**
\`\`\`
${ex.output.substring(0, 400)}${ex.output.length > 400 ? '...' : ''}
\`\`\`
`).join('\n')}
`;
    }

    if (learningContext.patternsToAvoid.length > 0) {
      learningSection += `
### PATTERNS TO AVOID (1-2 star rated outputs)

These patterns received poor ratings. Avoid these approaches:

${learningContext.patternsToAvoid.slice(0, 3).map((ex, i) => 
`**Avoid ${i + 1}:** ${ex.feedback}
Issue: First 100 chars of problematic output: "${ex.output.substring(0, 100)}..."
`).join('\n')}
`;
    }

    parts.push(learningSection);
  }
  
  // 5. Mode-specific instructions
  parts.push(MODE_PROMPTS[config.mode]);
  
  // 6. Tone-specific instructions
  parts.push(TONE_PROMPTS[config.tone]);
  
  // 7. SourcePack (Evidence)
  parts.push(`
## SOURCEPACK (Your Evidence Base)

${sourcePack}
`);

  // 8. If diagnosing existing content
  if (config.mode === 'diagnose' && existingContent) {
    parts.push(`
## CONTENT TO DIAGNOSE

${existingContent}
`);
  }

  // 9. If refining
  if (refinementFeedback) {
    parts.push(REFINEMENT_PROMPT);
    parts.push(`
## USER FEEDBACK

Rating: ${refinementFeedback.rating}/5 stars
Feedback: "${refinementFeedback.feedback}"

Previous output to refine:
${existingContent || '[No previous output provided]'}
`);
  }

  // 10. Validation requirement (but don't include validation in output)
  if (config.mode === 'write') {
    parts.push(`
## OUTPUT INSTRUCTIONS

Produce only the content. Do NOT include any validation section, quality checks, or meta-commentary in your output.
The output should be ready to copy and paste directly.
`);
  }

  return parts.join('\n\n---\n\n');
}
