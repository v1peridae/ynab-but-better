import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ScrollView, ActivityIndicator, StatusBar } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@/constants/apiurl";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { profile, loading, updateProfile, deleteProfilePicture } = useUser();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.name || "");
  const [updating, setUpdating] = useState(false);

  const navigateToAccounts = () => {
    router.push("/accounts");
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setUpdating(true);
        await updateProfile(undefined, result.assets[0].uri);
        setUpdating(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setUpdating(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera permissions to make this work!");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setUpdating(true);
        await updateProfile(undefined, result.assets[0].uri);
        setUpdating(false);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setUpdating(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert("Profile Picture", "Choose an option", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickImage },
      { text: "Remove Photo", onPress: handleDeleteProfilePicture, style: "destructive" },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDeleteProfilePicture = () => {
    Alert.alert("Remove Profile Picture", "Are you sure you want to remove your profile picture?", [
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setUpdating(true);
          await deleteProfilePicture();
          setUpdating(false);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSaveName = async () => {
    if (editName.trim() === "") {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setUpdating(true);
    await updateProfile(editName.trim());
    setUpdating(false);
    setEditModalVisible(false);
  };

  const getProfileImageSource = () => {
    if (profile?.profilePicture) {
      return { uri: `${API_URL}${profile.profilePicture}` };
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
        <ActivityIndicator size="large" color="#E5E5E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E14" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profilePictureContainer} onLongPress={showImagePicker} disabled={updating} delayLongPress={500}>
            {getProfileImageSource() ? (
              <Image source={getProfileImageSource()} style={styles.profilePicture} contentFit="cover" />
            ) : (
              <View style={styles.placeholderPicture}>
                <Ionicons name="person" size={50} color="#666" />
              </View>
            )}
            {updating && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#E5E5E5" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nameContainer}
            onPress={() => {
              setEditName(profile?.name || "");
              setEditModalVisible(true);
            }}
          >
            <ThemedText style={styles.userName}>{profile?.name || "Add your name"}</ThemedText>
            <Ionicons name="pencil" size={16} color="#666" style={styles.editNameIcon} />
          </TouchableOpacity>
          <ThemedText style={styles.userEmail}>{profile?.email}</ThemedText>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToAccounts}>
            <Ionicons name="wallet-outline" size={24} color="#E5E5E5" />
            <ThemedText style={styles.menuText}>Manage Accounts</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="pie-chart-outline" size={24} color="#E5E5E5" />
            <ThemedText style={styles.menuText}>Manage Categories</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
            <Ionicons name="settings-outline" size={24} color="#E5E5E5" />
            <ThemedText style={styles.menuText}>Settings</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
            <ThemedText style={[styles.menuText, { color: "#ff6b6b" }]}>Log Out</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editModalVisible} transparent={true} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Edit Name</ThemedText>
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor="#666"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator size="small" color="#E5E5E5" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14" },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0E14" },
  profileSection: { alignItems: "center", marginBottom: 40, borderRadius: 18, padding: 30, opacity: 0.5, marginTop: 50 },
  profilePictureContainer: { position: "relative", marginBottom: 20 },
  profilePicture: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#333" },
  placeholderPicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  nameContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  userName: { fontSize: 20, fontWeight: "600", color: "#E5E5E5", marginRight: 8 },
  editNameIcon: { opacity: 0.7 },
  userEmail: { fontSize: 16, color: "#666", fontWeight: "500" },
  menu: { marginTop: 0 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#252933",
    marginBottom: 16,
    opacity: 0.5,
  },
  menuText: { fontSize: 16, marginLeft: 12, flex: 1, color: "#E5E5E5", fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#252933", borderRadius: 18, padding: 25, width: "80%", maxWidth: 300, opacity: 0.95 },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 20, textAlign: "center", color: "#E5E5E5" },
  nameInput: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#E5E5E5",
    backgroundColor: "#1a1a1a",
    marginBottom: 25,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalButton: { flex: 1, padding: 15, borderRadius: 12, alignItems: "center" },
  cancelButton: { backgroundColor: "#333", marginRight: 10 },
  saveButton: { backgroundColor: "#575F72", marginLeft: 10 },
  buttonText: { color: "#E5E5E5", fontWeight: "600", fontSize: 16 },
  saveButtonText: { color: "#E5E5E5", fontWeight: "600", fontSize: 16 },
});
