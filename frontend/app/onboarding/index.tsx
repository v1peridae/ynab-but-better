import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import OnboardingName from "./components/OnboardingName";
import OnboardingAccounts from "./components/OnboardingAccounts";
import OnboardingPrefs from "./components/OnboardingPrefs";
import OnboardingCategories from "./components/OnboardingCategories";
import OnboardingComplete from "./components/OnboardingComplete";
import { useAuth } from "@/context/AuthContext";
import { saveOnboardingData } from "@/utils/api";

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: "",
    accounts: [],
    preferences: {
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      theme: "auto",
      notifications: true,
    },
    categories: [],
  });
  const { token } = useAuth();

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
    if (!token) {
      Alert.alert("Error", "Authentication token not found");
      return;
    }

    try {
      await saveOnboardingData(userData, token);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Failed to save onboarding data. Please try again.");
      console.error("Onboarding save error:", error);
    }
  };

  const goToStep = (s: number) => {
    if (s >= 1 && s <= 5 && s !== step) setStep(s);
  };

  return (
    <ThemedView style={styles.container}>
      {step === 1 && <OnboardingName onNext={handleNext} currentStep={step} totalSteps={5} onStepPress={goToStep} />}
      {step === 2 && (
        <OnboardingAccounts onNext={handleNext} onBack={handlePrevious} currentStep={step} totalSteps={5} onStepPress={goToStep} />
      )}
      {step === 3 && (
        <OnboardingPrefs onNext={handleNext} onBack={handlePrevious} currentStep={step} totalSteps={5} onStepPress={goToStep} />
      )}
      {step === 4 && (
        <OnboardingCategories onNext={handleNext} onBack={handlePrevious} currentStep={step} totalSteps={5} onStepPress={goToStep} />
      )}
      {step === 5 && (
        <OnboardingComplete
          userData={userData}
          onComplete={handleComplete}
          onBack={handlePrevious}
          currentStep={step}
          totalSteps={5}
          onStepPress={goToStep}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
