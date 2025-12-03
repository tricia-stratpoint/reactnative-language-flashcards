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
import { saveSecureItem } from "@/app/utils/secureStore";

export default function SignUpScreen({ navigation }: { navigation: any }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const authInstance = getAuth();

  const handleSignUp = async () => {
    setError("");
    setLoading(true);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await authInstance.createUserWithEmailAndPassword(
        email,
        password,
      );

      if (userCredential.user) {
        await userCredential.user.updateProfile({ displayName: username });

        // send email verification
        await userCredential.user.sendEmailVerification();
        setVerificationSent(true);
        await userCredential.user.reload();

        // save token for auto-login (if verified)
        if (userCredential.user.emailVerified) {
          const token = await userCredential.user.getIdToken();
          await saveSecureItem("userToken", token);
          navigation.replace("MainTabs");
        } else {
          setError("Please verify your email before logging in.");
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    const user = authInstance.currentUser;
    if (user) {
      try {
        await user.sendEmailVerification();
        setVerificationSent(true);
        alert("Verification email resent!");
      } catch {
        setError("Failed to resend verification email. Try again later.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/pocketlingo-logo.png")}
        style={styles.logo}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
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
          style={styles.passwordInput}
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

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing up..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      {verificationSent && (
        <View style={styles.verification}>
          <Text style={styles.verificationSent}>
            A verification email has been sent to {email}.
          </Text>
          <TouchableOpacity onPress={resendVerification}>
            <Text style={styles.verificationResend}>
              Didn&apos;t receive it? Resend
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.mintAccent,
    justifyContent: "center",
    paddingHorizontal: 45,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 40,
    alignSelf: "center",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.greenMint,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.greenMint,
    marginBottom: 15,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
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
    backgroundColor: Colors.blue,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "bold",
  },
  errorText: {
    color: Colors.red,
    textAlign: "center",
    marginBottom: 10,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  linkText: {
    color: Colors.gray,
    fontWeight: "600",
  },
  link: {
    color: Colors.tealDark,
    fontWeight: "600",
  },
  verification: {
    marginBottom: 15,
  },
  verificationSent: {
    color: Colors.gray,
    textAlign: "center",
  },
  verificationResend: {
    color: Colors.tealDark,
    textAlign: "center",
    marginTop: 5,
    fontWeight: 600,
  },
});
