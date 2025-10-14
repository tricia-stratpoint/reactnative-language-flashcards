import { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Deck, Flashcard } from "@/types/flashcard";

const SUPPORTED_LANGUAGES: Deck["language"][] = ["spanish", "french", "custom"];

export function useFlashcardStore() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAllLanguages();
  }, []);

  const loadAllLanguages = async () => {
    setIsLoading(true);
    try {
      const allDecks: Deck[] = [];
      const allCards: Flashcard[] = [];

      for (const lang of SUPPORTED_LANGUAGES) {
        const decksSnapshot = await getDocs(
          collection(db, `flashcards/${lang}/decks`)
        );
        const loadedDecks = decksSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              language: lang,
              ...doc.data(),
            } as Deck)
        );

        allDecks.push(...loadedDecks);

        for (const deck of loadedDecks) {
          const cardsSnapshot = await getDocs(
            collection(db, `flashcards/${lang}/decks/${deck.id}/cards`)
          );
          const deckCards = cardsSnapshot.docs.map(
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

      setDecks(allDecks);
      setCards(allCards);
    } catch (error) {
      console.error("Error loading decks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDeck = async (
    language: Deck["language"],
    name: string,
    description: string,
    color: string
  ) => {
    const newDeck: Omit<Deck, "id" | "language"> = { name, description, color };
    const ref = await addDoc(collection(db, `flashcards/${language}/decks`), {
      ...newDeck,
      createdAt: Date.now(),
    });

    setDecks((prev) => [...prev, { ...newDeck, id: ref.id, language }]);
  };

  const addCard = async (
    language: Flashcard["language"],
    deckId: string,
    front: string,
    back: string
  ) => {
    const newCard: Omit<Flashcard, "id" | "language"> = {
      front,
      back,
      deckId,
      createdAt: Date.now(),
      nextReview: Date.now(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good",
    };
    const ref = await addDoc(
      collection(db, `flashcards/${language}/decks/${deckId}/cards`),
      newCard
    );
    setCards((prev) => [...prev, { ...newCard, id: ref.id, language }]);
  };

  return {
    decks,
    cards,
    createDeck,
    addCard,
    isLoading,
  };
}
