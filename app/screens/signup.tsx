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

export default function SignUpScreen({ navigation }: { navigation: any }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = () => {
    // TODO: Integrate Firebase Auth (createUserWithEmailAndPassword + save username)
    console.log("Sign up with:", { username, email, password });
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/pocketlingo-logo.png")}
        style={styles.logo}
      />

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

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 10,
        }}
      >
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
  linkText: {
    color: Colors.gray,
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
