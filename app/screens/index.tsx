import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Play, BarChart3 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Flashcard, Deck } from "@/types/flashcard";
import FlashcardComponent from "@/components/FlashcardComponent";
import { Colors } from "../constants/colors";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useFlashcardStore } from "@/hooks/flashcard-store";

export default function StudyScreen({
  language = "spanish" as Deck["language"],
}) {
  const insets = useSafeAreaInsets();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0 });
  const [username, setUsername] = useState("");
  const isLoading = useFlashcardStore((state) => state.isLoading);

  const {
    cards,
    loadAllLanguages,
    setCards,
    decks: storeDecks,
  } = useFlashcardStore();

  useEffect(() => {
    const init = async () => {
      await loadAllLanguages();
      await useFlashcardStore.getState().fetchAchievements();
    };
    init();
  }, [loadAllLanguages]);

  useEffect(() => {
    setDecks(storeDecks);
  }, [storeDecks]);

  const deckCardCounts = useMemo(() => {
    return decks.reduce((acc: Record<string, number>, deck: Deck) => {
      acc[deck.id] = cards.filter((c) => c.deckId === deck.id).length;
      return acc;
    }, {});
  }, [decks, cards]);

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

  const fetchFlashcards = async (
    deckId: string,
    deckLang: Deck["language"]
  ) => {
    const snapshot = await firestore()
      .collection("flashcards")
      .doc(deckLang)
      .collection("decks")
      .doc(deckId)
      .collection("cards")
      .get();
    const fetchedCards: Flashcard[] = snapshot.docs.map(
      (doc) => ({ id: doc.id, language: deckLang, ...doc.data() } as Flashcard)
    );

    setStudyCards(fetchedCards);
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (user && user.displayName) setUsername(user.displayName);
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      const deck = decks.find((d) => d.id === selectedDeck);
      if (deck) fetchFlashcards(deck.id, deck.language);
      setCurrentCardIndex(0);
      setSessionStats({ studied: 0, correct: 0 });
    }
  }, [selectedDeck, decks]);

  const handleCardSwipe = (difficulty: Flashcard["difficulty"]) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    const isCorrect = difficulty === "good" || difficulty === "easy";

    // update local session stats
    setSessionStats((prev) => ({
      studied: prev.studied + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));

    // update card difficulty in global store
    const updatedCards: Flashcard[] = cards.map((card) =>
      card.id === currentCard.id ? { ...card, difficulty } : card
    );
    setCards(updatedCards);

    // update global stats
    const prevStats = useFlashcardStore.getState().stats;
    useFlashcardStore.getState().updateAchievements({
      totalCardsStudied: prevStats.totalCardsStudied + 1,
      perfectSession: isCorrect,
    });

    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // Session complete - show completion message
      setSelectedDeck(null);
    }
  };

  const startStudySession = (deckId: string) => setSelectedDeck(deckId);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.blue, Colors.greenMint]}
          style={styles.gradient}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (
    selectedDeck &&
    studyCards.length > 0 &&
    currentCardIndex < studyCards.length
  ) {
    const currentCard = studyCards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / studyCards.length) * 100;

    // learning flashcards page
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.blue, Colors.greenMint]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedDeck(null)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.progressText}>
              {currentCardIndex + 1} / {studyCards.length}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.studyContainer}>
            <FlashcardComponent
              key={currentCard.id}
              card={currentCard}
              onSwipe={handleCardSwipe}
            />
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Studied: {sessionStats.studied} | Accuracy:{" "}
              {sessionStats.studied > 0
                ? Math.round(
                    (sessionStats.correct / sessionStats.studied) * 100
                  )
                : 0}
              %
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // available deck selection page
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.white, Colors.mintAccent]}
        style={styles.gradient}
      >
        <Image
          source={require("../../assets/images/pocketlingo-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.greeting}>
            Hello{username ? `, ${username}!` : "!"}
          </Text>
          <Text style={styles.title}>Ready to Learn?</Text>
          <Text style={styles.subtitle}>
            Choose a deck to begin your learning session
          </Text>

          <View style={styles.decksContainer}>
            {decks.length === 0 ? (
              <View style={styles.emptyPlaceholder}>
                <Image
                  source={require("../../assets/images/empty-placeholder.png")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>No decks available yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add some decks or wait for new ones to appear.
                </Text>
              </View>
            ) : (
              decks.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  style={[
                    styles.deckCard,
                    {
                      backgroundColor: getDeckColor(deck),
                      opacity: (deckCardCounts[deck.id] || 0) === 0 ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => startStudySession(deck.id)}
                  disabled={deckCardCounts[deck.id] === 0}
                >
                  <View style={styles.deckHeader}>
                    <Text style={styles.deckName}>{deck.name}</Text>
                    <Play size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.deckDescription}>{deck.description}</Text>
                  <View style={styles.deckStats}>
                    <View style={styles.statItem}>
                      <BarChart3 size={16} color={Colors.white} />
                      <Text style={styles.statText}>
                        {deckCardCounts[deck.id] || 0} cards to study
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.blue,
    textAlign: "center",
    marginTop: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.tealDark,
    textAlign: "center",
    marginTop: 5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  decksContainer: {
    flex: 1,
  },
  deckCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  deckHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deckName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
  },
  deckDescription: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: 12,
  },
  deckStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: Colors.white,
  },
  dueText: {
    fontSize: 12,
    color: Colors.red,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontWeight: "500",
  },
  newText: {
    fontSize: 12,
    color: Colors.greenDark,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 18,
    color: Colors.white,
    textAlign: "center",
    marginTop: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  progressText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  studyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    padding: 20,
    alignItems: "center",
  },
  statsText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: "500",
  },
  logo: {
    width: 240,
    height: 120,
    alignSelf: "center",
    shadowColor: "transparent",
    marginTop: 20,
  },
  emptyPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyImage: {
    width: 150,
    height: 150,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.blue,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.blue,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
