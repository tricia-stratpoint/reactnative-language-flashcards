import { Timestamp } from "firebase/firestore";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  createdAt: number | Timestamp;
  lastReviewed?: number | Timestamp;
  nextReview: number | Timestamp;
  interval: number;
  easeFactor: number;
  repetitions: number;
  difficulty: "again" | "hard" | "good" | "easy";
  wordFrequency?: number;
  language: "spanish" | "french" | "custom";
  isCustom?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  color: string;
  language: "spanish" | "french" | "custom";
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
  unlockedAt?: number | null;
  progress: number;
  target: number;
}

export interface UserStats {
  totalCardsStudied: number;
  studyStreak: number;
  lastStudyDate: number | null;
  totalStudyTime: number;
  achievements: Achievement[];
  cardsStudiedToday: string[];
}
