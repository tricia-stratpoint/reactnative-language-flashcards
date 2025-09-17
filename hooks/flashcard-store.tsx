import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Flashcard, Deck, StudySession, UserStats } from '@/types/flashcard';

const STORAGE_KEYS = {
  DECKS: 'flashcard_decks',
  CARDS: 'flashcard_cards',
  STATS: 'user_stats',
  SESSIONS: 'study_sessions',
};

const defaultStats: UserStats = {
  totalCardsStudied: 0,
  studyStreak: 0,
  totalStudyTime: 0,
  achievements: [
    {
      id: 'first_card',
      title: 'First Steps',
      description: 'Study your first flashcard',
      icon: '🎯',
      progress: 0,
      target: 1,
    },
    {
      id: 'study_streak_7',
      title: 'Week Warrior',
      description: 'Study for 7 days in a row',
      icon: '🔥',
      progress: 0,
      target: 7,
    },
    {
      id: 'cards_100',
      title: 'Century Club',
      description: 'Study 100 flashcards',
      icon: '💯',
      progress: 0,
      target: 100,
    },
    {
      id: 'perfect_session',
      title: 'Perfect Score',
      description: 'Get 100% correct in a study session',
      icon: '⭐',
      progress: 0,
      target: 1,
    },
  ],
};

const sampleDecks: Deck[] = [
  {
    id: 'spanish-basics',
    name: 'Spanish Basics',
    description: 'Essential Spanish vocabulary for beginners',
    color: '#ef4444',
    createdAt: Date.now(),
    cardCount: 10,
    newCards: 10,
    reviewCards: 0,
  },
  {
    id: 'french-verbs',
    name: 'French Verbs',
    description: 'Common French verbs and conjugations',
    color: '#3b82f6',
    createdAt: Date.now(),
    cardCount: 8,
    newCards: 8,
    reviewCards: 0,
  },
];

const sampleCards: Flashcard[] = [
  // Spanish Basics
  { id: '1', front: 'Hello', back: 'Hola', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '2', front: 'Goodbye', back: 'Adiós', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '3', front: 'Thank you', back: 'Gracias', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '4', front: 'Please', back: 'Por favor', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '5', front: 'Yes', back: 'Sí', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '6', front: 'No', back: 'No', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '7', front: 'Water', back: 'Agua', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '8', front: 'Food', back: 'Comida', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '9', front: 'House', back: 'Casa', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '10', front: 'Friend', back: 'Amigo', deckId: 'spanish-basics', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  
  // French Verbs
  { id: '11', front: 'to be', back: 'être', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '12', front: 'to have', back: 'avoir', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '13', front: 'to go', back: 'aller', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '14', front: 'to do/make', back: 'faire', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '15', front: 'to say', back: 'dire', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '16', front: 'to see', back: 'voir', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '17', front: 'to know', back: 'savoir', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
  { id: '18', front: 'to come', back: 'venir', deckId: 'french-verbs', createdAt: Date.now(), nextReview: Date.now(), interval: 1, easeFactor: 2.5, repetitions: 0, difficulty: 'good' },
];

export const [FlashcardProvider, useFlashcards] = createContextHook(() => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Initialize with sample data for now
      setDecks(sampleDecks);
      setCards(sampleCards);
      setStats(defaultStats);
      setSessions([]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDecks = useCallback(async (newDecks: Deck[]) => {
    if (!newDecks || !Array.isArray(newDecks)) return;
    setDecks(newDecks);
    // Storage functionality would go here
  }, []);

  const saveCards = useCallback(async (newCards: Flashcard[]) => {
    if (!newCards || !Array.isArray(newCards)) return;
    setCards(newCards);
    // Storage functionality would go here
  }, []);

  const saveStats = useCallback(async (newStats: UserStats) => {
    if (!newStats) return;
    setStats(newStats);
    // Storage functionality would go here
  }, []);

  const updateCardAfterReview = useCallback(async (cardId: string, difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        const now = Date.now();
        let newInterval = card.interval;
        let newEaseFactor = card.easeFactor;
        let newRepetitions = card.repetitions;

        // Simplified SM-2 algorithm
        if (difficulty === 'again') {
          newRepetitions = 0;
          newInterval = 1;
        } else {
          newRepetitions += 1;
          if (newRepetitions === 1) {
            newInterval = 1;
          } else if (newRepetitions === 2) {
            newInterval = 6;
          } else {
            newInterval = Math.round(card.interval * card.easeFactor);
          }

          // Adjust ease factor
          const q = difficulty === 'easy' ? 5 : difficulty === 'good' ? 4 : 3;
          newEaseFactor = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
          newEaseFactor = Math.max(1.3, newEaseFactor);
        }

        return {
          ...card,
          lastReviewed: now,
          nextReview: now + (newInterval * 24 * 60 * 60 * 1000),
          interval: newInterval,
          easeFactor: newEaseFactor,
          repetitions: newRepetitions,
          difficulty,
        };
      }
      return card;
    });

    await saveCards(updatedCards);

    // Update stats
    const newStats = {
      ...stats,
      totalCardsStudied: stats.totalCardsStudied + 1,
    };

    // Update achievements
    newStats.achievements = newStats.achievements.map(achievement => {
      if (achievement.id === 'first_card' && newStats.totalCardsStudied >= 1) {
        return { ...achievement, progress: 1, unlockedAt: achievement.unlockedAt || Date.now() };
      }
      if (achievement.id === 'cards_100') {
        return { ...achievement, progress: Math.min(newStats.totalCardsStudied, 100) };
      }
      return achievement;
    });

    await saveStats(newStats);
  }, [cards, stats, saveCards, saveStats]);

  const getDueCards = useCallback((deckId: string): Flashcard[] => {
    const now = Date.now();
    return cards.filter(card => card.deckId === deckId && card.nextReview <= now);
  }, [cards]);

  const getNewCards = useCallback((deckId: string): Flashcard[] => {
    return cards.filter(card => card.deckId === deckId && card.repetitions === 0);
  }, [cards]);

  const createDeck = useCallback(async (name: string, description: string, color: string) => {
    const newDeck: Deck = {
      id: Date.now().toString(),
      name,
      description,
      color,
      createdAt: Date.now(),
      cardCount: 0,
      newCards: 0,
      reviewCards: 0,
    };

    await saveDecks([...decks, newDeck]);
  }, [decks, saveDecks]);

  const addCard = useCallback(async (deckId: string, front: string, back: string) => {
    const newCard: Flashcard = {
      id: Date.now().toString(),
      front,
      back,
      deckId,
      createdAt: Date.now(),
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: 'good',
    };

    const updatedCards = [...cards, newCard];
    await saveCards(updatedCards);

    // Update deck card count
    const updatedDecks = decks.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          cardCount: deck.cardCount + 1,
          newCards: deck.newCards + 1,
        };
      }
      return deck;
    });
    await saveDecks(updatedDecks);
  }, [cards, decks, saveCards, saveDecks]);

  return useMemo(() => ({
    decks,
    cards,
    stats,
    sessions,
    isLoading,
    updateCardAfterReview,
    getDueCards,
    getNewCards,
    createDeck,
    addCard,
  }), [decks, cards, stats, sessions, isLoading, updateCardAfterReview, getDueCards, getNewCards, createDeck, addCard]);
});