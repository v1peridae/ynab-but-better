import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import OnboardingName from "./components/OnboardingName";
import OnboardingAccounts from "./components/OnboardingAccounts";
import OnboardingCategories from "./components/OnboardingCategories";
import OnboardingComplete from "./components/OnboardingComplete";

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: "",
    accounts: [],
    categories: [],
  });

  const textColor = useThemeColor({}, "text");

  const handleNext = (data: any) => {
    setUserData({ ...userData, ...data });
    setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    router.replace("/(tabs)");
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((stepNumber) => (
          <View key={stepNumber} style={styles.stepContainer}>
            <View style={[styles.stepDot, { borderColor: textColor }, stepNumber <= step && { backgroundColor: textColor }]}>
              <ThemedText style={[styles.stepNumber, stepNumber <= step && styles.activeStepNumber]}>{stepNumber}</ThemedText>
            </View>
            {stepNumber < 4 && (
              <View style={[styles.stepLine, { backgroundColor: textColor }, stepNumber < step && styles.activeStepLine]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Setup Your Account</ThemedText>
        {renderStepIndicator()}
        <ThemedText style={styles.stepText}>Step {step} of 4</ThemedText>
      </View>

      <View style={styles.content}>
        {step === 1 && <OnboardingName onNext={handleNext} />}
        {step === 2 && <OnboardingAccounts onNext={handleNext} onBack={handlePrevious} />}
        {step === 3 && <OnboardingCategories onNext={handleNext} onBack={handlePrevious} />}
        {step === 4 && <OnboardingComplete userData={userData} onComplete={handleComplete} onBack={handlePrevious} />}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  stepIndicator: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepContainer: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stepNumber: { fontSize: 14, fontWeight: "600" },
  activeStepNumber: { color: "white" },
  stepLine: { width: 24, height: 2, opacity: 0.3, marginHorizontal: 4 },
  activeStepLine: { opacity: 1 },
  stepText: { fontSize: 14, opacity: 0.6, fontWeight: "500" },
  content: { flex: 1 },
});
