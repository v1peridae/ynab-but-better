import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type Category = {
  id: number;
  name: string;
  group: string;
};

export default function CategoriesScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to fetch categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    Alert.alert("Delete Category", `Are you sure you want to delete "${categoryName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/categories/${categoryId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to delete category");
            }
            Alert.alert("Success", "Category deleted successfully");
            fetchCategories();
          } catch (error) {
            console.error("Error deleting category:", error);
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete category");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const groupedCategories = categories.reduce((groups: Record<string, Category[]>, category) => {
    const group = category.group || "Other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(category);
    return groups;
  }, {});

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
        <ThemedText style={styles.categoryGroup}>{item.group || "Other"}</ThemedText>
      </View>
      <TouchableOpacity onPress={() => handleDeleteCategory(item.id, item.name)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  const renderGroupSection = ({ item }: { item: { group: string; categories: Category[] } }) => (
    <View style={styles.groupSection}>
      <ThemedText style={styles.groupTitle}>{item.group}</ThemedText>
      <FlatList
        data={item.categories}
        renderItem={renderCategoryItem}
        keyExtractor={(category) => category.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const sectionsData = Object.entries(groupedCategories).map(([group, categories]) => ({ group, categories }));

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
        <ThemedText style={styles.headerTitle}>Manage Categories</ThemedText>
        <TouchableOpacity onPress={() => router.push("/categories/add")} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#E5E5E5" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sectionsData}
        renderItem={renderGroupSection}
        keyExtractor={(item) => item.group}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color="#666" />
            <ThemedText style={styles.emptyText}>No categories found</ThemedText>
            <ThemedText style={styles.emptySubtext}>Add a category to get started</ThemedText>
            <TouchableOpacity style={styles.emptyAddButton} onPress={() => router.push("/categories/add")}>
              <ThemedText style={styles.emptyAddButtonText}>Add Category</ThemedText>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", paddingHorizontal: 20, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: "600", color: "#E5E5E5", flex: 1, textAlign: "center", marginHorizontal: 10 },
  backButton: { padding: 12, minWidth: 48, alignItems: "center", justifyContent: "center" },
  addButton: { padding: 12, minWidth: 48, alignItems: "center", justifyContent: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0E14" },
  totalSection: { alignItems: "center", marginBottom: 40, paddingVertical: 20 },
  totalLabel: { fontSize: 18, color: "#666", marginBottom: 10, fontWeight: "500" },
  totalCount: { fontSize: 52, fontWeight: "700", color: "#575F72", paddingTop: 30 },
  listContent: { paddingBottom: 100 },
  groupSection: { marginBottom: 30 },
  groupTitle: { fontSize: 18, fontWeight: "600", color: "#E5E5E5", marginBottom: 16, marginLeft: 4 },
  categoryCard: {
    backgroundColor: "#252933",
    opacity: 0.5,
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 18, fontWeight: "600", color: "#E5E5E5", marginBottom: 4 },
  categoryGroup: { fontSize: 14, color: "#666" },
  deleteButton: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  emptyAddButton: { backgroundColor: "#252933", opacity: 0.5, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 18 },
  emptyAddButtonText: { color: "#E5E5E5", fontSize: 16, fontWeight: "600" },
});
