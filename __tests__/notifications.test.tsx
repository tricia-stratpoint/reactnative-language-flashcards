import {
  requestNotificationPermission,
  getFcmToken,
  initializeNotificationChannel,
  showTestNotification,
  handleManageNotifications,
  scheduleStudyReminder,
} from "@/app/utils/notifications";
import messaging from "@react-native-firebase/messaging";
import notifee from "@notifee/react-native";
import firestore from "@react-native-firebase/firestore";
import { Platform, Linking } from "react-native";

jest.spyOn(Linking, "openURL").mockImplementation(jest.fn());
jest.spyOn(Linking, "openSettings").mockImplementation(jest.fn());

// mock messaging
jest.mock("@react-native-firebase/messaging", () => {
  const messagingMock = {
    isDeviceRegisteredForRemoteMessages: true,
    registerDeviceForRemoteMessages: jest.fn(),
    requestPermission: jest.fn().mockResolvedValue(1),
    getToken: jest.fn().mockResolvedValue("fcm_token"),
    onMessage: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0 },
  };

  return {
    __esModule: true,
    default: () => messagingMock,
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0 },
  };
});

// mock notifee
jest.mock("@notifee/react-native", () => {
  const notifeeMock = {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    createChannel: jest.fn().mockResolvedValue("default"),
    displayNotification: jest.fn(),
    cancelDisplayedNotifications: jest.fn(),
    createTriggerNotification: jest.fn(),
    getNotificationSettings: jest
      .fn()
      .mockResolvedValue({ authorizationStatus: 1 }),
  };

  return {
    __esModule: true,
    default: notifeeMock,
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0 },
    AndroidImportance: { HIGH: 5 },
    TriggerType: { TIMESTAMP: "timestamp" },
  };
});

// mock firestore
const mockProgressDoc = {
  get: jest.fn().mockResolvedValue({
    data: () => ({ lastStudyDate: { toMillis: () => Date.now() } }),
  }),
  set: jest.fn(),
};
const mockUserDoc = {
  get: jest.fn().mockResolvedValue({ data: () => ({ username: "Tester" }) }),
  collection: jest.fn(() => ({ doc: jest.fn(() => mockProgressDoc) })),
};
jest.mock("@react-native-firebase/firestore", () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      collection: jest.fn(() => ({ doc: jest.fn(() => mockUserDoc) })),
    })),
    Timestamp: { fromDate: jest.fn(() => 123456) },
  };
});

describe("Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests notification permission", async () => {
    await requestNotificationPermission();
    expect(notifee.requestPermission).toHaveBeenCalled();
  });

  it("registers device for FCM and gets token", async () => {
    const token = await getFcmToken();
    expect(token).toBe("fcm_token");
    expect(messaging().registerDeviceForRemoteMessages).not.toHaveBeenCalled();
  });

  it("initializes notification channel on Android", async () => {
    Platform.OS = "android";
    await initializeNotificationChannel();
    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "default" })
    );
  });

  it("shows test notification", async () => {
    Platform.OS = "android";
    await showTestNotification();
    expect(notifee.displayNotification).toHaveBeenCalled();
  });

  it("handles manage notifications", async () => {
    await handleManageNotifications();
    expect(messaging().getToken).toHaveBeenCalled();
  });

  it("schedules study reminder if user has lastStudyDate", async () => {
    await scheduleStudyReminder("user123");
    expect(notifee.createTriggerNotification).toHaveBeenCalled();
  });

  it("skips study reminder if username missing", async () => {
    const mockUserDocNoName = {
      get: jest.fn().mockResolvedValue({ data: () => ({}) }),
      collection: jest.fn(() => ({ doc: jest.fn(() => mockProgressDoc) })),
    };
    (firestore as unknown as jest.Mock).mockReturnValue({
      collection: jest.fn(() => ({ doc: jest.fn(() => mockUserDocNoName) })),
    });

    await scheduleStudyReminder("user123");
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });
});
