import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={"#575F72"} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={"#575F72"} />,
        }}
      />
      <Tabs.Screen
        name="add-transactions"
        options={{
          title: "",
          tabBarIcon: () => (
            <View
              style={{
                width: 50,
                height: 50,
                backgroundColor: "#0D0E14",
                borderRadius: 25,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons name="add" size={30} color="#575F72" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={"#575F72"} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={"#575F72"} />,
        }}
      />
    </Tabs>
  );
}
