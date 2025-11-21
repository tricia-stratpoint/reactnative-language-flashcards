import { useEffect, useState } from "react";
import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import type { CommunityDeck, Flashcard } from "../types/flashcard";

export function useCommunityStore(deckId: string) {
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<CommunityDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    const deckRef = firestore().collection("communityDecks").doc(deckId);

    deckRef.get().then((docSnap) => {
      if (!docSnap.exists) {
        deckRef.set(
          {
            title: "New Deck",
            description: "",
            color: "#fff",
            createdAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    });

    const unsubscribeDeck = deckRef.onSnapshot((doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setDeck({
          id: doc.id,
          title: data?.title || "New Deck",
          description: data?.description || "",
          color: data?.color || "#fff",
          createdBy: data?.createdBy || "Unknown",
          createdAt:
            (data?.createdAt as FirebaseFirestoreTypes.Timestamp)?.toMillis() ||
            Date.now(),
          status: data?.status || "pending",
        });
      }
      setLoading(false);
    });

    const unsubscribeCards = deckRef
      .collection("cards")
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
        if (!snapshot || !snapshot.docs) {
          setCards([]);
          return;
        }
        const list: Flashcard[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            front: data.front || "",
            back: data.back || "",
            deckId: deckId,
            createdAt:
              (
                data.createdAt as FirebaseFirestoreTypes.Timestamp
              )?.toMillis() || Date.now(),
            nextReview:
              (
                data.nextReview as FirebaseFirestoreTypes.Timestamp
              )?.toMillis() || Date.now(),
            interval: data.interval || 1,
            easeFactor: data.easeFactor || 2.5,
            repetitions: data.repetitions || 0,
            difficulty: data.difficulty || "good",
            language: data.language || "custom",
            wordFrequency: data.wordFrequency || 0,
            isCustom: data.isCustom || true,
          };
        });
        setCards(list);
      });

    return () => {
      unsubscribeDeck();
      unsubscribeCards();
    };
  }, [deckId]);

  const updateDeck = async (
    name: string,
    description: string,
    color?: string
  ) => {
    if (!deck) return;
    const deckRef = firestore().collection("communityDecks").doc(deck.id);

    await deckRef.update({
      title: name,
      description,
      color: color || deck.color,
    });

    setDeck({ ...deck, title: name, description, color: color || deck.color });
  };

  const deleteDeck = async () => {
    if (!deck) return;
    await firestore().collection("communityDecks").doc(deck.id).delete();
  };

  const addCard = async (front: string, back: string) => {
    if (!deck) return;
    const deckRef = firestore().collection("communityDecks").doc(deck.id);

    const newCard: Omit<Flashcard, "id"> = {
      front: front.trim(),
      back: back.trim(),
      createdAt: Date.now(),
      deckId: deck.id,
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      difficulty: "good",
      language: "custom",
    };
    await deckRef.collection("cards").add(newCard);

    await deckRef.collection("cards").add(newCard);
  };

  const saveCard = async (cardId: string, front: string, back: string) => {
    if (!deck) return;
    const cardRef = firestore()
      .collection("communityDecks")
      .doc(deck.id)
      .collection("cards")
      .doc(cardId);

    await cardRef.update({ front, back });
  };

  const deleteCard = async (card: Flashcard) => {
    if (!deck) return;
    await firestore()
      .collection("communityDecks")
      .doc(deck.id)
      .collection("cards")
      .doc(card.id)
      .delete();
  };

  return {
    loading,
    deck,
    cards,
    updateDeck,
    deleteDeck,
    addCard,
    saveCard,
    deleteCard,
  };
}
