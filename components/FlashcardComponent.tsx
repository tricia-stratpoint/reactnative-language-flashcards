import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import CardFlip from "react-native-card-flip";
import { LinearGradient } from "expo-linear-gradient";
import { Flashcard } from "../types/flashcard";
import { Volume2 } from "lucide-react-native";
import { Colors } from "../app/constants/colors";
import Tts from "react-native-tts";

const LANGUAGE_CODES: Record<Flashcard["language"], string> = {
  spanish: "es-ES",
  french: "fr-FR",
  custom: "en-US",
};

type CardFlipRef = { flip: () => void };
const CardFlipTyped = CardFlip as unknown as React.ComponentType<{
  style?: any;
  flipDuration?: number;
  ref?: React.Ref<CardFlipRef>;
  children?: React.ReactNode;
}>;

interface FlashcardComponentProps {
  card: Flashcard;
  onSwipe: (direction: "again" | "hard" | "good" | "easy") => void;
}

export default function FlashcardComponent({
  card,
  onSwipe,
}: FlashcardComponentProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const CARD_WIDTH = screenWidth - 40;
  const CARD_HEIGHT = screenHeight * 0.6;

  const cardFlipRef = useRef<CardFlipRef>(null);

  useEffect(() => {
    const setupTts = async () => {
      try {
        await Tts.setDefaultLanguage("en-US");
        await Tts.setDefaultPitch(1.0);
        await Tts.setDefaultRate(0.5, true);
      } catch (err) {
        console.warn("TTS setup error:", err);
      }
    };

    setupTts();
  }, []);

  const speakText = async () => {
    try {
      if (Platform.OS === "android") await Tts.stop();
      const langCode = LANGUAGE_CODES[card.language] || "en-US";
      await Tts.setDefaultLanguage(langCode);
      Tts.speak(card.back || "No text available.");
    } catch (err) {
      console.warn("TTS speak error:", err);
    }
  };

  const handleFlip = () => cardFlipRef.current?.flip();

  const getDifficultyColor = (direction: string) => {
    switch (direction) {
      case "again":
        return "#ef4444";
      case "hard":
        return "#f97316";
      case "good":
        return "#22c55e";
      case "easy":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={styles.container}>
      <CardFlipTyped
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        ref={cardFlipRef}
        flipDuration={600}
      >
        {/* FRONT */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]} // <-- force full size
          onPress={handleFlip}
        >
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            style={[
              styles.cardGradient,
              { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
          >
            <Text style={styles.cardText}>{card.front}</Text>
            <Text style={styles.tapHint}>Tap to reveal</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* BACK */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.card,
            {
              backgroundColor: "#ffffff",
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
            },
          ]}
          onPress={handleFlip}
        >
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            style={[
              styles.cardGradient,
              { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
          >
            <View style={styles.audioButtonContainer}>
              <TouchableOpacity onPress={speakText}>
                <Volume2 size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardText}>{card.back}</Text>
            <Text style={styles.swipeHint}>Swipe to rate difficulty</Text>
          </LinearGradient>
        </TouchableOpacity>
      </CardFlipTyped>

      <View style={[styles.indicators, { width: CARD_WIDTH }]}>
        {["again", "hard", "good", "easy"].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.indicator,
              { backgroundColor: getDifficultyColor(level) },
            ]}
            onPress={() => onSwipe(level as "again" | "hard" | "good" | "easy")}
          >
            <Text style={styles.indicatorText}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  cardText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 36,
  },
  tapHint: {
    position: "absolute",
    bottom: 30,
    fontSize: 14,
    color: Colors.gray,
    fontWeight: "500",
  },
  audioButtonContainer: {
    position: "absolute",
    top: 30,
    right: 30,
    zIndex: 20,
  },
  swipeHint: {
    position: "absolute",
    bottom: 30,
    fontSize: 14,
    color: Colors.gray,
    fontWeight: "500",
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  indicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  indicatorText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
