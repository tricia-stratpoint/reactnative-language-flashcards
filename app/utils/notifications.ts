import messaging from "@react-native-firebase/messaging";
import notifee, {
  AuthorizationStatus,
  AndroidImportance,
} from "@notifee/react-native";

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
    });
  });
}

// create test local notification

export async function initializeNotificationChannel() {
  await notifee.createChannel({
    id: "default",
    name: "Default Channel",
    importance: AndroidImportance.HIGH,
    sound: "default",
  });
}

export async function showTestNotification() {
  await notifee.requestPermission();
  const channelId = await notifee.createChannel({
    id: "default",
    name: "Default Channel",
    importance: AndroidImportance.HIGH,
    vibration: true,
  });

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
  });
}
