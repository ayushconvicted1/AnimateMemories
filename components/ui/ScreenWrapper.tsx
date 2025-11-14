import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform, ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabHeader from './TabHeader';

interface ScreenWrapperProps extends ScrollViewProps {
  children: ReactNode;
  showHeader?: boolean;
  creditsText?: string;
  addBottomPadding?: boolean;
  contentContainerStyle?: any;
}

export default function ScreenWrapper({
  children,
  showHeader = true,
  creditsText,
  addBottomPadding = true,
  contentContainerStyle,
  ...scrollViewProps
}: ScreenWrapperProps) {
  // Tab bar height: iOS = 105, Android = 90
  const tabBarHeight = Platform.OS === 'ios' ? 105 : 90;
  const bottomPadding = addBottomPadding ? tabBarHeight : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomPadding },
          contentContainerStyle,
        ]}
        {...scrollViewProps}
      >
        {showHeader && <TabHeader creditsText={creditsText} />}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

