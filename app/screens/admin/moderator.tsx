import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ArrowLeft, Plus, CheckCircle, Clock } from "lucide-react-native";
import { Colors } from "@/app/constants/colors";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import type { CommunityDeck } from "@/types/flashcard";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/app/navigation/AppNavigator";
import auth from "@react-native-firebase/auth";

type ModeratorPanelNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ModeratorPanel"
>;

const ModeratorPanel = () => {
  const navigation = useNavigation<ModeratorPanelNavigationProp>();
  const role = useFlashcardStore((state) => state.role);

  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<CommunityDeck[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const DECK_COLORS = [
    Colors.red,
    Colors.orange,
    Colors.greenMint,
    Colors.greenDark,
    Colors.blue,
    Colors.purple,
    Colors.pink,
  ];

  useEffect(() => {
    const unsub = firestore()
      .collection("communityDecks")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot || !snapshot.docs) {
            setDecks([]);
            setLoading(false);
            return;
          }

          const list: CommunityDeck[] = snapshot.docs.map((doc) => {
            const data = doc.data() as {
              title?: string;
              description?: string;
              status?: "pending" | "approved";
              createdBy?: string;
              createdAt?: any;
            };

            return {
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              status: data.status || "pending",
              createdBy: data.createdBy || "",
              createdAt: data.createdAt || null,
            };
          });

          setDecks(list);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore snapshot error:", error);
          setDecks([]);
          setLoading(false);
        },
      );

    return () => unsub();
  }, []);

  if (role !== "moderator") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.accessDenied}>Access Denied</Text>
      </SafeAreaView>
    );
  }

  const createCommunityDeck = async () => {
    if (!deckTitle.trim()) return;

    const user = auth().currentUser;
    if (!user) {
      return;
    }

    try {
      const userDoc = await firestore().collection("users").doc(user.uid).get();
      const username = userDoc.exists() ? userDoc.data()?.username : "Unknown";

      await firestore()
        .collection("communityDecks")
        .add({
          title: deckTitle.trim(),
          description: deckDescription.trim(),
          status: "pending",
          createdBy: username,
          createdAt: Date.now(),
          color: selectedColor || Colors.blue,
        });

      setDeckTitle("");
      setDeckDescription("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating deck:", error);
    }
  };

  const renderDeck = ({ item }: { item: CommunityDeck }) => (
    <View style={styles.deckCard}>
      <View style={styles.deckTopRow}>
        <Text style={styles.deckTitle}>{item.title}</Text>
        {item.status === "approved" ? (
          <CheckCircle color={Colors.greenDark} size={22} />
        ) : (
          <Clock color={Colors.orange} size={22} />
        )}
      </View>

      <Text style={styles.deckDescription}>{item.description}</Text>

      <TouchableOpacity
        style={styles.manageButton}
        onPress={() =>
          navigation.navigate("ManageCommunityDecks", {
            deckId: item.id,
          })
        }
      >
        <Text style={styles.manageButtonText}>Manage Community Deck</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Moderator Panel</Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={22} color={Colors.white} />
        <Text style={styles.createButtonText}>Create New Deck</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.blue}
          style={{ marginTop: 60 }}
        />
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          renderItem={renderDeck}
          contentContainerStyle={{ padding: 16 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      )}

      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Deck</Text>

            <TextInput
              value={deckTitle}
              onChangeText={setDeckTitle}
              placeholder="Deck title"
              style={styles.input}
            />

            <TextInput
              value={deckDescription}
              onChangeText={setDeckDescription}
              placeholder="Deck description"
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.colorLabel}>Choose a color:</Text>
            <View style={styles.colorPicker}>
              {DECK_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.createDeckButton]}
                onPress={createCommunityDeck}
              >
                <Text style={styles.createDeckText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ModeratorPanel;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.black,
  },
  createButton: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: Colors.tealDark,
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  createButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  deckCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  deckTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  deckDescription: {
    color: Colors.gray,
    marginBottom: 12,
  },
  manageButton: {
    backgroundColor: Colors.blue,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  manageButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  createDeckButton: {
    backgroundColor: Colors.blue,
  },
  cancelText: {
    color: Colors.gray,
  },
  createDeckText: {
    color: Colors.white,
    fontWeight: "600",
  },
  accessDenied: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    color: Colors.red,
    fontSize: 18,
  },
  colorLabel: {
    fontSize: 16,
    color: Colors.black,
    marginBottom: 8,
    fontWeight: "600",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  selectedColor: {
    borderColor: Colors.blue,
    borderWidth: 3,
  },
});
