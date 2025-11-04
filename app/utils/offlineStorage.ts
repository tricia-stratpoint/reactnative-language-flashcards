import AsyncStorage from "@react-native-async-storage/async-storage";
import { Deck, Flashcard } from "@/types/flashcard";

const GLOBAL_KEY = "global_decks";
const USER_KEY = "user_decks";

export const saveDeckOffline = async (
  deck: Deck,
  cards: Flashcard[],
  isUserDeck: boolean
) => {
  try {
    const key = isUserDeck ? USER_KEY : GLOBAL_KEY;
    const existing = await AsyncStorage.getItem(key);
    const downloaded = existing ? JSON.parse(existing) : [];

    const newDeck = {
      deck,
      cards,
      savedAt: new Date().toISOString(),
      isUserDeck,
    };

    // Replace deck if it already exists
    const updated = [
      ...downloaded.filter((d: any) => d.deck.id !== deck.id),
      newDeck,
    ];

    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving deck offline:", error);
  }
};

export const getOfflineDecks = async (isUserDeck: boolean) => {
  try {
    const key = isUserDeck ? USER_KEY : GLOBAL_KEY;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading offline decks:", error);
    return [];
  }
};

export async function deleteOfflineDeck(deckId: string, isUserDeck: boolean) {
  try {
    const key = isUserDeck ? USER_KEY : GLOBAL_KEY;
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return;

    const updated = JSON.parse(stored).filter((d: any) => d.deck.id !== deckId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    console.log("Deleted deck", deckId, isUserDeck);
  } catch (err) {
    console.log("Error deleting deck:", err);
  }
}

export const isDeckOffline = async (deckId: string, isUserDeck: boolean) => {
  try {
    const key = isUserDeck ? USER_KEY : GLOBAL_KEY;
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return false;
    const downloaded = JSON.parse(stored);
    return downloaded.some((d: any) => d.deck.id === deckId);
  } catch {
    return false;
  }
};
