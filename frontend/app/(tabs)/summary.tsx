import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SummaryScreen() {
  const navigateToGoals = () => {
    router.push("/goals");
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.goalsContainer}>
        <TouchableOpacity style={styles.goalsButton} onPress={navigateToGoals}>
          <View style={styles.goalContentContainer}>
            <Ionicons name="flag-outline" size={24} color="#FFFFFF" style={styles.goalIcon} />
            <ThemedText style={styles.goalText}>Goals</ThemedText>
          </View>
          <View style={styles.goalArrow}>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 16, color: "gray" },
  goalsContainer: { width: "100%", paddingHorizontal: 20 },
  goalsButton: { backgroundColor: "#000000", borderRadius: 12, padding: 20, flexDirection: "row", alignItems: "center" },
  goalArrow: { marginLeft: "auto", padding: 10 },
  goalText: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  goalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  goalContainer: { flex: 1 },
  goalContentContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  goalIcon: { marginRight: 12 },
});
