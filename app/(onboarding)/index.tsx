import { useEffect } from 'react';
import { router } from 'expo-router';

export default function OnboardingIndex() {
  useEffect(() => {
    // Redirect to first onboarding step (1M+ Downloads)
    router.replace('/(onboarding)/welcome');
  }, []);

  return null;
}