import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AddAccountScreen() {
  const backgroundColor = useThemeColor({ light: "#f8f9fa", dark: "#1c1c1e" }, "background");
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const accountTypes = [
    { id: "checking", label: "Checking Account" },
    { id: "savings", label: "Savings Account" },
    { id: "credit", label: "Credit Card" },
    { id: "cash", label: "Cash" },
    { id: "investment", label: "Investment" },
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
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Add New Account</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Account Name</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor }]}
            placeholder="Enter account name"
            placeholderTextColor="#777"
            value={name}
            onChangeText={setName}
          />
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

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Initial Balance</ThemedText>
          <View style={[styles.balanceInput, { backgroundColor }]}>
            <ThemedText style={styles.currencySymbol}>$</ThemedText>
            <TextInput
              style={styles.balanceTextInput}
              placeholder="0.00"
              placeholderTextColor="#777"
              value={balance}
              onChangeText={setBalance}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount} disabled={loading}>
          <ThemedText style={styles.addButtonText}>{loading ? "Adding..." : "Add Account"}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingTop: 20 },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  form: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  input: { borderRadius: 8, padding: 12, fontSize: 16, color: "#fff" },
  typeOptions: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  typeOption: { borderWidth: 1, borderColor: "#555", borderRadius: 6, padding: 8, margin: 4 },
  selectedTypeOption: { backgroundColor: "#000000", borderColor: "#000000" },
  typeText: { fontSize: 14 },
  selectedTypeText: { color: "#fff" },
  balanceInput: { flexDirection: "row", alignItems: "center", borderRadius: 8, padding: 12 },
  currencySymbol: { fontSize: 16, marginRight: 4 },
  balanceTextInput: { flex: 1, fontSize: 16, color: "#fff", padding: 0 },
  addButton: { backgroundColor: "#000000", borderRadius: 8, padding: 16, alignItems: "center", marginTop: 20 },
  addButtonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
});
