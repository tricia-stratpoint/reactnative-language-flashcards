import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import AchievementsScreen from "@/app/screens/achievements";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

jest.mock("@/hooks/flashcard-store", () => ({
  useFlashcardStore: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock("expo-linear-gradient", () => {
  return ({ children }: any) => children;
});

jest.mock("lucide-react-native", () => ({
  Trophy: "Trophy",
  Target: "Target",
  Calendar: "Calendar",
  Star: "Star",
}));

describe("AchievementsScreen", () => {
  beforeEach(() => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });

  it("renders loading state", () => {
    (useFlashcardStore as unknown as jest.Mock).mockReturnValue({
      isLoading: true,
      stats: {},
    });

    const { getByTestId } = render(<AchievementsScreen />);
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders stats overview correctly", async () => {
    const statsMock = {
      totalCardsStudied: 5,
      studyStreak: 3,
      lastStudyDate: new Date().toISOString(),
      achievements: [],
    };

    (useFlashcardStore as unknown as jest.Mock).mockReturnValue({
      isLoading: false,
      stats: statsMock,
    });

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText("5")).toBeTruthy(); // totalCardsStudied
      expect(getByText("3")).toBeTruthy(); // streak
      expect(getByText("Your Achievements")).toBeTruthy();
    });
  });

  it("renders locked and unlocked achievements correctly", async () => {
    const statsMock = {
      totalCardsStudied: 12,
      studyStreak: 2,
      lastStudyDate: new Date().toISOString(),
      achievements: [
        {
          id: "1",
          title: "First Card",
          description: "Desc1",
          icon: "🏆",
          progress: 1,
          target: 1,
          unlockedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Ten Cards",
          description: "Desc2",
          icon: "⭐",
          progress: 5,
          target: 10,
          unlockedAt: null,
        },
      ],
    };

    (useFlashcardStore as unknown as jest.Mock).mockReturnValue({
      isLoading: false,
      stats: statsMock,
    });

    const { getByText } = render(<AchievementsScreen />);

    await waitFor(() => {
      expect(getByText("First Card")).toBeTruthy();
      expect(getByText("Ten Cards")).toBeTruthy();
      expect(getByText("5 / 10")).toBeTruthy(); // progress of locked achievement
    });
  });

  it("renders motivational message based on totalCardsStudied", async () => {
    const statsMock = {
      totalCardsStudied: 0,
      studyStreak: 0,
      lastStudyDate: null,
      achievements: [],
    };

    (useFlashcardStore as unknown as jest.Mock).mockReturnValue({
      isLoading: false,
      stats: statsMock,
    });

    const { getByText } = render(<AchievementsScreen />);
    await waitFor(() => {
      expect(getByText(/Start your learning journey/i)).toBeTruthy();
    });
  });
});
