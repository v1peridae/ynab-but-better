import React from "react";
import { ThemedText } from "./ThemedText";
import { usePreferences } from "@/context/PreferencesContext";

interface FormattedDateProps {
  date: Date | string;
  style?: any;
}

export const FormattedDate: React.FC<FormattedDateProps> = ({ date, style }) => {
  const { formatDate } = usePreferences();

  return <ThemedText style={style}>{formatDate(date)}</ThemedText>;
};
