import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
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
  const [isLoading, setIsLoading] = useState(true);
  const { token, loading, isLoggedIn } = useAuth();

  useEffect(() => {
    loadOnboardingProgress();
  }, []);

  const loadOnboardingProgress = async () => {
    try {
      const savedProgress = await SecureStore.getItemAsync("onboarding_progress");
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setStep(progress.step || 1);
        setUserData(
          progress.userData || {
            name: "",
            accounts: [],
            preferences: {
              currency: "USD",
              dateFormat: "MM/DD/YYYY",
              theme: "auto",
              notifications: true,
            },
            categories: [],
          }
        );
      }
    } catch (error) {
      console.error("Error loading onboarding progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOnboardingProgress = async (currentStep: number, currentUserData: any) => {
    try {
      const progress = {
        step: currentStep,
        userData: currentUserData,
        timestamp: new Date().toISOString(),
      };
      await SecureStore.setItemAsync("onboarding_progress", JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving onboarding progress:", error);
    }
  };

  const handleNext = async (data: any) => {
    const newUserData = { ...userData, ...data };
    const nextStep = step + 1;

    setUserData(newUserData);
    setStep(nextStep);

    await saveOnboardingProgress(nextStep, newUserData);
  };

  const handlePrevious = async () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      await saveOnboardingProgress(prevStep, userData);
    }
  };

  const handleComplete = async () => {
    if (!token) {
      Alert.alert("Error", "Authentication token not found");
      return;
    }

    try {
      await saveOnboardingData(userData, token);
      await SecureStore.deleteItemAsync("onboarding_progress");
      await SecureStore.setItemAsync("onboarding_complete", "true");
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Onboarding save error:", error);
      Alert.alert("Error", "Failed to save onboarding data. Please try again.");
    }
  };

  const goToStep = async (s: number) => {
    if (s >= 1 && s <= 5 && s !== step) {
      setStep(s);
      await saveOnboardingProgress(s, userData);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      {step === 1 && (
        <OnboardingName
          onNext={handleNext}
          currentStep={step}
          totalSteps={5}
          onStepPress={goToStep}
          initialData={{ name: userData.name }}
        />
      )}
      {step === 2 && (
        <OnboardingAccounts
          onNext={handleNext}
          onBack={handlePrevious}
          currentStep={step}
          totalSteps={5}
          onStepPress={goToStep}
          initialData={{ accounts: userData.accounts }}
        />
      )}
      {step === 3 && (
        <OnboardingPrefs
          onNext={handleNext}
          onBack={handlePrevious}
          currentStep={step}
          totalSteps={5}
          onStepPress={goToStep}
          initialData={{ preferences: userData.preferences }}
        />
      )}
      {step === 4 && (
        <OnboardingCategories
          onNext={handleNext}
          onBack={handlePrevious}
          currentStep={step}
          totalSteps={5}
          onStepPress={goToStep}
          initialData={{ categories: userData.categories }}
        />
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
