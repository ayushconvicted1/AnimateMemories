import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  AppState,
  Linking,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { getFontFamily } from "@/constants/Fonts";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@clerk/clerk-expo";
import { SvgUri } from 'react-native-svg';
import { api } from "@/services/api";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { iapService } from "@/services/iap-service";
import { trackPurchase, trackInitiatedCheckout } from "@/services/tracking";
import { IAP_PRODUCTS, IAP_SUBSCRIPTION_PRODUCTS } from "@/constants/iap-config";
import CustomSlider from '@/components/ui/CustomSlider';

const WEBSITE_BASE = "https://animatememories.com";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAYMENT_ICONS = ["visa", "mastercard", "applepay", "googlepay"];

const PACK_DETAILS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 30,
    price: 5.99,
    originalPrice: 12,
    subtitle: 'Perfect for getting started',
    productId: 'com.hexerve.AnimateMemories.credits.starter'
  },
  popular: {
    id: 'popular',
    name: 'Popular Pack',
    credits: 100,
    price: 19.99,
    originalPrice: 40,
    subtitle: 'Most popular for historians',
    productId: 'com.hexerve.AnimateMemories.credits.popular'
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 200,
    price: 34.99,
    originalPrice: 70,
    subtitle: 'Best value for professionals',
    productId: 'com.hexerve.AnimateMemories.credits.pro'
  }
};

const SUBSCRIPTION_DETAILS = {
  basic: {
    id: 'sub_basic',
    name: 'Basic Monthly',
    credits: 50,
    price: 7.99,
    originalPrice: 15,
    subtitle: 'Great for occasional use',
    productId: 'com.hexerve.AnimateMemories.sub.basic'
  },
  standard: {
    id: 'sub_standard',
    name: 'Standard Monthly',
    credits: 120,
    price: 14.99,
    originalPrice: 30,
    subtitle: 'Best for regular users',
    productId: 'com.hexerve.AnimateMemories.sub.standard'
  },
  premium: {
    id: 'sub_premium',
    name: 'Premium Monthly',
    credits: 250,
    price: 39.99,
    originalPrice: 70,
    subtitle: 'For power users',
    productId: 'com.hexerve.AnimateMemories.sub.premium'
  }
};
export default function CreditScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();

  const [billingType, setBillingType] = useState<'one-time' | 'subscription'>('subscription');
  const [selectedPack, setSelectedPack] = useState<'starter' | 'popular' | 'pro'>('popular');

  const [customAmount, setCustomAmount] = useState<number>(100);

  const getOneTimePrice = (credits: number) => {
    const starterCredits = dynamicPricing['starter']?.credits ?? 30;
    const popularCredits = dynamicPricing['popular']?.credits ?? 100;
    const proCredits = dynamicPricing['pro']?.credits ?? 200;

    if (credits === starterCredits) return dynamicPricing['starter']?.amount ?? 5.99;
    if (credits === popularCredits) return dynamicPricing['popular']?.amount ?? 19.99;
    if (credits === proCredits) return dynamicPricing['pro']?.amount ?? 34.99;

    const rate = credits >= 200 ? 0.175 : 0.20;
    return Number((credits * rate).toFixed(2));
  };

  const [selectedSubPack, setSelectedSubPack] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<{ packId: string; credits: number; amount: number; createdAt: string; } | null>(null);
  const [isProcessingIAP, setIsProcessingIAP] = useState(false);
  const [dynamicPricing, setDynamicPricing] = useState<any>({});
  const [isPricingLoading, setIsPricingLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPricing = async () => {
      try {
        const token = await getToken();
        const data = await api.getPricing(token);
        if (isMounted && data?.pricing) {
          setDynamicPricing(data.pricing);
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
      } finally {
        if (isMounted) setIsPricingLoading(false);
      }
    };
    fetchPricing();
    return () => { isMounted = false; };
  }, [getToken]);

  const translateX = useSharedValue(0);
  const tabWidth = useSharedValue(0);
  
  const tabLayouts = useRef<{
    starter: { x: number; width: number } | null;
    popular: { x: number; width: number } | null;
    pro: { x: number; width: number } | null;
    basic: { x: number; width: number } | null;
    standard: { x: number; width: number } | null;
    premium: { x: number; width: number } | null;
  }>({
    starter: null,
    popular: null,
    pro: null,
    basic: null,
    standard: null,
    premium: null,
  });

  const updateIndicator = (pack: string, immediate = false) => {
    // @ts-ignore
    const layout = tabLayouts.current[pack];
    if (layout && layout.width > 0) {
      if (immediate) {
        tabWidth.value = layout.width;
        translateX.value = layout.x;
      } else {
        tabWidth.value = withTiming(layout.width, { duration: 300 });
        translateX.value = withTiming(layout.x, { duration: 300 });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateIndicator(billingType === 'one-time' ? selectedPack : selectedSubPack);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedPack, selectedSubPack, billingType]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth.value,
    };
  });

  const fetchUserCredits = useCallback(async () => {
    if (!user) return null;
    try {
      const token = await getToken();
      const result = await api.verifyUser(user, token);
      const credits = result.result?.credits ?? 0;
      setUserCredits(credits);
      return credits;
    } catch (error) {
      console.error("Error fetching credits:", error);
      return null;
    }
  }, [user, getToken]);

  const fetchUserPlan = useCallback(async () => {
    if (!user) return;
    try {
      const userEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) return;
      const token = await getToken();
      const result = await api.getUserPlan(userEmail, token);
      if (result.result) {
        setUserPlan(result.result);
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  }, [user, getToken]);



  useEffect(() => {
    if (user) {
      fetchUserCredits();
      fetchUserPlan();
    }
  }, [user, fetchUserCredits, fetchUserPlan]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserCredits();
        fetchUserPlan();
      }
    }, [user, fetchUserCredits, fetchUserPlan])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && user) {
        setTimeout(() => {
          fetchUserCredits();
          fetchUserPlan();
        }, 1500);
      }
    });
    return () => subscription.remove();
  }, [user, fetchUserCredits, fetchUserPlan]);

  useEffect(() => {
    if (Platform.OS === 'ios' && user) {
      const initIAP = async () => {
        await iapService.initialize();
      };
      initIAP();
    }
  }, [user]);

  const baseSubPack = SUBSCRIPTION_DETAILS[selectedSubPack];
  const currentSubPack = {
    ...baseSubPack,
    price: dynamicPricing[baseSubPack.id]?.amount ?? baseSubPack.price,
    credits: dynamicPricing[baseSubPack.id]?.credits ?? baseSubPack.credits,
  };

  const currentPack = billingType === 'one-time' 
    ? {
        name: 'Custom Pack',
        credits: customAmount,
        price: getOneTimePrice(customAmount),
        originalPrice: (customAmount * 0.40).toFixed(2),
        subtitle: 'Custom credits pack'
      } 
    : currentSubPack;

  const handlePurchasePress = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to purchase credits");
      return;
    }

    const isSubscription = billingType === 'subscription';
    
    let purchaseId = '';
    let purchasePrice = 0;
    let purchaseCredits = 0;
    let productId = '';

    if (isSubscription) {
      const baseSubPack = SUBSCRIPTION_DETAILS[selectedSubPack];
      purchaseId = baseSubPack.id;
      purchasePrice = dynamicPricing[baseSubPack.id]?.amount ?? baseSubPack.price;
      purchaseCredits = dynamicPricing[baseSubPack.id]?.credits ?? baseSubPack.credits;
      productId = baseSubPack.productId;
    } else {
      purchaseCredits = customAmount;
      purchasePrice = getOneTimePrice(customAmount);

      const starterCredits = dynamicPricing['starter']?.credits ?? 30;
      const popularCredits = dynamicPricing['popular']?.credits ?? 100;
      const proCredits = dynamicPricing['pro']?.credits ?? 200;

      if (customAmount === starterCredits) {
        purchaseId = 'starter';
        productId = PACK_DETAILS.starter.productId;
      } else if (customAmount === popularCredits) {
        purchaseId = 'popular';
        productId = PACK_DETAILS.popular.productId;
      } else if (customAmount === proCredits) {
        purchaseId = 'pro';
        productId = PACK_DETAILS.pro.productId;
      } else {
        purchaseId = 'custom';
        productId = 'com.hexerve.AnimateMemories.pack.custom';
      }
    }

    if (Platform.OS === 'ios') {
      const userEmail =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress;
        
      if (!userEmail) {
        Alert.alert("Error", "Email is required to make a purchase");
        return;
      }

      setIsProcessingIAP(true);
      try {
        const token = await getToken();
        const result = await iapService.purchaseProduct(productId, userEmail, token);
        
        if (result.success) {
          Alert.alert(
            "Payment Successful! 🎉",
            "Your credits have been added to your account."
          );
          trackPurchase({
            amount: Number(purchasePrice) || 0,
            currency: "USD",
            productId,
            credits: purchaseCredits,
          });
          fetchUserCredits();
          fetchUserPlan();
        } else if (
          result.error === "Purchase cancelled" ||
          result.error?.toLowerCase().includes("cancel")
        ) {
          Alert.alert(
            "Transaction Cancelled",
            "Your transaction was cancelled. No charges were made to your account.",
            [{ text: "OK", style: "default" }]
          );
        } else {
          Alert.alert("Purchase Failed", result.error || "An unknown error occurred");
        }
      } catch (error: any) {
        if (
          error.message === "Purchase cancelled" ||
          error.message?.toLowerCase().includes("cancel")
        ) {
          Alert.alert(
            "Transaction Cancelled",
            "Your transaction was cancelled. No charges were made to your account.",
            [{ text: "OK", style: "default" }]
          );
        } else {
          Alert.alert("Error", error.message || "Failed to process purchase");
        }
      } finally {
        setIsProcessingIAP(false);
      }
    } else {
      // Android / Web direct Stripe payment flow
      const userEmail =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress;
      const userName =
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "User";

      if (!userEmail) {
        Alert.alert("Error", "Email is required to make a purchase");
        return;
      }

      setIsProcessingIAP(true);
      try {
        const token = await getToken();
        let checkoutData;

        if (billingType === "subscription") {
          checkoutData = await api.createSubscription(
            purchaseId,
            userEmail,
            userName,
            token,
            "mobile"
          );
        } else {
          checkoutData = await api.createPaymentIntent(
            purchasePrice,
            purchaseCredits,
            { email: userEmail, name: userName },
            token,
            purchaseId,
            "mobile"
          );
        }

        if (checkoutData?.url) {
          const initialCredits = userCredits;
          trackInitiatedCheckout({
            value: Number(purchasePrice) || 0,
            currency: "USD",
            productId,
            credits: purchaseCredits,
          });
          const browserResult = await WebBrowser.openAuthSessionAsync(
            checkoutData.url,
            "animatememories://"
          );

          // Refresh user stats after returning from payment page
          const latestCredits = await fetchUserCredits();
          await fetchUserPlan();

          if (latestCredits !== null && latestCredits > (initialCredits || 0)) {
            trackPurchase({
              amount: Number(purchasePrice) || 0,
              currency: "USD",
              productId: productId || purchaseId,
              credits: purchaseCredits,
            });
            Alert.alert(
              "Payment Successful! 🎉",
              "Your credits have been added to your account."
            );
          } else if (
            browserResult.type === "cancel" ||
            browserResult.type === "dismiss" ||
            (browserResult.type === "success" &&
              (browserResult.url?.includes("cancelled") ||
                browserResult.url?.includes("payment-cancelled")))
          ) {
            // Verify if credits remained the same (no successful payment occurred)
            if (latestCredits === null || latestCredits <= (initialCredits || 0)) {
              Alert.alert(
                "Transaction Cancelled",
                "Your transaction was cancelled. No charges were made to your account.",
                [{ text: "OK", style: "default" }]
              );
            }
          }
        } else {
          Alert.alert(
            "Payment Error",
            checkoutData?.error || "Failed to create checkout session. Please try again."
          );
        }
      } catch (error: any) {
        console.error("Direct payment error:", error);
        Alert.alert("Error", error.message || "Failed to initiate payment. Please try again.");
      } finally {
        setIsProcessingIAP(false);
      }
    }
  };

  const handleRestorePurchases = async () => {
    if (!user) return;

    const userEmail =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;
      
    if (!userEmail) return;

    setIsProcessingIAP(true);
    try {
      const token = await getToken();
      const result = await iapService.restorePurchases(userEmail, token);
      
      if (result.success) {
        Alert.alert(
          "Restore Complete",
          result.message || `Restored ${result.restoredCount} purchases.`
        );
        fetchUserCredits();
        fetchUserPlan();
      } else {
        Alert.alert("Restore Failed", result.error || "An unknown error occurred");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to restore purchases");
    } finally {
      setIsProcessingIAP(false);
    }
  };

  return (
    <ScreenWrapper
      addBottomPadding={true}
      creditsText={userCredits !== null ? `${userCredits} Credits` : "Loading..."}
      contentContainerStyle={{ justifyContent: 'space-between' }}
    >
      {isPricingLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <ActivityIndicator size="large" color="#D229FF" />
          <Text style={{ marginTop: 16, color: '#666', fontFamily: getFontFamily('400') }}>Loading plans...</Text>
        </View>
      ) : (
      <>
      {/* AI-Powered Tag */}
      <View style={styles.tagSection}>
        <LinearGradient
          colors={['#28D4FA', '#D229FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tagContainer}
        >
          <Text style={styles.tagIcon}>✨</Text>
          <Text style={styles.tagText}>AI-Powered Photo Restoration</Text>
        </LinearGradient>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <GradientText style={styles.mainTitle}>Choose Your Plan</GradientText>
        <Text style={styles.subtitle}>
          Restore old photos and bring them to life with <Text style={styles.subtitleHighlight}>AI-powered technology</Text>
        </Text>
      </View>

      {/* Billing Type Toggle */}
      <View style={styles.billingToggleContainer}>
        <TouchableOpacity 
          style={[styles.billingToggleBtn, billingType === 'one-time' && styles.billingToggleBtnActive]}
          onPress={() => setBillingType('one-time')}
        >
          <Text style={[styles.billingToggleText, billingType === 'one-time' && styles.billingToggleTextActive]}>
            One-Time Packs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.billingToggleBtn, billingType === 'subscription' && styles.billingToggleBtnActive]}
          onPress={() => setBillingType('subscription')}
        >
          <Text style={[styles.billingToggleText, billingType === 'subscription' && styles.billingToggleTextActive]}>
            Subscriptions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pack Selection Tabs */}
      {billingType === 'subscription' ? (
        <View style={styles.packTabsContainer}>
          <View style={styles.packTabsWrapper}>
            <Animated.View style={[styles.packTabIndicator, animatedIndicatorStyle]} pointerEvents="none">
              <LinearGradient
                colors={['#28D4FA', '#D229FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.packTabIndicatorGradient}
              />
            </Animated.View>
            
            <TouchableOpacity
              style={styles.packTab}
              onPress={() => setSelectedSubPack('basic')}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                tabLayouts.current.basic = { x, width };
                if (selectedSubPack === 'basic') updateIndicator('basic', true);
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.packTabText,
                  selectedSubPack === 'basic' && styles.packTabTextSelected
                ]}
              >
                Basic
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.packTab}
              onPress={() => setSelectedSubPack('standard')}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                tabLayouts.current.standard = { x, width };
                if (selectedSubPack === 'standard') updateIndicator('standard', true);
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.packTabText,
                  selectedSubPack === 'standard' && styles.packTabTextSelected
                ]}
              >
                Standard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.packTab}
              onPress={() => setSelectedSubPack('premium')}
              onLayout={(event) => {
                const { width, x } = event.nativeEvent.layout;
                tabLayouts.current.premium = { x, width };
                if (selectedSubPack === 'premium') updateIndicator('premium', true);
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.packTabText,
                  selectedSubPack === 'premium' && styles.packTabTextSelected
                ]}
              >
                Premium
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>{customAmount} Credits</Text>
          <CustomSlider
            min={10}
            max={1000}
            step={10}
            value={customAmount}
            onValueChange={(val) => setCustomAmount(val)}
            trackHeight={8}
            activeGradientColors={["#38BDF8", "#D229FF"]}
            inactiveTrackColor="#CBD5E1"
            thumbColor="#D229FF"
            thumbSize={24}
          />
          <View style={styles.sliderPresets}>
            <TouchableOpacity 
              style={[styles.presetBtn, customAmount === 30 && styles.presetBtnActive]} 
              onPress={() => setCustomAmount(30)}
            >
              <Text style={[styles.presetBtnText, customAmount === 30 && styles.presetBtnTextActive]}>Starter (30)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.presetBtn, customAmount === 100 && styles.presetBtnActive]} 
              onPress={() => setCustomAmount(100)}
            >
              <Text style={[styles.presetBtnText, customAmount === 100 && styles.presetBtnTextActive]}>Popular (100)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.presetBtn, customAmount === 200 && styles.presetBtnActive]} 
              onPress={() => setCustomAmount(200)}
            >
              <Text style={[styles.presetBtnText, customAmount === 200 && styles.presetBtnTextActive]}>Pro (200)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Credit Pack Card */}
      <View style={styles.packCard}>
        <View style={styles.packCardContent}>
          {/* Gradient Header Section */}
          <LinearGradient
            colors={['rgba(40, 212, 250, 0.08)', 'rgba(210, 41, 255, 0.08)', 'rgba(255, 255, 255, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.packCardGradientHeader}
          >
            <View style={styles.packCardHeader}>
              <View style={styles.packCardLeft}>
                <View style={styles.creditsTag}>
                  <Text style={styles.creditsTagText}>{currentPack.credits} Credits</Text>
                </View>
                <GradientText style={styles.packCardTitle}>{currentPack.credits} AI Processing Credits</GradientText>
                <Text style={styles.packCardSubtitle}>{currentPack.subtitle}</Text>
              </View>
              <View style={styles.packCardRight}>
                <Text style={styles.packCardPrice}>${currentPack.price}</Text>
                <View style={styles.originalPriceContainer}>
                  <Text style={styles.originalPriceText}>Originally ${currentPack.originalPrice}</Text>
                  <View style={styles.strikethrough} />
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Features Section - White Background */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Photo restoration & animation</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Colorize old photos</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Priority processing</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Premium quality</Text>
            </View>
          </View>

          {/* Purchase Action Button - Fully inside container for 100% reliable touch hit testing */}
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={handlePurchasePress}
            disabled={isProcessingIAP}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#28D4FA', '#D229FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeButtonGradient}
            >
              {isProcessingIAP ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.upgradeButtonText}>Get {currentPack.name}</Text>
                  <IconSymbol name="chevron.right" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Restore Purchases Button for iOS Users */}
      {Platform.OS === 'ios' && (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity 
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isProcessingIAP}
          >
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Additional Features */}
      <View style={styles.additionalFeaturesContainer}>
        <View style={styles.additionalFeatureItem}>
          <View style={styles.additionalFeatureDot} />
          <Text style={styles.additionalFeatureText}>Secure Payment</Text>
        </View>
        <View style={styles.additionalFeatureItem}>
          <View style={styles.additionalFeatureDot} />
          <Text style={styles.additionalFeatureText}>Instant Processing</Text>
        </View>
        {billingType === 'subscription' && (
          <View style={styles.additionalFeatureItem}>
            <View style={styles.additionalFeatureDot} />
            <Text style={styles.additionalFeatureText}>Cancel Anytime</Text>
          </View>
        )}
      </View>

      {/* Current Credits */}
      <View style={styles.currentCreditsContainer}>
        <Text style={styles.creditsIcon}>💧</Text>
        <Text style={styles.currentCreditsText}>Current Credits left : {userCredits}</Text>
      </View>

      {/* My Plan Section */}
      {userPlan && (
        <View style={styles.myPlanSection}>
          <GradientText style={styles.myPlanTitle}>
            My Plan - {userPlan.packId === "popular" ? "Most Popular" : userPlan.packId === "starter" ? "Starter" : "Pro"}
          </GradientText>
        </View>
      )}



      {/* Payment Logos Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 30, paddingHorizontal: 16, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 15, color: '#979797', marginRight: 8, fontFamily: getFontFamily('400') }}>Secured by</Text>
        {PAYMENT_ICONS.map((icon) => (
          <SvgUri
            key={icon}
            width="36"
            height="24"
            uri={`https://www.animatememories.com/payment-icons/${icon}.svg`}
          />
        ))}
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.contactText}>Need custom solutions?</Text>
        <TouchableOpacity onPress={async () => {
          const mailtoUrl = "mailto:support@animatememories.com";
          try {
            await Linking.openURL(mailtoUrl);
          } catch (error) {
            console.error("Error opening email:", error);
            Alert.alert("Error", "Unable to open email client. Please email us at support@animatememories.com");
          }
        }}>
          <GradientText style={styles.contactLink}>Contact Us</GradientText>
        </TouchableOpacity>
      </View>
      </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tagSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#D229FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  tagIcon: {
    fontSize: 18,
  },
  tagText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: getFontFamily('600'),
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 26,
    marginBottom: 8,
    fontFamily: getFontFamily('700'),
  },
  subtitle: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: getFontFamily('400'),
  },
  subtitleHighlight: {
    color: '#D229FF',
    fontFamily: getFontFamily('600'),
  },
  billingToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 20,
    alignSelf: 'center',
  },
  billingToggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  billingToggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  billingToggleText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: getFontFamily('500'),
  },
  billingToggleTextActive: {
    color: '#111827',
  },
  packTabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  packTabsWrapper: {
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
  },
  packTabIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 1,
  },
  packTabIndicatorGradient: {
    width: '100%',
    height: '100%',
  },
  packTab: {
    flex: 1,
    borderRadius: 8,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  packTabText: {
    fontSize: 15,
    color: '#979797',
    textAlign: 'center',
    fontFamily: getFontFamily('400'),
  },
  packTabTextSelected: {
    color: '#fff',
    fontFamily: getFontFamily('600'),
  },
  packCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 24,
  },
  packCardContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  packCardGradientHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  packCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  packCardLeft: {
    flex: 1,
  },
  creditsTag: {
    backgroundColor: '#D229FF',
    borderRadius: 4.667,
    paddingHorizontal: 6.667,
    paddingVertical: 6.667,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  creditsTagText: {
    fontSize: 17,
    color: '#fff',
    fontFamily: getFontFamily('600'),
  },
  packCardTitle: {
    fontSize: 18,
    color: '#000',
    marginBottom: 4,
    fontFamily: getFontFamily('600'),
  },
  packCardSubtitle: {
    fontSize: 15,
    color: '#000',
    fontFamily: getFontFamily('400'),
  },
  packCardRight: {
    alignItems: 'flex-end',
  },
  packCardPrice: {
    fontSize: 34,
    color: '#000',
    marginBottom: 4,
    fontFamily: getFontFamily('600'),
  },
  originalPriceContainer: {
    position: 'relative',
  },
  originalPriceText: {
    fontSize: 14.59,
    fontFamily: getFontFamily('400'),
    color: '#282828',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#282828',
  },
  featuresContainer: {
    padding: 20,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    width: 6.857,
    height: 6.857,
    borderRadius: 3.428,
    backgroundColor: '#28D4FA',
  },
  featureText: {
    fontSize: 15,
    color: '#000',
    fontFamily: getFontFamily('400'),
  },
  additionalFeaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  additionalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  additionalFeatureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  additionalFeatureText: {
    fontSize: 14,
    color: '#000',
    fontFamily: getFontFamily('300'),
  },
  upgradeButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#D229FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 12.4,
    elevation: 4,
  },
  upgradeButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontFamily: getFontFamily('600'),
  },
  currentCreditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  creditsIcon: {
    fontSize: 16.789,
  },
  currentCreditsText: {
    fontSize: 19.747,
    color: '#28D4FA',
    fontFamily: getFontFamily('500'),
  },
  myPlanSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  myPlanTitle: {
    fontSize: 30,
    fontFamily: getFontFamily('700'),
  },
  transactionSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  transactionTitle: {
    fontSize: 22,
    fontFamily: getFontFamily('400'),
    color: '#000',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionName: {
    fontSize: 19,
    fontFamily: getFontFamily('600'),
    color: '#878787',
    flex: 1,
  },
  transactionDate: {
    fontSize: 19,
    fontFamily: getFontFamily('400'),
    color: '#878787',
  },
  transactionDivider: {
    height: 0.75,
    backgroundColor: '#e9ecef',
  },
  contactSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  contactText: {
    fontSize: 22,
    color: '#000',
    marginBottom: 8,
    fontFamily: getFontFamily('400'),
  },
  contactLink: {
    fontSize: 24,
    textDecorationLine: 'underline',
    fontFamily: getFontFamily('600'),
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  restoreText: {
    color: "#666",
    fontSize: 15,
    fontFamily: getFontFamily("500"),
    textDecorationLine: "underline",
  },
  noTransactionsText: {
    fontSize: 15,
    fontFamily: getFontFamily("400"),
    color: "#999",
    textAlign: "center",
    paddingVertical: 12,
    lineHeight: 20,
  },
  sliderContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sliderLabel: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 12,
    color: '#000',
    fontFamily: getFontFamily('700'),
  },
  sliderPresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: '#D229FF',
    backgroundColor: 'rgba(210, 41, 255, 0.05)',
  },
  presetBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: getFontFamily('500'),
  },
  presetBtnTextActive: {
    color: '#000',
    fontFamily: getFontFamily('700'),
  },
});
