import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { GradientText } from '@/components/ui/GradientText';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - 32;
const TAB_GAP = 8;
const TAB_PADDING = 16;

export default function CreditScreen() {
  const [selectedPack, setSelectedPack] = useState<'starter' | 'popular' | 'pro'>('popular');
  const translateX = useSharedValue(0);
  const tabWidth = useSharedValue(0);
  
  // Use refs to store layout measurements reliably
  const tabLayouts = useRef<{
    starter: { x: number; width: number } | null;
    popular: { x: number; width: number } | null;
    pro: { x: number; width: number } | null;
  }>({
    starter: null,
    popular: null,
    pro: null,
  });

  const updateIndicator = (pack: 'starter' | 'popular' | 'pro', immediate = false) => {
    const layout = tabLayouts.current[pack];
    if (layout && layout.width > 0) {
      if (immediate) {
        // Set immediately without animation for instant feedback
        tabWidth.value = layout.width;
        translateX.value = layout.x;
      } else {
        // Animate smoothly
        tabWidth.value = withTiming(layout.width, { duration: 300 });
        translateX.value = withTiming(layout.x, { duration: 300 });
      }
    }
  };

  useEffect(() => {
    // Small delay to ensure layout is measured
    const timer = setTimeout(() => {
      updateIndicator(selectedPack);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedPack]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth.value,
    };
  });

  const transactions = [
    { id: '1', name: '$25 - Popular Pack', date: '01 September, 2025' },
    { id: '2', name: '$25 - Popular Pack', date: '02 August, 2025' },
    { id: '3', name: '$25 - Popular Pack', date: '01 August, 2025' },
  ];

  return (
    <ScreenWrapper addBottomPadding={true}>

        {/* AI-Powered Tag */}
        <View style={styles.tagSection}>
          <View style={styles.tagContainer}>
            <Text style={styles.tagIcon}>✨</Text>
            <Text style={styles.tagText}>AI-Powered Photo Restoration</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <GradientText style={styles.mainTitle}>Choose Your Credit Pack</GradientText>
          <Text style={styles.subtitle}>
            Restore old photos and bring them to life with <Text style={styles.subtitleHighlight}>AI-powered technology</Text>
          </Text>
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
          </View>
        </View>

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
                    <Text style={styles.creditsTagText}>100 Credits</Text>
                  </View>
                  <GradientText style={styles.packCardTitle}>100 AI Processing Credits</GradientText>
                  <Text style={styles.packCardSubtitle}>Most popular for historians</Text>
                </View>
                <View style={styles.packCardRight}>
                  <Text style={styles.packCardPrice}>$25</Text>
                  <View style={styles.originalPriceContainer}>
                    <Text style={styles.originalPriceText}>Originally $55</Text>
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
          <TouchableOpacity style={styles.upgradeButton}>
            <LinearGradient
              colors={['#28D4FA', '#D229FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>Get Popular Pack</Text>
              <IconSymbol name="chevron.right" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
          <View style={styles.additionalFeatureItem}>
            <View style={styles.additionalFeatureDot} />
            <Text style={styles.additionalFeatureText}>No Subscription</Text>
          </View>
        </View>

        {/* Current Credits */}
        <View style={styles.currentCreditsContainer}>
          <Text style={styles.creditsIcon}>💧</Text>
          <Text style={styles.currentCreditsText}>Current Credits left : 60</Text>
        </View>

        {/* My Plan Section */}
        <View style={styles.myPlanSection}>
          <GradientText style={styles.myPlanTitle}>My Plan - Most Popular</GradientText>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <Text style={styles.transactionTitle}>Transaction History</Text>
          {transactions.map((transaction, index) => (
            <View key={transaction.id}>
              <View style={styles.transactionItem}>
                <Text style={styles.transactionName}>{transaction.name}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              {index < transactions.length - 1 && <View style={styles.transactionDivider} />}
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactText}>Need custom solutions?</Text>
          <TouchableOpacity>
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
    marginBottom: 60,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.27,
    shadowRadius: 31.7,
    elevation: 8,
    position: 'relative',
    padding: 20,
    overflow: 'visible',
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
    fontSize: 40,
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
});
