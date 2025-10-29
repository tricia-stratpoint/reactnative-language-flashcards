import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Trash2, Download, Bell, Info, LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/colors";
import auth from "@react-native-firebase/auth";
import { resetUserProgress } from "@/hooks/flashcard-store";
import { useNavigation } from "@react-navigation/native";
import {
  setupForegroundListener,
  showTestNotification,
  handleEnableNotifications,
} from "../utils/notifications";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showClearModal, setShowClearModal] = React.useState(false);
  const [showAboutModal, setShowAboutModal] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      });
      console.log("User logged out");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleClearData = () => setShowClearModal(true);
  const showAbout = () => setShowAboutModal(true);

  React.useEffect(() => {
    setupForegroundListener();
  }, []);

  const handleTestNotification = async () => {
    await showTestNotification();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.blue, Colors.greenMint, Colors.greenDark]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: Colors.blue }]}
                >
                  <LogOut size={20} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Logout</Text>
                  <Text style={styles.settingDescription}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: Colors.pink }]}
                >
                  <Download size={20} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Downloaded Content</Text>
                  <Text style={styles.settingDescription}>
                    View your offline decks and cards
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleClearData}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: Colors.red }]}
                >
                  <Trash2 size={20} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Reset Progress</Text>
                  <Text style={styles.settingDescription}>
                    Delete all progress and achievements
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleEnableNotifications}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.orange },
                  ]}
                >
                  <Bell size={20} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Manage Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Set your notification preferences
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleTestNotification}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: Colors.purple },
                  ]}
                >
                  <Bell size={20} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Test Notification</Text>
                  <Text style={styles.settingDescription}>
                    Tap to send a test notification
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            <TouchableOpacity style={styles.settingItem} onPress={showAbout}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: Colors.gray }]}
                >
                  <Info size={20} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.settingTitle}>About PocketLingo</Text>
                  <Text style={styles.settingDescription}>
                    Version and app information
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How Spaced Repetition Works</Text>
            <Text style={styles.infoText}>
              PocketLingo uses a spaced repetition algorithm to optimize your
              learning. Cards you find difficult will appear more frequently,
              while cards you know well will appear less often. This helps you
              focus on what you need to learn most.
            </Text>

            <View style={styles.difficultyGuide}>
              <Text style={styles.guideTitle}>Rating Guide:</Text>
              <View style={styles.guideItem}>
                <View
                  style={[styles.guideDot, { backgroundColor: Colors.red }]}
                />
                <Text style={styles.guideText}>
                  <Text style={styles.guideBold}>Again</Text> - You did not
                  remember
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View
                  style={[styles.guideDot, { backgroundColor: Colors.orange }]}
                />
                <Text style={styles.guideText}>
                  <Text style={styles.guideBold}>Hard</Text> - You barely
                  remembered
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View
                  style={[
                    styles.guideDot,
                    { backgroundColor: Colors.greenDark },
                  ]}
                />
                <Text style={styles.guideText}>
                  <Text style={styles.guideBold}>Good</Text> - You remembered
                  correctly
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View
                  style={[styles.guideDot, { backgroundColor: Colors.blue }]}
                />
                <Text style={styles.guideText}>
                  <Text style={styles.guideBold}>Easy</Text> - You remembered
                  easily
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Clear Data Modal */}
        <Modal visible={showClearModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Clear All Data</Text>
              <Text style={styles.modalText}>
                This will permanently delete all your decks, cards, and
                progress. This action cannot be undone.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowClearModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.destructiveButton]}
                  onPress={async () => {
                    await resetUserProgress();
                    setShowClearModal(false);
                    navigation.goBack();
                  }}
                >
                  <Text style={styles.destructiveButtonText}>Clear Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* About Modal */}
        <Modal visible={showAboutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>About PocketLingo</Text>
              <Text style={styles.modalText}>
                PocketLingo is a spaced repetition flashcard app designed to
                help you learn efficiently.
                {"\n\n"}Version 1.0.0
                {"\n\n"}Built with React Native and Expo
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={styles.primaryButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Logout Modal */}
        <Modal visible={showLogoutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Logout</Text>
              <Text style={styles.modalText}>
                Are you sure you want to log out?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.destructiveButton]}
                  onPress={confirmLogout}
                >
                  <Text style={styles.destructiveButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.gray,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
    marginBottom: 16,
  },
  difficultyGuide: {
    gap: 8,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 8,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  guideDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  guideText: {
    fontSize: 14,
    color: Colors.white,
  },
  guideBold: {
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: Colors.gray,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  destructiveButton: {
    backgroundColor: Colors.red,
  },
  primaryButton: {
    backgroundColor: Colors.blue,
  },
  cancelButtonText: {
    color: Colors.gray,
    fontSize: 16,
    fontWeight: "500",
  },
  destructiveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
});
