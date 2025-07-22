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

const apiUrl = getApiUrl();
console.log("Using API URL:", apiUrl);

export const API_URL = apiUrl;
