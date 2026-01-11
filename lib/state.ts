
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { customerSupportTools } from './tools/customer-support';
import { personalAssistantTools } from './tools/personal-assistant';
import { navigationSystemTools } from './tools/navigation-system';
import { 
  Template, 
  MeetingRole, 
  FunctionCall, 
  ConversationTurn 
} from './types';
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import { FunctionResponseScheduling } from '@google/genai';

export type AppPhase = 'portal' | 'config' | 'room';

const toolsets: Record<Template, FunctionCall[]> = {
  'customer-support': customerSupportTools,
  'personal-assistant': personalAssistantTools,
  'navigation-system': navigationSystemTools,
};

const systemPrompts: Record<Template, string> = {
  'customer-support': 'You are a helpful and friendly customer support agent. Be conversational and concise.',
  'personal-assistant': 'You are a helpful and friendly personal assistant. Be proactive and efficient.',
  'navigation-system': 'You are a helpful and friendly navigation assistant. Provide clear and accurate directions.',
};

/**
 * Settings Store
 */
export const useSettings = create<{
  phase: AppPhase;
  systemPrompt: string;
  model: string;
  voice: string;
  isWatchingRemote: boolean;
  remoteMeetingId: string;
  meetingRole: MeetingRole;
  // Media Config
  mirrorVideo: boolean;
  studioAudio: boolean;
  lightingIntensity: number;
  
  setPhase: (phase: AppPhase) => void;
  setSystemPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
  setIsWatchingRemote: (isWatching: boolean) => void;
  setRemoteMeetingId: (id: string) => void;
  setMeetingRole: (role: MeetingRole) => void;
  setMirrorVideo: (mirror: boolean) => void;
  setStudioAudio: (studio: boolean) => void;
  setLightingIntensity: (intensity: number) => void;
}>(set => ({
  phase: 'portal',
  systemPrompt: `You are a helpful and friendly AI assistant. Be conversational and concise.`,
  model: DEFAULT_LIVE_API_MODEL,
  voice: DEFAULT_VOICE,
  isWatchingRemote: false,
  remoteMeetingId: '',
  meetingRole: null,
  mirrorVideo: true,
  studioAudio: true,
  lightingIntensity: 50,

  setPhase: phase => set({ phase }),
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
  setModel: model => set({ model }),
  setVoice: voice => set({ voice }),
  setIsWatchingRemote: isWatching => set({ isWatchingRemote: isWatching }),
  setRemoteMeetingId: id => set({ remoteMeetingId: id }),
  setMeetingRole: role => set({ meetingRole: role }),
  setMirrorVideo: mirror => set({ mirrorVideo: mirror }),
  setStudioAudio: studio => set({ studioAudio: studio }),
  setLightingIntensity: intensity => set({ lightingIntensity: intensity }),
}));

/**
 * UI Store
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}>(set => ({
  isSidebarOpen: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

/**
 * Tools Store
 */
export const useTools = create<{
  tools: FunctionCall[];
  template: Template;
  setTemplate: (template: Template) => void;
  toggleTool: (toolName: string) => void;
  addTool: () => void;
  removeTool: (toolName: string) => void;
  updateTool: (oldName: string, updatedTool: FunctionCall) => void;
}>(set => ({
  tools: customerSupportTools,
  template: 'customer-support',
  setTemplate: (template: Template) => {
    set({ tools: toolsets[template], template });
    useSettings.getState().setSystemPrompt(systemPrompts[template]);
  },
  toggleTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.map(tool =>
        tool.name === toolName ? { ...tool, isEnabled: !tool.isEnabled } : tool,
      ),
    })),
  addTool: () =>
    set(state => {
      let newToolName = 'new_function';
      let counter = state.tools.length + 1;
      while (state.tools.some(tool => tool.name === newToolName)) {
        newToolName = `new_function_${counter++}`;
      }
      return {
        tools: [
          ...state.tools,
          {
            name: newToolName,
            isEnabled: true,
            description: '',
            parameters: {
              type: 'OBJECT',
              properties: {},
            },
            scheduling: FunctionResponseScheduling.INTERRUPT,
          },
        ],
      };
    }),
  removeTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.filter(tool => tool.name !== toolName),
    })),
  updateTool: (oldName: string, updatedTool: FunctionCall) =>
    set(state => {
      if (
        oldName !== updatedTool.name &&
        state.tools.some(tool => tool.name === updatedTool.name)
      ) {
        return state;
      }
      return {
        tools: state.tools.map(tool =>
          tool.name === oldName ? updatedTool : tool,
        ),
      };
    }),
}));

/**
 * Logs Store
 */
export const useLogStore = create<{
  turns: ConversationTurn[];
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) => void;
  updateLastTurn: (update: Partial<ConversationTurn>) => void;
  clearTurns: () => void;
}>((set, get) => ({
  turns: [],
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) =>
    set(state => ({
      turns: [...state.turns, { ...turn, timestamp: new Date() }],
    })),
  updateLastTurn: (update: Partial<Omit<ConversationTurn, 'timestamp'>>) => {
    set(state => {
      if (state.turns.length === 0) return state;
      const newTurns = [...state.turns];
      newTurns[newTurns.length - 1] = { ...newTurns[newTurns.length - 1], ...update };
      return { turns: newTurns };
    });
  },
  clearTurns: () => set({ turns: [] }),
}));
