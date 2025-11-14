import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { IconSymbol } from './IconSymbol';
import type { IconSymbolName } from './IconSymbol';

interface GradientIconProps {
  name: IconSymbolName;
  size?: number;
  focused?: boolean;
  inactiveColor?: string;
}

export function GradientIcon({ 
  name, 
  size = 28, 
  focused = false,
  inactiveColor = '#979797'
}: GradientIconProps) {
  if (focused) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <MaskedView
          style={styles.maskedView}
          maskElement={
            <View style={styles.iconContainer}>
              <IconSymbol 
                name={name} 
                size={size} 
                color="#000"
              />
            </View>
          }
        >
          <LinearGradient
            colors={['#28D4FA', '#D229FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </MaskedView>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <IconSymbol 
        name={name} 
        size={size} 
        color={inactiveColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedView: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

