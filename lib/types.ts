import {
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';

export type Template = 'customer-support' | 'personal-assistant' | 'navigation-system';
export type MeetingRole = 'transcriber' | 'listener' | null;

export interface FunctionCall {
  name: string;
  description?: string;
  parameters?: any;
  isEnabled: boolean;
  scheduling?: FunctionResponseScheduling;
}

export interface LiveClientToolResponse {
  functionResponses?: FunctionResponse[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ConversationTurn {
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  text: string;
  isFinal: boolean;
  toolUseRequest?: LiveServerToolCall;
  toolUseResponse?: LiveClientToolResponse;
  groundingChunks?: GroundingChunk[];
}
