import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FormattedCurrency } from "@/components/FormattedCurrency";

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

  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

  const renderAccountItem = ({ item }: { item: Account }) => (
    <View style={styles.accountCard}>
      <View style={styles.accountInfo}>
        <ThemedText style={styles.accountName}>{item.name}</ThemedText>
        <ThemedText style={styles.accountType}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Unknown"}</ThemedText>
      </View>
      <FormattedCurrency
        amount={item.balance}
        style={styles.accountBalance}
        showSign={false}
        splitFormat={true}
        dollarsStyle={styles.balanceDollars}
        centsStyle={styles.balanceCents}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
        <ActivityIndicator size="large" color="#E5E5E5" />
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
        <TouchableOpacity onPress={() => router.push("/accounts/add")} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalSection}>
        <ThemedText style={styles.totalLabel}>Accounts Total</ThemedText>
        <FormattedCurrency
          amount={totalBalance}
          style={styles.totalAmount}
          showSign={false}
          splitFormat={true}
          dollarsStyle={styles.totalDollars}
          centsStyle={styles.totalCents}
        />
      </View>

      <FlatList
        data={accounts}
        renderItem={renderAccountItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", paddingHorizontal: 20, paddingTop: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, paddingTop: 20 },
  backButton: { padding: 8 },
  addButton: { padding: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0E14" },
  totalSection: { alignItems: "center", marginBottom: 30 },
  totalLabel: { fontSize: 16, color: "#666", fontWeight: "600", marginBottom: 8 },
  totalAmount: { fontSize: 40, fontWeight: "bold", color: "#E5E5E5", paddingTop: 30 },
  totalDollars: { fontSize: 40, fontWeight: "bold", color: "#E5E5E5" },
  totalCents: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5", paddingTop: 30 },
  listContent: { flexGrow: 1, paddingBottom: 100 },
  accountCard: {
    backgroundColor: "#252933",
    opacity: 0.5,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5", marginBottom: 4 },
  accountType: { fontSize: 14, color: "#666", fontWeight: "600" },
  accountBalance: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5" },
  balanceDollars: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5" },
  balanceCents: { fontSize: 14, fontWeight: "bold", color: "#E5E5E5" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5", marginBottom: 16 },
  emptySubtext: { fontSize: 14, textAlign: "center", color: "#666", marginTop: 8, marginHorizontal: 32 },
  emptyAddButton: { backgroundColor: "#252933", opacity: 0.5, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 18, marginTop: 24 },
  emptyAddButtonText: { color: "#E5E5E5", fontSize: 16, fontWeight: "bold" },
});
