import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
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

  return (
    <ThemedView style={styles.container}>
      {step === 1 && <OnboardingName onNext={handleNext} />}
      {step === 2 && <OnboardingAccounts onNext={handleNext} onBack={handlePrevious} />}
      {step === 3 && <OnboardingCategories onNext={handleNext} onBack={handlePrevious} />}
      {step === 4 && <OnboardingComplete userData={userData} onComplete={handleComplete} onBack={handlePrevious} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
