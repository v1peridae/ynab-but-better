import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function OnboardingName({ onNext }) {
  const [name, setName] = useState("");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    onNext({ name });
  };
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Welcome to the app!</ThemedText>
      <ThemedText style={styles.subtitle}>What's your name?</ThemedText>

      <TextInput
        style={[styles.input, { color: textColor, borderColor: textColor }]}
        placeholder="Enter your name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TouchableOpacity style={[styles.nextButton, { backgroundColor: tintColor }]} onPress={handleNext}>
        <ThemedText style={styles.nextButtonText}>Next</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  subtitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { height: 50, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, fontSize: 16, marginBottom: 20 },
  nextButton: { paddingVertical: 15, borderRadius: 8, alignItems: "center" },
  nextButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
