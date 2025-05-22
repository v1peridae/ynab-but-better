import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, FlatList, Alert, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface Category {
  id: string;
  name: string;
  group: string;
}

interface OnboardingCategoriesProps {
  onNext: (data: { categories: Category[] }) => void;
  onBack: () => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "groceries", name: "Groceries", group: "Essentials" },
  { id: "transport", name: "Transport", group: "Essentials" },
  { id: "rent", name: "Rent/Mortgage", group: "Essentials" },
  { id: "utilities", name: "Utilities", group: "Essentials" },
  { id: "dining", name: "Dining Out", group: "Fun" },
  { id: "entertainment", name: "Entertainment", group: "Fun" },
  { id: "shopping", name: "Shopping", group: "Fun" },
  { id: "health", name: "Health & Wellness", group: "Other" },
  { id: "education", name: "Education", group: "Other" },
];

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  subtitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  description: { marginBottom: 20, textAlign: "center" },
  list: { marginBottom: 20 },
  categoryButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 70,
  },
  selectedCategoryText: { color: "#fff", fontWeight: "bold" },
  nextButtonText: { color: "#fff", fontWeight: "bold" },
  navButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1 },
  categoryGroup: { fontSize: 12, marginTop: 2 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
});

export default function OnboardingCategories({ onNext, onBack }: OnboardingCategoriesProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.find((c) => c.id === category.id) ? prev.filter((c) => c.id !== category.id) : [...prev, category]
    );
  };

  const handleNext = () => {
    if (selectedCategories.length === 0) {
      Alert.alert("No Categories", "Please select at least one category.");
      return;
    }
    onNext({ categories: selectedCategories });
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategories.some((c) => c.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.categoryButton, { borderColor: tintColor }, isSelected && { backgroundColor: tintColor }]}
        onPress={() => toggleCategory(item)}
      >
        <ThemedText style={isSelected ? styles.selectedCategoryText : { color: tintColor }}>{item.name}</ThemedText>
        <ThemedText style={[styles.categoryGroup, isSelected ? styles.selectedCategoryText : { color: textColor, opacity: 0.7 }]}>
          ({item.group})
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.subtitle}>Select Your Spending Categories</ThemedText>
      <ThemedText style={[styles.description, { color: textColor }]}>
        Choose from common categories. You can add custom categories later.
      </ThemedText>
      <FlatList
        data={DEFAULT_CATEGORIES}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.list}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.navButton, { borderColor: textColor }]} onPress={onBack}>
          <ThemedText style={{ color: textColor }}>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: tintColor }]} onPress={handleNext}>
          <ThemedText style={styles.nextButtonText}>Next</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
