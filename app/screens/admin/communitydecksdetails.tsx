import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react-native";
import { Colors } from "@/app/constants/colors";
import { useCommunityStore } from "@/hooks/community-store";
import type { Flashcard, CommunityDeck } from "@/types/flashcard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/app/navigation/AppNavigator";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import firestore from "@react-native-firebase/firestore";

type Props = NativeStackScreenProps<RootStackParamList, "ManageCommunityDecks">;

export default function ManageCommunityDecks({ route, navigation }: Props) {
  const { deckId } = route.params;

  const {
    loading,
    deck: selectedDeck,
    cards: deckCards,
    updateDeck,
    deleteDeck,
    addCard,
    saveCard,
    deleteCard,
  } = useCommunityStore(deckId);

  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [showDeleteDeckModal, setShowDeleteDeckModal] = useState(false);
  const [showDeleteCardModal, setShowDeleteCardModal] =
    useState<Flashcard | null>(null);
  const [showAddEditCardModal, setShowAddEditCardModal] = useState(false);
  const [showEditDeckModal, setShowEditDeckModal] = useState(false);
  const [approveDeckModal, setApproveDeckModal] =
    useState<CommunityDeck | null>(null);
  const role = useFlashcardStore((state) => state.role);

  useEffect(() => {
    if (selectedDeck) {
      setEditName(selectedDeck.title);
      setEditDescription(selectedDeck.description || "");
      setSelectedColor(selectedDeck.color || null);
    }
  }, [selectedDeck]);

  const resetCardModal = () => {
    setEditingCard(null);
    setCardFront("");
    setCardBack("");
    setShowAddEditCardModal(false);
  };

  const handleSaveDeck = () => {
    if (!selectedDeck) return;
    updateDeck(editName, editDescription, selectedColor ?? undefined);
    setShowEditDeckModal(false);
  };

  const handleDeleteDeck = () => {
    if (!selectedDeck) return;
    deleteDeck();
    navigation.goBack();
  };

  const handleSaveCard = () => {
    if (!selectedDeck) return;
    if (editingCard) {
      saveCard(editingCard.id, cardFront, cardBack);
    } else {
      addCard(cardFront, cardBack);
    }
    resetCardModal();
  };

  const handleDeleteCard = (card: Flashcard) => {
    deleteCard(card);
    setShowDeleteCardModal(null);
  };

  if (loading || !selectedDeck)
    return (
      <ActivityIndicator size="large" color={Colors.blue} style={{ flex: 1 }} />
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Community Deck</Text>
      </View>

      <View style={styles.deckHeader}>
        <Text style={styles.deckTitle}>{selectedDeck.title}</Text>
        {selectedDeck.description && (
          <Text style={styles.deckDescription}>{selectedDeck.description}</Text>
        )}
      </View>

      <View style={styles.actions}>
        {role === "super_admin" ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.blue }]}
            onPress={() => setApproveDeckModal(selectedDeck)}
          >
            <Text style={styles.buttonText}>Approve Deck</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.greenMint }]}
              onPress={() => setShowAddEditCardModal(true)}
            >
              <Text style={styles.buttonText}>Add Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.blue }]}
              onPress={() => setShowEditDeckModal(true)}
            >
              <Text style={styles.buttonText}>Edit Deck</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.red }]}
              onPress={() => setShowDeleteDeckModal(true)}
            >
              <Text style={styles.buttonText}>Delete Deck</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={deckCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardFront}>{item.front}</Text>
                <Text style={styles.cardBack}>{item.back}</Text>
              </View>
              {role !== "super_admin" && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingCard(item);
                      setCardFront(item.front);
                      setCardBack(item.back);
                      setShowAddEditCardModal(true);
                    }}
                  >
                    <Pencil color={Colors.blue} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowDeleteCardModal(item)}
                  >
                    <Trash2 color={Colors.red} size={20} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No cards yet.</Text>
            <Text style={styles.emptyDescription}>
              Tap &quot;Add Card&quot; to create your first one!
            </Text>
          </View>
        }
      />

      <Modal visible={showAddEditCardModal} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCard ? "Edit Card" : "Add Card"}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Front of card"
              value={cardFront}
              onChangeText={setCardFront}
              multiline
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Back of card"
              value={cardBack}
              onChangeText={setCardBack}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetCardModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleSaveCard}
              >
                <Text style={styles.createButtonText}>
                  {editingCard ? "Save" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditDeckModal} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Deck Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Deck name"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditDeckModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleSaveDeck}
              >
                <Text style={styles.createButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteDeckModal} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Deck?</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete &quot;{selectedDeck.title}&quot;?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteDeckModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  { backgroundColor: Colors.red },
                ]}
                onPress={handleDeleteDeck}
              >
                <Text style={styles.createButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!showDeleteCardModal} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Card?</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete &quot;{showDeleteCardModal?.front}
              &quot;?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteCardModal(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  { backgroundColor: Colors.red },
                ]}
                onPress={() =>
                  showDeleteCardModal && handleDeleteCard(showDeleteCardModal)
                }
              >
                <Text style={styles.createButtonText}>Delete</Text>
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
              This deck will be publicly visible to everyone. Are you sure you
              want to approve &quot;{approveDeckModal?.title}&quot;?
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
    padding: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  deckHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deckTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.black,
  },
  deckDescription: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardFront: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardBack: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTextContainer: {
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.gray,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
    marginTop: 8,
  },
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
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
    color: Colors.gray,
    fontSize: 16,
    fontWeight: "500",
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
});
