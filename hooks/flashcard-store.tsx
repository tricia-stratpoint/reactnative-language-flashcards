import { create } from "zustand";
import { Deck, Flashcard, UserStats } from "@/types/flashcard";
import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const SUPPORTED_LANGUAGES: Deck["language"][] = ["spanish", "french", "custom"];

const DEFAULT_ACHIEVEMENTS = [
  {
    id: "first_card",
    title: "First Steps",
    description: "Study your first flashcard",
    icon: "🎯",
    progress: 0,
    target: 1,
    unlockedAt: null,
  },
  {
    id: "study_streak_7",
    title: "Week Warrior",
    description: "Study for 7 days in a row",
    icon: "🔥",
    progress: 0,
    target: 7,
    unlockedAt: null,
  },
  {
    id: "cards_100",
    title: "Century Club",
    description: "Study 100 flashcards",
    icon: "💯",
    progress: 0,
    target: 100,
    unlockedAt: null,
  },
  {
    id: "perfect_session",
    title: "Perfect Score",
    description: "Get 100% correct in a study session",
    icon: "⭐",
    progress: 0,
    target: 1,
    unlockedAt: null,
  },
];

const toMillis = (ts?: FirebaseFirestoreTypes.Timestamp | number | Date) =>
  ts instanceof firestore.Timestamp
    ? ts.toDate().getTime()
    : ts instanceof Date
    ? ts.getTime()
    : ts ?? Date.now();
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
        const decksSnap = await firestore()
          .collection(`flashcards/${lang}/decks`)
          .get();
        const loadedDecks = decksSnap.docs.map(
          (doc) => ({ id: doc.id, language: lang, ...doc.data() } as Deck)
        );
        allDecks.push(...loadedDecks);

        for (const deck of loadedDecks) {
          const cardsSnap = await firestore()
            .collection(`flashcards/${lang}/decks/${deck.id}/cards`)
            .get();
          const deckCards = cardsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              deckId: deck.id,
              language: lang,
              front: data.front,
              back: data.back,
              interval: data.interval,
              easeFactor: data.easeFactor,
              repetitions: data.repetitions,
              difficulty: data.difficulty,
              createdAt: toMillis(data.createdAt),
              lastReviewed: toMillis(data.lastReviewed),
              nextReview: toMillis(data.nextReview),
              isCustom: data.isCustom,
              wordFrequency: data.wordFrequency,
            } as Flashcard;
          });
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
    const newDeck = { name, description, color };
    const ref = await firestore()
      .collection(`flashcards/${deckLanguage}/decks`)
      .add({ ...newDeck, createdAt: firestore.FieldValue.serverTimestamp() });
    set((state) => ({
      decks: [
        ...state.decks,
        { ...newDeck, id: ref.id, language: deckLanguage },
      ],
    }));
  },

  updateDeck: async (deckId, language, updatedData) => {
    try {
      await firestore()
        .doc(`flashcards/${language}/decks/${deckId}`)
        .update(updatedData);
      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId ? { ...d, ...updatedData } : d
        ),
      }));
    } catch (err) {
      console.error("Error updating deck:", err);
    }
  },

  deleteDeck: async (deckId, language) => {
    try {
      const cardsToDelete = get().cards.filter((c) => c.deckId === deckId);
      for (const card of cardsToDelete)
        await firestore()
          .doc(`flashcards/${language}/decks/${deckId}/cards/${card.id}`)
          .delete();
      await firestore().doc(`flashcards/${language}/decks/${deckId}`).delete();
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
    const cardLanguage = deck?.language || language;
    const newCard = {
      front,
      back,
      deckId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      nextReview: firestore.FieldValue.serverTimestamp(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good" as const,
      isCustom: true,
    };
    const ref = await firestore()
      .collection(`flashcards/${cardLanguage}/decks/${deckId}/cards`)
      .add(newCard);
    set((state) => ({
      cards: [
        ...state.cards,
        {
          ...newCard,
          id: ref.id,
          language: cardLanguage,
          createdAt: Date.now(),
          nextReview: Date.now(),
        },
      ],
    }));
  },

  updateCard: async (language, deckId, cardId, updatedData) => {
    try {
      await firestore()
        .doc(`flashcards/${language}/decks/${deckId}/cards/${cardId}`)
        .update(updatedData);
      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, ...updatedData } : c
        ),
      }));
    } catch (err) {
      console.error("Error updating card:", err);
    }
  },

  deleteCard: async (language, deckId, cardId) => {
    try {
      await firestore()
        .doc(`flashcards/${language}/decks/${deckId}/cards/${cardId}`)
        .delete();
      set((state) => ({ cards: state.cards.filter((c) => c.id !== cardId) }));
    } catch (err) {
      console.error("Error deleting card:", err);
    }
  },

  fetchAchievements: async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      await firestore()
        .collection("users")
        .doc(user.uid)
        .set(
          {
            username: user.displayName || "Unnamed User",
            email: user.email || "",
            createdAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      const statsRef = firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stats")
        .doc("progress");
      const snapshot = await statsRef.get();

      if (snapshot.exists()) {
        const data = snapshot.data();
        set((state) => ({
          stats: {
            ...state.stats,
            totalCardsStudied: data?.totalCardsStudied ?? 0,
            studyStreak: data?.studyStreak ?? 0,
            lastStudyDate: toMillis(data?.lastStudyDate) ?? null,
            cardsStudiedToday: data?.cardsStudiedToday ?? [],
            achievements: data?.achievements?.length
              ? data.achievements
              : DEFAULT_ACHIEVEMENTS,
          },
        }));
      } else {
        const defaultStats: UserStats = {
          totalCardsStudied: 0,
          studyStreak: 0,
          lastStudyDate: null,
          achievements: DEFAULT_ACHIEVEMENTS,
          cardsStudiedToday: [],
        };
        await statsRef.set(defaultStats);
        set({ stats: defaultStats });
      }
    } catch (err) {
      console.error("Error fetching achievements:", err);
    }
  },

  updateAchievements: async (newStats) => {
    set((state) => {
      const now = Date.now();
      const updatedStats = { ...state.stats, ...newStats };
      const achievements = state.stats.achievements.map((a) => {
        let progress = a.progress;
        switch (a.id) {
          case "first_card":
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
        const unlockedAt = a.unlockedAt || (progress >= a.target ? now : null);
        return { ...a, progress, unlockedAt };
      });
      return { stats: { ...updatedStats, achievements } };
    });

    try {
      const user = auth().currentUser;
      if (!user) return;
      const statsRef = firestore()
        .collection("users")
        .doc(user.uid)
        .collection("stats")
        .doc("progress");
      const currentStats = get().stats;

      await statsRef.update({
        totalCardsStudied: currentStats.totalCardsStudied,
        studyStreak: currentStats.studyStreak,
        lastStudyDate: currentStats.lastStudyDate
          ? new Date(currentStats.lastStudyDate)
          : null,
        achievements: currentStats.achievements,
        cardsStudiedToday: currentStats.cardsStudiedToday,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating Firestore stats:", err);
    }
  },

  studyCard: (
    cardId: string,
    isPerfectSession: boolean,
    studyMinutes: number = 0
  ) => {
    const { stats } = get();
    const todayStr = new Date().toDateString();
    let cardsStudiedToday =
      stats.lastStudyDate &&
      new Date(stats.lastStudyDate).toDateString() === todayStr
        ? [...stats.cardsStudiedToday]
        : [];

    if (!cardsStudiedToday.includes(cardId)) {
      cardsStudiedToday.push(cardId);
    }

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
      perfectSession: isPerfectSession,
    });
  },
}));

export const resetUserProgress = async () => {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error("No authenticated user");

    const statsRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stats")
      .doc("progress");
    const resetAchievements = DEFAULT_ACHIEVEMENTS.map((a) => ({
      ...a,
      progress: 0,
      unlockedAt: null,
    }));

    await statsRef.set({
      totalCardsStudied: 0,
      studyStreak: 0,
      lastStudyDate: null,
      achievements: resetAchievements,
      cardsStudiedToday: [],
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // reset zustand
    const { setStats } = useFlashcardStore.getState();
    setStats({
      totalCardsStudied: 0,
      studyStreak: 0,
      lastStudyDate: null,
      achievements: resetAchievements,
      cardsStudiedToday: [],
    });

    console.log("User progress reset successfully!");
  } catch (err) {
    console.error("Error resetting progress:", err);
  }
};
