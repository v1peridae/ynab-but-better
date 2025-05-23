import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
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
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

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

  const fetchAccounts = useCallback(async () => {
    if (token) {
      try {
        const response = await fetch(`${API_URL}/accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchAccounts();
    loadTransactions();
  }, [fetchAccounts, loadTransactions]);

  const handleAddTransaction = async () => {
    if (!description || !amount) {
      Alert.alert("Error", "Fill in all fields");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents)) {
      Alert.alert("Error", "Invalid amount");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description,
          amount: amountInCents,
          accountId: selectedAccountId,
          date: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      setDescription("");
      setAmount("");
      setModalVisible(false);

      loadTransactions();
    } catch {
      Alert.alert("Error", "Failed to add transaction");
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isPositive = item.amount > 0;
    const formattedAmount = `${isPositive ? "+" : "-"}$${Math.abs(item.amount / 100).toFixed(2)}`;

    return (
      <View style={styles.transactionItem}>
        <View>
          <ThemedText>{item.description}</ThemedText>
          <ThemedText style={styles.accountName}>{item.account?.name}</ThemedText>
        </View>
        <ThemedText style={[styles.amount, { color: isPositive ? "#4CAF50" : "#F44336" }]}>{formattedAmount}</ThemedText>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Transactions</ThemedText>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tintColor]} tintColor={tintColor} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
          </View>
        )}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : null}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <ThemedText style={styles.addButtonText}>Add Transaction</ThemedText>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Add Transaction</ThemedText>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Description"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Amount (+$10.00 or -$10.00)"
              placeholderTextColor="#888"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Picker
              selectedValue={selectedAccountId}
              onValueChange={(itemValue) => setSelectedAccountId(itemValue)}
              style={[styles.input, { color: textColor, borderColor: textColor }]}
            >
              <Picker.Item label="Select Account" value={null} />
              {accounts.map((acc: any) => (
                <Picker.Item key={acc.id} label={acc.name} value={acc.id} />
              ))}
            </Picker>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleAddTransaction}>
                <ThemedText style={styles.buttonText}>Add</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  list: { flex: 1 },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  accountName: { fontSize: 14, color: "#666666", marginTop: 4 },
  amount: { fontSize: 16, fontWeight: "bold" },
  addButton: { backgroundColor: "#000000", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 20 },
  addButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 8, width: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { height: 40, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginBottom: 15 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 5 },
  cancelButton: { backgroundColor: "#666666" },
  submitButton: { backgroundColor: "#000000" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  emptyContainer: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#666666" },
  date: { fontSize: 12, color: "#888888" },
  descriptionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
