import React, { useRef, useEffect, useState, memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  AccessibilityInfo,
} from "react-native";
import FlipCard from "react-native-flip-card";
import { LinearGradient } from "expo-linear-gradient";
import { Flashcard } from "@/types/flashcard";
import { Volume2 } from "lucide-react-native";
import { Colors } from "@/app/constants/colors";
import Tts from "react-native-tts";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const LANGUAGE_CODES: Record<Flashcard["language"], string> = {
  spanish: "es-ES",
  french: "fr-FR",
  custom: "en-US",
};
interface FlashcardComponentProps {
  card: Flashcard;
  onSwipe: (difficulty: "good" | "again") => void;
}

/**
 * FlashcardComponent
 *
 * Behavior preserved from original:
 * - Tap front/back area flips the FlipCard component.
 * - Swipe gestures operate only on the card area; bottom buttons do NOT trigger swipe.
 * - TTS (audio button) remains on the back and functions as before.
 * - Overlay color/opacity feedback for swipe preserved.
 *
 * Internals changed:
 * - Pan gestures + transforms moved to Reanimated (native UI thread).
 * - Animation primitives replaced with useSharedValue + useAnimatedStyle.
 */
export default memo(function FlashcardComponent({
  card,
  onSwipe,
}: FlashcardComponentProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const CARD_WIDTH = screenWidth - 40;
  const CARD_HEIGHT = screenHeight * 0.6;

  // FlipCard ref + state
  const flipCardRef = useRef<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reanimated shared values (native thread)
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Animated style for card transformation (translate, rotate, scale)
  const animatedCardStyle = useAnimatedStyle(() => {
    const rotateDeg = `${interpolate(
      panX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-15, 0, 15],
    )}deg`;

    return {
      transform: [
        { translateX: panX.value },
        { translateY: panY.value },
        { scale: scale.value },
        { rotate: rotateDeg },
      ],
    };
  });

  // Animated overlay style (color + opacity) same feedback as original
  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        Math.abs(panX.value),
        [0, screenWidth / 4],
        [0, 0.8],
      ),
      backgroundColor: interpolateColor(
        panX.value,
        [-screenWidth, -screenWidth / 3, 0, screenWidth / 3, screenWidth],
        [
          Colors.red,
          Colors.red,
          "transparent",
          Colors.tealDark,
          Colors.tealDark,
        ],
      ),
      borderRadius: 20,
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  // Gesture: pan only for the card area
  const gesture = Gesture.Pan()
    .onBegin(() => {
      // press down scale
      scale.value = withSpring(0.95);
    })
    .onUpdate((e) => {
      panX.value = e.translationX;
      panY.value = e.translationY;
    })
    .onEnd((e) => {
      // revert press scale
      scale.value = withSpring(1);

      const swipeThreshold = 100;
      const velocityThreshold = 500;
      const translationX = e.translationX;
      const velocityX = e.velocityX;
      const translationY = e.translationY;

      if (
        Math.abs(translationX) > swipeThreshold ||
        Math.abs(velocityX) > velocityThreshold
      ) {
        const direction = translationX > 0 ? "right" : "left";
        const toX = direction === "right" ? screenWidth : -screenWidth;
        const difficulty = direction === "right" ? "good" : "again";

        panX.value = withTiming(toX, { duration: 250 }, () => {
          // reset values on completed animation
          panX.value = 0;
          panY.value = 0;
          // call onSwipe and accessibility announcement on JS thread
          runOnJS(onSwipe)(difficulty);
          runOnJS(AccessibilityInfo.announceForAccessibility)(
            `Rated flashcard difficulty as ${difficulty}`,
          );
        });
      } else {
        // snap back
        panX.value = withSpring(0);
        panY.value = withSpring(0);
      }
    });

  useEffect(() => {
    const setupTts = async () => {
      try {
        await Tts.getInitStatus();
        await Tts.setDefaultPitch(1.0);
        await Tts.setDefaultRate(0.5, true);
      } catch (err) {
        console.warn("TTS initialization error:", err);
      }
    };

    setupTts();
  }, []);

  const speakText = useCallback(async () => {
    try {
      if (Platform.OS === "android") await Tts.stop();
      const langCode = LANGUAGE_CODES[card.language] || "en-US";
      await Tts.setDefaultLanguage(langCode);
      Tts.speak(card.back || "No text available.");
    } catch (err) {
      console.warn("TTS speak error:", err);
    }
  }, [card.back, card.language]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const newState = !prev;

      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(
          newState ? `Answer: ${card.back}` : `Question: ${card.front}`,
        );
      }, 300);

      return newState;
    });
  }, [card.back, card.front]);

  const getDifficultyColor = useCallback(
    (difficulty: "good" | "again") =>
      difficulty === "good" ? Colors.tealDark : Colors.red,
    [],
  );

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={animatedCardStyle}>
          <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
            <FlipCard
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
              flip={isFlipped}
              friction={10}
              perspective={1000}
              clickable={false}
              ref={flipCardRef}
              flipHorizontal={true}
              flipVertical={false}
            >
              {/* front */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.card,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
                onPress={handleFlip}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Flashcard front. ${card.front}`}
                accessibilityHint="Double tap to reveal the answer."
              >
                <LinearGradient
                  colors={["#fff", "#f8fafc"]}
                  style={styles.cardGradient}
                >
                  <Text
                    style={styles.cardText}
                    accessible={true}
                    accessibilityRole="text"
                    accessibilityLabel={card.front}
                  >
                    {card.front}
                  </Text>

                  <Text
                    style={styles.tapHint}
                    accessible={false}
                    importantForAccessibility="no"
                  >
                    Tap to reveal
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* back */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.card,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
                onPress={handleFlip}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Flashcard back. ${card.back}`}
                accessibilityHint="Double tap to flip back to the question."
              >
                <LinearGradient
                  colors={["#fff", "#f8fafc"]}
                  style={styles.cardGradient}
                >
                  <View style={styles.audioButtonContainer}>
                    <TouchableOpacity
                      onPress={speakText}
                      testID="audio-button"
                      style={styles.audioButton}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Play pronunciation audio"
                      accessibilityHint="Double tap to hear the pronunciation."
                    >
                      <Volume2 size={32} color={Colors.gray} />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={styles.cardText}
                    accessible={true}
                    accessibilityLabel={card.back}
                  >
                    {card.back}
                  </Text>

                  <Text
                    style={styles.swipeHint}
                    accessible={false}
                    importantForAccessibility="no"
                  >
                    Swipe to rate difficulty
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </FlipCard>

            {/* overlay */}
            <Animated.View pointerEvents="none" style={animatedOverlayStyle} />
          </View>
        </Animated.View>
      </GestureDetector>

      <View style={[styles.indicators, { width: CARD_WIDTH }]}>
        {(["again", "good"] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.indicator,
              {
                backgroundColor: getDifficultyColor(level),
                marginHorizontal: 5,
                flex: 1,
              },
            ]}
            onPress={() => onSwipe(level)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${level} difficulty`}
            accessibilityHint={`Rates this flashcard difficulty as ${level}.`}
            accessibilityValue={{ text: level }}
          >
            <Text style={styles.indicatorText}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

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
    color: Colors.black,
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
  audioButton: {
    padding: 16,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
    marginTop: 30,
  },
  indicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    minHeight: 44,
  },
  indicatorText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
  },
});
