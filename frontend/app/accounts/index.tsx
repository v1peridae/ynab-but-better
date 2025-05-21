import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

export default function AccountsScreen() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Alert.alert("Error", "Failed to fetch accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "checking":
        return "wallet-outline";
      case "savings":
        return "save-outline";
      case "credit":
        return "card-outline";
      case "cash":
        return "cash-outline";
      case "investment":
        return "trending-up-outline";
      default:
        return "wallet-outline";
    }
  };

  const renderAccountItem = ({ item }: { item: Account }) => (
    <View style={styles.accountItem}>
      <View style={styles.accountInfo}>
        <ThemedText style={styles.accountName}>{item.name}</ThemedText>
        <ThemedText style={styles.accountType}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Unknown"}</ThemedText>
      </View>
      <ThemedText style={styles.accountBalance}>${(item.balance / 100).toFixed(2)}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Your Accounts</ThemedText>
        <TouchableOpacity onPress={() => router.push("/accounts/add")} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#666" />
              <ThemedText style={styles.emptyText}>No accounts found</ThemedText>
              <ThemedText style={styles.emptySubtext}>Add an account to get started</ThemedText>
              <TouchableOpacity style={styles.emptyAddButton} onPress={() => router.push("/accounts/add")}>
                <ThemedText style={styles.emptyAddButtonText}>Add Account</ThemedText>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingTop: 20 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  addButton: { padding: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { flexGrow: 1 },
  accountItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 10, backgroundColor: "#000", marginBottom: 12 },
  accountInfo: { flex: 1, marginHorizontal: 12 },
  accountName: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  accountType: { fontSize: 14, opacity: 0.7, color: "#ccc" },
  accountBalance: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  emptySubtext: { fontSize: 14, textAlign: "center", opacity: 0.7, marginTop: 8, marginHorizontal: 32 },
  emptyAddButton: { backgroundColor: "#0a7ea4", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 24 },
  emptyAddButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
