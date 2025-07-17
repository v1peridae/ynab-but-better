import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { FormattedCurrency } from "@/components/FormattedCurrency";

const { width } = Dimensions.get("window");

interface SummaryData {
  netWorth: number;
  accounts: Array<{ id: number; name: string; balance: number }>;
  spendingByCategory: Record<string, number>;
  monthlyTrends: Record<string, { income: number; expenses: number }>;
  budgetData: Array<{ goal: number; spent: number; available: number; category: { name: string } }>;
}

export default function SummaryScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    netWorth: 0,
    accounts: [],
    spendingByCategory: {},
    monthlyTrends: {},
    budgetData: [],
  });

  const loadSummaryData = async (isRefresh = false) => {
    if (!token) return;

    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date();

      const [netWorthRes, spendingRes, trendsRes, budgetRes] = await Promise.all([
        fetch(`${API_URL}/reports/net-worth`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/reports/spending?startDate=${thirtyDaysAgo.toISOString()}&endDate=${today.toISOString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/report/trends?months=6`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/budget/${currentMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [netWorthData, spendingData, trendsData, budgetData] = await Promise.all([
        netWorthRes.ok ? netWorthRes.json() : { netWorth: 0, accounts: [] },
        spendingRes.ok ? spendingRes.json() : { byCategory: {} },
        trendsRes.ok ? trendsRes.json() : {},
        budgetRes.ok ? budgetRes.json() : [],
      ]);

      setSummaryData({
        netWorth: netWorthData.netWorth,
        accounts: netWorthData.accounts,
        spendingByCategory: spendingData.byCategory,
        monthlyTrends: trendsData,
        budgetData: budgetData,
      });
    } catch (error) {
      console.error("Error loading summary data:", error);
    } finally {
      if (!isRefresh) setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, [token]);

  const onRefresh = () => {
    loadSummaryData(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E5E5E5" />
      </View>
    );
  }

  const topCategories = Object.entries(summaryData.spendingByCategory)
    .map(([category, amount]) => ({ category, amount: Math.abs(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const totalBudgeted = summaryData.budgetData.reduce((sum, item) => sum + item.goal, 0);
  const totalSpent = summaryData.budgetData.reduce((sum, item) => sum + item.spent, 0);
  const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const monthEntries = Object.entries(summaryData.monthlyTrends).slice(-2);
  const currentMonthData = monthEntries[1] || [null, { income: 0, expenses: 0 }];
  const currentMonthNet = currentMonthData[1].income + currentMonthData[1].expenses;

  const getBudgetColor = (utilization: number) => {
    if (utilization === 0) return "#E5E5E5";
    return utilization > 90 ? "#F44336" : "#4CAF50";
  };

  const getBalanceColor = (balance: number) => {
    if (balance === 0) return "#E5E5E5";
    return balance > 0 ? "#4CAF50" : "#F44336";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E5E5E5" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.welcomeText}>Spending Summary</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Net Worth</ThemedText>
          <FormattedCurrency
            amount={summaryData.netWorth}
            style={styles.balanceAmount}
            showSign={false}
            splitFormat={true}
            dollarsStyle={styles.balanceDollars}
            centsStyle={styles.balanceCents}
          />
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryGridItem}>
            <ThemedText style={styles.summaryGridLabel}>Accounts</ThemedText>
            <ThemedText style={styles.summaryGridValue}>{summaryData.accounts.length}</ThemedText>
          </View>
          <View style={styles.summaryGridItem}>
            <ThemedText style={styles.summaryGridLabel}>Budget Used</ThemedText>
            <ThemedText style={[styles.summaryGridValue, { color: getBudgetColor(budgetUtilization) }]}>
              {budgetUtilization.toFixed(0)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Top Spending (30 days)</ThemedText>
          {topCategories.length > 0 ? (
            topCategories.map((item, index) => (
              <View key={item.category} style={styles.transactionItem}>
                <View>
                  <ThemedText>{item.category}</ThemedText>
                  <ThemedText style={styles.accountName}>#{index + 1}</ThemedText>
                </View>
                <FormattedCurrency amount={item.amount} style={styles.transactionAmount} showSign={false} />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No spending data available</ThemedText>
            </View>
          )}
        </View>

        {summaryData.accounts.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Account Balances</ThemedText>
            {summaryData.accounts.map((account) => (
              <View key={account.id} style={styles.transactionItem}>
                <ThemedText>{account.name}</ThemedText>
                <FormattedCurrency
                  amount={account.balance}
                  style={[styles.transactionAmount, { color: getBalanceColor(account.balance) }]}
                  showSign={true}
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>This Month</ThemedText>
          <View style={styles.balanceRow}>
            <ThemedText style={styles.balanceLabel}>Net Change</ThemedText>
            <FormattedCurrency
              amount={currentMonthNet}
              style={[styles.balanceValue, { color: getBalanceColor(currentMonthNet) }]}
              showSign={true}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#0D0E14" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0E14" },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  scrollViewContent: { paddingBottom: 80 },
  header: { flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", marginBottom: 20, marginTop: 20 },
  welcomeText: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5", marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: "400", color: "#666", opacity: 0.8 },
  section: { backgroundColor: "#252933", opacity: 0.5, borderRadius: 18, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#E5E5E5", marginBottom: 16 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  balanceLabel: { fontSize: 18, color: "#666", fontWeight: "600" },
  balanceValue: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5" },
  balanceAmount: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5", textAlign: "center" },
  balanceDollars: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5" },
  balanceCents: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5" },
  summaryGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  summaryGridItem: { width: "48%", alignItems: "center", backgroundColor: "#252933", opacity: 0.5, borderRadius: 18, padding: 16 },
  summaryGridLabel: { fontSize: 14, textAlign: "center", marginBottom: 8, color: "#E5E5E5", fontWeight: "600", lineHeight: 16 },
  summaryGridValue: { fontSize: 20, fontWeight: "bold", textAlign: "center", color: "#E5E5E5" },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginBottom: 8,
  },
  transactionAmount: { fontWeight: "bold", color: "#E5E5E5" },
  accountName: { fontSize: 14, color: "#666", marginTop: 2 },
  emptyContainer: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#666", fontSize: 16 },
});
