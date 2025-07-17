import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
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
  const { profile, loading, updateProfile, deleteProfilePicture, fetchProfile, refreshProfile } = useUser();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(profile?.name || "");
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  useEffect(() => {
    console.log("Profile changed in ProfileScreen:", profile);
    setEditName(profile?.name || "");
  }, [profile?.name]);

  useEffect(() => {
    if (!profile?.name && !loading) {
      console.log("Fetching profile because name is missing");
      fetchProfile();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

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

  const handleEditName = () => {
    setEditName(profile?.name || "");
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleSaveName = async () => {
    if (editName.trim() === "") {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setUpdating(true);
    await updateProfile(editName.trim());
    setUpdating(false);
    setIsEditingName(false);
  };
  const handleCancelEdit = () => {
    setEditName(profile?.name || "");
    setIsEditingName(false);
  };

  const getProfileImageSource = () => {
    if (profile?.profilePicture) {
      let path = profile.profilePicture;

      path = path.replace(/\\/g, "/");

      const uploadsIndex = path.lastIndexOf("uploads/");
      if (uploadsIndex !== -1) {
        path = path.substring(uploadsIndex);
      }
      if (path.startsWith("/")) {
        path = path.substring(1);
      }

      const imageUrl = path.startsWith("http") ? path : `${API_URL}/${path}`;

      return { uri: imageUrl };
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#E5E5E5"]} />}
      >
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

          {isEditingName ? (
            <TextInput
              ref={nameInputRef}
              style={styles.userName}
              value={editName}
              onChangeText={setEditName}
              placeholder={profile?.name ? "Edit your name" : "Enter your name"}
              placeholderTextColor="#666"
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
              returnKeyType="done"
              autoFocus
              textAlign="center"
            />
          ) : (
            <TouchableOpacity style={styles.nameContainer} onLongPress={handleEditName}>
              <ThemedText style={styles.userName}>{profile?.name || "Add your name"}</ThemedText>
              <Ionicons name="pencil" size={16} color="#666" style={styles.editNameIcon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToAccounts}>
            <ThemedText style={styles.menuText}>Manage Accounts</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <ThemedText style={styles.menuText}>Manage Categories</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
            <ThemedText style={styles.menuText}>Settings</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={logout}>
            <ThemedText style={[styles.menuText, { color: "#ff6b6b" }]}>Log Out</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E14" },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0E14" },
  profileSection: { alignItems: "center", borderRadius: 18, padding: 30, marginTop: 50 },
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
  userName: { fontSize: 34, fontWeight: "600", color: "#E5E5E5", marginRight: 8, paddingTop: 16 },
  editNameIcon: { opacity: 0.7 },
  nameHint: { fontSize: 14, color: "#666", marginTop: 5, textAlign: "center" },
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
  menuText: { fontSize: 16, marginLeft: 30, flex: 1, color: "#E5E5E5", fontWeight: "600" },
});
