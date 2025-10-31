import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Pencil, Trash2, Download } from "lucide-react-native";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { Colors } from "../constants/colors";
import { Flashcard } from "@/types/flashcard";
import { RootStackParamList } from "../navigation/AppNavigator";
import { saveDeckOffline, isDeckOffline } from "../utils/offlineStorage";

const DECK_COLORS = [
  Colors.red,
  Colors.orange,
  Colors.greenMint,
  Colors.greenDark,
  Colors.blue,
  Colors.purple,
  Colors.pink,
];

type Props = NativeStackScreenProps<RootStackParamList, "DeckDetails">;

export default function DeckDetailsScreen({ route, navigation }: Props) {
  const { deckId } = route.params;
  const {
    decks,
    cards,
    addCard,
    updateDeck,
    deleteDeck,
    deleteCard,
    updateCard,
  } = useFlashcardStore();
  const deck = decks.find((d) => d.id === deckId);

  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [showAddCard, setShowAddCard] = useState<string | null>(null);
  const [showEditDeck, setShowEditDeck] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showDeleteDeckModal, setShowDeleteDeckModal] = useState(false);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState<{
    id: string;
    front: string;
  } | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    setDeckCards(cards.filter((c) => c.deckId === deckId));
  }, [cards, deckId]);

  useEffect(() => {
    if (deck) {
      setEditName(deck.name);
      setEditDescription(deck.description || "");
      setSelectedColor(deck.color || null);
    }
  }, [deck]);

  useEffect(() => {
    if (!deck) return;
    (async () => {
      const downloaded = await isDeckOffline(deck.id);
      setIsDownloaded(downloaded);
    })();
  }, [deck]);

  if (!deck) return null;

  const isCustomDeck = deck.language === "custom";
  const isCustomCard = (card: Flashcard) => card.isCustom;

  const handleAddCard = async () => {
    if (!cardFront.trim() || !cardBack.trim()) return;
    if (showAddCard) {
      const deck = decks.find((d) => d.id === showAddCard);
      if (!deck) return;
      await addCard(deck.language, deck.id, cardFront.trim(), cardBack.trim());
      setCardFront("");
      setCardBack("");
      setShowAddCard(null);
    }
  };
  const handleEditDeck = () => {
    setShowEditDeck(true);
  };
  const handleSaveDeck = async () => {
    if (!editName.trim()) return;
    await updateDeck(deckId, deck.language, {
      name: editName.trim(),
      description: editDescription.trim(),
      color: selectedColor || deck.color,
    });
    setShowEditDeck(false);
  };

  const handleEditCard = (cardId: string) => {
    const card = deckCards.find((c) => c.id === cardId);
    if (!card) return;
    setEditingCard(card);
    setCardFront(card.front);
    setCardBack(card.back);
  };

  const handleSaveCard = async () => {
    if (!editingCard || !cardFront.trim() || !cardBack.trim()) return;

    await updateCard(deck.language, deck.id, editingCard.id, {
      front: cardFront.trim(),
      back: cardBack.trim(),
    });

    setEditingCard(null);
    setCardFront("");
    setCardBack("");
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!deck) return;
    await deleteCard(deck.language, deck.id, cardId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deck Details</Text>

        <TouchableOpacity
          disabled={isDownloaded}
          onPress={() => setShowDownloadModal(true)}
        >
          <Download color={isDownloaded ? "#dadada" : Colors.black} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>{deck.name}</Text>
        <Text style={styles.description}>{deck.description}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.greenMint }]}
            onPress={() => setShowAddCard(deck.id)}
          >
            <Text style={styles.buttonText}>Add Card</Text>
          </TouchableOpacity>

          {isCustomDeck && (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: Colors.blue }]}
                onPress={handleEditDeck}
              >
                <Text style={styles.buttonText}>Edit Details</Text>
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

                {isCustomCard(item) && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleEditCard(item.id)}>
                      <Pencil color={Colors.blue} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setShowDeleteCardModal({
                          id: item.id,
                          front: item.front,
                        })
                      }
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

        {/* Add Card Modal */}
        <Modal visible={!!showAddCard} transparent animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Card</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Front of card (question/prompt)"
                value={cardFront}
                onChangeText={setCardFront}
                multiline
                maxLength={500}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Back of card (answer)"
                value={cardBack}
                onChangeText={setCardBack}
                multiline
                maxLength={500}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddCard(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleAddCard}
                >
                  <Text style={styles.createButtonText}>Add Card</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Deck Modal */}
        <Modal visible={showEditDeck} transparent animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Deck Details</Text>

              <TextInput
                style={styles.input}
                placeholder="Deck name"
                value={editName}
                onChangeText={setEditName}
                maxLength={50}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                maxLength={200}
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
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditDeck(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleSaveDeck}
                >
                  <Text style={styles.createButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Deck Modal */}
        <Modal visible={showDeleteDeckModal} transparent animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Deck?</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to delete the deck &quot;{deck.name}
                &quot;? This action cannot be undone.
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
                  onPress={async () => {
                    await deleteDeck(deck.id, deck.language); // remove from db
                    setShowDeleteDeckModal(false);
                    navigation.goBack(); // remove from ui
                  }}
                >
                  <Text style={styles.createButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Card Modal */}
        <Modal visible={!!editingCard} transparent animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Card</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Front of card"
                value={cardFront}
                onChangeText={setCardFront}
                multiline
                maxLength={500}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Back of card"
                value={cardBack}
                onChangeText={setCardBack}
                multiline
                maxLength={500}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditingCard(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleSaveCard}
                >
                  <Text style={styles.createButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Card Modal */}
        <Modal visible={!!showDeleteCardModal} transparent animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Card?</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to delete the card &quot;
                {showDeleteCardModal?.front}&quot;? This action cannot be
                undone.
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
                  onPress={async () => {
                    if (!showDeleteCardModal) return;
                    await handleDeleteCard(showDeleteCardModal.id);
                    setShowDeleteCardModal(null);
                  }}
                >
                  <Text style={styles.createButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirm Download Modal */}
        <Modal visible={showDownloadModal} transparent animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Download Deck?</Text>
              <Text style={styles.modalDescription}>
                Do you want to download this deck for offline study mode?
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDownloadModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={async () => {
                    await saveDeckOffline(deck, deckCards);
                    setShowDownloadModal(false);
                    setIsDownloaded(true);
                  }}
                >
                  <Text style={styles.createButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
    marginVertical: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 10,
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
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    marginBottom: 20,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 24,
    textAlign: "center",
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
