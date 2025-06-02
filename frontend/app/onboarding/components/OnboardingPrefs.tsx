import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { Picker } from "@react-native-picker/picker";
import ProgressDots from "./ProgressDots";

const CURRENCIES = [
  { code: "USD", name: "US Dollar ($)" },
  { code: "EUR", name: "Euro (€)" },
  { code: "GBP", name: "British Pound (£)" },
  { code: "CAD", name: "Canadian Dollar (C$)" },
  { code: "AUD", name: "Australian Dollar (A$)" },
  { code: "JPY", name: "Japanese Yen (¥)" },
  { code: "INR", name: "Indian Rupee (₹)" },
];

const DATE_FORMATS = [
  { id: "MM/DD/YYYY", name: "MM/DD/YYYY (12/31/2023)" },
  { id: "DD/MM/YYYY", name: "DD/MM/YYYY (31/12/2023)" },
  { id: "YYYY-MM-DD", name: "YYYY-MM-DD (2023-12-31)" },
  { id: "DD-MM-YYYY", name: "DD-MM-YYYY (31-12-2023)" },
  { id: "MM-DD-YYYY", name: "MM-DD-YYYY (12-31-2023)" },
];

const THEMES = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "auto", name: "System" },
];

interface Preferences {
  currency: string;
  dateFormat: string;
  theme: string;
  notifications: boolean;
}

interface OnboardingPrefsProps {
  onNext: (data: { preferences: Preferences }) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  onStepPress: (step: number) => void;
}

export default function OnboardingPrefs({ onNext, onBack, currentStep, totalSteps, onStepPress }: OnboardingPrefsProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    theme: "auto",
    notifications: true,
  });

  const updatePreference = (key: keyof Preferences, value: string | boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    onNext({ preferences });
  };

  const NotificationRow = () => (
    <TouchableOpacity style={styles.preferenceRow} onPress={() => updatePreference("notifications", !preferences.notifications)}>
      <View style={styles.preferenceText}>
        <Text style={styles.preferenceTitle}>Notifications</Text>
        <Text style={styles.preferenceSubtitle}>{preferences.notifications ? "Enabled" : "Disabled"}</Text>
      </View>
      <View style={[styles.toggle, preferences.notifications && styles.toggleActive]}>
        <View style={[styles.toggleThumb, preferences.notifications && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <ScrollView style={{ width: "100%" }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.mainText}>Sense</Text>
            <Text style={styles.subtitle}>have control</Text>
          </View>
          <View style={styles.progressContainer}>
            <ProgressDots totalSteps={totalSteps} currentStep={currentStep} onStepPress={onStepPress} />
            <Text style={styles.stepText}>{`Step ${currentStep} of ${totalSteps}`}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.question}>Set Your Preferences</Text>
            <Text style={styles.description}>Customise your experience</Text>
            <View style={styles.preferencesContainer}>
              <View style={styles.preferenceSection}>
                <Text style={styles.sectionLabel}>Currency</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={preferences.currency}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    onValueChange={(value) => updatePreference("currency", value)}
                    dropdownIconColor="#E5E5E5"
                  >
                    {CURRENCIES.map((currency) => (
                      <Picker.Item key={currency.code} label={currency.name} value={currency.code} color="#E5E5E5" />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.preferenceSection}>
                <Text style={styles.sectionLabel}>Date Format</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={preferences.dateFormat}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    onValueChange={(value) => updatePreference("dateFormat", value)}
                    dropdownIconColor="#E5E5E5"
                  >
                    {DATE_FORMATS.map((format) => (
                      <Picker.Item key={format.id} label={format.name} value={format.id} color="#E5E5E5" />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.preferenceSection}>
                <Text style={styles.sectionLabel}>Theme</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={preferences.theme}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                    onValueChange={(value) => updatePreference("theme", value)}
                    dropdownIconColor="#E5E5E5"
                  >
                    {THEMES.map((theme) => (
                      <Picker.Item key={theme.id} label={theme.name} value={theme.id} color="#E5E5E5" />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.preferenceSection}>
                <Text style={styles.sectionLabel}>Notifications</Text>
                <NotificationRow />
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  preferencesContainer: { width: "100%", marginBottom: 40 },
  preferenceSection: { marginBottom: 25 },
  sectionLabel: { color: "#666", fontSize: 16, fontWeight: "500", marginBottom: 8, textAlign: "center" },
  pickerContainer: { borderRadius: 12, marginBottom: 16 },
  picker: { height: 50, color: "#E5E5E5", borderRadius: 18, width: "100%" },
  pickerItem: { height: 50, color: "#E5E5E5", fontSize: 16 },
  preferenceRow: {
    backgroundColor: "#252933",
    opacity: 0.5,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  preferenceText: { flex: 1 },
  preferenceTitle: { color: "#E5E5E5", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  preferenceSubtitle: { color: "#E5E5E5", fontSize: 14, opacity: 0.7 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: "#333", padding: 2, justifyContent: "center" },
  toggleActive: { backgroundColor: "#666" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#E5E5E5", transform: [{ translateX: 0 }] },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
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
