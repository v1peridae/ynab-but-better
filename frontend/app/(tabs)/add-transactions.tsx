import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, Switch, ScrollView, Platform, ActivityIndicator } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@/constants/apiurl";

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

const AddTransactionsScreen = () => {
  const { token, logout } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [isInflow, setIsInflow] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPayeeId, setSelectedPayeeId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [memo, setMemo] = useState("");
  const [flag, setFlag] = useState("none");
  const [repeat, setRepeat] = useState("never");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  // Load accounts and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await Promise.all([fetchAccounts(), fetchCategories()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        Alert.alert("Session expired", "Please log in again");
        logout?.();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched accounts:", data);
        setAccounts(data);
        if (data.length > 0) {
          setSelectedAccountId(data[0].id);
        }
      } else {
        console.error("Failed to fetch accounts, status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Alert.alert("Error", "Failed to fetch accounts. Please try again.");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        Alert.alert("Session expired", "Please log in again");
        logout?.();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const saveTransaction = async () => {
    if (!amount || !selectedAccountId) {
      Alert.alert("Missing information", "Please enter an amount and select an account");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents)) {
      Alert.alert("Invalid amount", "Please enter a valid number");
      return;
    }

    const finalAmount = isInflow ? amountInCents : -amountInCents;
    const txDescription = description || payee || "Unnamed transaction";

    setSubmitting(true);

    try {
      const transaction = {
        description: txDescription,
        amount: finalAmount,
        accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
        categoryId: selectedCategoryId ? Number(selectedCategoryId) : undefined,
        payeeId: selectedPayeeId ? Number(selectedPayeeId) : undefined,
        memo,
        cleared: isCleared,
        flag,
        repeat,
        date: date.toISOString(),
      };

      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transaction),
      });

      if (response.status === 401) {
        Alert.alert("Session expired", "Please log in again");
        logout?.();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Error", errorData.message || "Failed to add transaction");
        return;
      }

      resetForm();
      Alert.alert("Success", "Transaction added successfully");
    } catch (error) {
      console.error("Error adding transaction:", error);
      Alert.alert("Error", "Failed to save transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setPayee("");
    setAmount("");
    setIsInflow(true);
    setDate(new Date());
    setIsCleared(false);
    setMemo("");
    setFlag("none");
    setRepeat("never");
  };

  const flagColors = {
    none: "#999",
    red: "#F44336",
    orange: "#FF9800",
    yellow: "#FFEB3B",
    green: "#4CAF50",
    blue: "#2196F3",
    purple: "#9C27B0",
  };

  // Debug accounts
  useEffect(() => {
    console.log("Current accounts:", accounts);
  }, [accounts]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Payee */}
        <ThemedText style={styles.label}>Payee</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor }]}
          placeholder="Payee (optional)"
          placeholderTextColor="#888"
          value={payee}
          onChangeText={setPayee}
        />

        {/* From Account */}
        <ThemedText style={styles.label}>From Account</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: textColor }]}>
          {accounts.length === 0 ? (
            <TouchableOpacity
              style={[styles.input, { borderColor: textColor, alignItems: "center", justifyContent: "center" }]}
              onPress={fetchAccounts}
            >
              <ThemedText>No accounts found. Tap to retry.</ThemedText>
            </TouchableOpacity>
          ) : (
            <Picker
              selectedValue={selectedAccountId}
              onValueChange={(itemValue) => setSelectedAccountId(itemValue)}
              style={[styles.picker, { color: textColor }]}
              dropdownIconColor={textColor}
            >
              {accounts.map((account) => (
                <Picker.Item key={account.id} label={account.name} value={account.id} />
              ))}
            </Picker>
          )}
        </View>

        {/* Transfer Account */}
        <ThemedText style={styles.label}>Transfer Account</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: textColor }]}>
          <Picker
            selectedValue={selectedPayeeId}
            onValueChange={(itemValue) => setSelectedPayeeId(itemValue)}
            style={[styles.picker, { color: textColor }]}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Not a transfer" value={null} />
            {accounts.map((account) => (
              <Picker.Item key={account.id} label={account.name} value={account.id} />
            ))}
          </Picker>
        </View>

        {/* Details Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Details</ThemedText>
        </View>

        {/* Category */}
        <ThemedText style={styles.label}>Category</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: textColor }]}>
          <Picker
            selectedValue={selectedCategoryId}
            onValueChange={(itemValue) => setSelectedCategoryId(itemValue)}
            style={[styles.picker, { color: textColor }]}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Select category" value={null} />
            {categories.map((category) => (
              <Picker.Item key={category.id} label={category.name} value={category.id} />
            ))}
          </Picker>
        </View>

        {/* Date */}
        <ThemedText style={styles.label}>Date</ThemedText>
        <TouchableOpacity
          style={[styles.input, { borderColor: textColor, alignItems: "center", justifyContent: "center" }]}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText>{date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</ThemedText>
        </TouchableOpacity>
        {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />}

        {/* Date chip */}
        <View style={styles.dateChip}>
          <ThemedText style={styles.dateChipText}>
            {date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </ThemedText>
        </View>

        {/* Additional Info Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Additional Info</ThemedText>
        </View>

        {/* Notes/Memo */}
        <ThemedText style={styles.label}>Notes / Memo</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor, height: 80, textAlignVertical: "top" }]}
          placeholder="Add notes about this transaction (optional)"
          placeholderTextColor="#888"
          value={memo}
          onChangeText={setMemo}
          multiline={true}
          numberOfLines={3}
        />

        {/* Cleared */}
        <View style={styles.switchRow}>
          <ThemedText style={styles.label}>Cleared</ThemedText>
          <Switch
            value={isCleared}
            onValueChange={setIsCleared}
            trackColor={{ false: "#767577", true: tintColor }}
            thumbColor={isCleared ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        {/* Flags */}
        <ThemedText style={styles.label}>Flag Transaction</ThemedText>
        <View style={styles.flagsContainer}>
          {Object.entries(flagColors).map(([flagName, color]) => (
            <TouchableOpacity
              key={flagName}
              style={[
                styles.flagButton,
                flag === flagName && styles.selectedFlag,
                { backgroundColor: color },
                flagName === "none" && { borderWidth: 1, borderColor: "#ccc", backgroundColor: "transparent" },
              ]}
              onPress={() => setFlag(flagName)}
            >
              {flag === flagName && <Ionicons name="checkmark" size={16} color="#fff" />}
              {flagName === "none" && flag !== "none" && <ThemedText style={{ fontSize: 10 }}>None</ThemedText>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Repeat */}
        <ThemedText style={styles.label}>Repeat</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: textColor }]}>
          <Picker
            selectedValue={repeat}
            onValueChange={(itemValue) => setRepeat(itemValue)}
            style={[styles.picker, { color: textColor }]}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Never" value="never" />
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Yearly" value="yearly" />
          </Picker>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: submitting ? "#ccc" : "#0a7ea4", opacity: submitting ? 0.7 : 1 }]}
          onPress={saveTransaction}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Save</ThemedText>}
        </TouchableOpacity>

        {/* Hidden fields */}
        <TextInput style={{ display: "none" }} value={description} onChangeText={setDescription} defaultValue={payee} />

        <TextInput style={{ display: "none" }} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" defaultValue="0" />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  label: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    height: 45,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  picker: {
    height: 45,
    backgroundColor: "transparent",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    paddingBottom: 8,
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dateChip: {
    backgroundColor: "#333",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginVertical: 10,
  },
  dateChipText: {
    color: "white",
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
  },
  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  flagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedFlag: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddTransactionsScreen;
