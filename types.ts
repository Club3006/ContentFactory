
export type AppType = 'idea-log' | 'content-lab' | 'settings' | 'idea-detail' | 'unified-vault' | 'podcast-producer' | 'podcast-library' | 'podcast-detail' | 'podcast-transcript' | 'linkedin-creator';

export interface WindowState {
  id: string;
  type: AppType;
  title: string;
  zIndex: number;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized?: boolean;
  data?: any; // To pass specific idea context
  initialX?: number;
  initialY?: number;
}

export type FeedbackRating = 'Too formal' | 'Too casual' | 'Not enough personality' | 'Perfect tone' | 'Missed facts';

export interface ScrapedData {
  id: string;
  url: string;
  content: string;
  source: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: number;
}

export interface GeneratedContent {
  id: string;
  ideaId: string;
  platform: 'linkedin' | 'twitter' | 'blog' | 'instagram';
  contentBody: string;
  isPublished: boolean;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export type IdeaStatus = 'captured' | 'digested' | 'failed' | 'new' | 'approved' | 'rejected' | 'drafted';

export interface ContentIdea {
  id: string;
  timestamp: number;
  content: string; // The raw input or title
  type: 'url' | 'riff';
  transcript?: string;
  status: IdeaStatus;
  createdAt: number;

  // New Fields
  tags?: string[];
  rating?: number;
  sourceRefs?: string[];
  description?: string;
  source?: string; // e.g. 'scraper', 'manual'
  originalSource?: string; // URL

  // Legacy / UI specific
  rewrites?: Array<{
    text: string;
    platform: string;
    feedback?: FeedbackRating;
  }>;
  images?: string[];
}

export interface UserPersona {
  id: string;
  name: string;
  businessInfo: string;
  branding: string;
  tone: string;
  facts: string;
  figures: string;
  targetAudience: string;
  isDefault?: boolean;
}


export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Quote with rating for learning/feedback loop
export interface QuoteWithRating {
  id: string;
  text: string;
  speaker: string;
  timestamp?: string; // e.g., "00:12"
  rating?: 1 | 2 | 3; // 1 = worst, 3 = best
  ratedAt?: number;
}

export interface Episode {
  id?: string | number; // Dexie uses number, Firestore uses string. Union type handles both.
  episodeNumber: string;
  guest?: string;
  transcriptUrl: string;
  transcriptText: string;
  title: string;
  bulletPoints?: string; // 5 actionable bullet points generated from transcript
  notableQuotes?: string; // 3 notable quotes from the transcript (legacy text format)
  ratedQuotes?: QuoteWithRating[]; // Structured quotes with ratings for learning
  createdAt: number; // Changed from Date to number for serialization easier
  updatedAt: number;
  status: 'fetched' | 'draft' | 'published';
  cloudId?: string;
}

// Generator Draft - saved from ContentLab
export type GeneratorDraftStatus = 'draft' | 'final';

export interface GeneratorDraft {
  id?: number;
  title: string;
  seedQuote: string;
  contextSources: string[]; // URLs
  platform: string;
  generatedContent?: string;
  status: GeneratorDraftStatus;
  createdAt: number;
  updatedAt: number;
}

// LinkedIn Content - saved from LinkedInCreator
export type LinkedInContentType = 'post' | 'article' | 'script' | 'carousel';

export interface LinkedInContent {
  id?: number;
  title: string;
  contentBody: string;
  contentType: LinkedInContentType;
  platform: 'linkedin';
  isPublished: boolean;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// Content Rating - for CopyPro learning system
export interface ContentRating {
  id?: number;
  contentType: 'linkedin' | 'generator';
  format: 'post' | 'article' | 'carousel' | 'video-script' | 'ic-memo';
  rating: number; // 1-5 stars
  feedback: string;
  sourcePackSummary: string; // Brief summary of source material for context
  outputSample: string; // First 500 chars of output for pattern learning
  finalOutput?: string; // Full output if rated 5 stars (successful example)
  platform: 'linkedin' | 'youtube' | 'instagram' | 'twitter';
  createdAt: number;
}

// Unified Vault Item - for display purposes
export type VaultItemType = 'idea' | 'podcast' | 'generator' | 'linkedin';

export interface VaultItem {
  id: string | number;
  type: VaultItemType;
  title: string;
  subtitle?: string;
  status?: string;
  contentType?: string; // For LinkedIn: post, article, etc.
  createdAt: number;
  updatedAt: number;
  originalData: any; // The full original record
}
