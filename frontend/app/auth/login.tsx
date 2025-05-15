import React, { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import { Link } from "expo-router";
import { login } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();

  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const response = await login({ email, password });
      await authLogin(response.token, response.refreshToken);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Login
          </ThemedText>

          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor }]}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, { color: textColor, borderColor: textColor }]}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: tintColor }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Login</ThemedText>}
          </TouchableOpacity>
          <ThemedView style={styles.footer}>
            <ThemedText>Don&apos;t have an account? </ThemedText>
            <Link href="/auth/signup">
              <ThemedText style={{ color: tintColor }}>Sign up</ThemedText>
            </Link>
          </ThemedView>
        </ThemedView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { height: 40, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginBottom: 10 },
  button: { height: 50, borderRadius: 8, justifyContent: "center", alignItems: "center", marginTop: 16 },
  buttonText: { color: "#000", fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
});
