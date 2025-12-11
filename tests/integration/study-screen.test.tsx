import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";
import StudyScreen from "@/app/screens/index";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

jest.mock("@/components/FlashcardComponent", () => {
  const MockFlashcard = ({
    onSwipe,
    card,
  }: {
    onSwipe: (rating: "good" | "bad" | "hard") => void;
    card: { front: string };
  }) => (
    <TouchableOpacity onPress={() => onSwipe("good")} testID="mock-flashcard">
      <Text>{card.front}</Text>
    </TouchableOpacity>
  );
  MockFlashcard.displayName = "MockFlashcard";
  return MockFlashcard;
});

jest.mock("@react-native-firebase/auth", () => () => ({
  currentUser: { uid: "user123", displayName: "Tricia" },
}));

const mockOnSnapshot = jest.fn((cb: (snapshot: any) => void) => {
  cb({
    docs: [
      {
        id: "card1",
        data: () => ({ front: "Hola", back: "Hello", createdAt: 1 }),
      },
    ],
  });
  return jest.fn();
});

jest.mock("@react-native-firebase/firestore", () => {
  return () => ({
    collection: () => ({
      where: () => ({ onSnapshot: mockOnSnapshot }),
      doc: () => ({
        collection: () => ({
          orderBy: () => ({ onSnapshot: mockOnSnapshot }),
        }),
      }),
    }),
  });
});

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn((callback: (state: NetInfoState) => void) => {
    callback({
      type: "cellular",
      isConnected: true,
      isInternetReachable: true,
      details: {
        carrier: null,
        cellularGeneration: null,
        isConnectionExpensive: false,
      },
    } as NetInfoState);

    return { remove: jest.fn() };
  }),
}));

jest.mock("react-native-confetti-cannon", () => "Confetti");

const mockStoreState = {
  isLoading: false,
  cards: [],
  decks: [
    {
      id: "deck1",
      language: "spanish",
      name: "Basic Spanish",
      description: "",
      isCommunity: false,
    },
  ],
  loadAllLanguages: jest.fn(),
  fetchAchievements: jest.fn(),
};

jest
  .spyOn(useFlashcardStore, "getState")
  .mockReturnValue(
    mockStoreState as unknown as ReturnType<typeof useFlashcardStore.getState>,
  );

jest.mock("@/hooks/flashcard-store", () => ({
  useFlashcardStore: jest.fn((selector) => selector(mockStoreState)),
}));

describe("StudyScreen Integration", () => {
  it("renders deck list and loads cards when deck is selected", async () => {
    const { getByText } = render(<StudyScreen />);
    expect(getByText("Basic Spanish")).toBeTruthy();

    fireEvent.press(getByText("Basic Spanish"));

    await waitFor(() => {
      expect(getByText("Hola")).toBeTruthy();
    });
  });

  it("handles rating a flashcard (good)", async () => {
    const { getByText, getByTestId } = render(<StudyScreen />);
    fireEvent.press(getByText("Basic Spanish"));

    await waitFor(() => {
      expect(getByText("Hola")).toBeTruthy();
    });

    fireEvent.press(getByTestId("mock-flashcard"));

    await waitFor(() => {
      expect(mockStoreState.fetchAchievements).toHaveBeenCalled();
    });
  });

  it("renders correctly when offline", async () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementationOnce(
      (callback: (state: NetInfoState) => void) => {
        callback({
          type: "none",
          isConnected: false,
          isInternetReachable: false,
          details: null,
        } as NetInfoState);
        return { remove: jest.fn() };
      },
    );

    const { getByText } = render(<StudyScreen />);
    fireEvent.press(getByText("Basic Spanish"));

    await waitFor(() => {
      expect(getByText("Hola")).toBeTruthy();
    });
  });
});
