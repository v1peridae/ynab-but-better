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
} from "react-native";
import { Link, router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { signup } from "@/utils/api";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const { login: authLogin } = useAuth();

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
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
    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await signup({ email, password });

      if (response.token && response.refreshToken) {
        await authLogin(response.token, response.refreshToken);
      }

      router.replace("/onboarding");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "An unexpected error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: "center" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Create an account
          </ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor }]}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor }]}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor }]}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: loading ? "#ccc" : tintColor,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Sign Up</ThemedText>}
          </TouchableOpacity>

          <ThemedView style={styles.footer}>
            <ThemedText>Already have an account? </ThemedText>
            <Link href="/auth/login" disabled={loading}>
              <ThemedText style={{ color: tintColor }}>Login</ThemedText>
            </Link>
          </ThemedView>
        </ThemedView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { height: 40, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, paddingHorizontal: 10, marginBottom: 10 },
  button: { height: 50, borderRadius: 8, justifyContent: "center", alignItems: "center", marginTop: 16 },
  buttonText: { color: "#000", fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
});
