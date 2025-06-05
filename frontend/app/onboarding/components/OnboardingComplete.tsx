import React from "react";
import { StyleSheet, TouchableOpacity, View, Text, StatusBar, ScrollView } from "react-native";
import ProgressDots from "./ProgressDots";

interface Account {
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  group: string;
}

interface UserData {
  name?: string;
  accounts?: Account[];
  categories?: Category[];
  currency?: string;
  notifications?: boolean;
}

interface OnboardingCompleteProps {
  userData: UserData;
  onComplete: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  onStepPress: (step: number) => void;
}

export default function OnboardingComplete({
  userData,
  onComplete,
  onBack,
  currentStep,
  totalSteps,
  onStepPress,
}: OnboardingCompleteProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.mainText}>Sense</Text>
            <Text style={styles.subtitle}>have control</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.question}>You&apos;re All Set!</Text>
            <Text style={styles.description}>Welcome to Sense, {userData.name}! Your budgeting journey begins now.</Text>
            {userData.accounts && userData.accounts.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Your Accounts</Text>
                {userData.accounts.map((account, index) => (
                  <View key={index} style={styles.accountCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountType}>{account.type}</Text>
                    </View>
                    <Text style={styles.accountBalance}>
                      {userData.currency || "$"}
                      {(account.balance / 100).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {userData.categories && userData.categories.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Your Categories</Text>
                <View style={styles.categoriesContainer}>
                  {userData.categories.map((category) => (
                    <View key={category.id} style={styles.categoryButton}>
                      <Text style={styles.categoryText}>{category.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Your Preferences</Text>
              {userData.currency && (
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceText}>Currency: {userData.currency}</Text>
                </View>
              )}
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceText}>
                  {userData.notifications !== false ? "Notifications are now on" : "Notifications are off"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", alignItems: "center", justifyContent: "center" },
  innerContainer: { width: "100%", maxWidth: 340, alignItems: "center", justifyContent: "center", flex: 1 },
  header: { alignItems: "center", marginBottom: 40 },
  mainText: { fontSize: 72, fontWeight: "500", color: "#575F72", letterSpacing: -2, marginBottom: 8, marginTop: 60 },
  subtitle: { fontSize: 20, color: "#666", fontWeight: "400", letterSpacing: 1, marginTop: -30 },
  progressContainer: { alignItems: "center", marginBottom: 40 },
  stepText: { color: "#666", fontSize: 14 },
  scrollContainer: { alignItems: "center", paddingBottom: 40 },
  content: { width: "100%", maxWidth: 340, alignItems: "center" },
  question: { color: "#575F72", fontSize: 26, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  description: { color: "#666", fontSize: 16, textAlign: "center", marginBottom: 40, opacity: 0.9 },
  summarySection: { width: "100%", marginBottom: 30, alignItems: "center" },
  summaryTitle: { color: "#E5E5E5", fontSize: 20, fontWeight: "600", marginBottom: 15, textAlign: "center" },
  accountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#252933",
    opacity: 0.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: 280,
    alignSelf: "center",
  },
  accountName: { color: "#E5E5E5", fontSize: 16, fontWeight: "600" },
  accountType: { color: "#666", fontSize: 13, fontWeight: "400" },
  accountBalance: { color: "#575F72", fontSize: 16, fontWeight: "600" },
  categoriesContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", width: "100%", gap: 8 },
  categoryButton: {
    backgroundColor: "#575F72",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 13,
    alignItems: "center",
    marginBottom: 8,
  },
  categoryText: { fontSize: 14, fontWeight: "500", color: "#E5E5E5", textAlign: "center" },
  preferenceItem: {
    backgroundColor: "#252933",
    opacity: 0.7,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    width: 260,
    alignItems: "center",
    alignSelf: "center",
  },
  preferenceText: { color: "#E5E5E5", fontSize: 15, fontWeight: "500", textAlign: "center" },
  continueButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    width: 240,
    alignSelf: "center",
    marginTop: 20,
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
});
