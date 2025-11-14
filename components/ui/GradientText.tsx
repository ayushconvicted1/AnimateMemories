import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GradientTextProps {
  children: React.ReactNode;
  style?: TextStyle;
  colors?: string[];
}

export function GradientText({ 
  children, 
  style, 
  colors = ['#28D4FA', '#D229FF'] 
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]}>{children}</Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.text, style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    backgroundColor: 'transparent',
  },
});

