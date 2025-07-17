import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, StatusBar } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AddCategoryScreen() {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [group, setGroup] = useState("Essentials");
  const [loading, setLoading] = useState(false);

  const categoryGroups = [
    { id: "Essentials", label: "Essentials" },
    { id: "Fun", label: "Fun" },
    { id: "Lifestyle", label: "Lifestyle" },
    { id: "Savings", label: "Savings" },
    { id: "Bills", label: "Bills" },
    { id: "Other", label: "Other" },
  ];

  const handleAddCategory = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), group }),
      });
      if (!response.ok) throw new Error("Failed to add category");
      Alert.alert("Success", "Category added successfully", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Failed to add category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E5E5E5" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Add Category</ThemedText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Category Name</ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter category name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Category Group</ThemedText>
          <View style={styles.groupOptions}>
            {categoryGroups.map((categoryGroup) => (
              <TouchableOpacity
                key={categoryGroup.id}
                onPress={() => setGroup(categoryGroup.id)}
                style={[styles.groupOption, group === categoryGroup.id && styles.selectedGroupOption]}
              >
                <ThemedText style={[styles.groupText, group === categoryGroup.id && styles.selectedGroupText]}>
                  {categoryGroup.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory} disabled={loading}>
          <ThemedText style={styles.addButtonText}>{loading ? "Adding..." : "Add Category"}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", paddingTop: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 40, paddingHorizontal: 20 },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 24, fontWeight: "600", color: "#575F72" },
  scrollView: { flex: 1, paddingHorizontal: 40 },
  scrollContent: { paddingBottom: 40 },
  inputGroup: { marginBottom: 30 },
  label: { fontSize: 18, marginBottom: 12, color: "#E5E5E5", fontWeight: "600" },
  inputContainer: { backgroundColor: "#252933", opacity: 0.5, borderRadius: 18, paddingHorizontal: 16, height: 50 },
  input: { fontSize: 16, color: "#E5E5E5", padding: 0, height: "100%" },
  groupOptions: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  groupOption: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    maxWidth: "48%",
  },
  selectedGroupOption: { backgroundColor: "#575F72", opacity: 1 },
  groupText: { fontSize: 16, fontWeight: "600", color: "#666", textAlign: "center" },
  selectedGroupText: { color: "#E5E5E5" },
  addButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 40,
    width: 200,
    alignSelf: "center",
  },
  addButtonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
});
