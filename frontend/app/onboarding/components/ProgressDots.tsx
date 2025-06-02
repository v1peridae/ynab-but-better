import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
  onStepPress?: (step: number) => void;
}

export default function ProgressDots({ totalSteps, currentStep, onStepPress }: ProgressDotsProps) {
  return (
    <View style={styles.progressDots}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <TouchableOpacity
            style={[styles.dot, i + 1 === currentStep && styles.activeDot]}
            disabled={!onStepPress || i + 1 === currentStep}
            onPress={() => onStepPress && onStepPress(i + 1)}
            accessibilityRole="button"
            accessibilityLabel={`Go to step ${i + 1}`}
          />
          {i < totalSteps - 1 && <View style={styles.progressLine} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 260,
    marginBottom: 10,
    alignSelf: "center",
  },
  dot: { width: 25, height: 25, borderRadius: 12.5, backgroundColor: "#333", marginHorizontal: 2 },
  activeDot: { backgroundColor: "#666" },
  progressLine: { flex: 1, height: 2, backgroundColor: "#333", minWidth: 10, maxWidth: 30 },
});
