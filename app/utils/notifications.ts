import messaging from "@react-native-firebase/messaging";
import notifee, {
  AuthorizationStatus,
  AndroidImportance,
  TriggerType,
} from "@notifee/react-native";
import { Platform, Linking } from "react-native";
import firestore from "@react-native-firebase/firestore";

// ask for permission
export async function requestNotificationPermission() {
  await notifee.requestPermission();
}

// register for remote messages for fcm
export async function registerDeviceForFCM() {
  if (!messaging().isDeviceRegisteredForRemoteMessages) {
    await messaging().registerDeviceForRemoteMessages();
  }

  await messaging().requestPermission();
}

// get fcm token
export async function getFcmToken() {
  try {
    await registerDeviceForFCM();
    const token = await messaging().getToken();
    return token;
  } catch (err) {
    console.error("Failed to get FCM token:", err);
    return null;
  }
}

// foreground message listener
export function setupForegroundListener() {
  messaging().onMessage(async (remoteMessage) => {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || "New Message",
      body: remoteMessage.notification?.body || "You have a new notification.",
      android: { channelId: "default" },
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

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || "New Message",
    body: remoteMessage.notification?.body || "You have a new notification.",
    android: { channelId: "default" },
    ios: {
      sound: "default",
      foregroundPresentationOptions: { alert: true, badge: true, sound: true },
    },
  });
});

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
  await notifee.requestPermission();

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

export const handleManageNotifications = async () => {
  try {
    const settings = await notifee.getNotificationSettings();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      // if already granted, open system settings
      await registerDeviceForFCM();
      await messaging().getToken();

      // optionally open settings
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
    } else {
      // if not granted, request permission. open system settings
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
    }
  } catch (error) {
    console.error("Error handling notifications:", error);
  }
};

export async function scheduleStudyReminder(userId: string) {
  try {
    // fetch user data
    const userDoc = await firestore().collection("users").doc(userId).get();
    const username = userDoc.data()?.username;
    if (!username) {
      return;
    }

    // fetch lastStudyDate
    const progressDoc = await firestore()
      .collection("users")
      .doc(userId)
      .collection("stats")
      .doc("progress")
      .get();

    const lastStudyTimestamp = progressDoc.data()?.lastStudyDate;
    if (!lastStudyTimestamp) {
      await firestore()
        .collection("users")
        .doc(userId)
        .collection("stats")
        .doc("progress")
        .set(
          { lastStudyDate: firestore.Timestamp.fromDate(new Date()) },
          { merge: true },
        );
      return;
    }

    const lastStudyTime = lastStudyTimestamp.toMillis?.() ?? lastStudyTimestamp;

    if (isNaN(lastStudyTime)) {
      return;
    }

    const nextStudyTime = new Date(lastStudyTime + 24 * 60 * 60 * 1000);

    const channelId = await notifee.createChannel({
      id: "study-reminder",
      name: "Study Reminder",
      importance: AndroidImportance.HIGH,
    });

    await notifee.createTriggerNotification(
      {
        id: `study-reminder-${username}`,
        title: "Time to study!",
        body: "Review your flashcards and keep your streak going!",
        android: {
          channelId,
          smallIcon: "ic_launcher",
          pressAction: { id: "default" },
        },
        ios: { sound: "default" },
      },
      { type: TriggerType.TIMESTAMP, timestamp: nextStudyTime.getTime() },
    );
  } catch {}
}
