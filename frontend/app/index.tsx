import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/constants/apiurl";

export default function Index() {
  const { isLoggedIn, loading, token } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoggedIn || !token) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const localOnboardingStatus = await SecureStore.getItemAsync("onboarding_complete");
        if (localOnboardingStatus === "true") {
          setOnboardingComplete(true);
          return;
        }

        const response = await fetch(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const profile = await response.json();
          if (profile && profile.name) {
            setOnboardingComplete(true);
            await SecureStore.setItemAsync("onboarding_complete", "true");
          } else {
            setOnboardingComplete(false);
          }
        } else {
          setOnboardingComplete(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setOnboardingComplete(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [isLoggedIn, token]);

  if (loading || checkingOnboarding) return null;

  if (!isLoggedIn) {
    return <Redirect href="/start" />;
  }

  if (onboardingComplete === false) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
