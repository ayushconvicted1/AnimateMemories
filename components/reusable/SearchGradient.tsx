import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const FilterIcon = ({ color, size }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6.6C3 6.26863 3.26863 6 3.6 6H20.4C20.7314 6 21 6.26863 21 6.6C21 6.84021 20.893 7.06037 20.7163 7.2023L14.4 12.3V18L9.6 20.4V12.3L3.28373 7.2023C3.10696 7.06037 3 6.84021 3 6.6Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Eye icons for password toggle
const EyeIcon = ({ size = 20, color = "#7A7A7A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
      stroke={color}
      strokeWidth={1.5}
    />
  </Svg>
);

const EyeOffIcon = ({ size = 20, color = "#7A7A7A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.68 21.68 0 015.29-5.29M9.9 4.24A9.77 9.77 0 0112 4c7 0 11 7 11 7a21.8 21.8 0 01-3.31 4.19"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 1l22 22"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

type Props = {
  placeholder?: string;
  label?: string; // Label to show on top
  filter?: boolean;
  password?: boolean; // to enable secure input
  rightIcon?: React.ReactNode; // allow passing custom icon
  marginTop?: number;
  dropdown?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
} & TextInputProps;

const SearchGradient = ({
  placeholder,
  label,
  filter = false,
  password = false,
  rightIcon,
  marginTop = 20,
  dropdown = false,
  value,
  onChangeText,
  ...textInputProps
}: Props) => {
  const [secure, setSecure] = useState(password);

  // Use the original placeholder as label if label is not provided
  const displayLabel = label || placeholder;
  
  // Generate contextual placeholder based on label/field type
  const getContextualPlaceholder = () => {
    const labelLower = (displayLabel || "").toLowerCase();
    
    if (password) {
      return "••••••••";
    }
    
    if (labelLower.includes("name") && labelLower.includes("full")) {
      return "eg. John Smith";
    }
    
    if (labelLower.includes("name")) {
      return "eg. John";
    }
    
    if (labelLower.includes("email")) {
      return "eg. test@example.com";
    }
    
    if (labelLower.includes("phone")) {
      return "eg. +1 234 567 8900";
    }
    
    if (labelLower.includes("search")) {
      return "Search here...";
    }
    
    // Default fallback
    return "Type here...";
  };
  
  const inputPlaceholder = getContextualPlaceholder();

  return (
    <View style={[styles.wrapper, { marginTop }]}>
      {/* Label on top */}
      {displayLabel && (
        <Text style={styles.label}>{displayLabel}</Text>
      )}
      
      <View style={styles.container}>
        {dropdown ? (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownText} {...textInputProps}>
              {inputPlaceholder}
            </Text>
          </View>
        ) : (
          <TextInput
            placeholder={inputPlaceholder}
            placeholderTextColor="#7A7A7A"
            secureTextEntry={secure}
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            // Disable password suggestions and autofill
            passwordRules={password ? "minlength: 8;" : undefined}
            textContentType={password ? "newPassword" : textInputProps.textContentType}
            autoComplete={password ? "new-password" : textInputProps.autoComplete}
            {...textInputProps}
          />
        )}

        {/* Right-side icons */}
        {password ? (
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            {secure ? <EyeOffIcon color="#7A7A7A" /> : <EyeIcon color="#7A7A7A" />}
          </TouchableOpacity>
        ) : rightIcon ? (
          rightIcon
        ) : filter ? (
          <FilterIcon color="#7A7A7A" size={20} />
        ) : dropdown ? (
          <TouchableOpacity style={{ padding: 5 }}>
            {/* <ChevronDown color="#7A7A7A" /> */}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    // Wrapper for the entire component including label
  },
  label: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "500",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    height: "100%",
  },
  dropdownContainer: {
    flex: 1,
    justifyContent: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
  },
});

export default SearchGradient;
