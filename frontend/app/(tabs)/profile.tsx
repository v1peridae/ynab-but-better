import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const navigateToAccounts = () => {
    router.push("/accounts");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Profile</ThemedText>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={navigateToAccounts}>
          <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
          <ThemedText style={styles.menuText}>Manage Accounts</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          <ThemedText style={styles.menuText}>Settings</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <ThemedText style={[styles.menuText, { color: "#ff0000" }]}>Log Out</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  menu: { marginTop: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 10, backgroundColor: "#000000", marginBottom: 12 },
  menuText: { fontSize: 16, marginLeft: 12, flex: 1 },
});
