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
import { api } from "@/services/api";
import { useFocusEffect } from "expo-router";
import { iapService } from "@/services/iap-service";
import { IAP_PRODUCTS } from "@/constants/iap-config";

const WEBSITE_BASE = "https://animatememories.com";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PACK_DETAILS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 30,
    price: 9.99,
    originalPrice: 15,
    subtitle: 'Perfect for getting started',
    productId: 'com.animatememories.credits.starter'
  },
  popular: {
    id: 'popular',
    name: 'Popular Pack',
    credits: 100,
    price: 24.99,
    originalPrice: 40,
    subtitle: 'Most popular for historians',
    productId: 'com.animatememories.credits.popular'
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 200,
    price: 44.99,
    originalPrice: 80,
    subtitle: 'Best value for professionals',
    productId: 'com.animatememories.credits.pro'
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
    credits: 150,
    price: 14.99,
    originalPrice: 30,
    subtitle: 'Best for regular users',
    productId: 'com.hexerve.AnimateMemories.sub.standard'
  },
  premium: {
    id: 'sub_premium',
    name: 'Premium Monthly',
    credits: 400,
    price: 29.99,
    originalPrice: 60,
    subtitle: 'For power users',
    productId: 'com.hexerve.AnimateMemories.sub.premium'
  }
};
export default function CreditScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();

  const [billingType, setBillingType] = useState<'one-time' | 'subscription'>('one-time');
  const [selectedPack, setSelectedPack] = useState<'starter' | 'popular' | 'pro'>('popular');
  const [selectedSubPack, setSelectedSubPack] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<{ packId: string; credits: number; amount: number; createdAt: string; } | null>(null);
  const [transactions, setTransactions] = useState<Array<{ id: number; packId: string; credits: number; amount: number; createdAt: string; }>>([]);
  const [isProcessingIAP, setIsProcessingIAP] = useState(false);

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
    if (!user) return;
    try {
      const token = await getToken();
      const result = await api.verifyUser(user, token);
      setUserCredits(result.result?.credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
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

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const userEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) return;
      const token = await getToken();
      const result = await api.getTransactions(userEmail, token);
      if (result.result) {
        setTransactions(result.result);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [user, getToken]);

  useEffect(() => {
    if (user) {
      fetchUserCredits();
      fetchUserPlan();
      fetchTransactions();
    }
  }, [user, fetchUserCredits, fetchUserPlan, fetchTransactions]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserCredits();
        fetchUserPlan();
        fetchTransactions();
      }
    }, [user, fetchUserCredits, fetchUserPlan, fetchTransactions])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && user) {
        setTimeout(() => {
          fetchUserCredits();
          fetchUserPlan();
          fetchTransactions();
        }, 1500);
      }
    });
    return () => subscription.remove();
  }, [user, fetchUserCredits, fetchUserPlan, fetchTransactions]);

  useEffect(() => {
    if (Platform.OS === 'ios' && user) {
      const initIAP = async () => {
        await iapService.initialize();
      };
      initIAP();
    }
  }, [user]);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.startsWith("animatememories://payment-cancelled")) {
        Alert.alert(
          "Transaction Cancelled",
          "Your payment was not completed. No charges were made."
        );
        return;
      }
      if (!url.startsWith("animatememories://payment-success")) return;
      try {
        const urlObj = new URL(url);
        const sessionId = urlObj.searchParams.get("session_id");
        const emailFromLink = urlObj.searchParams.get("email");
        const userEmail =
          emailFromLink ||
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress;

        if (sessionId && userEmail) {
          try {
            const token = await getToken();
            await api.verifyPayment(sessionId, userEmail, token);
          } catch (_) {}
        }

        fetchUserCredits();
        fetchUserPlan();
        fetchTransactions();

        Alert.alert(
          "Payment Successful! 🎉",
          "Your credits have been added to your account."
        );
      } catch (err) {
        console.error("Deep link parse error:", err);
        fetchUserCredits();
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, [user, fetchUserCredits, fetchUserPlan, fetchTransactions, getToken]);

  const handlePurchasePress = async () => {
    if (!user) {
      Alert.alert("Error", "Please sign in to purchase credits");
      return;
    }

    const currentPack = billingType === 'one-time' ? PACK_DETAILS[selectedPack] : SUBSCRIPTION_DETAILS[selectedSubPack];
    
    // Attempt to get product ID from central IAP config, fallback to local default
    const iapProduct = IAP_PRODUCTS.find(p => p.id === currentPack.id) || 
                       (await import('@/constants/iap-config')).IAP_SUBSCRIPTION_PRODUCTS.find(p => p.id === currentPack.id);
    const productId = iapProduct ? iapProduct.productId : currentPack.productId;

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
          fetchUserCredits();
          fetchUserPlan();
          fetchTransactions();
        } else if (result.error !== 'Purchase cancelled') {
          Alert.alert("Purchase Failed", result.error || "An unknown error occurred");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to process purchase");
      } finally {
        setIsProcessingIAP(false);
      }
    } else {
      // Android / Web / Default payment flow via website
      const userEmail =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress;
      const userName =
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "";

      const params = new URLSearchParams({
        ref: "ios", 
        pack: currentPack.id,
        ...(userEmail ? { email: userEmail } : {}),
        ...(userName ? { name: userName } : {}),
      });

      const url = `${WEBSITE_BASE}/buy-credits?${params.toString()}`;

      try {
        await Linking.openURL(url);
      } catch (err) {
        Alert.alert("Error", "Could not open the website. Please try again.");
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
        fetchTransactions();
      } else {
        Alert.alert("Restore Failed", result.error || "An unknown error occurred");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to restore purchases");
    } finally {
      setIsProcessingIAP(false);
    }
  };

  const formatTransactionName = (packId: string, amount: number) => {
    const packNames: Record<string, string> = {
      starter: "Starter Pack",
      popular: "Popular Pack",
      pro: "Pro Pack",
    };
    return `$${(amount / 100).toFixed(2)} — ${packNames[packId] || "Pack"}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const currentPack = PACK_DETAILS[selectedPack];

  return (
    <ScreenWrapper
      addBottomPadding={true}
      creditsText={userCredits !== null ? `${userCredits} Credits` : "Loading..."}
    >
      {/* AI-Powered Tag */}
      <View style={styles.tagSection}>
        <View style={styles.tagContainer}>
          <Text style={styles.tagIcon}>✨</Text>
          <Text style={styles.tagText}>AI-Powered Photo Restoration</Text>
        </View>
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
      <View style={styles.packTabsContainer}>
        <View style={styles.packTabsWrapper}>
          <Animated.View style={[styles.packTabIndicator, animatedIndicatorStyle]}>
            <LinearGradient
              colors={['#28D4FA', '#D229FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.packTabIndicatorGradient}
            />
          </Animated.View>
          
          {billingType === 'one-time' ? (
            <>
              <TouchableOpacity
                style={styles.packTab}
                onPress={() => setSelectedPack('starter')}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  tabLayouts.current.starter = { x, width };
                }}
              >
                <Text style={[
                  styles.packTabText,
                  selectedPack === 'starter' && styles.packTabTextSelected
                ]}>Starter Pack</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.packTab}
                onPress={() => setSelectedPack('popular')}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  tabLayouts.current.popular = { x, width };
                }}
              >
                <Text style={[
                  styles.packTabText,
                  selectedPack === 'popular' && styles.packTabTextSelected
                ]}>Most Popular</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.packTab}
                onPress={() => setSelectedPack('pro')}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  tabLayouts.current.pro = { x, width };
                }}
              >
                <Text style={[
                  styles.packTabText,
                  selectedPack === 'pro' && styles.packTabTextSelected
                ]}>Pro Pack</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.packTab}
                onPress={() => setSelectedSubPack('basic')}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  tabLayouts.current.basic = { x, width };
                }}
              >
                <Text style={[
                  styles.packTabText,
                  selectedSubPack === 'basic' && styles.packTabTextSelected
                ]}>Basic</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.packTab}
                onPress={() => setSelectedSubPack('standard')}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  tabLayouts.current.standard = { x, width };
                }}
              >
                <Text style={[
                  styles.packTabText,
                  selectedSubPack === 'standard' && styles.packTabTextSelected
                ]}>Standard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.packTab}
                onPress={() => setSelectedSubPack('premium')}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  tabLayouts.current.premium = { x, width };
                }}
              >
                <Text style={[
                  styles.packTabText,
                  selectedSubPack === 'premium' && styles.packTabTextSelected
                ]}>Premium</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Credit Pack Card */}
      <View style={{ ...styles.packCard, paddingBottom: 60, marginBottom: 70 }}>
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
        </View>

        {/* Absolute Positioned Button - Half Above, Half Below */}
        <TouchableOpacity 
          style={styles.upgradeButton} 
          onPress={handlePurchasePress}
          disabled={isProcessingIAP}
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

      {/* Transaction History */}
      <View style={styles.transactionSection}>
        <Text style={styles.transactionTitle}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.noTransactionsText}>
            No transactions yet. Purchase a credit pack to get started!
          </Text>
        ) : (
          transactions.map((transaction, index) => (
            <View key={transaction.id}>
              <View style={styles.transactionItem}>
                <Text style={styles.transactionName}>{formatTransactionName(transaction.packId, transaction.amount)}</Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
              </View>
              {index < transactions.length - 1 && <View style={styles.transactionDivider} />}
            </View>
          ))
        )}
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.contactText}>Need custom solutions?</Text>
        <TouchableOpacity onPress={() => Linking.openURL("mailto:support@animatememories.com")}>
          <GradientText style={styles.contactLink}>Contact Us</GradientText>
        </TouchableOpacity>
      </View>
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
    borderWidth: 1,
    borderColor: '#28D4FA',
    borderRadius: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  tagIcon: {
    fontSize: 18,
  },
  tagText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#000',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleHighlight: {
    fontWeight: '600',
    color: '#D229FF',
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
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  packTabText: {
    fontSize: 15,
    fontWeight: '300',
    color: '#979797',
    textAlign: 'center',
  },
  packTabTextSelected: {
    fontWeight: '600',
    color: '#fff',
  },
  packCard: {
    marginHorizontal: 16,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.27,
    shadowRadius: 31.7,
    elevation: 8,
    position: 'relative',
    overflow: 'visible',
    padding: 0,
  },
  packCardContent: {
    backgroundColor: '#fff',
    borderRadius: 11,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  packCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  packCardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#000',
  },
  packCardRight: {
    alignItems: 'flex-end',
  },
  packCardPrice: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  originalPriceContainer: {
    position: 'relative',
  },
  originalPriceText: {
    fontSize: 12.59,
    fontWeight: '400',
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
    fontSize: 13,
    fontWeight: '400',
    color: '#000',
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
    fontSize: 12,
    fontWeight: '300',
    color: '#000',
  },
  upgradeButton: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#D229FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 12.4,
    elevation: 5,
    zIndex: 10,
    marginHorizontal: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    fontSize: 14.789,
  },
  currentCreditsText: {
    fontSize: 17.747,
    fontWeight: '500',
    color: '#28D4FA',
  },
  myPlanSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  myPlanTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  transactionSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  transactionTitle: {
    fontSize: 20,
    fontWeight: '400',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#878787',
    flex: 1,
  },
  transactionDate: {
    fontSize: 17,
    fontWeight: '400',
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
    fontSize: 15,
    fontWeight: '400',
    color: '#000',
    marginBottom: 8,
  },
  contactLink: {
    fontSize: 18,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  restoreText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  noTransactionsText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    paddingVertical: 12,
    lineHeight: 20,
  },
});
