import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, BookOpen, BookAlert } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { Colors } from "../constants/colors";
import { Flashcard, Deck } from "@/types/flashcard";

const DECK_COLORS = [
  Colors.red,
  Colors.orange,
  Colors.greenMint,
  Colors.greenDark,
  Colors.blue,
  Colors.purple,
  Colors.pink,
];

export default function DecksScreen() {
  const insets = useSafeAreaInsets();
  const { decks, cards, createDeck, addCard, isLoading } = useFlashcardStore();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [showAddCard, setShowAddCard] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(DECK_COLORS[0]);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<Deck["language"]>("spanish");
  const getDeckColor = (deck: Deck) => {
    if (deck.color) return deck.color;
    switch (deck.language) {
      case "spanish":
        return Colors.greenMint;
      case "french":
        return Colors.blue;
      default:
        return Colors.blue;
    }
  };

  const languageColors: Record<string, string> = {
    spanish: Colors.greenMint,
    french: Colors.blue,
  };

  const color = languageColors[selectedLanguage] || Colors.blue;

  const handleCreateDeck = async () => {
    if (!deckName.trim()) return;

    const finalColor = selectedColor || color;

    await createDeck(
      selectedLanguage,
      deckName.trim(),
      deckDescription.trim(),
      finalColor
    );

    setDeckName("");
    setDeckDescription("");
    setSelectedColor(DECK_COLORS[0]);
    setShowCreateDeck(false);
  };

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

  const getDeckStats = (deckId: string) => {
    const deckCards = cards.filter((card: Flashcard) => card.deckId === deckId);
    const newCards = deckCards.filter((c) => c.repetitions === 0).length;
    const dueCards = deckCards.filter((c) => {
      let nextReviewTime: number;
      if (typeof c.nextReview === "number") {
        nextReviewTime = c.nextReview;
      } else if (c.nextReview && typeof c.nextReview.toMillis === "function") {
        nextReviewTime = c.nextReview.toMillis();
      } else {
        nextReviewTime = 0;
      }
      return nextReviewTime <= Date.now();
    }).length;
    return { total: deckCards.length, new: newCards, due: dueCards };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.blue, Colors.greenMint]}
          style={styles.gradient}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.greenMint, Colors.mintAccent]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Decks</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateDeck(true)}
          >
            <Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {decks.map((deck: Deck & { language?: string }) => {
            const stats = getDeckStats(deck.id);
            return (
              <View
                key={deck.id}
                style={[
                  styles.deckCard,
                  { borderLeftColor: getDeckColor(deck) },
                ]}
              >
                <View style={styles.deckHeader}>
                  <View style={styles.deckInfo}>
                    <Text style={styles.deckName}>{deck.name}</Text>
                    <Text style={styles.deckDescription}>
                      {deck.description}
                    </Text>
                  </View>
                  <BookOpen size={24} color={getDeckColor(deck)} />
                </View>

                <View style={styles.deckStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: Colors.blue }]}>
                      {stats.new}
                    </Text>
                    <Text style={styles.statLabel}>New</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: Colors.red }]}>
                      {stats.due}
                    </Text>
                    <Text style={styles.statLabel}>Due</Text>
                  </View>
                </View>

                <View style={styles.deckActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: getDeckColor(deck) },
                    ]}
                    onPress={() => setShowAddCard(deck.id)}
                  >
                    <Plus size={16} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Add Card</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {decks.length === 0 && (
            <View style={styles.emptyState}>
              <BookAlert size={64} color={Colors.greenDark} />
              <Text style={styles.emptyTitle}>No decks yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first deck to start learning
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Create Deck Modal */}
        <Modal visible={showCreateDeck} transparent animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Deck</Text>

              <TextInput
                style={styles.input}
                placeholder="Deck name"
                value={deckName}
                onChangeText={setDeckName}
                maxLength={50}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={deckDescription}
                onChangeText={setDeckDescription}
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
                  onPress={() => setShowCreateDeck(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateDeck}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.white,
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  deckCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  deckHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    color: Colors.gray,
  },
  deckStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  deckActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.greenDark,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.greenDark,
    textAlign: "center",
    marginTop: 8,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.white,
    textAlign: "center",
    marginTop: 100,
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
  colorLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#1f2937",
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
});
