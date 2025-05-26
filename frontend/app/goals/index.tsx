import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { router } from "expo-router";
import { FormattedCurrency } from "@/components/FormattedCurrency";
import { Ionicons } from "@expo/vector-icons";

interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
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

interface GoalRecommendation {
  type: "emergency" | "debt" | "savings" | "category_optimization";
  title: string;
  description: string;
  suggestedAmount?: number;
  priority: "high" | "medium" | "low";
}

export default function GoalsScreen() {
  const { token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetItems, setBudgetItems] = useState<Record<number, BudgetItem>>({});
  const [unspentAmount, setUnspentAmount] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<GoalRecommendation[]>([]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [goalsRes, categoriesRes, accountsRes] = await Promise.all([
        fetch(`${API_URL}/goals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [goalsData, categoriesData, accountsData] = await Promise.all([goalsRes.json(), categoriesRes.json(), accountsRes.json()]);
      setGoals(goalsData);
      setCategories(categoriesData);
      setAccounts(accountsData);

      const month = new Date().toISOString().slice(0, 7);
      const budgetRes = await fetch(`${API_URL}/budget/month/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        const budgetMap: Record<number, BudgetItem> = {};
        budgetData.forEach((item: any) => {
          budgetMap[item.categoryId] = {
            amount: item.goal / 100,
            spent: item.spent / 100,
            available: (item.goal - item.spent) / 100,
          };
        });
        setBudgetItems(budgetMap);

        const totalBalance = accountsData.reduce((sum: number, account: any) => sum + account.balance, 0);
        const totalBudgeted = Object.values(budgetMap).reduce((sum, item) => sum + item.amount, 0);
        setUnspentAmount(totalBalance - totalBudgeted);

        generateRecommendations(goalsData, budgetMap, accountsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const generateRecommendations = (goals: Goal[], budgetItems: Record<number, BudgetItem>, accounts: any[]) => {
    const recs: GoalRecommendation[] = [];
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const emergencyGoal = goals.find((g) => g.name.toLowerCase().includes("emergency"));
    const monthlyExpenses = Object.values(budgetItems).reduce((sum, item) => sum + item.amount, 0);
    const recommendedEmergency = monthlyExpenses * 3;

    if (!emergencyGoal || emergencyGoal.targetAmount < recommendedEmergency) {
      recs.push({
        type: "emergency",
        title: "Emergency Fund",
        description: "Try to have atleast 3 months of expenses in your emergency fund",
        suggestedAmount: recommendedEmergency,
        priority: "high",
      });
    }

    const totalGoalAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const savingsRate = totalGoalAmount / totalBalance;

    if (savingsRate < 0.2) {
      recs.push({
        type: "savings",
        title: "Savings Rate",
        description: "Try saving atleast 20% of your income",
        suggestedAmount: totalBalance * 0.2,
        priority: "medium",
      });
    }

    const overspentCategories = Object.entries(budgetItems).filter(([_, item]) => item.spent > item.amount);
    if (overspentCategories.length > 0) {
      recs.push({
        type: "category_optimization",
        title: "Optimize Category Spending",
        description: `${overspentCategories.length} categories are overspent`,
        priority: "high",
      });
    }

    setRecommendations(recs);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calcProgress = (goal: Goal) => {
    return goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  };

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRequiredMonthlySavings = (goal: Goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (!goal.dueDate) return remaining;
    const daysRemaining = getDaysRemaining(goal.dueDate);
    if (!daysRemaining || daysRemaining <= 0) return remaining;
    const monthsLeft = daysRemaining / 30;
    return remaining / monthsLeft;
  };

  const handleCreateGoal = () => {
    router.push("/goals/create");
  };

  const handleEditGoal = (goalId: number) => {
    router.push(`/goals/edit/${goalId}`);
  };

  const handleDeleteGoal = async (goalId: number) => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API_URL}/goals/${goalId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchData();
          } catch (error) {
            console.error("Error deleting goal:", error);
          }
        },
      },
    ]);
  };

  const renderGoalItem = ({ item }: { item: Goal }) => {
    const progress = calcProgress(item);
    const daysRemaining = getDaysRemaining(item.dueDate);
    const requiredMonthlySavings = getRequiredMonthlySavings(item);
    const isOverdue = daysRemaining !== null && daysRemaining < 0;
    const isUrgent = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;

    return (
      <TouchableOpacity style={styles.goalItem} onPress={() => handleEditGoal(item.id)}>
        <View style={styles.goalHeader}>
          <ThemedText style={styles.goalName}>{item.name}</ThemedText>
          <TouchableOpacity onPress={() => handleDeleteGoal(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
          </TouchableOpacity>
        </View>

        <View style={styles.goalProgress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <ThemedText style={styles.progressText}>{progress.toFixed(1)}%</ThemedText>
        </View>

        <View style={styles.goalDetails}>
          <View style={styles.goalAmounts}>
            <FormattedCurrency amount={item.currentAmount * 100} style={styles.currentAmount} showSign={false} />
            <ThemedText style={styles.amountSeparator}> / </ThemedText>
            <FormattedCurrency amount={item.targetAmount * 100} style={styles.targetAmount} showSign={false} />
          </View>

          {daysRemaining !== null && (
            <View style={styles.timelineInfo}>
              <ThemedText style={[styles.daysRemaining, isOverdue && styles.overdue, isUrgent && styles.urgent]}>
                {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
              </ThemedText>
              <FormattedCurrency amount={requiredMonthlySavings * 100} style={styles.requiredSavings} showSign={false} />
              <ThemedText style={styles.requiredLabel}>/month needed</ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecommendation = ({ item }: { item: GoalRecommendation }) => {
    const priorityColour = { high: "#ff6b6b", medium: "#ffa726", low: "#66bb6a" }[item.priority];
    return (
      <View style={[styles.recommendationItem, { borderLeftColor: priorityColour }]}>
        <View style={styles.recommendationHeader}>
          <ThemedText style={styles.recommendationTitle}>{item.title}</ThemedText>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColour }]}>
            <ThemedText style={styles.priorityText}>{item.priority.toUpperCase()}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.recommendationDescription}>{item.description}</ThemedText>
        {item.suggestedAmount && <FormattedCurrency amount={item.suggestedAmount * 100} style={styles.suggestedAmount} showSign={false} />}
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Goals</ThemedText>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateGoal}>
            <Ionicons name="add-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Goal Amount</ThemedText>
            <FormattedCurrency
              amount={goals.reduce((sum, goal) => sum + goal.targetAmount, 0) * 100}
              style={styles.summaryValue}
              showSign={false}
            />
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Available to Assign</ThemedText>
            <FormattedCurrency amount={unspentAmount * 100} style={styles.summaryValue} showSign={false} />
          </View>
        </View>

        {recommendations.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Recommendations</ThemedText>
            <FlatList
              data={recommendations}
              renderItem={renderRecommendation}
              keyExtractor={(item, index) => `${item.type}-${index}`}
              scrollEnabled={false}
            />
          </View>
        )}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Your Goals</ThemedText>
          {goals.length > 0 ? (
            <FlatList data={goals} renderItem={renderGoalItem} keyExtractor={(item) => item.id.toString()} scrollEnabled={false} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="flag-outline" size={48} color="#666" />
              <ThemedText style={styles.emptyText}>No goals yet.</ThemedText>
              <ThemedText style={styles.emptyDescription}> Add a goal to get started.</ThemedText>
              <TouchableOpacity style={styles.createFirstGoalButton} onPress={handleCreateGoal}>
                <ThemedText style={styles.createFirstGoalText}>Create Your First Goal</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {},
  scrollView: {},
  header: {},
  title: {},
  addButton: {},
  summaryCard: {},
  summaryRow: {},
  summaryLabel: {},
  summaryValue: {},
  section: {},
  sectionTitle: {},
  goalItem: {},
  goalHeader: {},
  goalName: {},
  goalProgress: {},
  progressBar: {},
  progressFill: {},
  progressText: {},
  goalDetails: {},
  goalAmounts: {},
  currentAmount: {},
  amountSeparator: {},
  targetAmount: {},
  timelineInfo: {},
  daysRemaining: {},
  overdue: {},
  urgent: {},
  requiredSavings: {},
  requiredLabel: {},
  recommendationItem: {},
  recommendationHeader: {},
  recommendationTitle: {},
  priorityBadge: {},
  priorityText: {},
  recommendationDescription: {},
  suggestedAmount: {},
  loadingContainer: {},
  emptyContainer: {},
  emptyText: {},
  emptyDescription: {},
  createFirstGoalButton: {},
  createFirstGoalText: {},
});
