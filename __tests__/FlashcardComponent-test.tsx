import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import FlashcardComponent from "@/components/FlashcardComponent";
import Tts from "react-native-tts";
import { Flashcard } from "@/types/flashcard";

// mock tts
jest.mock("react-native-tts", () => ({
  __esModule: true,
  default: {
    speak: jest.fn(),
    stop: jest.fn(),
    setDefaultLanguage: jest.fn(),
    setDefaultPitch: jest.fn(),
    setDefaultRate: jest.fn(),
    getInitStatus: jest.fn().mockResolvedValue(true),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// mock flipcard to render both sides
jest.mock("react-native-flip-card", () => {
  const MockFlipCard: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => <>{children}</>;
  MockFlipCard.displayName = "MockFlipCard";
  return MockFlipCard;
});

const mockCard: Flashcard = {
  id: "1",
  deckId: "deck1",
  front: "Hola",
  back: "Hello",
  language: "spanish",
  difficulty: "good",
  createdAt: Date.now(),
  nextReview: Date.now(),
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
};

describe("FlashcardComponent", () => {
  it("renders front of the card initially", () => {
    const onSwipe = jest.fn();
    const { getByText } = render(
      <FlashcardComponent card={mockCard} onSwipe={onSwipe} />
    );

    expect(getByText("Hola")).toBeTruthy();
    expect(getByText("Tap to reveal")).toBeTruthy();
  });

  it("flips to back when card is pressed", async () => {
    const onSwipe = jest.fn();
    const { getByText } = render(
      <FlashcardComponent card={mockCard} onSwipe={onSwipe} />
    );

    fireEvent.press(getByText("Hola")); // tap front

    await act(async () => {
      expect(getByText("Hello")).toBeTruthy();
      expect(getByText("Swipe to rate difficulty")).toBeTruthy();
    });
  });

  it("calls onSwipe with 'good' when right indicator is pressed", () => {
    const onSwipe = jest.fn();
    const { getByText } = render(
      <FlashcardComponent card={mockCard} onSwipe={onSwipe} />
    );

    fireEvent.press(getByText("good"));
    expect(onSwipe).toHaveBeenCalledWith("good");
  });

  it("calls onSwipe with 'again' when left indicator is pressed", () => {
    const onSwipe = jest.fn();
    const { getByText } = render(
      <FlashcardComponent card={mockCard} onSwipe={onSwipe} />
    );

    fireEvent.press(getByText("again"));
    expect(onSwipe).toHaveBeenCalledWith("again");
  });

  it("calls TTS speak function when audio button is pressed", async () => {
    const onSwipe = jest.fn();
    const { getByTestId } = render(
      <FlashcardComponent card={mockCard} onSwipe={onSwipe} />
    );

    // using testID to find the audio button
    const audioButton = getByTestId("audio-button");

    await act(async () => {
      fireEvent.press(audioButton);
    });

    expect(Tts.setDefaultLanguage).toHaveBeenCalledWith("es-ES");
    expect(Tts.speak).toHaveBeenCalledWith("Hello");
  });
});
