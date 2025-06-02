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
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.mainText}>Sense</Text>
          <Text style={styles.subtitle}>have control</Text>
        </View>
        <View style={styles.progressContainer}>
          <ProgressDots totalSteps={totalSteps} currentStep={currentStep} onStepPress={onStepPress} />
          <Text style={styles.stepText}>{`Step ${currentStep} of ${totalSteps}`}</Text>
        </View>
        <ScrollView style={{ width: "100%" }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.question}>You&apos;re All Set!</Text>
            <Text style={styles.description}>Welcome to Sense, {userData.name}! Your budgeting journey begins now.</Text>
            {userData.accounts && userData.accounts.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Your Accounts</Text>
                {userData.accounts.map((account, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <Text style={styles.summaryItemName}>{account.name}</Text>
                    <Text style={styles.summaryItemBalance}>${(account.balance / 100).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}
            {userData.categories && userData.categories.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Your Categories</Text>
                <Text style={styles.categoryCount}>{userData.categories.length} categories configured</Text>
              </View>
            )}
            <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", alignItems: "center", justifyContent: "center" },
  innerContainer: { width: "100%", maxWidth: 320, alignItems: "center", justifyContent: "center", flex: 1 },
  header: { alignItems: "center", marginBottom: 40 },
  mainText: { fontSize: 72, fontWeight: "500", color: "#575F72", letterSpacing: -2, marginBottom: 8 },
  subtitle: { fontSize: 20, color: "#666", fontWeight: "400", letterSpacing: 1, marginTop: -30 },
  progressContainer: { alignItems: "center", marginBottom: 40 },
  stepText: { color: "#666", fontSize: 14 },
  scrollContent: { alignItems: "center", paddingBottom: 40 },
  content: { width: "100%", maxWidth: 320, alignItems: "center" },
  question: { color: "#666", fontSize: 24, fontWeight: "400", textAlign: "center", marginBottom: 10 },
  description: { color: "#666", fontSize: 16, textAlign: "center", marginBottom: 40, opacity: 0.8 },
  summarySection: { width: "100%", marginBottom: 30 },
  summaryTitle: { color: "#E5E5E5", fontSize: 18, fontWeight: "600", marginBottom: 15, textAlign: "center" },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#252933",
    opacity: 0.5,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: "100%",
  },
  summaryItemName: { color: "#E5E5E5", fontSize: 16, flex: 1 },
  summaryItemBalance: { color: "#E5E5E5", fontSize: 16, fontWeight: "600" },
  categoryCount: { color: "#E5E5E5", fontSize: 16, textAlign: "center", opacity: 0.8 },
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
