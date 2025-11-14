import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const options = [
  { id: 'workplace', label: 'Work Place' },
  { id: 'chatgpt', label: 'Chat GPT' },
  { id: 'google', label: 'Google Search' },
  { id: 'social', label: 'Social Media' },
];

export default function OnboardingDiscovery() {
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleContinue = () => {
    router.push('/(onboarding)/purpose');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    // Don't auto-advance, wait for continue button
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          <Text style={styles.titleBlue}>How Did You </Text>
          <Text style={styles.titlePurple}>Hear About</Text>
          {'\n'}
          <Text style={styles.titleBlue}>Animate Memories ?</Text>
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                selectedOption === option.id && styles.selectedOption,
              ]}
              onPress={() => handleOptionSelect(option.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === option.id && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        {selectedOption && (
          <TouchableOpacity style={styles.continueContainer} onPress={handleContinue}>
            <LinearGradient
              colors={['#28D4FA', '#D229FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginRight: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28D4FA',
    borderRadius: 2,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 80,
    lineHeight: 40,
  },
  titleBlue: {
    color: '#28D4FA',
  },
  titlePurple: {
    color: '#D229FF',
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: 'rgba(40, 212, 250, 0.1)',
    borderColor: '#28D4FA',
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#28D4FA',
    fontWeight: '600',
  },
  continueContainer: {
    marginTop: 20,
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});