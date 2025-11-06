import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveDeckOffline,
  getOfflineDecks,
  deleteOfflineDeck,
  isDeckOffline,
} from "@/app/utils/offlineStorage";
import { Deck, Flashcard } from "@/types/flashcard";

// mock asyncstorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe("Offline Deck Storage", () => {
  const sampleDeck: Deck = {
    id: "deck1",
    name: "Sample Deck",
    description: "A sample description",
    color: "blue",
    language: "custom",
  };

  const sampleCard: Flashcard[] = [
    {
      id: "card1",
      front: "What is 2+2?",
      back: "4",
      deckId: "deck1",
      createdAt: Date.now(),
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good",
      language: "custom",
    },
  ];

  const newCards: Flashcard[] = [
    {
      id: "card2",
      front: "Q2",
      back: "A2",
      deckId: "deck1",
      createdAt: Date.now(),
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good",
      language: "custom",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves a deck offline under the correct key", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    await saveDeckOffline(sampleDeck, sampleCard, true);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "user_decks",
      expect.stringContaining('"deck":{"id":"deck1"')
    );
  });

  it("retrieves offline decks", async () => {
    const stored = JSON.stringify([{ deck: sampleDeck, cards: sampleCard }]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(stored);

    const decks = await getOfflineDecks(true);
    expect(decks).toHaveLength(1);
    expect(decks[0].deck.id).toBe("deck1");
  });

  it("deletes a deck offline", async () => {
    const stored = JSON.stringify([{ deck: sampleDeck, cards: sampleCard }]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(stored);

    await deleteOfflineDeck("deck1", true);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith("user_decks", "[]");
  });

  it("checks if a deck exists offline", async () => {
    const stored = JSON.stringify([{ deck: sampleDeck, cards: sampleCard }]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(stored);

    const exists = await isDeckOffline("deck1", true);
    expect(exists).toBe(true);

    const notExists = await isDeckOffline("deck2", true);
    expect(notExists).toBe(false);
  });

  it("replaces an existing deck when saving", async () => {
    const existing = JSON.stringify([{ deck: sampleDeck, cards: sampleCard }]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(existing);

    await saveDeckOffline(sampleDeck, newCards, true);

    const callArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    expect(callArg).toContain('"cards":[{"id":"card2"');
    expect(callArg).not.toContain('"id":"card1"');
  });
});
