import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "@/app/screens/settings";
import auth from "@react-native-firebase/auth";
import crashlytics from "@react-native-firebase/crashlytics";
import { useNavigation } from "@react-navigation/native";
import { resetUserProgress, clearAllListeners } from "@/hooks/flashcard-store";
import {
  showTestNotification,
  scheduleStudyReminder,
  handleManageNotifications,
} from "@/app/utils/notifications";
import { getOfflineDecks } from "@/app/utils/offlineStorage";

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: () => ({
    signOut: jest.fn(),
    currentUser: { uid: "123" },
  }),
}));

jest.mock("@react-native-firebase/crashlytics", () => ({
  __esModule: true,
  default: () => ({
    crash: jest.fn(),
  }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

jest.mock("@/hooks/flashcard-store", () => ({
  resetUserProgress: jest.fn(),
  clearAllListeners: jest.fn(),
}));

jest.mock("@/app/utils/notifications", () => ({
  showTestNotification: jest.fn(),
  scheduleStudyReminder: jest.fn(),
  handleManageNotifications: jest.fn(),
}));

jest.mock("@/app/utils/offlineStorage", () => ({
  getOfflineDecks: jest.fn(),
  deleteOfflineDeck: jest.fn(),
}));

jest.mock(
  "expo-linear-gradient",
  () =>
    ({ children }: any) =>
      children,
);
jest.mock("lucide-react-native", () => ({
  Trash2: "Trash2",
  Download: "Download",
  Bell: "Bell",
  Info: "Info",
  LogOut: "LogOut",
}));

describe("SettingsScreen", () => {
  const goBack = jest.fn();
  const reset = jest.fn();

  beforeEach(() => {
    (useNavigation as jest.Mock).mockReturnValue({ goBack, reset });
    (getOfflineDecks as jest.Mock).mockResolvedValue([]);
  });

  it("renders correctly", async () => {
    const { getByText } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(getByText("Settings")).toBeTruthy();
      expect(getByText("Account")).toBeTruthy();
      expect(getByText("Data Management")).toBeTruthy();
      expect(getByText("App Settings")).toBeTruthy();
      expect(getByText("About")).toBeTruthy();
    });
  });

  it("opens and confirms logout modal", async () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Logout"));
    await waitFor(() => expect(getByText("Confirm Logout")).toBeTruthy());

    fireEvent.press(getByText("Logout"));
    await waitFor(() => {
      expect(clearAllListeners).toHaveBeenCalled();
      expect(auth().signOut).toHaveBeenCalled();
      expect(reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "Login" }],
      });
    });
  });

  it("opens and confirms clear data modal", async () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Reset Progress"));
    await waitFor(() => expect(getByText("Clear All Data")).toBeTruthy());

    fireEvent.press(getByText("Clear Data"));
    await waitFor(() => {
      expect(resetUserProgress).toHaveBeenCalled();
      expect(goBack).toHaveBeenCalled();
    });
  });

  it("triggers test notification", async () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Test Notification"));
    await waitFor(() => {
      expect(showTestNotification).toHaveBeenCalled();
      expect(scheduleStudyReminder).toHaveBeenCalledWith("123");
    });
  });

  it("triggers manage notifications", async () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Manage Notifications"));
    await waitFor(() => {
      expect(handleManageNotifications).toHaveBeenCalled();
    });
  });

  it("triggers crashlytics crash", () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Test Crash"));
    expect(crashlytics().crash).toHaveBeenCalled();
  });

  it("opens about modal and closes it", async () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("About PocketLingo"));
    await waitFor(() => expect(getByText("About PocketLingo")).toBeTruthy());
    fireEvent.press(getByText("OK"));
  });

  it("opens downloads modal with no decks", async () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText("Downloaded Content"));
    await waitFor(() => {
      expect(getByText("You have no downloaded decks.")).toBeTruthy();
    });
  });
});
