import React from "react";
import { StyleSheet, TouchableOpacity, ScrollView, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface Account {
  name: string;
  type: string;
  balance: number;
}

interface UserData {
  name?: string;
  accounts?: Account[];
}

interface OnboardingCompleteProps {
  userData: UserData;
  onComplete: () => void;
  onBack: () => void;
}

export default function OnboardingComplete({ userData, onComplete, onBack }: OnboardingCompleteProps) {
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "icon");

  const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 20 },
    subtitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
    description: { marginBottom: 25, textAlign: "center", color: textColor, fontSize: 16 },
    section: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
    sectionText: { fontSize: 16 },
    accountItem: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
    accountName: { fontSize: 16, fontWeight: "bold" },
    accountDetails: { fontSize: 14, color: "#666" },
    noAccounts: { fontSize: 16, fontStyle: "italic", color: textColor },
    buttonContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 20 },
    navButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, alignItems: "center", minWidth: 120 },
    completeButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedText style={styles.subtitle}>Review Your Setup</ThemedText>
      <ThemedText style={styles.description}>Almost there! Please review your setup before we get started.</ThemedText>

      <ThemedView style={[styles.section, { borderColor }]}>
        <ThemedText style={styles.sectionTitle}>Your Name</ThemedText>
        <ThemedText style={styles.sectionText}>{userData.name || "No name yet"}</ThemedText>
      </ThemedView>

      <ThemedView style={[styles.section, { borderColor }]}>
        <ThemedText style={styles.sectionTitle}>Accounts</ThemedText>
        {userData?.accounts && userData.accounts.length > 0 ? (
          userData.accounts.map((account, index) => (
            <ThemedView key={index} style={styles.accountItem}>
              <ThemedText style={styles.accountName}>{account.name}</ThemedText>
              <ThemedText style={styles.accountDetails}>
                Type: {account.type} - Balance: ${(account.balance / 100).toFixed(2)}
              </ThemedText>
            </ThemedView>
          ))
        ) : (
          <ThemedText style={styles.noAccounts}>No accounts found</ThemedText>
        )}
      </ThemedView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.navButton, { borderColor }]} onPress={onBack}>
          <ThemedText style={{ color: textColor }}>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: tintColor }]} onPress={onComplete}>
          <ThemedText style={styles.completeButtonText}>Complete Setup & Start!</ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
