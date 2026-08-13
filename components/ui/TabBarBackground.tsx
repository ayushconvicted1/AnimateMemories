import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabBarBackground() {
  return (
    <View style={styles.solidBackground} />
  );
}

const styles = StyleSheet.create({
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
});
