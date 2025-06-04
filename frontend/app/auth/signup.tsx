import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  StatusBar,
} from "react-native";
import { Link, router } from "expo-router";

import { signup } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const { login: authLogin } = useAuth();

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await signup({ email: trimmedEmail, password });

      if (response.token && response.refreshToken) {
        await authLogin(response.token, response.refreshToken, false);
        router.replace("/onboarding");
      } else {
        Alert.alert("Error", "Please try logging in.");
        router.replace("/auth/login");
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "An unexpected error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />

          <View style={styles.header}>
            <Text style={styles.title}>Sign Up</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity style={styles.continueButton} onPress={handleSignUp} disabled={loading}>
              {loading ? <ActivityIndicator color="#777076" /> : <Text style={styles.buttonText}>Continue</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/auth/login" disabled={loading}>
                <Text style={styles.linkText}>Sign In</Text>
              </Link>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0E14" },
  header: { alignItems: "center", marginBottom: 60 },
  title: { fontSize: 72, fontWeight: "600", color: "#575F72", letterSpacing: -2, marginBottom: 5 },
  formContainer: { width: "100%", maxWidth: 280, gap: 20 },
  input: { backgroundColor: "#252933", opacity: 0.5, height: 50, borderRadius: 18, paddingHorizontal: 16, color: "#E5E5E5", fontSize: 16 },
  continueButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    width: 200,
    alignSelf: "center",
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#666" },
  linkText: { color: "#777076", fontSize: 16, fontWeight: "600" },
});
