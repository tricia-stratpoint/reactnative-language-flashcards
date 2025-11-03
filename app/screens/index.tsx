import React, { useEffect, useState, useMemo, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Play, BarChart3, Check, Info } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Flashcard, Deck } from "@/types/flashcard";
import FlashcardComponent from "@/components/FlashcardComponent";
import { Colors } from "../constants/colors";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import ConfettiCannon from "react-native-confetti-cannon";

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0 });
  const [username, setUsername] = useState("");
  const isLoading = useFlashcardStore((state) => state.isLoading);
  const [downloadedDecks, setDownloadedDecks] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [totalCards, setTotalCards] = useState(0);

  const { cards, loadAllLanguages, decks: storeDecks } = useFlashcardStore();

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
    try {
      const snapshot = await firestore()
        .collection("flashcards")
        .doc(deckLang)
        .collection("decks")
        .doc(deckId)
        .collection("cards")
        .orderBy("createdAt", "asc")
        .get();

      const fetchedCards: Flashcard[] = snapshot.docs.map(
        (doc) =>
          ({ id: doc.id, language: deckLang, ...doc.data() } as Flashcard)
      );

      setStudyCards(fetchedCards);
      return fetchedCards;
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      setStudyCards([]);
      return [];
    }
  };

  useEffect(() => {
    const user = auth().currentUser;
    if (user && user.displayName) setUsername(user.displayName);
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      const deck = decks.find((d) => d.id === selectedDeck);
      if (deck) {
        fetchFlashcards(deck.id, deck.language).then((fetched) => {
          setTotalCards(fetched.length);
        });
      }
      setCurrentCardIndex(0);
      setSessionStats({ studied: 0, correct: 0 });
    }
  }, [selectedDeck, decks]);

  useFocusEffect(
    React.useCallback(() => {
      const loadDownloads = async () => {
        const stored = await AsyncStorage.getItem("downloaded_decks");
        if (stored) {
          const data = (JSON.parse(stored) as any[]).map((d: any) => d.deck.id);
          setDownloadedDecks(data);
        } else {
          setDownloadedDecks([]);
        }
      };

      loadDownloads();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const handleCardSwipe = (difficulty: Flashcard["difficulty"]) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    const updatedCards = [...studyCards];

    if (difficulty === "good") {
      // remove the card permanently from session
      updatedCards.splice(currentCardIndex, 1);

      setSessionStats((prev) => ({
        studied: prev.studied + 1,
        correct: prev.correct + 1,
      }));
    } else {
      // "again" repeat later but don’t add to total
      const [againCard] = updatedCards.splice(currentCardIndex, 1);
      // insert 2 cards later or at end
      const insertAt = Math.min(currentCardIndex + 2, updatedCards.length);
      updatedCards.splice(insertAt, 0, againCard);

      setSessionStats((prev) => ({
        ...prev,
        studied: prev.studied + 1,
      }));
    }

    setStudyCards(updatedCards);

    if (updatedCards.length === 0) {
      setCurrentCardIndex(totalCards);
    } else {
      // Session complete - show completion message
      setCurrentCardIndex((prev) => (prev >= updatedCards.length ? 0 : prev));
    }
  };

  const startStudySession = (deckId: string) => {
    // if offline, only allow downloaded decks to be studied
    if (!isConnected && !downloadedDecks.includes(deckId)) {
      console.log("Deck not available offline:", deckId);
      return;
    }
    setSelectedDeck(deckId);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.blue, Colors.greenMint]}
          style={[styles.gradient, styles.loadingGradient]}
        >
          <ActivityIndicator size={70} color={Colors.white} />
        </LinearGradient>
      </View>
    );
  }

  if (selectedDeck) {
    // End-of-session screen
    if (studyCards.length === 0 && totalCards > 0) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={[Colors.blue, Colors.greenMint]}
            style={styles.gradient}
          >
            <View style={styles.endContainer}>
              <ConfettiCannon
                key={Date.now()}
                count={200}
                origin={{ x: -10, y: 0 }}
              />
              <Image
                source={require("../../assets/images/pocketlingo-end-session.png")}
                style={styles.endSessionImage}
                resizeMode="contain"
              />
              <Text style={styles.endTitle}>Session Complete</Text>
              <Text style={styles.endText}>
                You answered {totalCards} cards with{" "}
                {sessionStats.studied > 0
                  ? Math.round(
                      (sessionStats.correct / sessionStats.studied) * 100
                    )
                  : 0}
                % accuracy
              </Text>

              <TouchableOpacity
                style={styles.endButton}
                onPress={() => {
                  setSelectedDeck(null);
                  setStudyCards([]);
                  setTotalCards(0);
                  setSessionStats({ studied: 0, correct: 0 });
                }}
              >
                <Text style={styles.endButtonText}>Back to Decks</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      );
    }

    const currentCard = studyCards[currentCardIndex];
    const progress =
      totalCards > 0 ? (sessionStats.correct / totalCards) * 100 : 0;

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
              {sessionStats.correct} / {totalCards}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.studyContainer}>
            {studyCards.length > 0 && currentCard ? (
              <FlashcardComponent
                key={currentCard.id}
                card={currentCard}
                onSwipe={handleCardSwipe}
              />
            ) : (
              <Text style={{ color: Colors.white, fontSize: 16 }}>
                Loading card...
              </Text>
            )}
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Correct: {sessionStats.correct} | Accuracy:{" "}
              {totalCards > 0
                ? Math.round((sessionStats.correct / totalCards) * 100)
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

          {!isConnected &&
            decks.some((deck) => !downloadedDecks.includes(deck.id)) && (
              <View style={styles.offlineNoticeContainer}>
                <Info
                  size={16}
                  color={Colors.blue}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.offlineNotice}>
                  Some decks may be unavailable while offline.
                </Text>
              </View>
            )}

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
                      // dim deck if offline & not downloaded, or if it has no cards
                      opacity:
                        (!isConnected && !downloadedDecks.includes(deck.id)) ||
                        (deckCardCounts[deck.id] || 0) === 0
                          ? 0.5
                          : 1,
                    },
                  ]}
                  // disable if offline & not downloaded, or has no cards
                  disabled={
                    (!isConnected && !downloadedDecks.includes(deck.id)) ||
                    deckCardCounts[deck.id] === 0
                  }
                  onPress={() => startStudySession(deck.id)}
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
                        {deckCardCounts[deck.id] || 0}{" "}
                        {deckCardCounts[deck.id] === 1 ? "card" : "cards"} to
                        study
                      </Text>
                    </View>

                    {downloadedDecks.includes(deck.id) && (
                      <View style={styles.downloadedTag}>
                        <Check size={16} color={Colors.white} />
                        <Text style={styles.downloadedText}>Downloaded</Text>
                      </View>
                    )}
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
  endSessionImage: {
    width: 300,
    height: 300,
  },
  endContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  endTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 12,
  },
  endText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: "center",
    marginBottom: 30,
  },
  endButton: {
    marginTop: 30,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.blue,
  },
  downloadedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    gap: 4,
  },
  downloadedText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  offlineNoticeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -25,
    marginBottom: 35,
  },
  offlineNotice: {
    fontSize: 13,
    color: Colors.blue,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
  },
  loadingGradient: {
    justifyContent: "center",
    alignItems: "center",
  },
});
