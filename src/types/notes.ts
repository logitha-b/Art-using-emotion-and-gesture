export interface StudyNote {
  id: string;
  title: string;
  content: string;
  summary?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  createdAt: Date;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export type AIMode = 'summary' | 'flashcards' | 'quiz';
