import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, Switch, ScrollView, Platform, ActivityIndicator } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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

const AddTransactionsScreen: React.FC = () => {
  const { token, logout } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
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
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoadingData(false);
        return;
      }
      try {
        await Promise.all([fetchAccounts(), fetchCategories()]);
      } catch (error) {
        console.error("Error during initial data fetch:", error);
      } finally {
        setLoadingData(false);
      }
    };

    init();
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
        Alert.alert("Session Expired", "Please login again");
        logout?.();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
        if (data.length > 0) {
          setSelectedAccountId(data[0].id);
        }
      } else {
        Alert.alert("Error", "Failed to fetch accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Alert.alert("Error", "Failed to fetch accounts");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        Alert.alert("Session Expired", "Please login again");
        logout?.();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } else {
        Alert.alert("Error", "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to fetch categories");
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const handleAddTransaction = async () => {
    if (!description || !amount || !selectedAccountId) {
      Alert.alert("Error", "Please fill in description, amount, and select an account");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents)) {
      Alert.alert("Error", "Invalid amount");
      return;
    }

    const finalAmount = isInflow ? amountInCents : -amountInCents;

    setSubmitting(true);
    try {
      const transaction = {
        description,
        amount: finalAmount,
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
        payeeId: selectedPayeeId,
        date: date.toISOString(),
        cleared: isCleared,
        memo,
        flag,
        repeat,
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
        Alert.alert("Session Expired", "Please login again");
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
      Alert.alert("Error", "Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription("");
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

  if (loadingData) {
    return (
      <ThemedView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 40 }}>
        <ThemedText style={styles.title}>New Transaction</ThemedText>
        <View style={styles.rowContainer}>
          <ThemedText style={styles.label}>Transaction Type</ThemedText>
          <View style={styles.flowTypeContainer}>
            <TouchableOpacity
              style={[styles.flowTypeButton, isInflow && { backgroundColor: tintColor, borderColor: tintColor }]}
              onPress={() => setIsInflow(true)}
            >
              <ThemedText style={isInflow ? styles.selectedFlowText : {}}>Income (+)</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flowTypeButton, !isInflow && { backgroundColor: tintColor, borderColor: tintColor }]}
              onPress={() => setIsInflow(false)}
            >
              <ThemedText style={!isInflow ? styles.selectedFlowText : {}}>Expense (-)</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor }]}
          placeholder="What's this transaction for?"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
        />

        <ThemedText style={styles.label}>Amount</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor }]}
          placeholder="0.00"
          placeholderTextColor="#888"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <ThemedText style={styles.formSectionTitle}>Account Details</ThemedText>
        <ThemedText style={styles.label}>From Account</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: textColor }]}>
          <Picker
            selectedValue={selectedAccountId}
            onValueChange={(itemValue) => setSelectedAccountId(itemValue)}
            style={[styles.picker, { color: textColor, height: 45 }]}
            dropdownIconColor={textColor}
          >
            {accounts.map((account) => (
              <Picker.Item key={account.id} label={account.name} value={account.id} />
            ))}
          </Picker>
        </View>

        <ThemedText style={styles.label}>Payee Account</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: textColor }]}>
          <Picker
            selectedValue={selectedPayeeId}
            onValueChange={(itemValue) => setSelectedPayeeId(itemValue)}
            style={[styles.picker, { color: textColor, height: 45 }]}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Not a transfer" value={null} />
            {accounts.map((account) => (
              <Picker.Item key={account.id} label={account.name} value={account.id} />
            ))}
          </Picker>
        </View>

        <ThemedText style={styles.formSectionTitle}>Details</ThemedText>
        <ThemedText style={styles.label}>Category</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: textColor }]}>
          <Picker
            selectedValue={selectedCategoryId}
            onValueChange={(itemValue) => setSelectedCategoryId(itemValue)}
            style={[styles.picker, { color: textColor, height: 45 }]}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Select category" value={null} />
            {categories.map((category) => (
              <Picker.Item key={category.id} label={category.name} value={category.id} />
            ))}
          </Picker>
        </View>

        <ThemedText style={styles.label}>Date</ThemedText>
        <TouchableOpacity style={[styles.dateButton, { borderColor: textColor, height: 45 }]} onPress={() => setShowDatePicker(true)}>
          <ThemedText>{date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</ThemedText>
        </TouchableOpacity>
        {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />}

        <ThemedText style={styles.formSectionTitle}>Additional Info</ThemedText>
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

        <View style={styles.switchContainer}>
          <ThemedText style={styles.label}>Cleared</ThemedText>
          <Switch
            value={isCleared}
            onValueChange={setIsCleared}
            trackColor={{ false: "#767577", true: tintColor }}
            thumbColor={isCleared ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        <ThemedText style={styles.label}>Flag Transaction</ThemedText>
        <View style={styles.flagContainer}>
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

        <ThemedText style={[styles.label, { marginTop: 20 }]}>Repeat</ThemedText>
        <View style={styles.repeatPickerContainer}>
          <Picker
            selectedValue={repeat}
            onValueChange={(itemValue) => setRepeat(itemValue as string)}
            style={[styles.repeatPicker, { height: 45 }]}
            dropdownIconColor={textColor}
          >
            <Picker.Item label="Never" value="never" />
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Yearly" value="yearly" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: submitting ? "#ccc" : tintColor,
              opacity: submitting ? 0.7 : 1,
              height: 50,
              marginTop: 20,
              marginBottom: 30,
            },
          ]}
          onPress={handleAddTransaction}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Save Transaction</ThemedText>}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
};

export default AddTransactionsScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 25, marginTop: 30 },
  label: { fontSize: 15, marginBottom: 6, fontWeight: "500" },
  input: { marginBottom: 15, padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, height: 45 },
  button: { padding: 15, borderRadius: 5, height: 50, marginTop: 20, marginBottom: 30, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  rowContainer: { flexDirection: "column", marginBottom: 10 },
  pickerContainer: { borderWidth: 1, borderRadius: 5, marginBottom: 15 },
  picker: { height: 45, paddingHorizontal: 10 },
  dateButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  switchContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 15 },
  flagContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", marginBottom: 20 },
  flagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedFlag: { borderWidth: 2, borderColor: "#000" },
  flowTypeContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  flowTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 5,
    borderWidth: 1,
    marginHorizontal: 3,
    alignItems: "center",
  },
  selectedFlowText: { color: "white", fontWeight: "600" },
  repeatPickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#ccc",
    marginBottom: 20,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 5,
    minHeight: 50,
    justifyContent: "center",
  },
  repeatPicker: {
    width: "100%",
    color: "#333",
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 12,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
});
