import Constants from "expo-constants";

const getDevelopmentUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostname = hostUri.split(":")[0];
    if (hostname) {
      return `http://${hostname}:3000`;
    }
  }

  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:3000`;
  }
  return "http://localhost:3000";
};

export const API_URL = process.env.NODE_ENV === "production" ? "https://ynab-but-better.onrender.com" : getDevelopmentUrl();
