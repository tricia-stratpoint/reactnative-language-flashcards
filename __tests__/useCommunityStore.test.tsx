import { renderHook, act } from "@testing-library/react";
import { useCommunityStore } from "@/hooks/community-store";
import type { Flashcard } from "@/types/flashcard";

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: { currentUser: { uid: "testUserId" } },
}));

const mockAdd = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockOnSnapshot = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn().mockReturnValue({
  collection: jest.fn().mockReturnValue({
    add: mockAdd,
    onSnapshot: mockOnSnapshot,
    get: mockGet,
    doc: jest.fn().mockReturnValue({
      update: mockUpdate,
      delete: mockDelete,
    }),
  }),
  update: mockUpdate,
  delete: mockDelete,
  onSnapshot: mockOnSnapshot,
  get: mockGet,
});
const mockCollection = jest.fn().mockReturnValue(mockDoc());

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(),
};

jest.mock("@react-native-firebase/firestore", () => ({
  __esModule: true,
  default: jest.fn(() => mockCollection()),
  FieldValue: { serverTimestamp: jest.fn(() => 123456) },
  batch: jest.fn(() => mockBatch),
}));

describe("useCommunityStore hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with loading true and empty deck/cards", () => {
    const { result } = renderHook(() => useCommunityStore("deckId"));
    expect(result.current.loading).toBe(true);
    expect(result.current.deck).toBeNull();
    expect(result.current.cards).toEqual([]);
  });

  it("should call addDeck correctly", async () => {
    const { result } = renderHook(() => useCommunityStore("deckId"));
    await act(async () => {
      await result.current.addDeck("Test Deck", "Desc", "#fff");
    });
    expect(mockAdd).toHaveBeenCalledWith({
      title: "Test Deck",
      description: "Desc",
      color: "#fff",
      createdBy: "testUserId",
      createdAt: 123456,
      status: "pending",
    });
  });

  it("should call updateDeck correctly", async () => {
    const { result } = renderHook(() => useCommunityStore("deckId"));
    await act(async () => {
      await result.current.updateDeck("Title", "Desc", "#000");
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      title: "Title",
      description: "Desc",
      color: "#000",
    });
  });

  it("should call addCard correctly", async () => {
    const { result } = renderHook(() => useCommunityStore("deckId"));
    await act(async () => {
      await result.current.addCard("Front", "Back");
    });
    expect(mockDoc().collection().add).toHaveBeenCalledWith(
      expect.objectContaining({
        front: "Front",
        back: "Back",
        deckId: "deckId",
      }),
    );
  });

  it("should call saveCard correctly", async () => {
    const { result } = renderHook(() => useCommunityStore("deckId"));
    await act(async () => {
      await result.current.saveCard("card1", "Front Updated", "Back Updated");
    });
    expect(mockDoc().collection().doc("card1").update).toHaveBeenCalledWith({
      front: "Front Updated",
      back: "Back Updated",
    });
  });

  it("should call deleteCard correctly", async () => {
    const { result } = renderHook(() => useCommunityStore("deckId"));

    const card: Flashcard = {
      id: "card1",
      deckId: "deckId",
      front: "F",
      back: "B",
      createdAt: Date.now(),
      nextReview: Date.now(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good",
      language: "custom",
    };

    await act(async () => {
      await result.current.deleteCard(card);
    });

    expect(mockDoc().collection().doc("card1").delete).toHaveBeenCalled();
  });

  it("should call deleteDeck and batch delete cards", async () => {
    mockGet.mockResolvedValue({
      docs: [{ ref: "docRef1" }, { ref: "docRef2" }],
    });
    const { result } = renderHook(() => useCommunityStore("deckId"));

    await act(async () => {
      await result.current.deleteDeck();
    });

    expect(mockBatch.delete).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
  });
});
