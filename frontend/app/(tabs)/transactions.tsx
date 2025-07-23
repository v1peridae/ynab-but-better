import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, StatusBar } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { SwipeableTransaction } from "@/components/SwipeableTransaction";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { FormattedCurrency } from "@/components/FormattedCurrency";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: {
    name: string;
  };
  account?: {
    name: string;
  };
}

const getTransactions = async (token: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export default function TransactionsScreen() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (token) {
      setLoading(true);
      try {
        const data = await getTransactions(token);
        const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sortedData);
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [token]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isPositive = item.amount > 0;
    return (
      <SwipeableTransaction transactionId={item.id} description={item.description} onDelete={() => handleDeleteTransaction(item.id)}>
        <View style={styles.transactionItem}>
          <View style={styles.transactionContent}>
            <ThemedText style={styles.transactionDescription}>{item.description}</ThemedText>
            {item.category && <ThemedText style={styles.categoryName}>{item.category.name}</ThemedText>}
            <ThemedText style={styles.accountName}>{item.account?.name}</ThemedText>
          </View>
          <FormattedCurrency amount={item.amount} style={[styles.amount, { color: isPositive ? "#4CAF50" : "#F44336" }]} showSign={true} />
        </View>
      </SwipeableTransaction>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <View style={styles.header}>
        <ThemedText style={styles.title}>Transactions</ThemedText>
      </View>
      <View style={styles.transactionsCard}>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E5E5E5" colors={["#E5E5E5"]} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
            </View>
          )}
          ListFooterComponent={loading ? <ActivityIndicator style={styles.loader} color="#E5E5E5" /> : null}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#0D0E14" },
  header: { paddingHorizontal: 20, marginBottom: 20, marginTop: 20 },
  title: { fontSize: 28, fontWeight: "600", color: "#E5E5E5", paddingTop: 20 },
  transactionsCard: {
    flex: 1,
    backgroundColor: "#252933",
    opacity: 0.5,
    borderRadius: 18,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
  },
  list: { flex: 1 },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#252933",
  },
  transactionContent: { flex: 1 },
  transactionDescription: { fontSize: 20, color: "#E5E5E5", fontWeight: "500" },
  categoryName: { fontSize: 14, color: "#FFF", marginTop: 2, fontStyle: "italic" },
  accountName: { fontSize: 14, color: "#FFF", marginTop: 4 },
  amount: { fontSize: 20, fontWeight: "bold" },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#666", fontSize: 16 },
  loader: { marginTop: 20 },
});
