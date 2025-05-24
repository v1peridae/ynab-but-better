import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { API_URL } from "@/constants/apiurl";
import { usePreferences } from "@/context/PreferencesContext";

interface UserPreferences {
  currency: string;
  dateFormat: string;
  theme: string;
  notifications: boolean;
}

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
  const { token } = useAuth();
  const { preferences, updatePreference, loading } = usePreferences();
  const backgroundColor = useThemeColor({ light: "#f8f9fa", dark: "#1c1c1e" }, "background");
  const tintColor = useThemeColor({}, "tint");

  // Modal states
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDateFormatPicker, setShowDateFormatPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={[styles.sectionContent, { backgroundColor }]}>{children}</View>
    </View>
  );

  const SettingsRow = ({
    icon,
    title,
    subtitle,
    children,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingsRowLeft}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
        <View style={styles.settingsRowText}>
          <ThemedText style={styles.settingsRowTitle}>{title}</ThemedText>
          {subtitle && <ThemedText style={styles.settingsRowSubtitle}>{subtitle}</ThemedText>}
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );

  const getSelectedOptionName = (value: string, options: { id: string; name: string }[]) => {
    const option = options.find((opt) => opt.id === value);
    return option ? option.name : value;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Preferences">
          <SettingsRow
            icon="card-outline"
            title="Currency"
            subtitle={getSelectedOptionName(
              preferences.currency,
              CURRENCIES.map((c) => ({ id: c.code, name: c.name }))
            )}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </SettingsRow>

          <SettingsRow
            icon="calendar-outline"
            title="Date Format"
            subtitle={getSelectedOptionName(preferences.dateFormat, DATE_FORMATS)}
            onPress={() => setShowDateFormatPicker(true)}
          >
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </SettingsRow>

          <SettingsRow
            icon="color-palette-outline"
            title="Theme"
            subtitle={getSelectedOptionName(preferences.theme, THEMES)}
            onPress={() => setShowThemePicker(true)}
          >
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </SettingsRow>

          <SettingsRow icon="notifications-outline" title="Notifications" subtitle="Enable push notifications">
            <Switch
              value={preferences.notifications}
              onValueChange={(value) => updatePreference("notifications", value)}
              trackColor={{ false: "#767577", true: tintColor }}
              thumbColor={preferences.notifications ? "#f4f3f4" : "#f4f3f4"}
            />
          </SettingsRow>
        </SettingsSection>
      </ScrollView>

      <Modal visible={showCurrencyPicker} transparent animationType="slide" onRequestClose={() => setShowCurrencyPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Select Currency</ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={styles.modalItem}
                  onPress={() => {
                    updatePreference("currency", currency.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <ThemedText style={preferences.currency === currency.code ? styles.selectedItemText : undefined}>
                    {currency.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCurrencyPicker(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDateFormatPicker} transparent animationType="slide" onRequestClose={() => setShowDateFormatPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Select Date Format</ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {DATE_FORMATS.map((format) => (
                <TouchableOpacity
                  key={format.id}
                  style={styles.modalItem}
                  onPress={() => {
                    updatePreference("dateFormat", format.id);
                    setShowDateFormatPicker(false);
                  }}
                >
                  <ThemedText style={preferences.dateFormat === format.id ? styles.selectedItemText : undefined}>{format.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDateFormatPicker(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showThemePicker} transparent animationType="slide" onRequestClose={() => setShowThemePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Select Theme</ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {THEMES.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={styles.modalItem}
                  onPress={() => {
                    updatePreference("theme", theme.id);
                    setShowThemePicker(false);
                  }}
                >
                  <ThemedText style={preferences.theme === theme.id ? styles.selectedItemText : undefined}>{theme.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowThemePicker(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  content: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionContent: { borderRadius: 12, overflow: "hidden" },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingsRowText: { marginLeft: 12, flex: 1 },
  settingsRowTitle: { fontSize: 16, fontWeight: "600" },
  settingsRowSubtitle: { fontSize: 14, opacity: 0.7, margin: 2 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: {
    width: "80%",
    maxHeight: "60%",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalScrollView: { maxHeight: 300 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#333" },
  selectedItemText: { fontWeight: "bold", color: "#FFFFFF" },
  modalCloseButton: { marginTop: 15, padding: 10, backgroundColor: "#000000", borderRadius: 5, alignItems: "center" },
  modalCloseText: { color: "#FFFFFF", fontWeight: "bold" },
});
