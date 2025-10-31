import AsyncStorage from "@react-native-async-storage/async-storage";
import { Deck, Flashcard } from "@/types/flashcard";

const DOWNLOADS_KEY = "downloaded_decks";

export const saveDeckOffline = async (deck: Deck, cards: Flashcard[]) => {
  try {
    const existing = await AsyncStorage.getItem(DOWNLOADS_KEY);
    const downloaded = existing ? JSON.parse(existing) : [];

    const newDeck = {
      deck,
      cards,
      savedAt: new Date().toISOString(),
    };

    const updated = [
      ...downloaded.filter((d: any) => d.deck.id !== deck.id),
      newDeck,
    ];
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving deck offline:", error);
  }
};

export const getOfflineDecks = async () => {
  try {
    const stored = await AsyncStorage.getItem(DOWNLOADS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading offline decks:", error);
    return [];
  }
};

export const deleteOfflineDeck = async (deckId: string) => {
  try {
    const stored = await AsyncStorage.getItem(DOWNLOADS_KEY);
    if (!stored) return;
    const updated = JSON.parse(stored).filter((d: any) => d.deck.id !== deckId);
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error deleting offline deck:", error);
  }
};

export const isDeckOffline = async (deckId: string): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(DOWNLOADS_KEY);
    if (!stored) return false;
    const downloaded = JSON.parse(stored);
    return downloaded.some((d: any) => d.deck.id === deckId);
  } catch {
    return false;
  }
};
