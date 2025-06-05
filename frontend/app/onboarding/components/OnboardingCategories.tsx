import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, Alert, View, Text, StatusBar, ScrollView } from "react-native";
import ProgressDots from "./ProgressDots";

interface Category {
  id: string;
  name: string;
  group: string;
}

interface OnboardingCategoriesProps {
  onNext: (data: { categories: Category[] }) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  onStepPress: (step: number) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "groceries", name: "Groceries", group: "Essentials" },
  { id: "transport", name: "Transport", group: "Essentials" },
  { id: "utilities", name: "Utilities", group: "Essentials" },
  { id: "dining", name: "Dining Out", group: "Fun" },
  { id: "entertainment", name: "Entertainment", group: "Fun" },
  { id: "rent", name: "Rent", group: "Essentials" },
];

export default function OnboardingCategories({ onNext, onBack, currentStep, totalSteps, onStepPress }: OnboardingCategoriesProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.mainText}>Sense</Text>
          <Text style={styles.subtitle}>have control</Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressDots totalSteps={totalSteps} currentStep={currentStep} onStepPress={onStepPress} />
          <Text style={styles.stepText}>{`Step ${currentStep} of ${totalSteps}`}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.question}>Add Your Categories</Text>
          <Text style={styles.description}>Pick what categories you want.{"\n"}You can add more later.</Text>
          <View style={styles.categoriesContainer}>
            {DEFAULT_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.some((c) => c.id === category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryButton, isSelected && styles.selectedCategory]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.addCategoryButton}>
            <Text style={styles.addCategoryText}>+ Add Category</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14" },
  scrollView: { flex: 1 },
  scrollContent: { alignItems: "center", paddingBottom: 40 },
  header: { alignItems: "center", marginTop: 80, marginBottom: 40 },
  mainText: { fontSize: 72, fontWeight: "500", color: "#575F72", letterSpacing: -2, marginBottom: 8, marginTop: 60 },
  subtitle: { fontSize: 20, color: "#666", fontWeight: "400", letterSpacing: 1, marginTop: -30 },
  progressContainer: { alignItems: "center", marginBottom: 40 },
  stepText: { color: "#666", fontSize: 14 },
  content: { width: "100%", alignItems: "center", paddingHorizontal: 40 },
  question: { color: "#666", fontSize: 24, fontWeight: "400", textAlign: "center", marginBottom: 10 },
  description: { color: "#666", fontSize: 16, textAlign: "center", marginBottom: 40, opacity: 0.8, lineHeight: 22 },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 500,
    marginBottom: 40,
    gap: 12,
  },
  categoryButton: {
    backgroundColor: "#252933",
    opacity: 0.8,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 13,
    alignItems: "center",
    flexShrink: 0,
  },
  selectedCategory: { backgroundColor: "#575F72", opacity: 1 },
  categoryText: { fontSize: 16, fontWeight: "500", color: "#777076", textAlign: "center" },
  selectedCategoryText: { color: "#E5E5E5" },
  addCategoryButton: { marginBottom: 40 },
  addCategoryText: { color: "#777076", fontSize: 16, fontWeight: "600", textAlign: "center" },
  continueButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    width: 240,
    alignSelf: "center",
    marginBottom: 40,
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#E5E5E5" },
});
