import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, TextInput, ActivityIndicator, Keyboard, StatusBar, ScrollView } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { router } from "expo-router";
import { FormattedCurrency } from "@/components/FormattedCurrency";
import { Ionicons } from "@expo/vector-icons";

interface CategoryResponse {
  id: number;
  name: string;
  group: string;
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
  const [unspentAmount, setUnspentAmount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if (translationX > 100 && velocityX > 500) {
        router.push("/");
      }
    }
  };

  const fetchAccounts = useCallback(async () => {
    try {
      const accountsRes = await fetch(`${API_URL}/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const accountsData = await accountsRes.json();
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }, [token]);

  const fetchData = useCallback(
    async (month: string) => {
      setLoading(true);
      try {
        const [categoriesRes] = await Promise.all([
          fetch(`${API_URL}/categories`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const categoriesData = (await categoriesRes.json()) as CategoryResponse[];
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
    },
    [token]
  );

  useEffect(() => {
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    setCurrentMonth(month);

    if (token) {
      fetchData(month);
      fetchAccounts();
    }
  }, [token, fetchData, fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0 || Object.keys(budgetItems).length > 0) {
      const totalAccountBalances = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      const totalSpent = Object.values(budgetItems).reduce((sum, item) => sum + (item.spent || 0), 0);
      setUnspentAmount(totalAccountBalances - totalSpent);
    } else {
      const totalAccountBalances = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      setUnspentAmount(totalAccountBalances);
    }
  }, [accounts, budgetItems]);

  const updateBudgetItem = async (categoryId: number, amount: string) => {
    const numAmount = parseFloat(amount) || 0;

    const currentGoals = Object.entries(budgetItems)
      .filter(([id]) => Number(id) !== categoryId)
      .reduce((sum, [, item]) => sum + (item.amount || 0), 0);

    const totalAccountBalances = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalSpent = Object.values(budgetItems).reduce((sum, item) => sum + (item.spent || 0), 0);
    const unspentCash = totalAccountBalances - totalSpent;

    if (currentGoals + numAmount > unspentCash) {
      alert(
        `Cannot assign more than unspent cash ($${unspentCash.toFixed(2)}). Total goals would be $${(currentGoals + numAmount).toFixed(2)}.`
      );
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

  const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
        <ActivityIndicator size="large" color="#E5E5E5" />
      </View>
    );
  }

  return (
    <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.unassignedSection}>
            <ThemedText style={styles.unassignedLabel}>Unassigned</ThemedText>
            <FormattedCurrency
              amount={unspentAmount}
              style={styles.unassignedAmount}
              showSign={false}
              splitFormat={true}
              dollarsStyle={styles.unassignedDollars}
              centsStyle={styles.unassignedCents}
            />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Category"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredCategories.map((item) => (
            <View key={item.id} style={styles.categoryCard}>
              <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
              <View style={styles.categoryRow}>
                <ThemedText style={styles.categoryLabel}>Assigned</ThemedText>
                <TextInput
                  style={styles.assignedInput}
                  value={budgetItems[item.id]?.amount > 0 ? `$${budgetItems[item.id].amount.toFixed(0)}` : ""}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, "");
                    updateBudgetItem(item.id, numericValue);
                  }}
                  keyboardType="numeric"
                  onBlur={() => saveBudgetItem(item.id, budgetItems[item.id]?.amount || 0)}
                  placeholder="$0"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.categoryRow}>
                <ThemedText style={styles.categoryLabel}>Spent</ThemedText>
                <FormattedCurrency amount={Math.abs(budgetItems[item.id]?.spent || 0) * 100} style={styles.spentAmount} showSign={false} />
              </View>
            </View>
          ))}

          {filteredCategories.length === 0 && <ThemedText style={styles.emptyText}>No categories found</ThemedText>}
        </ScrollView>
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14" },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0E14" },
  unassignedSection: { alignItems: "center", marginBottom: 40, paddingHorizontal: 20 },
  unassignedLabel: { fontSize: 30, color: "#666", fontWeight: "600", textAlign: "center", paddingTop: 40 },
  unassignedAmount: { fontSize: 48, fontWeight: "bold", color: "#E5E5E5", textAlign: "center" },
  unassignedDollars: { fontSize: 48, fontWeight: "bold", color: "#E5E5E5", paddingTop: 40 },
  unassignedCents: { fontSize: 32, fontWeight: "bold", color: "#E5E5E5", paddingTop: 40 },
  searchContainer: {
    backgroundColor: "#252933",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.8,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: "#E5E5E5", fontWeight: "500" },
  categoryCard: { backgroundColor: "#252933", borderRadius: 18, padding: 20, opacity: 0.5, marginBottom: 16 },
  categoryName: { fontSize: 20, fontWeight: "600", color: "#E5E5E5", marginBottom: 16 },
  categoryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  categoryLabel: { fontSize: 16, color: "#666", fontWeight: "600" },
  assignedInput: {
    fontSize: 16,
    color: "#E5E5E5",
    fontWeight: "600",
    backgroundColor: "transparent",
    textAlign: "right",
    minWidth: 80,
    padding: 8,
  },
  spentAmount: { fontSize: 16, fontWeight: "600", color: "#E5E5E5" },
  emptyText: { textAlign: "center", color: "#666", fontSize: 16, marginTop: 40 },
});
