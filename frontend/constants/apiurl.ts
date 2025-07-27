import { Platform } from "react-native";
import Constants from "expo-constants";

const getApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  const hostname = hostUri?.split(":")[0];

  if (hostname) {
    return `http://${hostname}:3000`;
  }

  return "http://165.232.130.152:3000";
};

const apiUrl =
  process.env.NODE_ENV === "production"
    ? "https://ynab-but-better-production.up.railway.app"
    : (() => {
        const hostUri = Constants.expoConfig?.hostUri;
        const hostname = hostUri?.split(":")[0];
        return hostname ? `http://${hostname}:3000` : "http://localhost:3000";
      })();

export const API_URL = apiUrl;
