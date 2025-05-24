import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme, ColorSchemeName } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "./AuthContext";
import { API_URL } from "@/constants/apiurl";

interface userPreferences {
  currency: string;
  dateFormat: string;
  theme: "light" | "dark" | "auto";
  notifications: boolean;
}

interface PreferencesContextType {
  preferences: userPreferences;
  updatePreference: (key: keyof userPreferences, value: any) => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  getTheme: () => "light" | "dark";
  loading: boolean;
}

const defaultPreferences: userPreferences = {
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  theme: "auto",
  notifications: true,
};

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaultPreferences,
  formatCurrency: (amount: number) => `$${(amount / 100).toFixed(2)}`,
  formatDate: (date: Date | string) => new Date(date).toLocaleDateString(),
  getTheme: () => "light",
  loading: false,
});

export const usePreferences = () => useContext(PreferencesContext);

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
};
export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const systemColorScheme = useColorScheme();
  const [preferences, setPreferences] = useState<userPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/user/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        if (userData.preferences) {
          const serverPreferences = { ...defaultPreferences, ...userData.preferences };
          setPreferences(serverPreferences);
          await SecureStore.setItemAsync("userPreferences", JSON.stringify(serverPreferences));
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      try {
        const cached = await SecureStore.getItemAsync("userPreferences");
        if (cached) {
          setPreferences(JSON.parse(cached));
        }
      } catch (error) {
        console.error("Error loading cached preferences:", error);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPreferences();
  }, [token]);

  const updatePreference = async (key: keyof userPreferences, value: any) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    try {
      await SecureStore.setItemAsync("userPreferences", JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error("Error caching preferences:", error);
    }
    if (token) {
      try {
        const response = await fetch(`${API_URL}/user/preferences`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [key]: value }),
        });
        if (!response.ok) {
          throw new Error("Failed to update preferences");
        }
      } catch (error) {
        console.error("Error updating preferences:", error);

        setPreferences(preferences);
        try {
          await SecureStore.setItemAsync("userPreferences", JSON.stringify(preferences));
        } catch (error) {
          console.error("Error caching preferences:", error);
        }
      }
    }
  };
  const formatCurrency = (amount: number): string => {
    const symbol = CURRENCY_SYMBOLS[preferences.currency] || "$";
    const value = Math.abs(amount / 100);

    if (preferences.currency === "JPY") {
      return `${symbol}${Math.round(value)}`;
    }

    return `${symbol}${value.toFixed(2)}`;
  };
  const formatDate = (date: Date | string): string => {
    const dateObj = new Date(date);

    switch (preferences.dateFormat) {
      case "DD/MM/YYYY":
        return dateObj.toLocaleDateString("en-GB");
      case "MM/DD/YYYY":
        return dateObj.toLocaleDateString("en-US");
      case "YYYY-MM-DD":
        return dateObj.toISOString().split("T")[0];
      case "DD-MM-YYYY":
        return dateObj.toLocaleDateString("en-GB").replace(/\//g, "-");
      case "MM-DD-YYYY":
        return dateObj.toLocaleDateString("en-US").replace(/\//g, "-");
      default:
        return dateObj.toLocaleDateString("en-US");
    }
  };
  const getTheme = (): "light" | "dark" => {
    if (preferences.theme === "auto") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return preferences.theme;
  };
  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreference,
        formatCurrency,
        formatDate,
        getTheme,
        loading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};
