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
import { getAuth } from "@/firebase/firebaseConfig";

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const authInstance = getAuth();

  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    setError("");
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    try {
      const userCredential = await authInstance.signInWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        setVerificationSent(true);
        return;
      }

      console.log("User logged in:", user);
      navigation.replace("MainTabs");
    } catch (error: any) {
      console.log("Login error:", error);
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    }
  };

  const resendVerification = async () => {
    const user = authInstance.currentUser;
    if (user) {
      try {
        await user.sendEmailVerification();
        alert("Verification email resent!");
      } catch (err) {
        console.log("Resend email error:", err);
        setError("Failed to resend verification email. Try again later.");
      }
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
        onChangeText={(text) => {
          setEmail(text);
          setError("");
          setVerificationSent(false);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {verificationSent && (
        <TouchableOpacity onPress={resendVerification}>
          <Text
            style={{
              color: Colors.blue,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Didn&apos;t receive verification email? Resend
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
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
  errorText: {
    color: Colors.red,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
});
