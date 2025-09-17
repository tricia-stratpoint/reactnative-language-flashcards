export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  createdAt: number;
  lastReviewed?: number;
  nextReview: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
  difficulty: 'again' | 'hard' | 'good' | 'easy';
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  cardCount: number;
  newCards: number;
  reviewCards: number;
}

export interface StudySession {
  id: string;
  deckId: string;
  startTime: number;
  endTime?: number;
  cardsStudied: number;
  correctAnswers: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress: number;
  target: number;
}

export interface UserStats {
  totalCardsStudied: number;
  studyStreak: number;
  lastStudyDate?: number;
  totalStudyTime: number;
  achievements: Achievement[];
}