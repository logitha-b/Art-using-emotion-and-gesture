export type Emotion = 'happy' | 'sad' | 'angry' | 'neutral';

export type Gesture = 'draw' | 'undo' | 'clear' | 'none';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: Point[];
  color: string;
}

export const EMOTION_COLORS: Record<Emotion, string> = {
  happy: '#ec4899',    // Pink
  sad: '#3b82f6',      // Blue
  angry: '#ef4444',    // Red
  neutral: '#eab308',  // Yellow
};
