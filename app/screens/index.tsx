import React, { useEffect, useState, useMemo } from "react";
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
import { Play, ChartColumn, Check, Info } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Flashcard, Deck } from "@/types/flashcard";
import FlashcardComponent from "@/components/FlashcardComponent";
import { Colors } from "../constants/colors";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import NetInfo from "@react-native-community/netinfo";
import ConfettiCannon from "react-native-confetti-cannon";
import { getOfflineDecks } from "../utils/offlineStorage";

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [communityCardCounts, setCommunityCardCounts] = useState<
    Record<string, number>
  >({});

  const { cards, loadAllLanguages, decks: storeDecks } = useFlashcardStore();
  const user = auth().currentUser;

  const currentCardIndexRef = React.useRef(currentCardIndex);
  currentCardIndexRef.current = currentCardIndex;

  const sessionStatsRef = React.useRef(sessionStats);
  sessionStatsRef.current = sessionStats;

  useEffect(() => {
    const init = async () => {
      await loadAllLanguages();
      await useFlashcardStore.getState().fetchAchievements();
    };
    init();
  }, [loadAllLanguages]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("communityDecks")
      .where("status", "==", "approved")
      .onSnapshot((querySnapshot) => {
        const updatedCommunityDecks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          language: doc.data().language ?? "english",
          name: doc.data().title ?? "Untitled Deck",
          description: doc.data().description ?? "",
          color: doc.data().color ?? null,
          isCommunity: true,
        }));

        setDecks((prev) => {
          const all = [...storeDecks];

          updatedCommunityDecks.forEach((d) => {
            if (!all.some((x) => x.id === d.id)) {
              all.push(d);
            }
          });

          return all;
        });
      });
    return () => unsubscribe();
  }, [storeDecks]);

  const deckCardCounts = useMemo(() => {
    return decks.reduce<Record<string, number>>((acc, deck) => {
      if (deck.isCommunity) {
        acc[deck.id] = communityCardCounts[deck.id] ?? 0;
      } else {
        acc[deck.id] = cards.filter((c) => c.deckId === deck.id).length;
      }
      return acc;
    }, {});
  }, [decks, cards, communityCardCounts]);

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

  // get username
  useEffect(() => {
    if (user?.displayName) setUsername(user.displayName);
  }, [user]);

  // fetch flashcards when deck is selected
  useEffect(() => {
    if (!selectedDeck) return;
    const deck = decks.find((d) => d.id === selectedDeck);
    if (!deck || !user) return;

    let collectionRef;

    if (deck.isCommunity) {
      collectionRef = firestore()
        .collection("communityDecks")
        .doc(deck.id)
        .collection("cards");
    } else if (deck.language === "spanish" || deck.language === "french") {
      collectionRef = firestore()
        .collection("flashcards")
        .doc(deck.language)
        .collection("decks")
        .doc(deck.id)
        .collection("cards");
    } else {
      collectionRef = firestore()
        .collection("users")
        .doc(user.uid)
        .collection("customDecks")
        .doc(deck.id)
        .collection("cards");
    }

    const unsubscribe = collectionRef
      .orderBy("createdAt")
      .onSnapshot((snapshot) => {
        const fetchedCards = snapshot.docs.map((doc) => ({
          id: doc.id,
          language: deck.language,
          ...doc.data(),
        })) as Flashcard[];

        setStudyCards(fetchedCards);
        setTotalCards(fetchedCards.length);
        setCurrentCardIndex(0);
      });

    return () => unsubscribe();
  }, [selectedDeck, decks, user]);

  // load downloaded decks per user
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user) return;

      const userOffline = await getOfflineDecks(true);
      const globalOffline = await getOfflineDecks(false);

      setDownloadedDecks([
        ...userOffline.map((d: { deck: Deck }) => String(d.deck.id)),
        ...globalOffline.map((d: { deck: Deck }) => String(d.deck.id)),
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const communityUnsub = firestore()
      .collection("communityDecks")
      .where("status", "==", "approved")
      .orderBy("createdAt", "asc")
      .onSnapshot(async (querySnapshot) => {
        const decks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          language: doc.data().language ?? "english",
          name: doc.data().title ?? "Untitled Deck",
          description: doc.data().description ?? "",
          color: doc.data().color ?? null,
          isCommunity: true,
        }));

        setDecks([...storeDecks, ...decks]);

        decks.forEach((deck) => {
          firestore()
            .collection("communityDecks")
            .doc(deck.id)
            .collection("cards")
            .onSnapshot((cardSnap) => {
              setCommunityCardCounts((prev) => ({
                ...prev,
                [deck.id]: cardSnap.size,
              }));
            });
        });
      });

    return () => communityUnsub();
  }, [storeDecks]);

  // handle card swipe
  const handleCardSwipe = async (difficulty: Flashcard["difficulty"]) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    const updatedCards = [...studyCards];
    let newCorrect = sessionStats.correct;

    if (difficulty === "good") {
      newCorrect += 1;
      updatedCards.splice(currentCardIndex, 1);
    } else {
      // "again" repeat later but don’t add to total
      const [againCard] = updatedCards.splice(currentCardIndex, 1);
      // insert 2 cards later or at end
      const insertAt = Math.min(currentCardIndex + 2, updatedCards.length);
      updatedCards.splice(insertAt, 0, againCard);
    }

    const newStudied = sessionStats.studied + 1;
    setSessionStats({
      studied: newStudied,
      correct: newCorrect,
    });
    // trigger confetti if last card
    if (updatedCards.length === 0 && totalCards > 0) {
      setShowConfetti(true);
    }

    useFlashcardStore
      .getState()
      .studyCard(
        currentCard.id,
        newStudied === totalCards && newCorrect === totalCards
      );

    if (user) {
      firestore()
        .collection("users")
        .doc(user.uid)
        .collection("progress")
        .doc(selectedDeck!)
        .set(
          {
            studied: newStudied,
            correct: newCorrect,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }

    setStudyCards(updatedCards);
    setCurrentCardIndex((prev) =>
      updatedCards.length === 0
        ? totalCards
        : prev >= updatedCards.length
        ? 0
        : prev
    );
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
        <View style={styles.container}>
          <LinearGradient
            colors={[Colors.blue, Colors.greenMint]}
            style={styles.gradient}
          >
            <View style={styles.endContainer}>
              {showConfetti && (
                <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />
              )}
              <Image
                source={require("../../assets/images/pocketlingo-end-session.png")}
                style={styles.endSessionImage}
                resizeMode="contain"
              />
              <Text style={styles.endTitle}>Session Complete</Text>
              <Text style={styles.endText}>
                You studied {totalCards} cards with{" "}
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
      <View style={styles.container}>
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

            <Text style={styles.deckTitle}>
              {decks.find((d) => d.id === selectedDeck)?.name || ""}
            </Text>

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
              Studied: {sessionStats.correct} | Accuracy:{" "}
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
    <View style={styles.container}>
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
                      <ChartColumn size={16} color={Colors.white} />
                      <Text style={styles.statText}>
                        {deckCardCounts[deck.id] || 0}{" "}
                        {deckCardCounts[deck.id] === 1 ? "card" : "cards"} to
                        study
                      </Text>
                    </View>

                    {downloadedDecks.some(
                      (id) => String(id) === String(deck.id)
                    ) && (
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
    paddingTop: 40,
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
  deckTitle: {
    textAlign: "center",
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: -35,
  },
});
