import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Target, Calendar, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import { Colors } from "../constants/colors";
import { Achievement } from "@/types/flashcard";

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { stats, isLoading } = useFlashcardStore();

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

  const getStreakDays = () => {
    const today = new Date();
    const lastStudy = stats.lastStudyDate
      ? new Date(stats.lastStudyDate)
      : null;

    if (!lastStudy) return 0;

    const diffTime = today.getTime() - lastStudy.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      return stats.studyStreak;
    }
    return 0;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.greenMint, Colors.blue]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Target size={24} color={Colors.blue} />
              <Text style={styles.statNumber}>{stats.totalCardsStudied}</Text>
              <Text style={styles.statLabel}>Cards Studied</Text>
            </View>

            <View style={styles.statCard}>
              <Calendar size={24} color={Colors.red} />
              <Text style={styles.statNumber}>{getStreakDays()}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statCard}>
              <Star size={24} color={Colors.orange} />
              <Text style={styles.statNumber}>
                {stats.achievements.filter((a) => a.unlockedAt !== null).length}
              </Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
          </View>

          {/* Achievements */}
          <Text style={styles.sectionTitle}>Your Achievements</Text>

          <View style={styles.achievementsContainer}>
            {stats.achievements.map((achievement: Achievement) => {
              const isUnlocked = achievement.unlockedAt !== null;
              const progress = Math.min(
                achievement.progress / achievement.target,
                1
              );

              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    isUnlocked && styles.unlockedAchievement,
                  ]}
                >
                  <View style={styles.achievementHeader}>
                    <View
                      style={[
                        styles.achievementIcon,
                        isUnlocked && styles.unlockedIcon,
                      ]}
                    >
                      <Text style={styles.achievementEmoji}>
                        {isUnlocked ? achievement.icon : "🔒"}
                      </Text>
                    </View>

                    <View style={styles.achievementInfo}>
                      <Text
                        style={[
                          styles.achievementTitle,
                          isUnlocked && styles.unlockedTitle,
                        ]}
                      >
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementDescription}>
                        {achievement.description}
                      </Text>
                    </View>

                    {isUnlocked && <Trophy size={20} color={Colors.orange} />}
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress * 100}%` },
                          isUnlocked && styles.completedProgress,
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.progress} / {achievement.target}
                    </Text>
                  </View>

                  {isUnlocked && achievement.unlockedAt && (
                    <Text style={styles.unlockedDate}>
                      Unlocked{" "}
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Motivational Section */}
          <View style={styles.motivationCard}>
            <Text style={styles.motivationTitle}>Keep Going! 🚀</Text>
            <Text style={styles.motivationText}>
              {stats.totalCardsStudied === 0
                ? "Start your learning journey by studying your first flashcard!"
                : stats.totalCardsStudied < 10
                ? "Great start! Keep studying to unlock more achievements."
                : stats.totalCardsStudied < 50
                ? "You're building momentum! Consistency is key to mastering new knowledge."
                : "Amazing progress! You're becoming a learning machine!"}
            </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 16,
  },
  achievementsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  achievementCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    opacity: 0.7,
  },
  unlockedAchievement: {
    opacity: 1,
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  unlockedIcon: {
    backgroundColor: "#fef3c7",
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray,
    marginBottom: 2,
  },
  unlockedTitle: {
    color: "#1f2937",
  },
  achievementDescription: {
    fontSize: 14,
    color: "#9ca3af",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#9ca3af",
    borderRadius: 3,
  },
  completedProgress: {
    backgroundColor: Colors.orange,
  },
  progressText: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: "500",
    minWidth: 40,
  },
  unlockedDate: {
    fontSize: 12,
    color: Colors.orange,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "right",
  },
  motivationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    textShadowColor: "#0000",
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
  },
  loadingGradient: {
    justifyContent: "center",
    alignItems: "center",
  },
});
