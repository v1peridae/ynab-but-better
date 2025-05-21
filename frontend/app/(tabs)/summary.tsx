import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

export default function SummaryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Summary</ThemedText>
      <ThemedText style={styles.subtitle}>Coming soon</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 16, color: "gray" },
});
