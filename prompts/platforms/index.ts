/**
 * Platform Doctrine Index
 * 
 * Central registry for all platform-specific doctrine files.
 * Add new platforms here as they are created.
 */

import { Platform, CopyProFormat } from '../copyPro';
import { getLinkedInDoctrine } from './linkedin';

// ============================================================================
// PLATFORM DOCTRINE REGISTRY
// ============================================================================

/**
 * Get the full platform doctrine for a given platform and format
 */
export function getPlatformDoctrine(platform: Platform, format: CopyProFormat): string {
  switch (platform) {
    case 'linkedin':
      return getLinkedInDoctrine(format);
    
    case 'youtube':
      return getYouTubeDoctrine(format);
    
    case 'instagram':
      return getInstagramDoctrine(format);
    
    case 'twitter':
      return getTwitterDoctrine(format);
    
    default:
      return getGenericDoctrine(format);
  }
}

// ============================================================================
// PLACEHOLDER DOCTRINES (To be expanded)
// ============================================================================

function getYouTubeDoctrine(format: CopyProFormat): string {
  return `
# YouTube Platform Doctrine

## Algorithm Philosophy
YouTube optimizes for watch time, engagement, and session duration.

## What YouTube Rewards
- Strong thumbnails and titles
- High retention in first 30 seconds
- Comments and engagement
- Watch time over views

## What YouTube Suppresses
- Clickbait without payoff
- Low retention content
- Misleading thumbnails

## Content Formula
1. HOOK (first 5 seconds)
2. PROMISE (what they'll learn)
3. CONTENT (deliver value)
4. CTA (subscribe, comment)

Note: Full YouTube doctrine coming soon.
`;
}

function getInstagramDoctrine(format: CopyProFormat): string {
  return `
# Instagram Platform Doctrine

## Algorithm Philosophy
Instagram optimizes for saves, shares, and time spent.

## What Instagram Rewards
- Carousel posts (high engagement)
- Reels with high completion rates
- Save-worthy content
- Stories for daily touchpoints

## What Instagram Suppresses
- Low-quality images
- Engagement bait
- Overuse of hashtags

## Content Formula
1. VISUAL HOOK
2. VALUE (teach or entertain)
3. ENGAGEMENT (question or CTA)

Note: Full Instagram doctrine coming soon.
`;
}

function getTwitterDoctrine(format: CopyProFormat): string {
  return `
# Twitter/X Platform Doctrine

## Algorithm Philosophy
X optimizes for replies, retweets, and conversation.

## What Twitter Rewards
- Strong first line
- Thread format for depth
- Controversial/contrarian takes
- Quote tweets with commentary

## What Twitter Suppresses
- External links (lower reach)
- Thread engagement bait
- Low-effort posts

## Content Formula
1. HOOK (first tweet)
2. CONTEXT (2-3 tweets)
3. PROOF (data or story)
4. TAKEAWAY (final tweet)

Note: Full Twitter doctrine coming soon.
`;
}

function getGenericDoctrine(format: CopyProFormat): string {
  return `
# Generic Platform Doctrine

## Universal Principles
- Lead with value
- Be specific, not generic
- One idea per piece
- Clear call to action

## Content Formula
1. ATTENTION
2. VALUE
3. ACTION

Apply CopyPro universal formula.
`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getLinkedInDoctrine } from './linkedin';

