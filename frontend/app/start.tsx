import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Link } from "expo-router";

const { height } = Dimensions.get("window");

export default function StartScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.mainText}>Sense</Text>
        <Text style={styles.subtitle}>have control</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.separator} />

        <Link href="/auth/signup" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", alignItems: "center" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  section: { alignItems: "center", marginBottom: height * 0.15 },
  mainText: { fontSize: 72, fontWeight: "500", color: "#575F72", letterSpacing: -2, marginBottom: 8, marginTop: 100 },
  subtitle: { fontSize: 20, color: "#666", fontWeight: "400", letterSpacing: 1, marginTop: -30 },
  buttonContainer: { width: "100%", maxWidth: 200, gap: 20, marginTop: 100 },
  button: { backgroundColor: "#252933", opacity: 0.5, paddingVertical: 16, borderRadius: 18, alignItems: "center" },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
  separator: { height: 2, backgroundColor: "#666", width: "140%", marginVertical: 10, alignSelf: "center", opacity: 0.5 },
});
