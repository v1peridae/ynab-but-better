import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, StatusBar } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePreferences } from "@/context/PreferencesContext";
import { Picker } from "@react-native-picker/picker";

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

export default function SettingsScreen() {
  const { preferences, updatePreference, loading } = usePreferences();

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const SettingsRow = ({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) => (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowLeft}>
        <Ionicons name={icon as any} size={24} color="#E5E5E5" />
        <View style={styles.settingsRowText}>
          <ThemedText style={styles.settingsRowTitle}>{title}</ThemedText>
        </View>
      </View>
      {children}
    </View>
  );

  const PickerRow = ({
    icon,
    title,
    selectedValue,
    onValueChange,
    options,
  }: {
    icon: string;
    title: string;
    selectedValue: string;
    onValueChange: (value: string) => void;
    options: { id: string; name: string }[];
  }) => (
    <View style={styles.pickerRowContainer}>
      <View style={styles.pickerRowHeader}>
        <Ionicons name={icon as any} size={24} color="#E5E5E5" />
        <View style={styles.settingsRowText}>
          <ThemedText style={styles.settingsRowTitle}>{title}</ThemedText>
        </View>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          onValueChange={onValueChange}
          dropdownIconColor="#E5E5E5"
        >
          {options.map((option) => (
            <Picker.Item key={option.id} label={option.name} value={option.id} color="#E5E5E5" />
          ))}
        </Picker>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#E5E5E5" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E5E5E5" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Preferences">
          <PickerRow
            icon="card-outline"
            title="Currency"
            selectedValue={preferences.currency}
            onValueChange={(value) => updatePreference("currency", value)}
            options={CURRENCIES.map((c) => ({ id: c.code, name: c.name }))}
          />

          <PickerRow
            icon="calendar-outline"
            title="Date Format"
            selectedValue={preferences.dateFormat}
            onValueChange={(value) => updatePreference("dateFormat", value)}
            options={DATE_FORMATS}
          />

          <PickerRow
            icon="color-palette-outline"
            title="Theme"
            selectedValue={preferences.theme}
            onValueChange={(value) => updatePreference("theme", value)}
            options={THEMES}
          />

          <SettingsRow icon="notifications-outline" title="Notifications">
            <Switch
              value={preferences.notifications}
              onValueChange={(value) => updatePreference("notifications", value)}
              trackColor={{ false: "#767577", true: "#E5E5E5" }}
              thumbColor={preferences.notifications ? "#f4f3f4" : "#f4f3f4"}
            />
          </SettingsRow>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#0D0E14" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 28, fontWeight: "600", color: "#E5E5E5" },
  content: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#E5E5E5", fontSize: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#E5E5E5", marginBottom: 16 },
  sectionContent: { backgroundColor: "#252933", opacity: 0.5, borderRadius: 18, overflow: "hidden" },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingsRowText: { marginLeft: 16, flex: 1 },
  settingsRowTitle: { fontSize: 16, fontWeight: "600", color: "#E5E5E5" },
  pickerRowContainer: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#333" },
  pickerRowHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  pickerContainer: { height: 50, borderRadius: 18, overflow: "hidden" },
  picker: { height: 50, color: "#E5E5E5", backgroundColor: "transparent" },
  pickerItem: { height:
     50, fontSize: 16, color: "#E5E5E5" },
});
