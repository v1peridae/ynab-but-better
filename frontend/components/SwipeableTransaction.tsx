import React, { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Animated, PanResponder, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = screenWidth * 0.25;
const DELETE_ZONE_WIDTH = 80;

interface SwipeableTransactionProps {
  children: React.ReactNode;
  onDelete: () => void;
  transactionId: string;
  description: string;
}

export function SwipeableTransaction({ children, onDelete, transactionId, description }: SwipeableTransactionProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const backgroundColor = useThemeColor({}, "background");

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (event, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dx < 0) {
          const newTranslateX = Math.max(gestureState.dx, -DELETE_ZONE_WIDTH);
          translateX.setValue(newTranslateX);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -DELETE_ZONE_WIDTH,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
          setIsDeleteVisible(true);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
          setIsDeleteVisible(false);
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
        setIsDeleteVisible(false);
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert("Delete Transaction", `Are you sure you want to delete "${description}"?`, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
          setIsDeleteVisible(false);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            onDelete();
          });
        },
      },
    ]);
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
    setIsDeleteVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.deleteContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <ThemedText style={styles.deleteText}>Delete</ThemedText>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { backgroundColor }, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.contentTouchable}
          onPress={isDeleteVisible ? resetPosition : undefined}
          activeOpacity={isDeleteVisible ? 0.7 : 1}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", overflow: "hidden" },
  deleteContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ZONE_WIDTH,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: { flex: 1, width: "100%", justifyContent: "center", alignItems: "center", paddingHorizontal: 10 },
  deleteText: { color: "#fff", fontSize: 12, fontWeight: "600", marginTop: 2 },
  content: {},
  contentTouchable: { width: "100%" },
});
