import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flashcard } from "../types/flashcard";
import { Volume2 } from "lucide-react-native";
import { Colors } from "../app/constants/colors";
import Tts from "react-native-tts";

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

  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [panAnimation] = useState(new Animated.ValueXY());
  const [scaleAnimation] = useState(new Animated.Value(1));

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

    const startSub: any = Tts.addEventListener("tts-start", () =>
      console.log("TTS start")
    );
    const finishSub: any = Tts.addEventListener("tts-finish", () =>
      console.log("TTS finish")
    );
    const cancelSub: any = Tts.addEventListener("tts-cancel", () =>
      console.log("TTS cancel")
    );

    return () => {
      startSub?.remove?.();
      finishSub?.remove?.();
      cancelSub?.remove?.();
    };
  }, []);

  const speakText = async () => {
    try {
      if (Platform.OS === "android") {
        await Tts.stop();
      }
      Tts.speak(card.back || "No text available.");
    } catch (err) {
      console.warn("TTS speak error:", err);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: (_, gestureState) => {
      panAnimation.setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, vx } = gestureState;

      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      const swipeThreshold = 100;
      const velocityThreshold = 500;

      if (Math.abs(dx) > swipeThreshold || Math.abs(vx) > velocityThreshold) {
        if (dx > 0) {
          onSwipe(dx > screenWidth / 3 ? "easy" : "good");
        } else {
          onSwipe(Math.abs(dx) > screenWidth / 3 ? "again" : "hard");
        }

        Animated.timing(panAnimation, {
          toValue: {
            x: dx > 0 ? screenWidth : -screenWidth,
            y: gestureState.dy,
          },
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(panAnimation, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const cardTransform = {
    transform: [
      { translateX: panAnimation.x },
      { translateY: panAnimation.y },
      { scale: scaleAnimation },
      {
        rotate: panAnimation.x.interpolate({
          inputRange: [-screenWidth / 2, 0, screenWidth / 2],
          outputRange: ["-15deg", "0deg", "15deg"],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const handleFlip = () => {
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    Animated.timing(flipAnimation, {
      toValue: newFlipped ? 180 : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  };

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

  const overlayOpacity = panAnimation.x.interpolate({
    inputRange: [-screenWidth / 4, 0, screenWidth / 4],
    outputRange: [0.8, 0, 0.8],
    extrapolate: "clamp",
  });

  const overlayColor = panAnimation.x.interpolate({
    inputRange: [
      -screenWidth,
      -screenWidth / 3,
      0,
      screenWidth / 3,
      screenWidth,
    ],
    outputRange: ["#ef4444", "#f97316", "transparent", "#22c55e", "#3b82f6"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[styles.cardContainer, cardTransform]}>
        <TouchableOpacity
          style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          onPress={handleFlip}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            style={styles.cardGradient}
          >
            <Animated.View style={[styles.cardSide, frontAnimatedStyle]}>
              <Text style={styles.cardText}>{card.front}</Text>
              <Text style={styles.tapHint}>Tap to reveal</Text>
            </Animated.View>

            <Animated.View
              style={[styles.cardSide, styles.backSide, backAnimatedStyle]}
            >
              <View style={styles.audioButtonContainer}>
                <TouchableOpacity onPress={speakText}>
                  <Volume2 size={24} color={Colors.gray} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardText}>{card.back}</Text>
              <Text style={styles.swipeHint}>Swipe to rate difficulty</Text>
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
              backgroundColor: overlayColor,
            },
          ]}
        />
      </Animated.View>

      <View style={[styles.indicators, { width: CARD_WIDTH }]}>
        {["again", "hard", "good", "easy"].map((level) => (
          <View
            key={level}
            style={[
              styles.indicator,
              { backgroundColor: getDifficultyColor(level) },
            ]}
          >
            <Text style={styles.indicatorText}>{level}</Text>
          </View>
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
  cardContainer: {
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
  cardSide: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backfaceVisibility: "hidden",
  },
  backSide: {
    backgroundColor: "transparent",
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
    top: 10,
    right: 10,
    zIndex: 10,
  },
  audioButton: {
    position: "absolute",
    top: 10,
    right: 10,
    color: Colors.gray,
  },
  swipeHint: {
    position: "absolute",
    bottom: 30,
    fontSize: 14,
    color: Colors.gray,
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
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
