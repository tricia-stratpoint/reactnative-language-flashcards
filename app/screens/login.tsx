import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Colors } from "../constants/colors";
import { auth } from "@/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User logged in:", userCredential.user);
      navigation.replace("MainTabs");
    } catch (error) {
      console.log("Login error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/pocketlingo-logo-white.png")}
        style={styles.logo}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        <Text style={styles.linkText}>Don&apos;t have an account yet? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.link}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greenMint,
    justifyContent: "center",
    paddingHorizontal: 45,
    paddingVertical: 20,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 40,
    alignSelf: "center",
    shadowColor: "transparent",
    marginTop: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 15,
    paddingRight: 10,
  },
  toggleButton: {
    paddingHorizontal: 8,
  },
  toggleText: {
    color: Colors.gray,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    backgroundColor: Colors.tealDark,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "bold",
  },
  linkText: {
    color: Colors.white,
    fontWeight: "600",
    textAlign: "center",
    marginRight: 5,
  },
  link: {
    color: Colors.tealDark,
    fontWeight: "600",
    textAlign: "center",
  },
});
