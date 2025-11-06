import { act } from "@testing-library/react-native";
import { useFlashcardStore } from "@/hooks/flashcard-store";

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: {
      uid: "user123",
      displayName: "Test User",
      email: "test@example.com",
    },
  })),
}));

class MockTimestamp {
  date: Date;
  constructor(date: Date) {
    this.date = date;
  }
  toDate() {
    return this.date;
  }
  toMillis() {
    return this.date.getTime();
  }
  seconds = Math.floor(Date.now() / 1000);
  nanoseconds = 0;
  isEqual(other: { toMillis: () => number }) {
    return this.toMillis() === other.toMillis();
  }
  toJSON() {
    return this.date.toISOString();
  }
}

const mockDoc = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  set: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
  add: jest.fn().mockResolvedValue({ id: "doc123" }),
};

const mockFirestoreFn: any = jest.fn(() => mockDoc);
mockFirestoreFn.FieldValue = { serverTimestamp: jest.fn(() => ({})) };
mockFirestoreFn.Timestamp = { fromDate: (d: Date) => new MockTimestamp(d) };

jest.mock("@react-native-firebase/firestore", () => ({
  __esModule: true,
  default: mockFirestoreFn,
}));

describe("FlashcardStore", () => {
  beforeEach(() => {
    const { setCards, setDecks, setStats } = useFlashcardStore.getState();
    act(() => {
      setCards([]);
      setDecks([]);
      setStats({
        totalCardsStudied: 0,
        studyStreak: 0,
        lastStudyDate: null,
        achievements: [],
        cardsStudiedToday: [],
      });
    });
  });

  it("initial state", () => {
    const state = useFlashcardStore.getState();
    expect(state.decks).toEqual([]);
    expect(state.cards).toEqual([]);
    expect(state.stats.totalCardsStudied).toBe(0);
    expect(state.isLoading).toBe(true);
  });

  it("sets decks, cards, and stats", () => {
    act(() => {
      useFlashcardStore.getState().setDecks([
        {
          id: "d1",
          name: "Deck 1",
          description: "Desc",
          color: "#fff",
          language: "custom",
        },
      ]);
      useFlashcardStore.getState().setCards([
        {
          id: "c1",
          deckId: "d1",
          front: "Hello",
          back: "Hola",
          language: "custom",
          createdAt: Date.now(),
          nextReview: Date.now(),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          difficulty: "good",
        },
      ]);
      useFlashcardStore.getState().setStats({
        totalCardsStudied: 5,
        studyStreak: 2,
        lastStudyDate: Date.now(),
        achievements: [],
        cardsStudiedToday: [],
      });
    });

    const state = useFlashcardStore.getState();
    expect(state.decks.length).toBe(1);
    expect(state.cards.length).toBe(1);
    expect(state.stats.totalCardsStudied).toBe(5);
  });

  it("studyCard updates stats correctly", () => {
    const statsBefore = useFlashcardStore.getState().stats;
    act(() => {
      useFlashcardStore.getState().studyCard("card1", true);
    });
    const statsAfter = useFlashcardStore.getState().stats;

    expect(statsAfter.totalCardsStudied).toBe(
      statsBefore.totalCardsStudied + 1
    );
    expect(statsAfter.cardsStudiedToday).toContain("card1");
    expect(statsAfter.studyStreak).toBeGreaterThanOrEqual(1);
  });

  it("updateAchievements updates progress correctly", () => {
    act(() => {
      useFlashcardStore.getState().updateAchievements({
        totalCardsStudied: 1,
        studyStreak: 1,
        perfectSession: true,
      });
    });

    const stats = useFlashcardStore.getState().stats;
    const perfectAchievement = stats.achievements.find(
      (a) => a.id === "perfect_session"
    );
    expect(perfectAchievement?.progress).toBe(1);
    expect(perfectAchievement?.unlockedAt).not.toBeNull();
  });
});
