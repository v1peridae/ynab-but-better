import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { router } from "expo-router";

interface CategoryResponse {
  id: number;
  name: string;
  group: string;
}

interface DashboardResponse {
  unassigned: number;
}

interface BudgetItemResponse {
  categoryId: number;
  amount: number;
  spent: number;
  available: number;
}

interface Category {
  id: number;
  name: string;
  group: string;
}

interface BudgetItem {
  amount: number;
  spent: number;
  available: number;
}

interface Account {
  id: number;
  name: string;
  balance: number;
}

export default function AssignScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetItems, setBudgetItems] = useState<Record<number, BudgetItem>>({});
  const [unassignedAmount, setUnassignedAmount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    setCurrentMonth(month);

    if (token) {
      fetchData(month);
      fetchAccounts();
    }
  }, [token]);

  useEffect(() => {
    if (accounts.length > 0 || Object.keys(budgetItems).length > 0) {
      const totalAccountBalances = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      const totalBudgeted = Object.values(budgetItems).reduce((sum, item) => sum + (item.amount || 0), 0);
      setUnassignedAmount(totalAccountBalances - totalBudgeted);
    } else {
      const totalAccountBalances = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      setUnassignedAmount(totalAccountBalances);
    }
  }, [accounts, budgetItems]);

  const fetchAccounts = async () => {
    try {
      const accountsRes = await fetch(`${API_URL}/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const accountsData = await accountsRes.json();
      setAccounts(accountsData);

      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0]);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchData = async (month: string) => {
    setLoading(true);
    try {
      const [categoriesRes, dashboardRes] = await Promise.all([
        fetch(`${API_URL}/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/user/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const categoriesData = (await categoriesRes.json()) as CategoryResponse[];
      const dashboardData = (await dashboardRes.json()) as DashboardResponse;

      setCategories(categoriesData);

      try {
        console.log(`Fetching budget data for month: ${month}`);

        const budgetRes = await fetch(`${API_URL}/budget/${month}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!budgetRes.ok) {
          console.log(`Budget fetch returned status: ${budgetRes.status}`);
          setBudgetItems({});
        } else {
          const budgetData = (await budgetRes.json()) as BudgetItemResponse[];
          console.log("Budget data response:", budgetData);

          const budgetMap: Record<number, BudgetItem> = {};
          if (Array.isArray(budgetData)) {
            budgetData.forEach((item) => {
              budgetMap[item.categoryId] = {
                amount: item.amount / 100,
                spent: item.spent / 100,
                available: item.available / 100,
              };
            });
          }
          setBudgetItems(budgetMap);
        }
      } catch (error) {
        console.error("Error fetching budget data:", error);
        setBudgetItems({});
      }
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBudgetItem = async (categoryId: number, amount: string) => {
    const numAmount = parseFloat(amount) || 0;

    const newBudgetItems = {
      ...budgetItems,
      [categoryId]: {
        ...(budgetItems[categoryId] || { spent: 0, available: 0 }),
        amount: numAmount,
        available: numAmount - (budgetItems[categoryId]?.spent || 0),
      },
    };
    const newTotalBudgeted = Object.values(newBudgetItems).reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalAccountBalances = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

    if (newTotalBudgeted > totalAccountBalances) {
      alert(`Total budgeted amount cannot exceed total available funds in accounts ($${totalAccountBalances.toFixed(2)}).`);
      return;
    }

    setBudgetItems((prev) => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || { spent: 0, available: 0 }),
        amount: numAmount,
        available: numAmount - (prev[categoryId]?.spent || 0),
      },
    }));
  };

  const saveBudgetItem = async (categoryId: number, amount: number) => {
    try {
      const amountInCents = Math.round(amount * 100);
      await fetch(`${API_URL}/budget/${currentMonth}/categories/${categoryId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: amountInCents }),
      });
      fetchData(currentMonth);
      fetchAccounts();
    } catch (error) {
      console.error("Error saving budget item:", error);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const budgetItem = budgetItems[item.id] || { amount: 0, spent: 0, available: 0 };
    return (
      <View style={styles.categoryItem}>
        <View style={styles.categoryInfo}>
          <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
          <ThemedText style={styles.groupName}>{item.group}</ThemedText>
        </View>
        <View style={styles.budgetInfo}>
          <View style={styles.amountContainer}>
            <ThemedText style={styles.amountLabel}>Budgeted</ThemedText>
            <TextInput
              style={styles.amountInput}
              value={budgetItem.amount.toString()}
              onChangeText={(text) => updateBudgetItem(item.id, text)}
              keyboardType="numeric"
              onBlur={() => saveBudgetItem(item.id, budgetItem.amount)}
            />
          </View>
          <View style={styles.amountContainer}>
            <ThemedText style={styles.amountLabel}>Available</ThemedText>
            <ThemedText style={styles.amountValue}>${budgetItem.available.toFixed(2)}</ThemedText>
          </View>
        </View>
      </View>
    );
  };
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.backButton}>Back</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.headerText}>Assign Budget</ThemedText>
      </View>

      <View style={styles.accountSelector}>
        <ThemedText style={styles.accountLabel}>Assign from account:</ThemedText>
        <View style={styles.accountDropdown}>
          {accounts.length > 0 ? (
            <FlatList
              horizontal
              data={accounts}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.accountItem, selectedAccount?.id === item.id && styles.selectedAccountItem]}
                  onPress={() => setSelectedAccount(item)}
                >
                  <ThemedText style={styles.accountName}>{item.name}</ThemedText>
                  <ThemedText style={styles.accountBalance}>${item.balance.toFixed(2)}</ThemedText>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <ThemedText style={styles.noAccountsText}>No accounts found</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.unassignedContainer}>
        <ThemedText style={styles.unassignedLabel}>Unassigned</ThemedText>
        <ThemedText style={styles.unassignedAmount}>${unassignedAmount.toFixed(2)}</ThemedText>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListFooterComponent={<ThemedText style={styles.emptyText}>No categories found. Create some categories first.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { fontSize: 16, fontWeight: "bold", marginRight: 10 },
  title: { fontSize: 24, fontWeight: "bold" },
  unassignedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#000000",
    borderRadius: 8,
  },
  unassignedLabel: { fontSize: 16 },
  unassignedAmount: { fontSize: 18, fontWeight: "bold" },
  list: { paddingBottom: 20 },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: "bold" },
  groupName: { fontSize: 14, color: "#666" },
  budgetInfo: { flex: 1 },
  amountContainer: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  amountLabel: { fontSize: 14 },
  amountInput: { backgroundColor: "#222222", padding: 4, borderRadius: 4, width: 80, textAlign: "right", color: "#FFFFFF" },
  amountValue: { fontSize: 16, textAlign: "right" },
  emptyText: { fontSize: 16, textAlign: "center", color: "#666" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerText: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  accountSelector: { marginBottom: 15 },
  accountLabel: { fontSize: 16, marginBottom: 8 },
  accountDropdown: { backgroundColor: "#000000", borderRadius: 8, padding: 10 },
  accountItem: { backgroundColor: "#222222", padding: 10, borderRadius: 5, marginRight: 10, minWidth: 120 },
  selectedAccountItem: { backgroundColor: "#444444" },
  accountName: { fontWeight: "bold", marginBottom: 4 },
  accountBalance: { fontSize: 14 },
  noAccountsText: { fontStyle: "italic", color: "#666" },
});
