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
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { Colors } from "@/app/constants/colors";
import { UserRole } from "@/app/utils/roles";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

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

  useEffect(() => {
    if (role !== "super_admin") return;

    const unsubscribe = firestore()
      .collection("users")
      .onSnapshot(
        (snapshot) => {
          const allUsers = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          })) as User[];
          setUsers(allUsers);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching users:", error);
          setUsers([]);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [role]);

  const toggleModerator = async (user: User) => {
    const newRole = user.role === "moderator" ? "user" : "moderator";
    await firestore()
      .collection("users")
      .doc(user.uid)
      .update({ role: newRole });
    setShowModal(null);
  };

  if (role !== "super_admin")
    return <Text style={styles.accessDenied}>Access Denied</Text>;
  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={Colors.blue}
        style={styles.loader}
      />
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={Colors.black} size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Super Admin Panel</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.role}>Role: {item.role}</Text>

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
                    action: item.role === "moderator" ? "demote" : "promote",
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
    backgroundColor: Colors.greenMint,
  },
  demoteButton: {
    backgroundColor: Colors.orange,
  },
  buttonText: {
    fontWeight: "600",
    color: Colors.black,
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
});
