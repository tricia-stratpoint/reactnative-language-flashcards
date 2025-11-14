import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Colors } from "../constants/colors";
import { useFlashcardStore } from "@/hooks/flashcard-store";
import auth from "@react-native-firebase/auth";
import MaskedView from "@react-native-masked-view/masked-view";
import { Mail, ShieldUser } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const ARC_HEIGHT = 80;
const ICON_SIZE = 120;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    role: "",
    icon: require("@/assets/images/user-icon.png"),
  });

  const role = useFlashcardStore((state) => state.role);
  const fetchUserRole = useFlashcardStore((state) => state.fetchUserRole);

  useEffect(() => {
    const loadUser = async () => {
      const user = auth().currentUser;
      if (user) {
        await fetchUserRole();
        setUserData({
          username: user.displayName || "Unnamed User",
          email: user.email || "",
          role: role || "user",
          icon: require("@/assets/images/user-icon.png"),
        });
      }
    };
    loadUser();
  }, [fetchUserRole, role]);

  const handleAdminPress = () => console.log("Admin button pressed!");

  return (
    <LinearGradient
      colors={[Colors.blue, Colors.blue, Colors.greenMint]}
      style={[styles.container, { paddingTop: insets.top }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={styles.headerTitle}>Profile</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.imageWrapper, { top: ARC_HEIGHT / 1.5 }]}>
          <Image source={userData.icon} style={styles.profileImage} />
        </View>

        <View style={styles.card}>
          <Svg
            width={screenWidth}
            height={ARC_HEIGHT}
            style={styles.arc}
            viewBox={`0 0 ${screenWidth} ${ARC_HEIGHT}`}
          >
            <Path
              d={`M0 ${ARC_HEIGHT} Q${
                screenWidth / 2
              } 0 ${screenWidth} ${ARC_HEIGHT} L${screenWidth} ${ARC_HEIGHT} L0 ${ARC_HEIGHT} Z`}
              fill={Colors.white}
            />
          </Svg>
          <View style={styles.info}>
            <MaskedView
              maskElement={
                <Text style={styles.username}>{userData.username}</Text>
              }
            >
              <LinearGradient
                colors={[Colors.blue, Colors.greenMint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.username, { opacity: 0 }]}>
                  {userData.username}
                </Text>
              </LinearGradient>
            </MaskedView>

            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Mail size={20} color={Colors.gray} style={styles.icon} />
                <Text style={styles.label}>Email</Text>
              </View>
              <View style={styles.dataContainer}>
                <Text style={styles.data}>{userData.email}</Text>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <ShieldUser size={20} color={Colors.gray} style={styles.icon} />
                <Text style={styles.label}>Role</Text>
              </View>
              <View style={styles.dataContainer}>
                <Text style={styles.data}>{userData.role}</Text>
              </View>
            </View>

            {["super_admin", "moderator"].includes(
              userData.role.toLowerCase()
            ) && (
              <TouchableOpacity
                style={styles.adminButton}
                onPress={handleAdminPress}
              >
                <Text style={styles.adminButtonText}>
                  Go to Super Admin Panel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 90,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  card: {
    marginTop: ICON_SIZE / 2,
    width: "100%",
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: ICON_SIZE / 2 + 20,
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: "center",
  },
  arc: {
    position: "absolute",
    top: -ARC_HEIGHT,
  },
  info: {
    alignItems: "center",
  },
  username: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.blue,
    textAlign: "center",
  },
  infoBlock: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: "bold",
  },
  icon: {
    marginRight: 8,
  },
  imageWrapper: {
    position: "absolute",
    zIndex: 10,
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: Colors.mintAccent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.blue,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dataContainer: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  data: {
    fontSize: 16,
    color: Colors.black,
  },
  adminButton: {
    backgroundColor: Colors.blue,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginTop: 50,
  },
  adminButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
});
