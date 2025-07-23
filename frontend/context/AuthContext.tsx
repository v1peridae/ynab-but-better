import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

interface AuthContextType {
  token: string | null;
  login: (token: string, refreshToken: string, redirect?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  logout: async () => {},
  loading: false,
  isLoggedIn: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Error loading token", error);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (token: string, refreshToken: string, redirect: boolean = true) => {
    try {
      await SecureStore.setItemAsync("token", token);
      await SecureStore.setItemAsync("refreshToken", refreshToken);
      setToken(token);
      if (redirect) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Error logging in", error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("refreshToken");
      await SecureStore.deleteItemAsync("onboarding_complete");
      await SecureStore.deleteItemAsync("onboarding_progress");
      setToken(null);
      router.replace("/auth/login");
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoggedIn: !!token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
