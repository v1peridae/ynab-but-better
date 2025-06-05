import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, View, Text, StatusBar } from "react-native";
import { Picker } from "@react-native-picker/picker";
import ProgressDots from "./ProgressDots";

const ACCOUNT_TYPES = [
  { id: "checking", name: "Checking Account" },
  { id: "savings", name: "Savings Account" },
  { id: "creditCard", name: "Credit Card" },
  { id: "investment", name: "Investment Account" },
  { id: "other", name: "Other" },
];

interface Account {
  type: string;
  name: string;
  balance: string;
}

interface AccountForNext extends Omit<Account, "balance"> {
  balance: number;
}

interface OnboardingAccountsProps {
  onNext: (data: { accounts: AccountForNext[] }) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  onStepPress: (step: number) => void;
}

export default function OnboardingAccounts({ onNext, onBack, currentStep, totalSteps, onStepPress }: OnboardingAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([{ type: "checking", name: "", balance: "" }]);

  const addAccount = () => {
    setAccounts([...accounts, { type: "other", name: "", balance: "" }]);
  };

  const updateAccount = (index: number, field: keyof Account, value: string) => {
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.mainText}>Sense</Text>
          <Text style={styles.subtitle}>have control</Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressDots totalSteps={totalSteps} currentStep={currentStep} onStepPress={onStepPress} />
          <Text style={styles.stepText}>{`Step ${currentStep} of ${totalSteps}`}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.question}>Add Your Accounts</Text>
          <Text style={styles.description}>Add the accounts you&apos;d like to track on Sense</Text>

          {accounts.map((account, index) => (
            <View key={index} style={styles.accountForm}>
              <TextInput
                style={styles.input}
                placeholder="Account Name"
                placeholderTextColor="#666"
                value={account.name}
                onChangeText={(value) => updateAccount(index, "name", value)}
              />

              <TextInput
                style={styles.input}
                placeholder="Account Balance"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                value={account.balance}
                onChangeText={(value) => updateAccount(index, "balance", value)}
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                importantForAutofill="no"
                selectTextOnFocus={false}
                clearTextOnFocus={false}
                secureTextEntry={false}
              />

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={account.type}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(value) => updateAccount(index, "type", value)}
                  dropdownIconColor="#E5E5E5"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <Picker.Item key={type.id} label={type.name} value={type.id} color="#E5E5E5" />
                  ))}
                </Picker>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addAccount}>
            <Text style={styles.addButtonText}>+ Add Another Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14" },
  scrollView: { flex: 1 },
  scrollContent: { alignItems: "center", paddingBottom: 40 },
  header: { alignItems: "center", marginTop: 80, marginBottom: 40 },
  mainText: { fontSize: 72, fontWeight: "500", color: "#575F72", letterSpacing: -2, marginBottom: 8, marginTop: 60 },
  subtitle: { fontSize: 20, color: "#666", fontWeight: "400", letterSpacing: 1, marginTop: -30 },
  progressContainer: { alignItems: "center", marginBottom: 40 },
  stepText: { color: "#666", fontSize: 14 },
  content: { width: "100%", alignItems: "center", paddingHorizontal: 24 },
  question: { color: "#666", fontSize: 24, fontWeight: "400", textAlign: "center", marginBottom: 10 },
  description: { color: "#666", fontSize: 16, textAlign: "center", marginBottom: 40, opacity: 0.8 },
  accountForm: { width: "100%", maxWidth: 320, marginBottom: 30 },
  input: {
    backgroundColor: "#252933",
    opacity: 0.5,
    height: 50,
    borderRadius: 18,
    paddingHorizontal: 16,
    color: "#E5E5E5",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  pickerContainer: { borderRadius: 18, marginBottom: 15, height: 50, overflow: "hidden" },
  picker: { height: 50, color: "#E5E5E5", borderRadius: 18, backgroundColor: "transparent" },
  pickerItem: { height: 50, fontSize: 16, color: "#E5E5E5" },
  addButton: { marginBottom: 40 },
  addButtonText: { color: "#E5E5E5", opacity: 0.5, fontSize: 16, fontWeight: "600", textAlign: "center" },
  continueButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    width: 280,
    alignSelf: "center",
    marginBottom: 40,
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
});
