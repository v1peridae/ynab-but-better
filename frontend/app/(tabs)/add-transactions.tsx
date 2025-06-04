//part of this too is vibecoded because the logic was making me crash out </3

import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Switch, StatusBar, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";
import { FormattedDate } from "@/components/FormattedDate";

export default function AddTransactionScreen() {
  const { token } = useAuth();

  // Transaction states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isInflow, setIsInflow] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isTransfer, setIsTransfer] = useState(false);
  const [transferToAccountId, setTransferToAccountId] = useState<number | null>(null);
  const [isRepeated, setIsRepeated] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState("monthly");
  const [date, setDate] = useState(new Date());

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data fetching states
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const frequencyOptions = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Bi-Weekly", value: "biweekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Annually", value: "annually" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        setLoading(true);
        try {
          const [accountsResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_URL}/accounts`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/categories`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (accountsResponse.ok) {
            const accountsData = await accountsResponse.json();
            setAccounts(accountsData);
          }

          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData);
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [token]);

  const handleAddTransaction = async () => {
    if (!description || !amount || !selectedAccountId || (!isTransfer && !selectedCategoryId) || (isTransfer && !transferToAccountId)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents)) {
      Alert.alert("Error", "Invalid amount");
      return;
    }

    setLoading(true);

    try {
      if (!isTransfer) {
        const response = await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description,
            amount: amountInCents * (isInflow ? 1 : -1),
            accountId: selectedAccountId,
            categoryId: !isInflow ? selectedCategoryId : null,
            date: date.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add transaction");
        }
      } else {
        const fromResponse = await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: `${description} (Transfer from)`,
            amount: -Math.abs(amountInCents),
            accountId: selectedAccountId,
            categoryId: null,
            date: date.toISOString(),
          }),
        });

        if (!fromResponse.ok) {
          throw new Error("Failed to add transfer (from account)");
        }

        const toResponse = await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: `${description} (Transfer to)`,
            amount: Math.abs(amountInCents),
            accountId: transferToAccountId,
            categoryId: null,
            date: date.toISOString(),
          }),
        });

        if (!toResponse.ok) {
          throw new Error("Failed to add transfer (to account)");
        }
      }

      setDescription("");
      setAmount("");
      setIsInflow(false);
      setSelectedAccountId(null);
      setSelectedCategoryId(null);
      setIsTransfer(false);
      setTransferToAccountId(null);
      setIsRepeated(false);
      setRepeatFrequency("monthly");
      setDate(new Date());

      Alert.alert("Success", "Transaction added successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
        <ActivityIndicator size="large" color="#E5E5E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add A Transaction</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleButton, isInflow && styles.activeToggle]} onPress={() => setIsInflow(true)}>
            <Text style={[styles.toggleText, isInflow && styles.activeToggleText]}>Inflow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, !isInflow && styles.activeToggle]} onPress={() => setIsInflow(false)}>
            <Text style={[styles.toggleText, !isInflow && styles.activeToggleText]}>Outflow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountContainer}>
          <TextInput
            style={styles.amountDisplay}
            value={amount ? `$${amount}` : "$0.00"}
            onChangeText={(text) => {
              const cleanText = text.replace(/[^0-9.]/g, "");
              setAmount(cleanText);
            }}
            keyboardType="decimal-pad"
            placeholder="$0.00"
            placeholderTextColor="#E5E5E5"
            textAlign="center"
            selectTextOnFocus={true}
          />
        </View>

        {/* Transaction Name */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Transaction Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter description"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Payee Account</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedAccountId}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              onValueChange={(itemValue) => setSelectedAccountId(itemValue)}
              dropdownIconColor="#E5E5E5"
            >
              <Picker.Item label="Select Account" value={null} color="#666" />
              {accounts.map((account: any) => (
                <Picker.Item key={account.id} label={account.name} value={account.id} color="#E5E5E5" />
              ))}
            </Picker>
          </View>
        </View>

        {/* Transfer Toggle */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Is this a transfer?</Text>
          <Switch
            value={isTransfer}
            onValueChange={setIsTransfer}
            trackColor={{ false: "#767577", true: "#777076" }}
            thumbColor="#E5E5E5"
          />
        </View>

        {isTransfer ? (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Transfer To Account</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={transferToAccountId}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(itemValue) => setTransferToAccountId(itemValue)}
                dropdownIconColor="#E5E5E5"
              >
                <Picker.Item label="Select Account" value={null} color="#666" />
                {accounts.map((account: any) => (
                  <Picker.Item key={account.id} label={account.name} value={account.id} color="#E5E5E5" />
                ))}
              </Picker>
            </View>
          </View>
        ) : (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategoryId}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(itemValue) => setSelectedCategoryId(itemValue)}
                dropdownIconColor="#E5E5E5"
              >
                <Picker.Item label="Select Category" value={null} color="#666" />
                {categories.map((category: any) => (
                  <Picker.Item key={category.id} label={category.name} value={category.id} color="#E5E5E5" />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Date */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDatePicker(true)}>
            <FormattedDate date={date} />
          </TouchableOpacity>
        </View>

        {/* Recurring Toggle */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Is this recurring</Text>
          <Switch
            value={isRepeated}
            onValueChange={setIsRepeated}
            trackColor={{ false: "#767577", true: "#777076" }}
            thumbColor="#E5E5E5"
          />
        </View>

        {isRepeated && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Repeat Frequency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={repeatFrequency}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(itemValue) => setRepeatFrequency(itemValue)}
                dropdownIconColor="#E5E5E5"
              >
                {frequencyOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} color="#E5E5E5" />
                ))}
              </Picker>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction} disabled={loading}>
          {loading ? <ActivityIndicator color="#E5E5E5" /> : <Text style={styles.addButtonText}>Add</Text>}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14", paddingTop: 60 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "600", color: "#666", textAlign: "center", marginBottom: 30, marginTop: 20 },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#252933",
    opacity: 0.5,
    borderRadius: 18,
    marginBottom: 30,
    overflow: "hidden",
  },
  toggleButton: { flex: 1, paddingVertical: 16, alignItems: "center" },
  activeToggle: { backgroundColor: "#777076" },
  toggleText: { fontSize: 16, fontWeight: "600", color: "#666" },
  activeToggleText: { color: "#E5E5E5" },
  amountContainer: { alignItems: "center", marginBottom: 40 },
  amountDisplay: { fontSize: 48, fontWeight: "bold", color: "#E5E5E5", textAlign: "center", backgroundColor: "transparent", minWidth: 200 },
  inputSection: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#666", marginBottom: 8 },
  input: { backgroundColor: "#252933", opacity: 0.5, height: 50, borderRadius: 18, paddingHorizontal: 16, color: "#E5E5E5", fontSize: 16 },
  pickerContainer: { backgroundColor: "transparent", borderRadius: 18, height: 50, overflow: "hidden" },
  picker: { height: 50, color: "#E5E5E5", borderRadius: 18, backgroundColor: "transparent" },
  pickerItem: { height: 50, fontSize: 16, color: "#E5E5E5" },
  dropdownButton: {
    backgroundColor: "#252933",
    opacity: 0.5,
    height: 50,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#E5E5E5" },
  addButton: { backgroundColor: "#252933", opacity: 0.5, paddingVertical: 16, borderRadius: 18, alignItems: "center", marginTop: 20 },
  addButtonText: { color: "#E5E5E5", fontSize: 18, fontWeight: "600" },
});
