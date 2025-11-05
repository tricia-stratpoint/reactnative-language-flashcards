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
    name: string,
    description: string,
    color: string
  ) => Promise<void>;
  updateDeck: (deckId: string, updatedData: Partial<Deck>) => Promise<void>;
  deleteDeck: (deckId: string) => Promise<void>;
  addCard: (deckId: string, front: string, back: string) => Promise<void>;
  updateCard: (
    deckId: string,
    cardId: string,
    updatedData: Partial<Flashcard>
  ) => Promise<void>;
  deleteCard: (deckId: string, cardId: string) => Promise<void>;
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
      const user = auth().currentUser;
      if (!user) return;

      const allDecks: Deck[] = [];
      const allCards: Flashcard[] = [];

      // load shared spanish & french decks
      for (const lang of SUPPORTED_LANGUAGES.filter((l) => l !== "custom")) {
        const decksSnap = await firestore()
          .collection(`flashcards/${lang}/decks`)
          .get();
        const sharedDecks = decksSnap.docs.map(
          (d) => ({ id: d.id, language: lang, ...d.data() } as Deck)
        );
        allDecks.push(...sharedDecks);

        for (const deck of sharedDecks) {
          const cardsSnap = await firestore()
            .collection(`flashcards/${lang}/decks/${deck.id}/cards`)
            .get();
          const deckCards = cardsSnap.docs.map((doc) => ({
            id: doc.id,
            deckId: deck.id,
            language: lang,
            ...doc.data(),
            createdAt: toMillis(doc.data().createdAt),
            lastReviewed: toMillis(doc.data().lastReviewed),
            nextReview: toMillis(doc.data().nextReview),
          })) as Flashcard[];
          allCards.push(...deckCards);
        }
      }

      // load user custom decks
      const customDecksSnap = await firestore()
        .collection(`users/${user.uid}/customDecks`)
        .get();

      const userDecks = customDecksSnap.docs.map(
        (d) => ({ id: d.id, language: "custom", ...d.data() } as Deck)
      );
      allDecks.push(...userDecks);

      for (const deck of userDecks) {
        const userCardsSnap = await firestore()
          .collection(`users/${user.uid}/customDecks/${deck.id}/cards`)
          .get();
        const userCards = userCardsSnap.docs.map((doc) => ({
          id: doc.id,
          deckId: deck.id,
          language: "custom",
          ...doc.data(),
          createdAt: toMillis(doc.data().createdAt),
          nextReview: toMillis(doc.data().nextReview),
        })) as Flashcard[];
        allCards.push(...userCards);
      }

      set({ decks: allDecks, cards: allCards });
    } catch (err) {
      console.error("Error loading decks:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  createDeck: async (name, description, color) => {
    const user = auth().currentUser;
    if (!user) return;

    const newDeck = {
      name,
      description,
      color,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    const ref = await firestore()
      .collection(`users/${user.uid}/customDecks`)
      .add(newDeck);

    set((state) => ({
      decks: [...state.decks, { ...newDeck, id: ref.id, language: "custom" }],
    }));
  },

  updateDeck: async (deckId, updatedData) => {
    const user = auth().currentUser;
    if (!user) return;

    await firestore()
      .doc(`users/${user.uid}/customDecks/${deckId}`)
      .update(updatedData);

    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, ...updatedData } : d
      ),
    }));
  },

  deleteDeck: async (deckId) => {
    const user = auth().currentUser;
    if (!user) return;

    const deckCards = get().cards.filter(
      (c) => c.deckId === deckId && c.language === "custom"
    );
    for (const card of deckCards) {
      await firestore()
        .doc(`users/${user.uid}/customDecks/${deckId}/cards/${card.id}`)
        .delete();
    }
    await firestore().doc(`users/${user.uid}/customDecks/${deckId}`).delete();

    set((state) => ({
      decks: state.decks.filter((d) => d.id !== deckId),
      cards: state.cards.filter((c) => c.deckId !== deckId),
    }));
  },

  addCard: async (deckId, front, back) => {
    const user = auth().currentUser;
    if (!user) return;

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
      .collection(`users/${user.uid}/customDecks/${deckId}/cards`)
      .add(newCard);

    set((state) => ({
      cards: [
        ...state.cards,
        {
          ...newCard,
          id: ref.id,
          language: "custom",
          createdAt: Date.now(),
          nextReview: Date.now(),
        },
      ],
    }));
  },

  updateCard: async (deckId, cardId, updatedData) => {
    const user = auth().currentUser;
    if (!user) return;

    await firestore()
      .doc(`users/${user.uid}/customDecks/${deckId}/cards/${cardId}`)
      .update(updatedData);
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, ...updatedData } : c
      ),
    }));
  },

  deleteCard: async (deckId, cardId) => {
    const user = auth().currentUser;
    if (!user) return;

    await firestore()
      .doc(`users/${user.uid}/customDecks/${deckId}/cards/${cardId}`)
      .delete();
    set((state) => ({ cards: state.cards.filter((c) => c.id !== cardId) }));
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
        set({
          stats: {
            totalCardsStudied: data?.totalCardsStudied ?? 0,
            studyStreak: data?.studyStreak ?? 0,
            lastStudyDate: toMillis(data?.lastStudyDate) ?? null,
            cardsStudiedToday: data?.cardsStudiedToday ?? [],
            achievements: data?.achievements?.length
              ? data.achievements
              : DEFAULT_ACHIEVEMENTS,
          },
        });
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

  updateAchievements: async (
    newStats: Partial<UserStats> & { perfectSession?: boolean }
  ) => {
    const user = auth().currentUser;
    if (!user) return;

    const now = Date.now();

    // compute locally
    const currentStats = get().stats;
    const updatedStats: UserStats = { ...currentStats, ...newStats };

    const achievements = currentStats.achievements.map((a) => {
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

    const finalStats: UserStats = { ...updatedStats, achievements };

    // update zustand
    set({ stats: finalStats });

    // update firestore
    const statsRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stats")
      .doc("progress");

    await statsRef.set(
      {
        totalCardsStudied: finalStats.totalCardsStudied,
        studyStreak: finalStats.studyStreak,
        lastStudyDate: firestore.FieldValue.serverTimestamp(),
        achievements: finalStats.achievements,
        cardsStudiedToday: finalStats.cardsStudiedToday,
      },
      { merge: true }
    );
  },

  studyCard: (cardId, isPerfectSession) => {
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
    const newTotal = stats.totalCardsStudied + 1;

    set({
      stats: {
        ...stats,
        totalCardsStudied: newTotal,
        studyStreak: newStreak,
        lastStudyDate: Date.now(),
        cardsStudiedToday,
      },
    });

    get().updateAchievements({
      totalCardsStudied: newTotal,
      studyStreak: newStreak,
      perfectSession: isPerfectSession,
    });
  },
}));

export const resetUserProgress = async () => {
  const user = auth().currentUser;
  if (!user) return;

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

  useFlashcardStore.getState().setStats({
    totalCardsStudied: 0,
    studyStreak: 0,
    lastStudyDate: null,
    achievements: resetAchievements,
    cardsStudiedToday: [],
  });
};
