import { create } from "zustand";
import { Deck, Flashcard } from "@/types/flashcard";
import { db } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const SUPPORTED_LANGUAGES: Deck["language"][] = ["spanish", "french", "custom"];

interface FlashcardState {
  decks: Deck[];
  cards: Flashcard[];
  isLoading: boolean;
  setCards: (cards: Flashcard[]) => void;
  setDecks: (decks: Deck[]) => void;
  loadAllLanguages: () => Promise<void>;
  createDeck: (
    language: Deck["language"],
    name: string,
    description: string,
    color: string
  ) => Promise<void>;
  updateDeck: (
    deckId: string,
    language: Deck["language"],
    updatedData: Partial<Deck>
  ) => Promise<void>;
  deleteDeck: (deckId: string, language: Deck["language"]) => Promise<void>;
  addCard: (
    language: Flashcard["language"],
    deckId: string,
    front: string,
    back: string
  ) => Promise<void>;
  updateCard: (
    language: Flashcard["language"],
    deckId: string,
    cardId: string,
    updatedData: Partial<Flashcard>
  ) => Promise<void>;
  deleteCard: (
    language: Flashcard["language"],
    deckId: string,
    cardId: string
  ) => Promise<void>;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  decks: [],
  cards: [],
  isLoading: true,

  setCards: (cards) => set({ cards }),
  setDecks: (decks) => set({ decks }),

  loadAllLanguages: async () => {
    set({ isLoading: true });
    try {
      const allDecks: Deck[] = [];
      const allCards: Flashcard[] = [];

      for (const lang of SUPPORTED_LANGUAGES) {
        const decksSnap = await getDocs(
          collection(db, `flashcards/${lang}/decks`)
        );
        const loadedDecks = decksSnap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              language: lang,
              ...doc.data(),
            } as Deck)
        );

        allDecks.push(...loadedDecks);

        for (const deck of loadedDecks) {
          const cardsSnap = await getDocs(
            collection(db, `flashcards/${lang}/decks/${deck.id}/cards`)
          );
          const deckCards = cardsSnap.docs.map(
            (doc) =>
              ({
                id: doc.id,
                deckId: deck.id,
                language: lang,
                ...doc.data(),
              } as Flashcard)
          );
          allCards.push(...deckCards);
        }
      }

      set({ decks: allDecks, cards: allCards });
    } catch (err) {
      console.error("Error loading decks:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  createDeck: async (language, name, description, color) => {
    const deckLanguage = name.toLowerCase().includes("custom")
      ? "custom"
      : language;

    const newDeck: Omit<Deck, "id" | "language"> = { name, description, color };
    const ref = await addDoc(
      collection(db, `flashcards/${deckLanguage}/decks`),
      {
        ...newDeck,
        createdAt: Timestamp.now(),
      }
    );

    set((state) => ({
      decks: [
        ...state.decks,
        { ...newDeck, id: ref.id, language: deckLanguage },
      ],
    }));
  },

  updateDeck: async (
    deckId: string,
    language: Deck["language"],
    updatedData: Partial<Deck>
  ) => {
    try {
      const deckRef = doc(db, `flashcards/${language}/decks/${deckId}`);
      await updateDoc(deckRef, updatedData);

      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId ? { ...d, ...updatedData } : d
        ),
      }));
    } catch (err) {
      console.error("Error updating deck:", err);
    }
  },

  deleteDeck: async (deckId: string, language: Deck["language"]) => {
    try {
      const cardsToDelete = get().cards.filter((c) => c.deckId === deckId);
      for (const card of cardsToDelete) {
        const cardRef = doc(
          db,
          `flashcards/${language}/decks/${deckId}/cards/${card.id}`
        );
        await deleteDoc(cardRef);
      }

      const deckRef = doc(db, `flashcards/${language}/decks/${deckId}`);
      await deleteDoc(deckRef);

      set((state) => ({
        decks: state.decks.filter((d) => d.id !== deckId),
        cards: state.cards.filter((c) => c.deckId !== deckId),
      }));
    } catch (err) {
      console.error("Error deleting deck:", err);
    }
  },

  addCard: async (language, deckId, front, back) => {
    const deck = get().decks.find((d) => d.id === deckId);
    const cardLanguage: Flashcard["language"] = deck?.language || language;

    const newCard = {
      front,
      back,
      deckId,
      createdAt: Timestamp.now(),
      nextReview: Timestamp.now(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good" as const,
      isCustom: true,
    };
    const ref = await addDoc(
      collection(db, `flashcards/${cardLanguage}/decks/${deckId}/cards`),
      newCard
    );

    set((state) => ({
      cards: [
        ...state.cards,
        { ...newCard, id: ref.id, language: cardLanguage },
      ],
    }));
  },

  updateCard: async (
    language: Flashcard["language"],
    deckId: string,
    cardId: string,
    updatedData: Partial<Flashcard>
  ) => {
    try {
      const cardRef = doc(
        db,
        `flashcards/${language}/decks/${deckId}/cards/${cardId}`
      );
      await updateDoc(cardRef, updatedData);

      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, ...updatedData } : c
        ),
      }));
    } catch (err) {
      console.error("Error updating card:", err);
    }
  },

  deleteCard: async (
    language: Flashcard["language"],
    deckId: string,
    cardId: string
  ) => {
    try {
      const cardRef = doc(
        db,
        `flashcards/${language}/decks/${deckId}/cards/${cardId}`
      );
      await deleteDoc(cardRef);

      set((state) => ({
        cards: state.cards.filter((c) => c.id !== cardId),
      }));
    } catch (err) {
      console.error("Error deleting card:", err);
    }
  },
}));
