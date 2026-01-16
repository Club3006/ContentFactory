
export type AppType = 'idea-log' | 'content-lab' | 'settings' | 'idea-detail' | 'library' | 'podcast-producer' | 'podcast-library' | 'podcast-detail' | 'podcast-transcript' | 'linkedin-creator' | 'scraper-pro';

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
  type: 'url' | 'riff' | 'voice' | 'file';
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
  fileTypes?: string[]; // ['PDF', 'MP3', 'JPG'] for TallyTable display

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

export interface Episode {
  id?: string | number; // Dexie uses number, Firestore uses string. Union type handles both.
  episodeNumber: string;
  guest?: string;
  transcriptUrl: string;
  transcriptText: string;
  title: string;
  bulletPoints?: string; // 5 actionable bullet points generated from transcript
  createdAt: number; // Changed from Date to number for serialization easier
  updatedAt: number;
  status: 'fetched' | 'draft' | 'published';
  cloudId?: string;
}


