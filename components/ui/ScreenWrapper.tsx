import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform, ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TabHeader from './TabHeader';

interface ScreenWrapperProps extends ScrollViewProps {
  children: ReactNode;
  showHeader?: boolean;
  creditsText?: string;
  addBottomPadding?: boolean;
  contentContainerStyle?: any;
  useCustomScroll?: boolean; // If true, just render header and children without ScrollView
  backgroundColor?: string;
}

export default function ScreenWrapper({
  children,
  showHeader = true,
  creditsText,
  addBottomPadding = true,
  contentContainerStyle,
  useCustomScroll = false,
  backgroundColor = "#fff",
  ...scrollViewProps
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  // Dynamic Tab bar height accounting for safe area insets
  const tabBarHeight = (Platform.OS === 'ios' ? 75 : 65) + Math.max(insets.bottom, Platform.OS === 'ios' ? 30 : 16);
  const bottomPadding = addBottomPadding ? tabBarHeight : 0;

  // If using custom scroll (like FlatList), just render header and children
  if (useCustomScroll) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'left', 'right']}>
        {showHeader && <TabHeader creditsText={creditsText} />}
        <View style={[styles.customScrollContainer, { paddingBottom: bottomPadding }]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: backgroundColor === 'transparent' ? 'transparent' : undefined }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomPadding },
          contentContainerStyle,
        ]}
        {...scrollViewProps}
      >
        {showHeader && (
          <View style={{ zIndex: 10 }}>
            <TabHeader creditsText={creditsText} />
          </View>
        )}
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
  customScrollContainer: {
    flex: 1,
  },
});

