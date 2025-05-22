import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@/constants/apiurl";
import { router } from "expo-router";

const navToAssign = () => {
  router.push("/assign");
};

const fetchDashboardData = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/user/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      totalBalance: 0,
      accounts: [],
      recentTransactions: [],
      unassigned: 0,
      summary: {
        topPurchase: "Unknown",
        topCategory: "Unknown",
        weeklyChangePercent: 0,
      },
    };
  }
};

const fetchUserProfile = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { name: "User" };
  }
};

export default function IndexScreen() {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    accounts: [],
    recentTransactions: [],
    unassigned: 0,
    summary: {
      topPurchase: "Unknown",
      topCategory: "Unknown",
      weeklyChangePercent: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        setLoading(true);
        try {
          const [data, profile] = await Promise.all([fetchDashboardData(token), fetchUserProfile(token)]);
          setDashboardData(data);
          if (profile && profile.name) {
            setUserName(profile.name);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setDashboardData({
            totalBalance: 0,
            accounts: [],
            recentTransactions: [],
            unassigned: 0,
            summary: {
              topPurchase: "Unknown",
              topCategory: "Unknown",
              weeklyChangePercent: 0,
            },
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setDashboardData({
          totalBalance: 0,
          accounts: [],
          recentTransactions: [],
          unassigned: 0,
          summary: {
            topPurchase: "Unknown",
            topCategory: "Unknown",
            weeklyChangePercent: 0,
          },
        });
      }
    };
    fetchData();
  }, [token]);

  const renderTransactionItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View>
        <ThemedText>{item.description || "something"}</ThemedText>
        <ThemedText style={styles.accountName}>{item.account?.name || "Checking account"}</ThemedText>
      </View>
      <ThemedText style={styles.transactionAmount}>-${Math.abs(item.amount / 100).toFixed(2)}</ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const formattedTotalBalance = (dashboardData.totalBalance / 100).toFixed(2);
  const spentBalance = (dashboardData.totalBalance / 100).toFixed(2);
  const unassignedAmount = (dashboardData.unassigned / 100).toFixed(2);

  const weeklyChangePercent = dashboardData.summary.weeklyChangePercent;
  const isPositiveChange = weeklyChangePercent > 0;
  const weeklyChangeFormatted = isPositiveChange ? `+${weeklyChangePercent}%` : `${weeklyChangePercent}%`;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.welcomeText}>Welcome back, {userName}</ThemedText>
        </View>
        <TouchableOpacity onPress={logout} style={styles.settingsButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <ThemedText style={styles.balanceLabel}>Spent</ThemedText>
          <ThemedText style={styles.balanceValue}>${spentBalance}</ThemedText>
        </View>
        <ThemedText style={styles.totalBalance}>${formattedTotalBalance}</ThemedText>
        <View style={styles.balanceRow}>
          <ThemedText style={styles.balanceLabel}>Left to assign</ThemedText>
          <ThemedText style={styles.balanceValue}>${unassignedAmount}</ThemedText>
        </View>
      </View>
      <TouchableOpacity onPress={navToAssign} style={styles.assignButton}>
        <ThemedText style={styles.assignButtonText}>Assign</ThemedText>
      </TouchableOpacity>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Spending</ThemedText>
        <View style={styles.divider} />
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
        <ThemedText style={styles.sectionTitle}>This week summary</ThemedText>
        <View style={styles.divider} />
        <View style={styles.summaryGrid}>
          <View style={styles.summaryGridItem}>
            <ThemedText style={styles.summaryGridLabel}>Top purchase</ThemedText>
            <ThemedText style={styles.summaryGridValue}>{dashboardData.summary?.topPurchase || "Cat food"}</ThemedText>
          </View>
          <View style={styles.summaryGridItem}>
            <ThemedText style={styles.summaryGridLabel}>Top category</ThemedText>
            <ThemedText style={styles.summaryGridValue}>{dashboardData.summary?.topCategory || "Entertainment"}</ThemedText>
          </View>
          <View style={styles.summaryGridItem}>
            <ThemedText style={styles.summaryGridLabel}>Weekly change</ThemedText>
            <View style={styles.changeIndicator}>
              <Ionicons name={isPositiveChange ? "arrow-up" : "arrow-down"} size={14} color={isPositiveChange ? "green" : "red"} />
              <ThemedText style={styles.summaryGridValue}>{weeklyChangeFormatted}</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  welcomeText: { fontSize: 24, fontWeight: "normal" },
  emptyList: { alignItems: "center", paddingVertical: 10 },
  changeIndicator: { flexDirection: "row", alignItems: "center" },
  summaryItem: { marginVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 15, flex: 1, paddingRight: 10 },
  summaryValue: { fontSize: 15, fontWeight: "bold", textAlign: "right" },
  transactionAmount: { fontWeight: "bold" },
  balanceCard: { backgroundColor: "#000000", borderRadius: 8, padding: 16, marginBottom: 16 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  balanceLabel: { fontSize: 16 },
  balanceValue: { fontSize: 14, fontWeight: "bold" },
  totalBalance: { fontSize: 24, fontWeight: "bold", textAlign: "right", marginVertical: 4 },
  section: { backgroundColor: "#000000", borderRadius: 8, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  divider: { height: 1, backgroundColor: "#333333", marginBottom: 10 },
  transactionItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  accountName: { fontSize: 14, color: "#666666" },
  emptyContainer: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#666666" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 0 },
  summaryGridItem: { width: "30%", marginBottom: 8, alignItems: "center" },
  summaryGridLabel: { fontSize: 12, textAlign: "center", marginBottom: 4, color: "#666666", lineHeight: 14 },
  summaryGridValue: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginTop: 4 },
  settingsButton: { padding: 5 },
  assignButton: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  assignButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
