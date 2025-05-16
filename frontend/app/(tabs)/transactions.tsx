import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  account?: {
    name: string;
  };
}

const getTransactions = async (token: string) => {
  try {
    const response = await fetch("http://192.168.100.3:3000/transactions", {
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
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState([]);
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const loadTransactions = async () => {
    if (token) {
      setLoading(true);
      try {
        const data = await getTransactions(token);
        setTransactions(data);
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    const fetchAccounts = async () => {
      if (token) {
        try {
          const response = await fetch("http://192.168.100.3:3000/accounts", {
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
    };

    fetchAccounts();
    loadTransactions();
  }, [token]);

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
      const response = await fetch("http://192.168.100.3:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description,
          amount: amountInCents,
          accountId: selectedAccountId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      setDescription("");
      setAmount("");
      setModalVisible(false);

      loadTransactions();
    } catch (error) {
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

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Transactions</ThemedText>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListHeaderComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No transactions yet</ThemedText>
          </View>
        }
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
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Account ID (number)"
              placeholderTextColor="#888"
              value={account}
              onChangeText={(text) => {
                setAccount(text);
                setSelectedAccountId(text ? parseInt(text, 10) : null);
              }}
              keyboardType="number-pad"
            />

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
});
