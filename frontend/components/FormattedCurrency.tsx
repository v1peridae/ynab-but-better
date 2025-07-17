import React from "react";
import { usePreferences } from "@/context/PreferencesContext";
import { ThemedText } from "./ThemedText";
import { View } from "react-native";

interface FormattedCurrencyProps {
  amount: number;
  style?: any;
  showSign?: boolean;
  splitFormat?: boolean;
  dollarsStyle?: any;
  centsStyle?: any;
}

export const FormattedCurrency: React.FC<FormattedCurrencyProps> = ({
  amount,
  style,
  showSign = true,
  splitFormat = false,
  dollarsStyle,
  centsStyle,
}) => {
  const { formatCurrency, preferences } = usePreferences();
  const isPositive = amount >= 0;
  const sign = showSign ? (isPositive ? "+" : "-") : "";

  if (splitFormat) {
    const symbol = preferences.currency === "USD" ? "$" : preferences.currency === "EUR" ? "€" : preferences.currency === "GBP" ? "£" : "$";
    const value = Math.abs(amount / 100);
    const dollars = Math.floor(value);
    const cents = Math.round((value - dollars) * 100);

    return (
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <ThemedText style={[style, dollarsStyle]}>
          {sign}
          {symbol}
          {dollars}.
        </ThemedText>
        <ThemedText style={[style, centsStyle]}>{cents.toString().padStart(2, "0")}</ThemedText>
      </View>
    );
  }

  const formattedAmount = formatCurrency(Math.abs(amount));
  return (
    <ThemedText style={style}>
      {sign}
      {formattedAmount}
    </ThemedText>
  );
};
