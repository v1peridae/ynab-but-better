import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
export default function HomeScreen() {
  const { logout } = useAuth();
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Home</ThemedText>
      <Button title="Logout" onPress={logout} />
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  buttonText: { color: "#000", fontWeight: "bold" },
});
