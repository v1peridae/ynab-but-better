import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, Text, StatusBar } from "react-native";

export default function OnboardingName({ onNext }) {
  const [name, setName] = useState("");

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    onNext({ name });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainText}>Sense</Text>
        <Text style={styles.subtitle}>have control</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressDots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.progressLine} />
          <View style={styles.dot} />
          <View style={styles.progressLine} />
          <View style={styles.dot} />
          <View style={styles.progressLine} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.stepText}>Step 1 of 4</Text>
      </View>
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", alignItems: "center", paddingTop: 20 },
  header: { alignItems: "center", marginBottom: 60 },
  mainText: { fontSize: 72, fontWeight: "500", color: "#575F72", letterSpacing: -2, marginBottom: 8 },
  subtitle: { fontSize: 20, color: "#666", fontWeight: "400", letterSpacing: 1, marginTop: -30 },
  progressContainer: { alignItems: "center", marginBottom: 60 },
  progressDots: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#333" },
  activeDot: { backgroundColor: "#666" },
  progressLine: { width: 50, height: 2, backgroundColor: "#333" },
  stepText: { color: "#666", fontSize: 14 },
  content: { width: "100%", maxWidth: 280, alignItems: "center" },
  input: {
    backgroundColor: "#252933",
    opacity: 0.5,
    height: 50,
    borderRadius: 18,
    paddingHorizontal: 16,
    color: "#E5E5E5",
    fontSize: 16,
    width: "100%",
    marginBottom: 40,
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    width: 240,
    alignSelf: "center",
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
});
