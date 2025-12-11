import { useState, useEffect, useMemo } from "react";
import { Flashcard, Deck, CommunityDeck } from "@/types/flashcard";
import { getOfflineDecks } from "@/app/utils/offlineStorage";
import { useAllCommunityDecks } from "./community-store";
import { useFlashcardStore } from "./flashcard-store";
import firestore from "@react-native-firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/app/constants/colors";

export type NormalizedDeck = {
  id: string;
  name: string;
  description: string;
  color: string;
  language: "spanish" | "french" | "custom" | "community";
  type: "user" | "community";
  originalDeck: Deck | CommunityDeck;
};

export type CommunityDeckCardsData = Record<string, Flashcard[]>;

export const useDecks = () => {
  const { decks, cards, createDeck, isLoading } = useFlashcardStore();
  const { communityDecks } = useAllCommunityDecks();
  const [offlineDecks, setOfflineDecks] = useState<string[]>([]);

  // Fetch offline decks
  useEffect(() => {
    const fetchOffline = async () => {
      const userOffline = await getOfflineDecks(true);
      const userDeckIds = userOffline.map((d: any) => d.deck.id);

      const globalOffline = await getOfflineDecks(false);
      const globalDeckIds = globalOffline.map((d: any) => d.deck.id);

      setOfflineDecks([...userDeckIds, ...globalDeckIds]);
    };
    fetchOffline();
  }, []);

  // Fetch community deck cards
  const fetchCommunityDeckCards = async (deckId: string) => {
    const snapshot = await firestore()
      .collection("communityDecks")
      .doc(deckId)
      .collection("cards")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Flashcard[];
  };

  const { data: communityDeckCardsData = {} } = useQuery<
    CommunityDeckCardsData,
    Error
  >({
    queryKey: ["communityDecks", communityDecks.map((d) => d.id)],
    queryFn: async () => {
      const result: CommunityDeckCardsData = {};
      await Promise.all(
        communityDecks.map(async (deck) => {
          result[deck.id] = await fetchCommunityDeckCards(deck.id);
        }),
      );
      return result;
    },
    enabled: communityDecks.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Deck stats helpers
  const getCommunityDeckStats = (
    deck: CommunityDeck,
    deckCards: Flashcard[] = [],
  ) => {
    const total = deckCards.length;
    const newCards = deckCards.filter((c) => c.repetitions === 0).length;
    const dueCards = deckCards.filter((c) => {
      const nextReviewTime =
        typeof c.nextReview === "number"
          ? c.nextReview
          : c.nextReview?.toMillis
            ? c.nextReview.toMillis()
            : 0;
      return nextReviewTime <= Date.now();
    }).length;

    return { total, new: newCards, due: dueCards };
  };

  const getDeckStats = (deckId: string, deckCards?: Flashcard[]) => {
    const cardsToUse = deckCards ?? cards.filter((c) => c.deckId === deckId);
    const newCards = cardsToUse.filter((c) => c.repetitions === 0).length;
    const dueCards = cardsToUse.filter((c) => {
      const nextReviewTime =
        typeof c.nextReview === "number"
          ? c.nextReview
          : c.nextReview?.toMillis
            ? c.nextReview.toMillis()
            : 0;
      return nextReviewTime <= Date.now();
    }).length;

    return { total: cardsToUse.length, new: newCards, due: dueCards };
  };

  const combinedDecks: NormalizedDeck[] = useMemo(() => {
    return [
      ...communityDecks
        .filter((d) => d.status === "approved")
        .map((d) => ({
          id: d.id,
          name: d.title,
          description: d.description || "",
          color: d.color || Colors.blue,
          language: "community" as const,
          type: "community" as const,
          originalDeck: d,
        })),
      ...decks.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        color: d.color,
        language: (d.language || "custom") as
          | "spanish"
          | "french"
          | "custom"
          | "community",
        type: "user" as const,
        originalDeck: d,
      })),
    ];
  }, [communityDecks, decks]);

  const sortedDecks = useMemo(() => {
    const order: Record<string, number> = {
      spanish: 1,
      french: 2,
      community: 3,
      custom: 4,
    };
    return [...combinedDecks].sort(
      (a, b) => (order[a.language] ?? 4) - (order[b.language] ?? 4),
    );
  }, [combinedDecks]);

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

  return {
    offlineDecks,
    createDeck,
    isLoading,
    sortedDecks,
    getDeckStats,
    getCommunityDeckStats,
    communityDeckCardsData,
    getDeckColor,
  };
};
