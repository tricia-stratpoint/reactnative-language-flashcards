import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { Colors } from "../constants/colors";
import { Flashcard } from "@/types/flashcard";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "DeckDetails">;

export default function DeckDetailsScreen({ route, navigation }: Props) {
  const { deckId } = route.params;
  const { decks, cards } = useFlashcardStore();
  const deck = decks.find((d) => d.id === deckId);

  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    setDeckCards(cards.filter((c) => c.deckId === deckId));
  }, [cards, deckId]);

  if (!deck) return null;

  const isCustomDeck = deck.language === "custom";

  const handleAddCard = () => {};
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
            onPress={handleAddCard}
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
              <Text style={styles.cardFront}>{item.front}</Text>
              <Text style={styles.cardBack}>{item.back}</Text>

              {isCustomDeck && (
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEditCard(item.id)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteCard(item.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
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
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 16,
  },
  editText: {
    color: Colors.blue,
  },
  deleteText: {
    color: Colors.red,
  },
});
