import React from "react";
import { usePreferences } from "@/context/PreferencesContext";
import { ThemedText } from "./ThemedText";

interface FormattedCurrencyProps {
  amount: number;
  style?: any;
  showSign?: boolean;
}

export const FormattedCurrency: React.FC<FormattedCurrencyProps> = ({ amount, style, showSign = true }) => {
  const { formatCurrency } = usePreferences();
  const isPositive = amount >= 0;
  const sign = showSign && isPositive ? "+" : "";
  const formattedAmount = formatCurrency(Math.abs(amount));

  return (
    <ThemedText style={style}>
      {sign}
      {formattedAmount}
    </ThemedText>
  );
};
