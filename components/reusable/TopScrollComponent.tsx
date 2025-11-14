import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TopScrollComponentProps {
  children: React.ReactNode;
  contentContainerStyle?: any;
  style?: any;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}

const TopScrollComponent = ({
  children,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = "handled",
}: TopScrollComponentProps) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={[
            {
              paddingBottom: insets.bottom + 100,
              paddingHorizontal: "4%",
              flexGrow: 1,
            },
            contentContainerStyle,
          ]}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          bounces={true}
          alwaysBounceVertical={false}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default TopScrollComponent;
