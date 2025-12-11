import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import StudyScreen from "@/app/screens/index";
import { useFlashcardStore } from "@/hooks/flashcard-store";

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: {
    currentUser: { uid: "user123", displayName: "Test User" },
  },
}));

jest.mock("@react-native-firebase/firestore", () => {
  const onSnapshotMock = jest.fn();
  const collectionMock = jest.fn(() => ({
    doc: jest.fn(() => ({
      collection: jest.fn(() => ({
        orderBy: jest.fn(() => ({ onSnapshot: onSnapshotMock })),
      })),
    })),
    where: jest.fn(() => ({ onSnapshot: onSnapshotMock })),
  }));
  return jest.fn(() => ({
    collection: collectionMock,
    FieldValue: { serverTimestamp: jest.fn() },
  }));
});

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock("@/hooks/flashcard-store", () => ({
  useFlashcardStore: jest.fn(() => ({
    isLoading: false,
    cards: [],
    loadAllLanguages: jest.fn(),
    decks: [],
    fetchAchievements: jest.fn(),
    studyCard: jest.fn(),
  })),
}));

jest.mock("react-native-confetti-cannon", () => "ConfettiCannon");

describe("StudyScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    (useFlashcardStore as unknown as jest.Mock).mockReturnValueOnce({
      isLoading: true,
      cards: [],
      loadAllLanguages: jest.fn(),
      decks: [],
      fetchAchievements: jest.fn(),
      studyCard: jest.fn(),
    });

    const { getByTestId } = render(<StudyScreen />);
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders deck selection when no deck selected", async () => {
    (useFlashcardStore as unknown as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      cards: [],
      loadAllLanguages: jest.fn(),
      decks: [],
      fetchAchievements: jest.fn(),
      studyCard: jest.fn(),
    });

    const { getByText } = render(<StudyScreen />);
    await waitFor(() => {
      expect(getByText(/Ready to Learn\?/i)).toBeTruthy();
    });
  });

  it("starts study session when a deck is selected", async () => {
    const mockDeck = {
      id: "deck1",
      language: "english",
      name: "Test Deck",
      description: "Desc",
      isCommunity: false,
    };

    (useFlashcardStore as unknown as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      cards: [],
      loadAllLanguages: jest.fn(),
      decks: [mockDeck],
      fetchAchievements: jest.fn(),
      studyCard: jest.fn(),
    });

    const { getByText } = render(<StudyScreen />);
    const deckButton = getByText("Test Deck");
    fireEvent.press(deckButton);

    await waitFor(() => {
      expect(getByText(/Loading card/i)).toBeTruthy();
    });
  });
});
