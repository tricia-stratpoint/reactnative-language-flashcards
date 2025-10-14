import { create } from "zustand";
import { Deck, Flashcard } from "@/types/flashcard";
import { db } from "@/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";

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
  addCard: (
    language: Flashcard["language"],
    deckId: string,
    front: string,
    back: string
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
    const newDeck = { name, description, color };
    const ref = await addDoc(collection(db, `flashcards/${language}/decks`), {
      ...newDeck,
      createdAt: Date.now(),
    });

    set((state) => ({
      decks: [...state.decks, { ...newDeck, id: ref.id, language }],
    }));
  },

  addCard: async (language, deckId, front, back) => {
    const newCard = {
      front,
      back,
      deckId,
      createdAt: Date.now(),
      nextReview: Date.now(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good" as const,
    };
    const ref = await addDoc(
      collection(db, `flashcards/${language}/decks/${deckId}/cards`),
      newCard
    );

    set((state) => ({
      cards: [...state.cards, { ...newCard, id: ref.id, language }],
    }));
  },
}));
