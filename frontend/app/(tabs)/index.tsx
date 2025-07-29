import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, StatusBar, RefreshControl } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@/constants/apiurl";
import { router } from "expo-router";
import { FormattedCurrency } from "@/components/FormattedCurrency";

const navToAssign = () => {
  router.push("/assign");
};

interface BudgetItemResponse {
  categoryId: number;
  amount: number;
  spent: number;
  available: number;
}

export default function IndexScreen() {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("User");
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    totalSpent: 0,
    accounts: [],
    recentTransactions: [],
    unassigned: 0,
    summary: { topPurchase: "Unknown", topCategory: "Unknown", weeklyChangePercent: 0 },
  });
  const [calculatedLeftToAssign, setCalculatedLeftToAssign] = useState(0);

  const loadData = async (isRefresh = false) => {
    if (token) {
      if (!isRefresh) setLoading(true);
      if (isRefresh) setRefreshing(true);
      try {
        const now = new Date();
        const month = now.toISOString().slice(0, 7);

        const [dashboardApiResponse, profileResponse, budgetMonthResponse] = await Promise.all([
          fetch(`${API_URL}/user/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/budget/${month}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        let apiDashboardData = {
          totalBalance: 0,
          totalSpent: 0,
          accounts: [],
          recentTransactions: [],
          unassigned: 0,
          summary: { topPurchase: "Unknown", topCategory: "Unknown", weeklyChangePercent: 0 },
        };
        if (dashboardApiResponse.ok) {
          apiDashboardData = await dashboardApiResponse.json();
          console.log("Dashboard API data:", apiDashboardData);
        } else {
          console.error("Failed to fetch dashboard data from API");
        }
        setDashboardData(apiDashboardData);

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          if (profile && profile.name) {
            setUserName(profile.name);
          }
        } else {
          console.error("Failed to fetch user profile from API");
        }

        let currentMonthBudgetedInCents = 0;
        if (budgetMonthResponse.ok) {
          const budgetItems = (await budgetMonthResponse.json()) as BudgetItemResponse[];
          if (Array.isArray(budgetItems)) {
            currentMonthBudgetedInCents = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0);
          }
        } else {
          console.error(`Budget data fetch for month ${month} failed with status: ${budgetMonthResponse.status}`);
        }
        const totalBalanceInCents = apiDashboardData.totalBalance || 0;
        setCalculatedLeftToAssign(totalBalanceInCents - currentMonthBudgetedInCents);
      } catch (error) {
        console.error("Error fetching data in IndexScreen:", error);
        setDashboardData({
          totalBalance: 0,
          totalSpent: 0,
          accounts: [],
          recentTransactions: [],
          unassigned: 0,
          summary: { topPurchase: "Unknown", topCategory: "Unknown", weeklyChangePercent: 0 },
        });
        setUserName("User");
        setCalculatedLeftToAssign(0);
      } finally {
        if (!isRefresh) setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    } else {
      if (!isRefresh) setLoading(false);
      if (isRefresh) setRefreshing(false);
      setDashboardData({
        totalBalance: 0,
        totalSpent: 0,
        accounts: [],
        recentTransactions: [],
        unassigned: 0,
        summary: { topPurchase: "Unknown", topCategory: "Unknown", weeklyChangePercent: 0 },
      });
      setCalculatedLeftToAssign(0);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const onRefresh = () => {
    loadData(true);
  };

  const renderTransactionItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View>
        <ThemedText>{item.description || "something"}</ThemedText>
        <ThemedText style={styles.accountName}>{item.account?.name || "Checking account"}</ThemedText>
      </View>
      <FormattedCurrency amount={item.amount} style={styles.transactionAmount} showSign={true} />
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

  const weeklyChangePercent = dashboardData.summary.weeklyChangePercent;
  const isPositiveChange = weeklyChangePercent > 0;
  const weeklyChangeFormatted = isPositiveChange ? `+${weeklyChangePercent}%` : `${weeklyChangePercent}%`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E5E5E5" colors={["#E5E5E5"]} />}
      >
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
            <ThemedText style={styles.userName}>{userName}</ThemedText>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <ThemedText style={styles.spentLabel}>Spent</ThemedText>
            <FormattedCurrency
              amount={dashboardData.totalSpent}
              style={styles.spentAmount}
              showSign={false}
              splitFormat={true}
              dollarsStyle={styles.spentDollars}
              centsStyle={styles.spentCents}
            />
          </View>
          <View style={[styles.balanceRow, styles.balanceRowSpacing]}>
            <ThemedText style={styles.balanceLabel}>Balance</ThemedText>
            <FormattedCurrency
              amount={dashboardData.totalBalance}
              style={styles.balanceAmount}
              showSign={false}
              splitFormat={true}
              dollarsStyle={styles.balanceDollars}
              centsStyle={styles.balanceCents}
            />
          </View>
          <View style={[styles.balanceRow, styles.leftToAssignRow]}>
            <ThemedText style={styles.balanceLabel}>Unassigned</ThemedText>
            <FormattedCurrency
              amount={calculatedLeftToAssign}
              style={styles.leftToAssignAmount}
              showSign={false}
              splitFormat={true}
              dollarsStyle={styles.leftToAssignDollars}
              centsStyle={styles.leftToAssignCents}
            />
          </View>
        </View>

        <TouchableOpacity onPress={navToAssign} style={styles.assignButton}>
          <ThemedText style={styles.assignButtonText}>Assign</ThemedText>
        </TouchableOpacity>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Spending</ThemedText>
          <FlatList
            data={dashboardData.recentTransactions?.slice(0, 3) || []}
            renderItem={renderTransactionItem}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No recent transactions</ThemedText>
              </View>
            }
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>This Week&apos;s Summary</ThemedText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryGridItem}>
              <ThemedText style={styles.summaryGridLabel}>Top Purchase</ThemedText>
              <ThemedText style={styles.summaryGridValue}>{dashboardData.summary?.topPurchase}</ThemedText>
            </View>
            <View style={styles.summaryGridItem}>
              <ThemedText style={styles.summaryGridLabel}>Top Category</ThemedText>
              <ThemedText style={styles.summaryGridValue}>{dashboardData.summary?.topCategory}</ThemedText>
            </View>
            <View style={styles.summaryGridItem}>
              <ThemedText style={styles.summaryGridLabel}>Weekly Change</ThemedText>
              <View style={styles.changeIndicator}>
                <Ionicons name={isPositiveChange ? "arrow-up" : "arrow-down"} size={14} color={isPositiveChange ? "#4CAF50" : "#F44336"} />
                <ThemedText style={[styles.summaryGridValue, { color: isPositiveChange ? "#4CAF50" : "#F44336" }]}>
                  {weeklyChangeFormatted}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#0D0E14" },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0E14" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, marginTop: 20 },
  welcomeText: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5", marginBottom: 4 },
  userName: { fontSize: 28, fontWeight: "600", color: "#E5E5E5", opacity: 0.8, fontStyle: "italic", paddingTop: 10 },
  emptyList: { alignItems: "center", paddingVertical: 10 },
  changeIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  summaryItem: { marginVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 15, flex: 1, paddingRight: 10 },
  summaryValue: { fontSize: 15, fontWeight: "bold", textAlign: "right" },
  transactionAmount: { fontWeight: "bold" },
  balanceCard: { backgroundColor: "#252933", opacity: 0.5, borderRadius: 18, padding: 20, marginBottom: 20 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  balanceLabel: { fontSize: 18, color: "#666", fontWeight: "600" },
  balanceValue: { fontSize: 14, fontWeight: "bold" },
  totalBalance: { fontSize: 18, fontWeight: "bold", textAlign: "right" },
  totalBalanceLabel: { fontSize: 16, marginBottom: 8, color: "#666666" },
  section: { backgroundColor: "#252933", opacity: 0.5, borderRadius: 18, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#E5E5E5", marginBottom: 16 },
  divider: { height: 1, backgroundColor: "#333333", marginBottom: 10 },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginBottom: 8,
  },
  accountName: { fontSize: 14, color: "#666", marginTop: 2 },
  emptyContainer: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#666", fontSize: 16 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  summaryGridItem: { width: "33%", alignItems: "center", marginBottom: 12 },
  summaryGridLabel: { fontSize: 14, textAlign: "center", marginBottom: 8, color: "#E5E5E5", fontWeight: "600", lineHeight: 16 },
  summaryGridValue: { fontSize: 12, fontWeight: "400", textAlign: "center", color: "#666" },
  assignButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginBottom: 20,
    alignItems: "center",
  },
  assignButtonText: { color: "#E5E5E5", fontSize: 18, fontWeight: "600" },
  spentLabel: { fontSize: 32, fontWeight: "bold", color: "#E5E5E5", paddingTop: 10 },
  spentAmount: { fontSize: 25, fontWeight: "bold", color: "#E5E5E5", paddingTop: 10 },
  spentDollars: { fontSize: 28, fontWeight: "bold", color: "#E5E5E5" },
  spentCents: { fontSize: 20, fontWeight: "bold", color: "#E5E5E5" },
  balanceAmount: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5" },
  balanceDollars: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5" },
  balanceCents: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5" },
  leftToAssignAmount: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5" },
  leftToAssignDollars: { fontSize: 24, fontWeight: "bold", color: "#E5E5E5" },
  leftToAssignCents: { fontSize: 18, fontWeight: "bold", color: "#E5E5E5" },
  leftToAssignRow: { marginTop: 4 },
  balanceRowSpacing: { marginTop: 10 },
  scrollViewContent: { paddingBottom: 80 },
});
