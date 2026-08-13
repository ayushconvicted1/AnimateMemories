import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useTour } from '@/contexts/TourContext';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { isActive } = useTour();

  return (
    <PlatformPressable
      {...props}
      disabled={isActive}
      onPressIn={(ev) => {
        if (!isActive && process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}