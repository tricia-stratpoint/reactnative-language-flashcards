import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  createdAt: number | FirebaseFirestoreTypes.Timestamp;
  lastReviewed?: number | FirebaseFirestoreTypes.Timestamp;
  nextReview: number | FirebaseFirestoreTypes.Timestamp;
  interval: number;
  easeFactor: number;
  repetitions: number;
  difficulty: "again" | "good";
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
  isCommunity?: boolean;
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
  achievements: Achievement[];
  cardsStudiedToday: string[];
}

export type CommunityDeck = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: number | null;
  status: string;
  cards?: Flashcard[];
  color?: string;
};
