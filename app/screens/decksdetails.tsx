import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react-native";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { Colors } from "../constants/colors";
import { Flashcard } from "@/types/flashcard";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "DeckDetails">;

export default function DeckDetailsScreen({ route, navigation }: Props) {
  const { deckId } = route.params;
  const { decks, cards, addCard } = useFlashcardStore();
  const deck = decks.find((d) => d.id === deckId);

  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [showAddCard, setShowAddCard] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  useEffect(() => {
    setDeckCards(cards.filter((c) => c.deckId === deckId));
  }, [cards, deckId]);

  if (!deck) return null;

  const isCustomDeck = deck.language === "custom";

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
  const handleEditDeck = () => {};
  const handleDeleteDeck = () => {
    Alert.alert("Delete Deck", "Are you sure you want to delete this deck?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {} },
    ]);
  };

  const handleEditCard = (cardId: string) => {};
  const handleDeleteCard = (cardId: string) => {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#111" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deck Details</Text>
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
                onPress={handleDeleteDeck}
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

                {isCustomDeck && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleEditCard(item.id)}>
                      <Pencil color={Colors.blue} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCard(item.id)}>
                      <Trash2 color={Colors.red} size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
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
    gap: 12,
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
});
