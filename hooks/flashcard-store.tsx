import { create } from "zustand";
import { Deck, Flashcard, UserStats } from "@/types/flashcard";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const SUPPORTED_LANGUAGES: Deck["language"][] = ["spanish", "french", "custom"];

interface FlashcardState {
  decks: Deck[];
  cards: Flashcard[];
  stats: UserStats;
  isLoading: boolean;
  setCards: (cards: Flashcard[]) => void;
  setDecks: (decks: Deck[]) => void;
  setStats: (stats: UserStats) => void;
  loadAllLanguages: () => Promise<void>;
  createDeck: (
    language: Deck["language"],
    name: string,
    description: string,
    color: string
  ) => Promise<void>;
  updateDeck: (
    deckId: string,
    language: Deck["language"],
    updatedData: Partial<Deck>
  ) => Promise<void>;
  deleteDeck: (deckId: string, language: Deck["language"]) => Promise<void>;
  addCard: (
    language: Flashcard["language"],
    deckId: string,
    front: string,
    back: string
  ) => Promise<void>;
  updateCard: (
    language: Flashcard["language"],
    deckId: string,
    cardId: string,
    updatedData: Partial<Flashcard>
  ) => Promise<void>;
  deleteCard: (
    language: Flashcard["language"],
    deckId: string,
    cardId: string
  ) => Promise<void>;
  fetchAchievements: () => Promise<void>;
  updateAchievements: (
    newStats: Partial<UserStats> & { perfectSession?: boolean }
  ) => void;
  studyCard: (isPerfectSession: boolean) => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  decks: [],
  cards: [],
  stats: {
    totalCardsStudied: 0,
    studyStreak: 0,
    lastStudyDate: undefined,
    totalStudyTime: 0,
    achievements: [],
  },
  isLoading: true,
  setCards: (cards) => set({ cards }),
  setDecks: (decks) => set({ decks }),
  setStats: (stats) => set({ stats }),

  loadAllLanguages: async () => {
    set({ isLoading: true });
    try {
      const allDecks: Deck[] = [];
      const allCards: Flashcard[] = [];

      for (const lang of SUPPORTED_LANGUAGES) {
        const decksSnap = await getDocs(
          collection(db, `flashcards/${lang}/decks`)
        );
        const loadedDecks = decksSnap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              language: lang,
              ...doc.data(),
            } as Deck)
        );

        allDecks.push(...loadedDecks);

        for (const deck of loadedDecks) {
          const cardsSnap = await getDocs(
            collection(db, `flashcards/${lang}/decks/${deck.id}/cards`)
          );
          const deckCards = cardsSnap.docs.map(
            (doc) =>
              ({
                id: doc.id,
                deckId: deck.id,
                language: lang,
                ...doc.data(),
              } as Flashcard)
          );
          allCards.push(...deckCards);
        }
      }

      set({ decks: allDecks, cards: allCards });
    } catch (err) {
      console.error("Error loading decks:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  createDeck: async (language, name, description, color) => {
    const deckLanguage = name.toLowerCase().includes("custom")
      ? "custom"
      : language;

    const newDeck: Omit<Deck, "id" | "language"> = { name, description, color };
    const ref = await addDoc(
      collection(db, `flashcards/${deckLanguage}/decks`),
      {
        ...newDeck,
        createdAt: Timestamp.now(),
      }
    );

    set((state) => ({
      decks: [
        ...state.decks,
        { ...newDeck, id: ref.id, language: deckLanguage },
      ],
    }));
  },

  updateDeck: async (
    deckId: string,
    language: Deck["language"],
    updatedData: Partial<Deck>
  ) => {
    try {
      const deckRef = doc(db, `flashcards/${language}/decks/${deckId}`);
      await updateDoc(deckRef, updatedData);

      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId ? { ...d, ...updatedData } : d
        ),
      }));
    } catch (err) {
      console.error("Error updating deck:", err);
    }
  },

  deleteDeck: async (deckId: string, language: Deck["language"]) => {
    try {
      const cardsToDelete = get().cards.filter((c) => c.deckId === deckId);
      for (const card of cardsToDelete) {
        const cardRef = doc(
          db,
          `flashcards/${language}/decks/${deckId}/cards/${card.id}`
        );
        await deleteDoc(cardRef);
      }

      const deckRef = doc(db, `flashcards/${language}/decks/${deckId}`);
      await deleteDoc(deckRef);

      set((state) => ({
        decks: state.decks.filter((d) => d.id !== deckId),
        cards: state.cards.filter((c) => c.deckId !== deckId),
      }));
    } catch (err) {
      console.error("Error deleting deck:", err);
    }
  },

  addCard: async (language, deckId, front, back) => {
    const deck = get().decks.find((d) => d.id === deckId);
    const cardLanguage: Flashcard["language"] = deck?.language || language;

    const newCard = {
      front,
      back,
      deckId,
      createdAt: Timestamp.now(),
      nextReview: Timestamp.now(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good" as const,
      isCustom: true,
    };
    const ref = await addDoc(
      collection(db, `flashcards/${cardLanguage}/decks/${deckId}/cards`),
      newCard
    );

    set((state) => ({
      cards: [
        ...state.cards,
        { ...newCard, id: ref.id, language: cardLanguage },
      ],
    }));
  },

  updateCard: async (
    language: Flashcard["language"],
    deckId: string,
    cardId: string,
    updatedData: Partial<Flashcard>
  ) => {
    try {
      const cardRef = doc(
        db,
        `flashcards/${language}/decks/${deckId}/cards/${cardId}`
      );
      await updateDoc(cardRef, updatedData);

      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, ...updatedData } : c
        ),
      }));
    } catch (err) {
      console.error("Error updating card:", err);
    }
  },

  deleteCard: async (
    language: Flashcard["language"],
    deckId: string,
    cardId: string
  ) => {
    try {
      const cardRef = doc(
        db,
        `flashcards/${language}/decks/${deckId}/cards/${cardId}`
      );
      await deleteDoc(cardRef);

      set((state) => ({
        cards: state.cards.filter((c) => c.id !== cardId),
      }));
    } catch (err) {
      console.error("Error deleting card:", err);
    }
  },

  fetchAchievements: async () => {
    try {
      const statsRef = doc(db, "stats", "default");
      const snapshot = await getDoc(statsRef);

      if (snapshot.exists()) {
        const data = snapshot.data();

        set((state) => ({
          stats: {
            ...state.stats,
            totalCardsStudied: data.totalCardsStudied ?? 0,
            studyStreak: data.studyStreak ?? 0,
            lastStudyDate: data.lastStudyDate ?? null,
            totalStudyTime: data.totalStudyTime ?? 0,
            achievements: data.achievements ?? [],
          },
        }));
      } else {
        console.warn("No stats document found at /stats/default");
      }
    } catch (err) {
      console.error("Error fetching achievements from Firestore:", err);
    }
  },

  updateAchievements: (
    newStats: Partial<UserStats> & { perfectSession?: boolean }
  ) => {
    set((state) => {
      const now = Date.now();
      const achievements = state.stats.achievements.map((a) => {
        let progress = a.progress;

        if (
          a.id === "first_card" &&
          newStats.totalCardsStudied &&
          newStats.totalCardsStudied >= 1
        ) {
          progress = 1;
        } else if (a.id === "cards_100" && newStats.totalCardsStudied) {
          progress = Math.min(newStats.totalCardsStudied, a.target);
        } else if (a.id === "study_streak_7" && newStats.studyStreak) {
          progress = Math.min(newStats.studyStreak, a.target);
        } else if (a.id === "perfect_session" && newStats.perfectSession) {
          progress = 1;
        }

        const unlockedAt = progress >= a.target ? now : a.unlockedAt;

        return { ...a, progress, unlockedAt };
      });

      return { stats: { ...state.stats, ...newStats, achievements } };
    });
  },

  studyCard: (perfectSession) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const { stats } = get();
    const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;

    const newStreak =
      lastDate && lastDate.toDateString() === yesterday.toDateString()
        ? stats.studyStreak + 1
        : 1;

    const newTotalCards = stats.totalCardsStudied + 1;

    set({
      stats: {
        ...stats,
        totalCardsStudied: newTotalCards,
        studyStreak: newStreak,
        lastStudyDate: Date.now(),
      },
    });

    get().updateAchievements({
      totalCardsStudied: newTotalCards,
      studyStreak: newStreak,
      perfectSession,
    });
  },
}));
