import messaging from "@react-native-firebase/messaging";
import notifee, {
  AuthorizationStatus,
  AndroidImportance,
} from "@notifee/react-native";
import { Platform, Linking } from "react-native";

// ask for permission
export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log("Notifications permission granted.");
  } else {
    console.log("Notifications permission denied.");
  }
}

// get fcm token
export async function getFcmToken() {
  await messaging().registerDeviceForRemoteMessages();
  const token = await messaging().getToken();
  console.log("FCM Token:", token);
  return token;
}

// foreground message listener
export function setupForegroundListener() {
  messaging().onMessage(async (remoteMessage) => {
    console.log("FCM Message Received:", remoteMessage);

    await notifee.displayNotification({
      title: remoteMessage.notification?.title || "New Message",
      body: remoteMessage.notification?.body || "You have a new notification.",
      android: {
        channelId: "default",
      },
      ios: {
        sound: "default",
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  });
}

// create test local notification

export async function initializeNotificationChannel() {
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      importance: AndroidImportance.HIGH,
      sound: "default",
    });
  }
}

export async function showTestNotification() {
  const settings = await notifee.requestPermission();
  console.log("iOS permission result:", settings);

  let channelId: string | undefined = undefined;
  if (Platform.OS === "android") {
    channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  }

  await notifee.cancelDisplayedNotifications();
  await new Promise((res) => setTimeout(res, 200));

  await notifee.displayNotification({
    id: Date.now().toString(),
    title: "PocketLingo Notification",
    body: "This is a test local notification!",
    android: {
      channelId,
      smallIcon: "ic_launcher",
      pressAction: { id: "default" },
      autoCancel: true,
      importance: AndroidImportance.HIGH,
      vibrationPattern: [300, 500],
      groupId: Date.now().toString(),
    },
    ios: {
      sound: "default",
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  });
}

export const handleEnableNotifications = async () => {
  try {
    const settings = await notifee.getNotificationSettings();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      // if already granted, open system settings
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
    } else {
      // if not granted, request permission
      const newSettings = await notifee.requestPermission();
      if (newSettings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
        console.log("Notifications permission granted.");
        await messaging().getToken();
      } else {
        console.log("Notifications permission denied.");
      }
    }
  } catch (error) {
    console.error("Error handling notifications:", error);
  }
};
