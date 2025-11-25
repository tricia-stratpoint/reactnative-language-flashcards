import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { Colors } from "@/app/constants/colors";
import { UserRole } from "@/app/utils/roles";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { CommunityDeck } from "@/types/flashcard";

interface User {
  uid: string;
  email: string;
  username: string;
  role: UserRole;
}

export default function SuperAdminPanel() {
  const navigation = useNavigation();
  const role = useFlashcardStore((state) => state.role);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<{
    user: User;
    action: "promote" | "demote";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"moderators" | "decks">(
    "moderators"
  );
  const [pendingDecks, setPendingDecks] = useState<CommunityDeck[]>([]);
  const [liveDecks, setLiveDecks] = useState<CommunityDeck[]>([]);
  const [approveDeckModal, setApproveDeckModal] =
    useState<CommunityDeck | null>(null);

  const formatRole = (role: string) =>
    role
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const toggleModerator = async (user: User) => {
    const newRole = user.role === "moderator" ? "user" : "moderator";
    try {
      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({ role: newRole });
      setShowModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (role !== "super_admin") return;

    const unsubscribeUsers = firestore()
      .collection("users")
      .onSnapshot(
        (snapshot) => {
          const allUsers = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          })) as User[];
          setUsers([...allUsers].reverse());
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching users:", error);
          setUsers([]);
          setLoading(false);
        }
      );

    return () => unsubscribeUsers();
  }, [role]);

  useEffect(() => {
    const unsubscribeDecks = firestore()
      .collection("communityDecks")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const decks = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              createdBy: data.createdBy || "",
              status: data.status || "pending",
              createdAt: data.createdAt || null,
            } as CommunityDeck;
          });

          setPendingDecks(decks.filter((d) => d.status === "pending"));
          setLiveDecks(decks.filter((d) => d.status === "approved"));
        },
        (error) => {
          console.error("Error fetching decks:", error);
          setPendingDecks([]);
          setLiveDecks([]);
        }
      );

    return () => unsubscribeDecks();
  }, []);

  const renderDeckCard = (deck: CommunityDeck) => {
    return (
      <View key={deck.id} style={styles.deckCard}>
        <Text style={styles.deckTitle}>{deck.title}</Text>
        <Text style={styles.deckDescription}>{deck.description}</Text>
        <Text style={styles.deckCreatedBy}>Created by: {deck.createdBy}</Text>

        {deck.status === "pending" && (
          <TouchableOpacity
            style={[styles.button, styles.promoteButton]}
            onPress={() => setApproveDeckModal(deck)}
          >
            <Text style={styles.buttonText}>Approve Deck</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {role !== "super_admin" ? (
        <Text style={styles.accessDenied}>Access Denied</Text>
      ) : loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.blue}
          style={styles.loader}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft color={Colors.black} size={24} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Super Admin Panel</Text>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "moderators" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("moderators")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "moderators" && styles.activeTabText,
                ]}
              >
                Manage Moderators
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "decks" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("decks")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "decks" && styles.activeTabText,
                ]}
              >
                Manage Decks
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            {activeTab === "moderators" ? (
              <FlatList
                data={users}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.role}>
                      Role: {formatRole(item.role)}
                    </Text>

                    {item.email !== "pocketlingo.admin@yopmail.com" && (
                      <TouchableOpacity
                        style={[
                          styles.button,
                          item.role === "moderator"
                            ? styles.demoteButton
                            : styles.promoteButton,
                        ]}
                        onPress={() =>
                          setShowModal({
                            user: item,
                            action:
                              item.role === "moderator" ? "demote" : "promote",
                          })
                        }
                      >
                        <Text style={styles.buttonText}>
                          {item.role === "moderator"
                            ? "Demote to User"
                            : "Promote to Moderator"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No users found.</Text>
                  </View>
                }
              />
            ) : (
              <ScrollView style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Pending Community Decks</Text>
                {pendingDecks.length === 0 ? (
                  <Text>No pending decks</Text>
                ) : (
                  pendingDecks.map((deck) => renderDeckCard(deck))
                )}

                <Text style={styles.sectionTitle}>Live Community Decks</Text>
                {liveDecks.length === 0 ? (
                  <Text>No live decks yet</Text>
                ) : (
                  liveDecks.map((deck) => renderDeckCard(deck))
                )}
              </ScrollView>
            )}
          </View>

          <Modal visible={!!showModal} transparent animationType="fade">
            <View style={styles.modal}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {showModal?.action === "promote"
                    ? "Promote to Moderator?"
                    : "Demote to User?"}
                </Text>
                <Text style={styles.modalDescription}>
                  Are you sure you want to {showModal?.action}{" "}
                  {showModal?.user.username}?
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowModal(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.createButton]}
                    onPress={() => showModal && toggleModerator(showModal.user)}
                  >
                    <Text style={styles.createButtonText}>
                      {showModal?.action === "promote" ? "Promote" : "Demote"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={!!approveDeckModal} transparent animationType="fade">
            <View style={styles.modal}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Approve Community Deck?</Text>
                <Text style={styles.modalDescription}>
                  This deck will be publicly visible to everyone. Are you sure
                  you want to approve &quot;{approveDeckModal?.title}&quot;?
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setApproveDeckModal(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.createButton]}
                    onPress={async () => {
                      if (!approveDeckModal) return;
                      try {
                        await firestore()
                          .collection("communityDecks")
                          .doc(approveDeckModal.id)
                          .update({ status: "approved" });
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setApproveDeckModal(null);
                      }
                    }}
                  >
                    <Text style={styles.createButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "relative",
  },

  backButton: {
    position: "absolute",
    left: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
    textAlign: "center",
  },
  userCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },
  email: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  promoteButton: {
    backgroundColor: Colors.blue,
  },
  demoteButton: {
    backgroundColor: Colors.orange,
  },
  buttonText: {
    fontWeight: "600",
    color: Colors.white,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  accessDenied: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 18,
    color: Colors.red,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.gray,
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    color: Colors.black,
    marginBottom: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.gray,
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
  createButton: {
    backgroundColor: Colors.blue,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.gray,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.white,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.blue,
  },
  tabText: {
    fontSize: 16,
    color: Colors.gray,
    fontWeight: "500",
  },
  activeTabText: {
    color: Colors.blue,
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  deckCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },
  deckDescription: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  deckCreatedBy: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.blue,
    marginTop: 12,
    marginBottom: 8,
  },
});
