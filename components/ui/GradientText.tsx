import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { getFontFamily } from '@/constants/Fonts';

interface GradientTextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  colors?: [string, string, ...string[]];
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
    fontFamily: getFontFamily("700"),
  },
});

