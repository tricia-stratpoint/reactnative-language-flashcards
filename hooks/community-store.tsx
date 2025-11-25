import { useEffect, useState, useMemo } from "react";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import type { CommunityDeck, Flashcard } from "../types/flashcard";

export function useCommunityStore(deckId?: string) {
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<CommunityDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);

  const userId = auth().currentUser?.uid;

  const deckRef = useMemo(
    () =>
      deckId ? firestore().collection("communityDecks").doc(deckId) : null,
    [deckId]
  );
  const cardsRef = useMemo(
    () => (deckRef ? deckRef.collection("cards") : null),
    [deckRef]
  );

  useEffect(() => {
    if (!deckRef || !cardsRef) {
      setLoading(false);
      return;
    }

    const unsubDeck = deckRef.onSnapshot(
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setDeck({
            id: doc.id,
            title: data?.title || "",
            description: data?.description || "",
            color: data?.color || "#fff",
            createdBy: data?.createdBy || "",
            status: data?.status || "pending",
            createdAt:
              data?.createdAt && typeof data.createdAt.toMillis === "function"
                ? data.createdAt.toMillis()
                : Date.now(),
          });
        } else {
          setDeck(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching deck:", error);
        setLoading(false);
      }
    );

    const unsubCards = cardsRef.orderBy("createdAt", "desc").onSnapshot(
      (snapshot) => {
        if (!snapshot) return;
        const list: Flashcard[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            deckId: deckId || "",
            front: d.front,
            back: d.back,
            createdAt:
              d.createdAt && typeof d.createdAt.toMillis === "function"
                ? d.createdAt.toMillis()
                : Date.now(),
            nextReview: d.nextReview ?? Date.now(),
            interval: d.interval ?? 0,
            easeFactor: d.easeFactor ?? 2.5,
            repetitions: d.repetitions ?? 0,
            difficulty: d.difficulty ?? "good",
            language: d.language ?? "custom",
            createdBy: d.createdBy ?? "",
          };
        });
        setCards(list);
      },
      (error) => console.error("Error fetching cards:", error)
    );

    return () => {
      unsubDeck();
      unsubCards();
    };
  }, [deckRef, cardsRef, deckId]);

  const addDeck = async (
    title: string,
    description: string,
    color?: string
  ) => {
    if (!userId) return;
    try {
      await firestore()
        .collection("communityDecks")
        .add({
          title,
          description,
          color: color || "#fff",
          createdBy: userId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          status: "pending",
        });
    } catch (e) {
      console.error("Failed to add deck:", e);
    }
  };

  const updateDeck = async (
    title: string,
    description: string,
    color?: string
  ) => {
    if (!deckRef) return;
    try {
      await deckRef.update({
        title,
        description,
        ...(color ? { color } : {}),
      });
    } catch (e) {
      console.error("Failed to update deck:", e);
    }
  };

  const deleteDeck = async () => {
    if (!deckRef || !cardsRef) return;
    try {
      const snap = await cardsRef.get();
      if (snap.docs.length) {
        const batch = firestore().batch();
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      await deckRef.delete();
    } catch (e) {
      console.error("Failed to delete deck:", e);
    }
  };

  const addCard = async (front: string, back: string) => {
    if (!cardsRef || !userId) return;
    try {
      await cardsRef.add({
        front,
        back,
        deckId,
        createdBy: userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        nextReview: Date.now(),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        difficulty: "good",
        language: "custom",
      });
    } catch (e) {
      console.error("Failed to add card:", e);
    }
  };

  const saveCard = async (id: string, front: string, back: string) => {
    if (!cardsRef) return;
    try {
      await cardsRef.doc(id).update({ front, back });
    } catch (e) {
      console.error("Failed to save card:", e);
    }
  };

  const deleteCard = async (card: Flashcard) => {
    if (!cardsRef) return;
    try {
      await cardsRef.doc(card.id).delete();
    } catch (e) {
      console.error("Failed to delete card:", e);
    }
  };

  return {
    loading,
    deck,
    cards,
    addDeck,
    updateDeck,
    deleteDeck,
    addCard,
    saveCard,
    deleteCard,
  };
}
