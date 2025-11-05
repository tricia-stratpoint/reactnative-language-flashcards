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
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log("Notifications permission granted.");
  } else {
    console.log("Notifications permission denied.");
  }
}

// register for remote messages for fcm
export async function registerDeviceForFCM() {
  if (!messaging().isDeviceRegisteredForRemoteMessages) {
    await messaging().registerDeviceForRemoteMessages();
  }

  const authStatus = await messaging().requestPermission();
  if (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  ) {
    console.log("FCM permission granted.");
  } else {
    console.log("FCM permission denied.");
  }
}

// get fcm token
export async function getFcmToken() {
  try {
    await registerDeviceForFCM();
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    return token;
  } catch (err) {
    console.error("Failed to get FCM token:", err);
    return null;
  }
}

// foreground message listener
export function setupForegroundListener() {
  messaging().onMessage(async (remoteMessage) => {
    console.log("FCM Message Received:", remoteMessage);

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
  console.log("Message handled in background:", remoteMessage);
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

export const handleManageNotifications = async () => {
  try {
    const settings = await notifee.getNotificationSettings();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      // if already granted, open system settings
      await registerDeviceForFCM();
      const token = await messaging().getToken();
      console.log("FCM Token:", token);

      // optionally open settings
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
    } else {
      // if not granted, request permission. open system settings
      console.log(
        "Notifications permission denied. Redirecting to system settings..."
      );
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
      console.log(`No username found for user ${userId}, skipping reminder.`);
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
      console.log(`No lastStudyDate found for ${username}, setting default.`);
      await firestore()
        .collection("users")
        .doc(userId)
        .collection("stats")
        .doc("progress")
        .set(
          { lastStudyDate: firestore.Timestamp.fromDate(new Date()) },
          { merge: true }
        );
      return;
    }

    const lastStudyTime = lastStudyTimestamp.toMillis?.() ?? lastStudyTimestamp;

    if (isNaN(lastStudyTime)) {
      console.log(`Invalid lastStudyDate for ${username}, skipping reminder.`);
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
      { type: TriggerType.TIMESTAMP, timestamp: nextStudyTime.getTime() }
    );

    console.log(`Scheduled study reminder for ${username} at`, nextStudyTime);
  } catch (error) {
    console.error("Error scheduling study reminder:", error);
  }
}
