import { create } from "zustand";
import { Deck, Flashcard, UserStats } from "@/types/flashcard";
import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const SUPPORTED_LANGUAGES: Deck["language"][] = ["spanish", "french", "custom"];
const SUPER_ADMIN_EMAIL = "pocketlingo.admin@yopmail.com";

const DEFAULT_ACHIEVEMENTS: UserStats["achievements"] = [
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

const toMillis = (
  ts?: FirebaseFirestoreTypes.Timestamp | number | Date | null
) => {
  if (!ts) return Date.now();
  if (ts instanceof firestore.Timestamp) return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  return ts;
};

let unsubscribers: (() => void)[] = [];
export const clearAllListeners = () => {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
};
const addUnsubscriber = (fn: () => void) => unsubscribers.push(fn);

let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

const createOrUpdateUserDocument = async () => {
  const user = auth().currentUser;
  if (!user) return;

  try {
    const userRef = firestore().collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    let role: FlashcardState["role"] = "user";

    if (user.email === SUPER_ADMIN_EMAIL) {
      role = "super_admin";
    }

    if (userDoc.exists()) {
      const data = userDoc.data();
      role = data?.role || role;
    }

    await userRef.set(
      {
        username: user.displayName || "Unnamed User",
        email: user.email || "",
        role,
        createdAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    useFlashcardStore.getState().setUserRole(role);
  } catch (err) {
    console.error("Error creating/updating user document:", err);
  }
};

const refreshUserToken = async () => {
  const user = auth().currentUser;
  if (!user) return;
  try {
    const token = await user.getIdToken(true);
    console.log("Firebase ID token refreshed:", token);
  } catch (err) {
    console.error("Error refreshing Firebase token:", err);
  }
};

const startAutoTokenRefresh = () => {
  if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
  tokenRefreshInterval = setInterval(() => refreshUserToken(), 55 * 60 * 1000);
};

const stopAutoTokenRefresh = () => {
  if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
  tokenRefreshInterval = null;
};

const initializeUser = async () => {
  const user = auth().currentUser;
  if (!user) return;

  await createOrUpdateUserDocument();
  await refreshUserToken();
  startAutoTokenRefresh();
};

auth().onIdTokenChanged((user) => {
  if (user) {
    initializeUser().catch(console.error);
  } else {
    stopAutoTokenRefresh();
    clearAllListeners();
  }
});
interface FlashcardState {
  decks: Deck[];
  cards: Flashcard[];
  stats: UserStats;
  isLoading: boolean;
  role: "user" | "moderator" | "super_admin";
  setUserRole: (role: "user" | "moderator" | "super_admin") => void;
  fetchUserRole: () => Promise<void>;
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
    achievements: DEFAULT_ACHIEVEMENTS,
    cardsStudiedToday: [],
  },
  isLoading: true,
  setCards: (cards) => set({ cards }),
  setDecks: (decks) => set({ decks }),
  setStats: (stats) => set({ stats }),

  role: "user",
  setUserRole: (role: "user" | "moderator" | "super_admin") => set({ role }),

  fetchUserRole: async () => {
    const user = auth().currentUser;
    if (!user) return;

    const userDoc = await firestore().collection("users").doc(user.uid).get();
    if (userDoc.exists()) {
      const data = userDoc.data();
      set({ role: data?.role || "user" });
    } else {
      await firestore()
        .collection("users")
        .doc(user.uid)
        .set({
          email: user.email,
          username: user.displayName || "Unnamed User",
          role: "user",
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      set({ role: "user" });
    }
  },

  loadAllLanguages: async () => {
    set({ isLoading: true });
    try {
      const user = auth().currentUser;
      if (!user) return;

      // realtime shared spanish & french decks
      for (const lang of SUPPORTED_LANGUAGES.filter((l) => l !== "custom")) {
        const unsubDeck = firestore()
          .collection(`flashcards/${lang}/decks`)
          .onSnapshot((decksSnap) => {
            if (!decksSnap?.docs) return;
            const sharedDecks = decksSnap.docs.map(
              (d) => ({ id: d.id, language: lang, ...d.data() } as Deck)
            );

            sharedDecks.forEach((deck) => {
              const unsubCards = firestore()
                .collection(`flashcards/${lang}/decks/${deck.id}/cards`)
                .onSnapshot((cardsSnap) => {
                  if (!cardsSnap?.docs) return;
                  const deckCards = cardsSnap.docs
                    .map((doc) => {
                      const data = doc.data();
                      if (!data) return null;
                      return {
                        id: doc.id,
                        deckId: deck.id,
                        language: lang,
                        ...data,
                        createdAt: toMillis(data.createdAt),
                        lastReviewed: toMillis(data.lastReviewed),
                        nextReview: toMillis(data.nextReview),
                      } as Flashcard;
                    })
                    .filter(Boolean) as Flashcard[];
                  set((state) => ({
                    cards: [
                      ...state.cards.filter((c) => c.deckId !== deck.id),
                      ...deckCards,
                    ],
                  }));
                });
              addUnsubscriber(unsubCards);
            });

            set((state) => ({
              decks: [
                ...state.decks.filter((d) => d.language !== lang),
                ...sharedDecks,
              ],
            }));
          });
        addUnsubscriber(unsubDeck);
      }

      // realtime user custom decks
      const customUnsub = firestore()
        .collection(`users/${user.uid}/customDecks`)
        .onSnapshot((customDecksSnap) => {
          if (!customDecksSnap?.docs) return;
          const userDecks = customDecksSnap.docs.map(
            (d) => ({ id: d.id, language: "custom", ...d.data() } as Deck)
          );

          userDecks.forEach((deck) => {
            const cardUnsub = firestore()
              .collection(`users/${user.uid}/customDecks/${deck.id}/cards`)
              .onSnapshot((cardsSnap) => {
                if (!cardsSnap?.docs) return;
                const userCards = cardsSnap.docs
                  .map((doc) => {
                    const data = doc.data();
                    if (!data) return null;
                    return {
                      id: doc.id,
                      deckId: deck.id,
                      language: "custom",
                      ...data,
                      createdAt: toMillis(data.createdAt),
                      nextReview: toMillis(data.nextReview),
                    } as Flashcard;
                  })
                  .filter(Boolean) as Flashcard[];
                set((state) => ({
                  cards: [
                    ...state.cards.filter((c) => c.deckId !== deck.id),
                    ...userCards,
                  ],
                }));
              });
            addUnsubscriber(cardUnsub);
          });

          set((state) => ({
            decks: [
              ...state.decks.filter((d) => d.language !== "custom"),
              ...userDecks,
            ],
          }));
        });
      addUnsubscriber(customUnsub);
    } catch (err) {
      console.error("Error loading decks:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  createDeck: async (name, description, color) => {
    const user = auth().currentUser;
    if (!user) return;

    await firestore().collection(`users/${user.uid}/customDecks`).add({
      name,
      description,
      color,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
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
    await firestore()
      .collection(`users/${user.uid}/customDecks/${deckId}/cards`)
      .add({
        front,
        back,
        deckId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        nextReview: firestore.FieldValue.serverTimestamp(),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        difficulty: "good",
        isCustom: true,
      });
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
    const user = auth().currentUser;
    if (!user) return;
    const statsRef = firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stats")
      .doc("progress");

    const unsubscribe = statsRef.onSnapshot((snapshot) => {
      const data = snapshot?.data();
      if (data) {
        set({
          stats: {
            totalCardsStudied: data.totalCardsStudied ?? 0,
            studyStreak: data.studyStreak ?? 0,
            lastStudyDate: toMillis(data.lastStudyDate),
            cardsStudiedToday: data.cardsStudiedToday ?? [],
            achievements: data.achievements?.length
              ? data.achievements
              : DEFAULT_ACHIEVEMENTS,
          },
        });
      } else {
        const initialStats = {
          totalCardsStudied: 0,
          studyStreak: 0,
          lastStudyDate: null,
          cardsStudiedToday: [],
          achievements: DEFAULT_ACHIEVEMENTS,
        };
        statsRef.set(initialStats);
        set({ stats: initialStats });
      }
    });
    addUnsubscriber(unsubscribe);
  },

  updateAchievements: async (newStats) => {
    const user = auth().currentUser;
    if (!user) return;
    const now = Date.now();

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
      return {
        ...a,
        progress,
        unlockedAt: a.unlockedAt ?? (progress >= a.target ? now : null),
      };
    });
    const finalStats: UserStats = { ...updatedStats, achievements };
    set({ stats: finalStats });
    await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("stats")
      .doc("progress")
      .set(
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

    if (!cardsStudiedToday.includes(cardId)) cardsStudiedToday.push(cardId);
    const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newStreak =
      lastDate?.toDateString() === yesterday.toDateString()
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
