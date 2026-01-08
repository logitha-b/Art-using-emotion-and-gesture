export type AttentionState = 'focused' | 'distracted' | 'restless' | 'unknown';

export interface AttentionData {
  state: AttentionState;
  confidence: number;
  timestamp: number;
}

export interface Intervention {
  type: 'quiz' | 'breathing' | 'praise' | 'break';
  title: string;
  description: string;
  icon: string;
}

export const ATTENTION_INTERVENTIONS: Record<Exclude<AttentionState, 'unknown'>, Intervention> = {
  focused: {
    type: 'praise',
    title: 'Great Focus! 🌟',
    description: 'You\'re doing amazing! Keep up the excellent concentration.',
    icon: '⭐',
  },
  distracted: {
    type: 'quiz',
    title: 'Quick Quiz Time! 🧠',
    description: 'Let\'s do a quick quiz to refocus your attention.',
    icon: '❓',
  },
  restless: {
    type: 'breathing',
    title: 'Deep Breathing 🧘',
    description: 'Let\'s take 3 deep breaths together to calm down.',
    icon: '🌬️',
  },
};

export const ATTENTION_COLORS: Record<AttentionState, string> = {
  focused: 'hsl(142 76% 36%)',   // Green
  distracted: 'hsl(38 92% 50%)', // Orange
  restless: 'hsl(0 84% 60%)',    // Red
  unknown: 'hsl(240 5% 60%)',    // Gray
};
