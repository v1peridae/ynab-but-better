import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Switch, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/apiurl";

export default function AddTransactionScreen() {
  const { token } = useAuth();
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

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
  const [flagColor, setFlagColor] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [isCleared, setIsCleared] = useState(false);

  // UI state
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showTransferAccountPicker, setShowTransferAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data fetching states
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Flag color options
  const flagColors = [
    { label: "None", value: null, color: "#CCCCCC" },
    { label: "Red", value: "red", color: "#F44336" },
    { label: "Yellow", value: "yellow", color: "#FFC107" },
    { label: "Green", value: "green", color: "#4CAF50" },
    { label: "Blue", value: "blue", color: "#2196F3" },
    { label: "Purple", value: "purple", color: "#9C27B0" },
  ];

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
          // error removed
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
      setFlagColor(null);
      setDate(new Date());
      setIsCleared(false);

      Alert.alert("Success", "Transaction added successfully");
    } catch (error) {
      // error removed
      Alert.alert("Error", "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (id: number | null) => {
    if (!id) return "Select Account";
    const account = accounts.find((a: any) => a.id === id);
    return account ? account.name : "Select Account";
  };

  const getCategoryName = (id: number | null) => {
    if (!id) return "Select Category";
    const category = categories.find((c: any) => c.id === id);
    return category ? category.name : "Select Category";
  };

  const getFrequencyName = (value: string) => {
    const frequency = frequencyOptions.find((f) => f.value === value);
    return frequency ? frequency.label : "Select Frequency";
  };

  if (loading && accounts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Add Transaction</ThemedText>

        {/* Transaction Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleButton, !isInflow && styles.activeToggle]} onPress={() => setIsInflow(false)}>
            <ThemedText style={isInflow ? styles.inactiveText : styles.activeText}>Outflow</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, isInflow && styles.activeToggle]} onPress={() => setIsInflow(true)}>
            <ThemedText style={!isInflow ? styles.inactiveText : styles.activeText}>Inflow</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor }]}
          placeholder="Enter description"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
        />

        {/* Amount */}
        <ThemedText style={styles.label}>Amount</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: textColor }]}
          placeholder="0.00"
          placeholderTextColor="#888"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Account - Compact Dropdown */}
        <ThemedText style={styles.label}>Account</ThemedText>
        <TouchableOpacity style={[styles.dropdownButton, { borderColor: textColor }]} onPress={() => setShowAccountPicker(true)}>
          <ThemedText>{getAccountName(selectedAccountId)}</ThemedText>
        </TouchableOpacity>

        {/* Is Transfer */}
        <View style={styles.switchRow}>
          <ThemedText>Is this a transfer?</ThemedText>
          <Switch value={isTransfer} onValueChange={setIsTransfer} trackColor={{ false: "#767577", true: tintColor }} />
        </View>

        {isTransfer ? (
          <>
            {/* Transfer To Account - Compact Dropdown */}
            <ThemedText style={styles.label}>Transfer To Account</ThemedText>
            <TouchableOpacity
              style={[styles.dropdownButton, { borderColor: textColor }]}
              onPress={() => setShowTransferAccountPicker(true)}
            >
              <ThemedText>{getAccountName(transferToAccountId)}</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Category - Compact Dropdown */}
            <ThemedText style={styles.label}>Category</ThemedText>
            <TouchableOpacity style={[styles.dropdownButton, { borderColor: textColor }]} onPress={() => setShowCategoryPicker(true)}>
              <ThemedText>{getCategoryName(selectedCategoryId)}</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Date */}
        <ThemedText style={styles.label}>Date</ThemedText>
        <TouchableOpacity style={[styles.dropdownButton, { borderColor: textColor }]} onPress={() => setShowDatePicker(true)}>
          <ThemedText>{date.toLocaleDateString()}</ThemedText>
        </TouchableOpacity>

        {/* Repeat */}
        <View style={styles.switchRow}>
          <ThemedText>Recurring Transaction</ThemedText>
          <Switch value={isRepeated} onValueChange={setIsRepeated} trackColor={{ false: "#767577", true: tintColor }} />
        </View>

        {isRepeated && (
          <>
            <ThemedText style={styles.label}>Repeat Frequency</ThemedText>
            <TouchableOpacity style={[styles.dropdownButton, { borderColor: textColor }]} onPress={() => setShowFrequencyPicker(true)}>
              <ThemedText>{getFrequencyName(repeatFrequency)}</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Flag Color */}
        <ThemedText style={styles.label}>Flag Color</ThemedText>
        <View style={styles.flagsContainer}>
          {flagColors.map((flag) => (
            <TouchableOpacity
              key={flag.value || "none"}
              style={[styles.flagButton, { backgroundColor: flag.color }, flagColor === flag.value && styles.selectedFlag]}
              onPress={() => setFlagColor(flag.value)}
            />
          ))}
        </View>

        {/* Cleared */}
        <View style={styles.switchRow}>
          <ThemedText>Cleared</ThemedText>
          <Switch value={isCleared} onValueChange={setIsCleared} trackColor={{ false: "#767577", true: tintColor }} />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.addButtonText}>Add Transaction</ThemedText>}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Pickers */}
      <Modal visible={showAccountPicker} transparent animationType="slide" onRequestClose={() => setShowAccountPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Select Account</ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {accounts.map((account: any) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedAccountId(account.id);
                    setShowAccountPicker(false);
                  }}
                >
                  <ThemedText style={selectedAccountId === account.id ? styles.selectedItemText : undefined}>{account.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowAccountPicker(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTransferAccountPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransferAccountPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Select Transfer Account</ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {accounts.map((account: any) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setTransferToAccountId(account.id);
                    setShowTransferAccountPicker(false);
                  }}
                >
                  <ThemedText style={transferToAccountId === account.id ? styles.selectedItemText : undefined}>{account.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTransferAccountPicker(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Select Category</ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {categories.map((category: any) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <ThemedText style={selectedCategoryId === category.id ? styles.selectedItemText : undefined}>{category.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryPicker(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showFrequencyPicker} transparent animationType="slide" onRequestClose={() => setShowFrequencyPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Select Frequency</ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setRepeatFrequency(option.value);
                    setShowFrequencyPicker(false);
                  }}
                >
                  <ThemedText style={repeatFrequency === option.value ? styles.selectedItemText : undefined}>{option.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowFrequencyPicker(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  toggleContainer: { flexDirection: "row", marginBottom: 20, borderRadius: 8, overflow: "hidden" },
  toggleButton: { flex: 1, padding: 12, alignItems: "center", backgroundColor: "#EEEEEE" },
  activeToggle: { backgroundColor: "#000000" },
  activeText: { color: "#FFFFFF" },
  inactiveText: { color: "#000000" },
  label: { fontSize: 16, marginBottom: 5 },
  input: { height: 40, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginBottom: 15 },
  dropdownButton: { height: 40, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginBottom: 15, justifyContent: "center" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  flagsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  flagButton: { width: 30, height: 30, borderRadius: 15 },
  selectedFlag: { borderWidth: 2, borderColor: "#000000" },
  addButton: { backgroundColor: "#000000", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 10, marginBottom: 30 },
  addButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: {
    width: "80%",
    maxHeight: "60%",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalScrollView: { maxHeight: 300 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EEEEEE" },
  selectedItemText: { fontWeight: "bold", color: "#000000" },
  modalCloseButton: { marginTop: 15, padding: 10, backgroundColor: "#000000", borderRadius: 5, alignItems: "center" },
  modalCloseText: { color: "#FFFFFF", fontWeight: "bold" },
});
