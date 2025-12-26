
export type AppType = 'idea-log' | 'content-lab' | 'chatbot' | 'settings' | 'idea-detail' | 'library' | 'podcast-manager';

export interface WindowState {
  id: string;
  type: AppType;
  title: string;
  zIndex: number;
  isOpen: boolean;
  isMinimized: boolean;
  data?: any; // To pass specific idea context
  initialX?: number;
  initialY?: number;
}

export type FeedbackRating = 'Too formal' | 'Too casual' | 'Not enough personality' | 'Perfect tone' | 'Missed facts';

export interface ContentIdea {
  id: string;
  timestamp: number;
  content: string; // URL or text
  type: 'url' | 'riff';
  transcript?: string;
  status: 'captured' | 'digested' | 'failed';
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
