/**
 * IAP Service for In-App Purchases using react-native-iap
 *
 * This service handles IAP operations including:
 * - Initializing IAP connection with App Store / Google Play
 * - Fetching available products & subscriptions
 * - Requesting purchases & subscriptions
 * - Verifying receipts with backend (/api/iap-verify)
 * - Restoring purchases (/api/iap-restore)
 * - Finishing transactions with StoreKit / Google Play Billing
 */

import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import {
  getProductIds,
  getSubscriptionProductIds,
  isValidProductId,
} from '@/constants/iap-config';
import { api } from './api';

export class IAPService {
  private static instance: IAPService;
  private isInitialized = false;
  private products: RNIap.Product[] = [];
  private subscriptions: RNIap.Subscription[] = [];

  private constructor() {}

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  /**
   * Initialize IAP connection
   * Must be called before any other IAP operations
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.log('IAP: Not on mobile platform, skipping initialization');
      return false;
    }

    if (this.isInitialized) {
      console.log('IAP: Connection already initialized');
      return true;
    }

    try {
      console.log('IAP: Initializing connection with react-native-iap...');
      const result = await RNIap.initConnection();
      console.log('IAP: Connected to store:', result);

      this.isInitialized = true;

      // Fetch products and subscriptions
      await this.fetchProducts();

      return true;
    } catch (error) {
      console.error('IAP: Failed to initialize connection:', error);
      return false;
    }
  }

  /**
   * Fetch available products and subscriptions from App Store / Google Play
   */
  async fetchProducts(): Promise<{ products: RNIap.Product[]; subscriptions: RNIap.Subscription[] }> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return { products: [], subscriptions: [] };
    }

    try {
      const productSkus = getProductIds();
      const subscriptionSkus = getSubscriptionProductIds();

      console.log('IAP: Fetching products:', productSkus);
      console.log('IAP: Fetching subscriptions:', subscriptionSkus);

      let fetchedProducts: RNIap.Product[] = [];
      let fetchedSubscriptions: RNIap.Subscription[] = [];

      try {
        if (productSkus.length > 0) {
          fetchedProducts = await RNIap.getProducts({ skus: productSkus });
          this.products = fetchedProducts || [];
          console.log(`IAP: Successfully fetched ${this.products.length} products`);
        }
      } catch (prodErr) {
        console.warn('IAP: Failed to fetch credit pack products:', prodErr);
      }

      try {
        if (subscriptionSkus.length > 0) {
          fetchedSubscriptions = await RNIap.getSubscriptions({ skus: subscriptionSkus });
          this.subscriptions = fetchedSubscriptions || [];
          console.log(`IAP: Successfully fetched ${this.subscriptions.length} subscriptions`);
        }
      } catch (subErr) {
        console.warn('IAP: Failed to fetch subscription products:', subErr);
      }

      return {
        products: this.products,
        subscriptions: this.subscriptions,
      };
    } catch (error) {
      console.error('IAP: Failed to fetch store items:', error);
      return { products: [], subscriptions: [] };
    }
  }

  /**
   * Get product details by product ID (SKU)
   */
  getProduct(productId: string): RNIap.Product | undefined {
    return this.products.find(p => p.productId === productId);
  }

  /**
   * Get subscription details by product ID (SKU)
   */
  getSubscription(productId: string): RNIap.Subscription | undefined {
    return this.subscriptions.find(s => s.productId === productId);
  }

  /**
   * Purchase a product or subscription
   */
  async purchaseProduct(
    productId: string,
    userEmail: string,
    token?: string | null
  ): Promise<{
    success: boolean;
    credits?: number;
    creditsAdded?: number;
    error?: string;
  }> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return { success: false, error: 'IAP only available on iOS and Android' };
    }

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Failed to initialize payment connection' };
      }
    }

    if (!isValidProductId(productId)) {
      return { success: false, error: 'Invalid product ID' };
    }

    const isSubscription = getSubscriptionProductIds().includes(productId);

    try {
      console.log(`IAP: Requesting ${isSubscription ? 'subscription' : 'purchase'} for:`, productId);

      let purchaseResult: RNIap.Purchase | RNIap.Purchase[] | null = null;

      if (isSubscription) {
        purchaseResult = (await RNIap.requestSubscription({ sku: productId })) as any;
      } else {
        purchaseResult = (await RNIap.requestPurchase({ sku: productId })) as any;
      }

      const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;

      if (!purchase) {
        throw new Error('No purchase data returned from App Store / Google Play');
      }

      console.log('IAP: Purchase successful, extracting receipt data...');

      const receiptData = purchase.transactionReceipt || (purchase as any).receipt || (purchase as any).transactionId;

      if (!receiptData) {
        throw new Error('No valid receipt data found in purchase response');
      }

      console.log('IAP: Verifying receipt with backend...');
      const verificationResult = await api.verifyIAPReceipt(receiptData, userEmail, token);

      if (verificationResult.success) {
        // Finish transaction with Apple / Google
        try {
          await RNIap.finishTransaction({
            purchase,
            isConsumable: !isSubscription
          });
          console.log('IAP: Transaction finished successfully with native store');
        } catch (finishErr) {
          console.warn('IAP: Error finishing transaction:', finishErr);
        }

        return {
          success: true,
          credits: verificationResult.credits,
          creditsAdded: verificationResult.creditsAdded,
        };
      } else {
        throw new Error(verificationResult.error || 'Backend receipt verification failed');
      }
    } catch (error: any) {
      console.error('IAP: Purchase error:', error);

      if (
        error?.code === 'E_USER_CANCELLED' ||
        error?.message?.includes('cancelled') ||
        error?.message?.includes('canceled')
      ) {
        return { success: false, error: 'Purchase cancelled' };
      }

      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(
    userEmail: string,
    token?: string | null
  ): Promise<{
    success: boolean;
    restoredCount?: number;
    creditsAdded?: number;
    message?: string;
    error?: string;
  }> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return { success: false, error: 'IAP only available on mobile' };
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('IAP: Restoring purchases via react-native-iap...');
      const availablePurchases = await RNIap.getAvailablePurchases();

      if (!availablePurchases || availablePurchases.length === 0) {
        return {
          success: true,
          restoredCount: 0,
          creditsAdded: 0,
          message: 'No active purchases to restore',
        };
      }

      const latestPurchase = availablePurchases[availablePurchases.length - 1];
      const receiptData = latestPurchase.transactionReceipt || (latestPurchase as any).receipt;

      if (!receiptData) {
        return {
          success: true,
          restoredCount: 0,
          creditsAdded: 0,
          message: 'No receipt found for previous purchases',
        };
      }

      const restoreResult = await api.restoreIAPPurchases(receiptData, userEmail, token);

      // Finish all restored transactions
      for (const purchase of availablePurchases) {
        try {
          await RNIap.finishTransaction({ purchase, isConsumable: false });
        } catch (e) {
          console.warn('IAP: Error finishing restored transaction:', e);
        }
      }

      return {
        success: true,
        restoredCount: restoreResult.restoredCount || 0,
        creditsAdded: restoreResult.creditsAdded || 0,
        message: restoreResult.message || 'Purchases restored successfully',
      };
    } catch (error: any) {
      console.error('IAP: Restore failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases',
      };
    }
  }

  /**
   * Handle pending transactions on app startup
   */
  async handlePendingPurchases(
    userEmail: string,
    token?: string | null
  ): Promise<void> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    try {
      const purchases = await RNIap.getAvailablePurchases();
      if (!purchases || purchases.length === 0) return;

      console.log(`IAP: Handling ${purchases.length} pending/available purchases`);
      for (const purchase of purchases) {
        const receiptData = purchase.transactionReceipt || (purchase as any).receipt;
        if (receiptData) {
          try {
            await api.verifyIAPReceipt(receiptData, userEmail, token);
            await RNIap.finishTransaction({ purchase, isConsumable: true });
          } catch (e) {
            console.warn('IAP: Error processing pending purchase:', e);
          }
        }
      }
    } catch (error) {
      console.error('IAP: Failed handling pending purchases:', error);
    }
  }

  /**
   * Cleanup IAP connection on app closing
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await RNIap.endConnection();
      this.isInitialized = false;
      this.products = [];
      this.subscriptions = [];
      console.log('IAP: Connection closed');
    } catch (error) {
      console.error('IAP: Failed to cleanup connection:', error);
    }
  }
}

// Export singleton instance
export const iapService = IAPService.getInstance();
