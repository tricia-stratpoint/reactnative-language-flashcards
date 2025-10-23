import { create } from "zustand";
import { Deck, Flashcard, UserStats } from "@/types/flashcard";
import { db, auth } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const SUPPORTED_LANGUAGES: Deck["language"][] = ["spanish", "french", "custom"];

const DEFAULT_ACHIEVEMENTS = [
  {
    id: "first_card",
    title: "First Steps",
    description: "Study your first flashcard",
    icon: "🎯",
    progress: 0,
    target: 1,
  },
  {
    id: "study_streak_7",
    title: "Week Warrior",
    description: "Study for 7 days in a row",
    icon: "🔥",
    progress: 0,
    target: 7,
  },
  {
    id: "cards_100",
    title: "Century Club",
    description: "Study 100 flashcards",
    icon: "💯",
    progress: 0,
    target: 100,
  },
  {
    id: "perfect_session",
    title: "Perfect Score",
    description: "Get 100% correct in a study session",
    icon: "⭐",
    progress: 0,
    target: 1,
  },
];
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
  studyCard: (cardId: string, isPerfectSession: boolean) => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  decks: [],
  cards: [],
  stats: {
    totalCardsStudied: 0,
    studyStreak: 0,
    lastStudyDate: null,
    totalStudyTime: 0,
    achievements: [],
    cardsStudiedToday: [],
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
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      // create or update the user document
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          username: user.displayName || "Unnamed User",
          email: user.email || "",
          createdAt: Timestamp.now(),
        },
        { merge: true }
      );

      // fetch or initialize stats
      const statsRef = doc(db, "users", user.uid, "stats", "progress");
      const snapshot = await getDoc(statsRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        set((state) => ({
          stats: {
            ...state.stats,
            totalCardsStudied: data.totalCardsStudied ?? 0,
            studyStreak: data.studyStreak ?? 0,
            lastStudyDate: data.lastStudyDate?.toMillis() ?? null,
            totalStudyTime: data.totalStudyTime ?? 0,
            cardsStudiedToday: data.cardsStudiedToday ?? [],
            achievements:
              data.achievements && data.achievements.length > 0
                ? data.achievements
                : DEFAULT_ACHIEVEMENTS,
          },
        }));
      } else {
        console.log("No stats document found — creating default user stats...");
        const defaultStats: UserStats = {
          totalCardsStudied: 0,
          studyStreak: 0,
          lastStudyDate: null,
          totalStudyTime: 0,
          achievements: DEFAULT_ACHIEVEMENTS,
          cardsStudiedToday: [],
        };

        await setDoc(statsRef, defaultStats);
        set({ stats: defaultStats });
      }
    } catch (err) {
      console.error("Error fetching achievements:", err);
    }
  },

  updateAchievements: async (
    newStats: Partial<UserStats> & { perfectSession?: boolean }
  ) => {
    set((state) => {
      const now = Date.now();
      const updatedStats = { ...state.stats, ...newStats };

      const achievements = state.stats.achievements.map((a) => {
        let progress = a.progress;

        switch (a.id) {
          case "first_card":
            progress = Math.min(updatedStats.totalCardsStudied, a.target);
            break;
          case "cards_100":
            progress = Math.min(updatedStats.totalCardsStudied, a.target);
            break;
          case "study_streak_7":
            progress = Math.min(updatedStats.studyStreak, a.target);
            break;
          case "perfect_session":
            progress = newStats.perfectSession ? 1 : a.progress;
            break;
        }

        // Only unlock if progress reaches target and not already unlocked
        const unlockedAt = a.unlockedAt ?? (progress >= a.target ? now : null);

        return { ...a, progress, unlockedAt };
      });

      return { stats: { ...updatedStats, achievements } };
    });

    // save to firestore
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const statsRef = doc(db, "users", user.uid, "stats", "progress");
      const currentStats = get().stats;
      await updateDoc(statsRef, {
        totalCardsStudied: currentStats.totalCardsStudied ?? 0,
        studyStreak: currentStats.studyStreak ?? 0,
        lastStudyDate: currentStats.lastStudyDate ?? null,
        totalStudyTime: currentStats.totalStudyTime ?? 0,
        achievements: currentStats.achievements ?? [],
        cardsStudiedToday: currentStats.cardsStudiedToday ?? [],
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Error updating Firestore stats:", err);
    }
  },

  studyCard: (cardId: string, perfectSession: boolean) => {
    const { stats } = get();
    const todayStr = new Date().toDateString();

    let cardsStudiedToday =
      stats.lastStudyDate &&
      new Date(stats.lastStudyDate).toDateString() === todayStr
        ? [...stats.cardsStudiedToday]
        : [];

    if (cardsStudiedToday.includes(cardId)) return;

    cardsStudiedToday.push(cardId);

    const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

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
        cardsStudiedToday,
      },
    });

    get().updateAchievements({
      totalCardsStudied: newTotalCards,
      studyStreak: newStreak,
      perfectSession,
    });
  },
}));

export const resetUserProgress = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    const statsRef = doc(db, "users", user.uid, "stats", "progress");

    // reset in firestore
    const resetAchievements = DEFAULT_ACHIEVEMENTS.map((a) => ({
      ...a,
      progress: 0,
      unlockedAt: null,
    }));

    await setDoc(statsRef, {
      totalCardsStudied: 0,
      studyStreak: 0,
      lastStudyDate: null,
      totalStudyTime: 0,
      achievements: resetAchievements,
      cardsStudiedToday: [],
      updatedAt: new Date(),
    });

    // reset zustand
    const { setStats } = useFlashcardStore.getState();
    setStats({
      totalCardsStudied: 0,
      studyStreak: 0,
      lastStudyDate: null,
      totalStudyTime: 0,
      achievements: resetAchievements,
      cardsStudiedToday: [],
    });

    console.log("User progress reset successfully!");
  } catch (err) {
    console.error("Error resetting progress:", err);
  }
};
