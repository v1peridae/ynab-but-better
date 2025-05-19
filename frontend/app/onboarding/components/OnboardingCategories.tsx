import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, View } from "react-native";
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
  addCustomTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  input: { height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 10, fontSize: 14 },
  addCategoryButton: { paddingVertical: 12, borderRadius: 8, alignItems: "center", marginBottom: 20 },
  addCategoryButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
});

export default function OnboardingCategories({ onNext, onBack }: OnboardingCategoriesProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryGroup, setCustomCategoryGroup] = useState("");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.find((c) => c.id === category.id) ? prev.filter((c) => c.id !== category.id) : [...prev, category]
    );
  };

  const handleAddCustomCategory = () => {
    if (!customCategory.trim()) {
      Alert.alert("Missing Name", "Please enter a name for your custom category.");
      return;
    }
    const newCategory: Category = {
      id: `custom-${customCategory.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: customCategory.trim(),
      group: customCategoryGroup.trim() || "Other",
    };
    setSelectedCategories((prev) => [...prev, newCategory]);
    setCustomCategory("");
    setCustomCategoryGroup("");
  };

  const handleNext = () => {
    if (selectedCategories.length === 0) {
      Alert.alert("No Categories", "Please select or add at least one category.");
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
        Choose from common categories or add your own. You can always change these later.
      </ThemedText>
      <FlatList
        data={DEFAULT_CATEGORIES.concat(selectedCategories.filter((sc) => sc.id.startsWith("custom-")))}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.list}
      />

      <ThemedText style={styles.addCustomTitle}>Add a Custom Category:</ThemedText>
      <TextInput
        style={[styles.input, { color: textColor, borderColor: textColor, backgroundColor }]}
        placeholder="Category Name (e.g., Hobbies)"
        placeholderTextColor="#888"
        value={customCategory}
        onChangeText={setCustomCategory}
      />

      <TextInput
        style={[styles.input, { color: textColor, borderColor: textColor, backgroundColor }]}
        placeholder="Category Group (e.g., Fun, Other)"
        placeholderTextColor="#888"
        value={customCategoryGroup}
        onChangeText={setCustomCategoryGroup}
      />

      <TouchableOpacity
        style={[styles.addCategoryButton, { backgroundColor: tintColor, opacity: !customCategory.trim() ? 0.5 : 1 }]}
        onPress={handleAddCustomCategory}
        disabled={!customCategory.trim()}
      >
        <ThemedText style={styles.addCategoryButtonText}>Add Category</ThemedText>
      </TouchableOpacity>

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
