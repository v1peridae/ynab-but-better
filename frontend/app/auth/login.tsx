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
  Text,
  StatusBar,
} from "react-native";
import { Link } from "expo-router";
import { login } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
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
      keyboardVerticalOffset={Platform.OS === "ios" ? -40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />

          <View style={styles.header}>
            <Text style={styles.title}>Sign In</Text>
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
            <TouchableOpacity style={styles.continueButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#E5E5E5" /> : <Text style={styles.buttonText}>Continue</Text>}
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/auth/signup" disabled={loading}>
                <Text style={styles.linkText}>Sign Up</Text>
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
