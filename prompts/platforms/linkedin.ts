/**
 * LinkedIn Platform Doctrine
 * 
 * Canonical doctrine for HOW LinkedIn distributes content.
 * This file must be applied BEFORE CopyPro execution.
 * 
 * Instruction: Apply LinkedIn doctrine first, then apply CopyPro.
 */

import { CopyProFormat } from '../copyPro';

// ============================================================================
// LINKEDIN DOCTRINE (Algorithm Rules)
// ============================================================================

export const LINKEDIN_DOCTRINE = `
# LinkedIn Platform Doctrine

## Purpose
Canonical doctrine for how LinkedIn distributes content.
This must be applied BEFORE CopyPro execution.

---

## LinkedIn Algorithm Philosophy

LinkedIn optimizes for:
1. **Attention** – Does the content stop the scroll?
2. **Dwell time** – Do people stay and read?
3. **Meaningful interaction** – Quality comments over reactions
4. **Sustained conversation** – Threads that continue

It ranks behavior, not format.

---

## What LinkedIn Rewards

- Strong first 2 lines
- Mobile readability
- Native content (no external links)
- Saves and shares
- Experience-based comments
- Creator replies to comments

---

## What LinkedIn Suppresses

- External-link-first posts
- Engagement bait ("Like if you agree!")
- Over-posting (more than 1-2x/day)
- Hashtag stuffing (3+ hashtags)
- Long, low-retention video
- Generic advice everyone's heard

---

## Global LinkedIn Content Formula

1. **HOOK** – Earn the pause in first 2 lines
2. **CONTEXT** – Why this matters now
3. **PROOF** – Data, story, or evidence
4. **FRAMEWORK** – Actionable structure
5. **PROMPT** – Drive engagement (question, CTA)

No step may be skipped.

---

## Quality Gate

Before publishing, ask:
- Would a serious professional save this?
- Does this earn attention in 2 seconds?
- Does it invite experience-based replies?

If any answer is no, rewrite.
`;

// ============================================================================
// LINKEDIN FORMAT RULES
// ============================================================================

export const LINKEDIN_FORMAT_RULES: Record<CopyProFormat, string> = {
  'post': `
## FORMAT: LinkedIn Text Post

Requirements:
- Short lines (mobile-first)
- White space between ideas
- One core idea only
- NO external links in main post
- Hook in first 2 lines (before "see more")
- 150-300 words optimal
- End with engagement prompt
`,

  'article': `
## FORMAT: LinkedIn Article

Requirements:
- Authority established in first 150 words
- Compelling title (60-80 characters)
- Subheaders every 3-5 paragraphs
- 800-1500 words
- Built for repurposing into posts
- Include data/evidence throughout
- Clear sections with ## headers
`,

  'carousel': `
## FORMAT: LinkedIn Carousel

Requirements:
- One idea per slide
- Large typography (readable on mobile)
- 8-12 slides optimal
- Slide 1: Hook/Title (pattern interrupt)
- Slides 2-10: Build argument with visuals
- Final slide: Save-worthy summary + CTA
- Include visual direction for each slide

Output format:
SLIDE 1:
[Visual direction]
"Text content"

SLIDE 2:
...
`,

  'video-script': `
## FORMAT: LinkedIn Video Script

Requirements:
- Hook in first 3 seconds
- Captions required (most watch muted)
- Comment-driven CTA at end
- 60-90 seconds optimal
- Conversational, direct-to-camera style
- One clear takeaway

Output format:
[0:00-0:03] HOOK
Visual: ...
Script: "..."

[0:03-0:15] CONTEXT
...
`,

  'ic-memo': `
## FORMAT: LinkedIn IC Memo Style

Requirements:
- Executive summary (3-5 bullets)
- Formal but readable structure
- Data exhibits referenced
- Clear recommendation
- Professional, institutional tone
- Works as both post and article
`
};

// ============================================================================
// LINKEDIN RESOURCES (Intelligence Layer)
// ============================================================================

export const LINKEDIN_RESOURCES = `
# LinkedIn Resources - Platform Intelligence

## Purpose
Contextual intelligence for LinkedIn optimization.
Apply after LinkedIn doctrine, before CopyPro.

---

## Algorithm Intelligence Sources

- Richard van der Blom reports (annual LinkedIn studies)
- LinkedIn product disclosures (official blog)
- Shield Analytics benchmarks

---

## Observed High-Performer Patterns

- Clear, consistent POV
- Data-backed claims
- Storytelling with specifics
- Regular engagement with comments
- Native-first publishing (no link posts)

---

## High-Performance Content Types

1. **Deal breakdowns** – Real numbers, real lessons
2. **Market POVs** – Timely takes on current events
3. **Failure post-mortems** – What went wrong, what was learned
4. **Frameworks** – Repeatable processes others can use
5. **Checklists** – Save-worthy reference content

---

## Underperforming Content (Avoid)

- Generic motivation ("Believe in yourself!")
- Corporate announcements
- External-link-first posts
- Engagement bait
- Recycled content without fresh angle

---

## Living Adjustments

Tactics may change with algorithm updates.
Core principles (value, clarity, authenticity) do not.
`;

// ============================================================================
// HELPER: Get Full LinkedIn Doctrine
// ============================================================================

export function getLinkedInDoctrine(format: CopyProFormat): string {
  return `
${LINKEDIN_DOCTRINE}

${LINKEDIN_FORMAT_RULES[format]}

${LINKEDIN_RESOURCES}
`;
}

// ============================================================================
// EXPORT DEFAULT DOCTRINE
// ============================================================================

export default {
  doctrine: LINKEDIN_DOCTRINE,
  formatRules: LINKEDIN_FORMAT_RULES,
  resources: LINKEDIN_RESOURCES,
  getDoctrine: getLinkedInDoctrine
};

