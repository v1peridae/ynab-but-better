import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, StatusBar } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePreferences } from "@/context/PreferencesContext";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
};

export default function AddAccountScreen() {
  const { token } = useAuth();
  const { preferences } = usePreferences();

  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const accountTypes = [
    { id: "cash", label: "Cash" },
    { id: "investment", label: "Investments" },
    { id: "checking", label: "Checking" },
    { id: "savings", label: "Savings" },
    { id: "credit", label: "Credit" },
    { id: "other", label: "Other" },
  ];

  const handleAddAccount = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    if (!balance || isNaN(parseFloat(balance))) {
      Alert.alert("Error", "Please enter a valid balance amount");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          type,
          balance: Math.round(parseFloat(balance) * 100),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add account");
      }

      Alert.alert("Success", "Account added successfully", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      console.error("Error adding account:", error);
      Alert.alert("Error", "Failed to add account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E5E5E5" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Add New Account</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Account Name</ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter account name"
              placeholderTextColor="#777076"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Initial Amount</ThemedText>
          <View style={styles.inputContainer}>
            <View style={styles.balanceInput}>
              <ThemedText style={styles.currencySymbol}>{CURRENCY_SYMBOLS[preferences.currency] || "$"}</ThemedText>
              <TextInput
                style={styles.balanceTextInput}
                placeholder="0.00"
                placeholderTextColor="#777076"
                value={balance}
                onChangeText={setBalance}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Account Type</ThemedText>
          <View style={styles.typeOptions}>
            {accountTypes.map((accountType) => (
              <TouchableOpacity
                key={accountType.id}
                onPress={() => setType(accountType.id)}
                style={[styles.typeOption, type === accountType.id && styles.selectedTypeOption]}
              >
                <ThemedText style={[styles.typeText, type === accountType.id && styles.selectedTypeText]}>{accountType.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount} disabled={loading}>
          <ThemedText style={styles.addButtonText}>{loading ? "Adding..." : "Add"}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", paddingTop: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 40, paddingHorizontal: 20 },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 24, fontWeight: "600", color: "#E5E5E5" },
  scrollView: { flex: 1, paddingHorizontal: 40 },
  scrollContent: { paddingBottom: 40 },
  inputGroup: { marginBottom: 30 },
  label: { fontSize: 18, marginBottom: 12, color: "#E5E5E5", fontWeight: "600" },
  inputContainer: { backgroundColor: "#252933", opacity: 0.8, borderRadius: 13, padding: 16 },
  input: { fontSize: 16, color: "#E5E5E5", padding: 0 },
  balanceInput: { flexDirection: "row", alignItems: "center" },
  currencySymbol: { fontSize: 16, marginRight: 8, color: "#E5E5E5" },
  balanceTextInput: { flex: 1, fontSize: 16, color: "#E5E5E5", padding: 0 },
  typeOptions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", width: "100%", maxWidth: 500, gap: 12 },
  typeOption: {
    backgroundColor: "#252933",
    opacity: 0.8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 13,
    alignItems: "center",
    flexShrink: 0,
  },
  selectedTypeOption: { backgroundColor: "#575F72", opacity: 1 },
  typeText: { fontSize: 20, fontWeight: "500", color: "#777076", textAlign: "center" },
  selectedTypeText: { color: "#E5E5E5" },
  addButton: { backgroundColor: "#252933", opacity: 0.8, paddingVertical: 16, borderRadius: 18, alignItems: "center", marginTop: 40 },
  addButtonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
});
