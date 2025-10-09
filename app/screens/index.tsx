import React, { useState, useEffect } from "react";
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
import { useFlashcards } from "@/hooks/flashcard-store";
import FlashcardComponent from "@/components/FlashcardComponent";
import { Flashcard } from "@/types/flashcard";
import { Colors } from "../constants/colors";

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const { decks, getDueCards, getNewCards, updateCardAfterReview, isLoading } =
    useFlashcards();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0 });

  useEffect(() => {
    if (selectedDeck) {
      const dueCards = getDueCards(selectedDeck);
      const newCards = getNewCards(selectedDeck).slice(0, 10); // Limit new cards
      const allCards = [...dueCards, ...newCards];
      setStudyCards(allCards);
      setCurrentCardIndex(0);
      setSessionStats({ studied: 0, correct: 0 });
    }
  }, [selectedDeck, getDueCards, getNewCards]);

  const handleCardSwipe = async (
    difficulty: "again" | "hard" | "good" | "easy"
  ) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard || !difficulty?.trim()) return;

    await updateCardAfterReview(currentCard.id, difficulty);

    const isCorrect = difficulty === "good" || difficulty === "easy";
    setSessionStats((prev) => ({
      studied: prev.studied + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));

    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // Session complete - show completion message
      setSelectedDeck(null);
    }
  };

  const startStudySession = (deckId: string) => {
    setSelectedDeck(deckId);
  };

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
          <View style={styles.content}>
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
                  />{" "}
                  <Text style={styles.emptyTitle}>No decks available yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Add some decks or wait for new ones to appear.
                  </Text>
                </View>
              ) : (
                decks.map((deck) => {
                  const dueCards = getDueCards(deck.id);
                  const newCards = getNewCards(deck.id);
                  const totalCards =
                    dueCards.length + Math.min(newCards.length, 10);

                  return (
                    <TouchableOpacity
                      key={deck.id}
                      style={[
                        styles.deckCard,
                        {
                          backgroundColor: deck.color,
                          opacity: totalCards === 0 ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => startStudySession(deck.id)}
                      disabled={totalCards === 0}
                    >
                      <View style={styles.deckHeader}>
                        <Text style={styles.deckName}>{deck.name}</Text>
                        <Play size={20} color={Colors.white} />
                      </View>
                      <Text style={styles.deckDescription}>
                        {deck.description}
                      </Text>
                      <View style={styles.deckStats}>
                        <View style={styles.statItem}>
                          <BarChart3 size={16} color={Colors.white} />
                          <Text style={styles.statText}>
                            {totalCards} cards to study
                          </Text>
                        </View>
                        {dueCards.length > 0 && (
                          <Text style={styles.dueText}>
                            {dueCards.length} due
                          </Text>
                        )}
                        {newCards.length > 0 && (
                          <Text style={styles.newText}>
                            {Math.min(newCards.length, 10)} new
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.greenMint,
    textAlign: "center",
    marginTop: 5,
  },
  subtitle: {
    fontSize: 16,
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
