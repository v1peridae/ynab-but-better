import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

const ACCOUNT_TYPES = [
  { id: "checking", name: "Checking Account" },
  { id: "savings", name: "Savings Account" },
  { id: "creditCard", name: "Credit Card" },
  { id: "investment", name: "Investment Account" },
  { id: "other", name: "Other" },
];

export default function OnboardingAccounts({ onNext, onBack }) {
  const [accounts, setAccounts] = useState([{ type: "checking", name: "Checking", balance: "" }]);

  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  const addAccount = () => {
    setAccounts([...accounts, { type: "other", name: "", balance: "" }]);
  };

  const updateAccount = (index, field, value) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setAccounts(updatedAccounts);
  };

  const handleNext = () => {
    for (const account of accounts) {
      if (!account.name.trim() || !account.balance.trim()) {
        Alert.alert("Missing Information", "Please fill in all account details");
        return;
      }
    }
    const formattedAccounts = accounts.map((account) => ({
      ...account,
      balance: parseFloat(account.balance) * 100,
    }));
    onNext({ accounts: formattedAccounts });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.subtitle}>Add your accounts</ThemedText>
      <ThemedText style={styles.description}>Add the accounts you want to track in this app</ThemedText>
      <FlatList
        data={accounts}
        keyExtractor={(_, index) => `account-${index}`}
        renderItem={({ item, index }) => (
          <ThemedView style={styles.accountItem}>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Account Name"
              value={item.name}
              onChangeText={(value) => updateAccount(index, "name", value)}
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Current Balance"
              keyboardType="numeric"
              value={item.balance}
              onChangeText={(value) => updateAccount(index, "balance", value)}
            />
            <ThemedText style={styles.selectLabel}>Account Type</ThemedText>
            <FlatList
              data={ACCOUNT_TYPES}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: type }) => (
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: type.id === accounts[index].type ? tintColor : "transparent" }]}
                  onPress={() => updateAccount(index, "type", type.id)}
                >
                  <ThemedText style={type.id === accounts[index].type ? styles.selectedTypeText : {}}>{type.name}</ThemedText>
                </TouchableOpacity>
              )}
              keyExtractor={(type) => type.id}
            />
          </ThemedView>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={addAccount}>
        <ThemedText style={{ color: tintColor }}>+ Add Another Account</ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.nextButton, { backgroundColor: tintColor }]} onPress={handleNext}>
          <ThemedText style={styles.nextButtonText}>Next</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subtitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  description: { marginBottom: 20 },
  accountItem: { marginBottom: 20, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: "#ddd" },
  input: { height: 40, borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, borderRadius: 5 },
  selectLabel: { marginBottom: 5 },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedTypeText: { color: "#fff", fontWeight: "bold" },
  addButton: { alignItems: "center", marginVertical: 15 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: "auto" },
  backButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  nextButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  nextButtonText: { color: "#fff", fontWeight: "bold" },
});
