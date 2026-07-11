/**
 * IAP Service for iOS In-App Purchases
 * Using Expo In-App Purchases API
 * 
 * This service handles all iOS IAP operations including:
 * - Initializing IAP connection
 * - Fetching available products
 * - Purchasing products
 * - Verifying receipts with backend
 * - Restoring purchases
 * - Finishing transactions
 */

import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { getProductIds, getProductByProductId, isValidProductId, getSubscriptionProductIds } from '@/constants/iap-config';
import { api } from './api';

export class IAPService {
  private static instance: IAPService;
  private isInitialized = false;
  private products: InAppPurchases.IAPItemDetails[] = [];

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
    if (Platform.OS !== 'ios') {
      console.log('IAP: Not on iOS, skipping initialization');
      return false;
    }

    if (this.isInitialized) {
      console.log('IAP: Already initialized');
      return true;
    }

    try {
      console.log('IAP: Initializing connection...');
      await InAppPurchases.connectAsync();
      
      this.isInitialized = true;
      console.log('IAP: Connection initialized successfully');
      
      // Fetch products
      await this.fetchProducts();
      
      return true;
    } catch (error) {
      console.error('IAP: Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Fetch available products from App Store
   */
  async fetchProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
    if (Platform.OS !== 'ios') {
      console.log('IAP: Not on iOS platform, skipping product fetch');
      return [];
    }

    try {
      const productIds = [...getProductIds(), ...getSubscriptionProductIds()];
      
      console.log('IAP: Fetching products:', productIds);
      console.log('IAP: Bundle ID should be: com.hexerve.AnimateMemories');
      
      const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);
      
      console.log('IAP: Response code:', responseCode);
      console.log('IAP: Response code OK?', responseCode === InAppPurchases.IAPResponseCode.OK);
      console.log('IAP: Raw results:', JSON.stringify(results, null, 2));
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.products = results || [];
        console.log('IAP: Fetched products:', this.products.length);
        
        if (this.products.length === 0) {
          console.warn('⚠️ IAP: 0 products fetched. Possible reasons:');
          console.warn('  1. Product IDs in App Store Connect don\'t match code');
          console.warn('  2. Products not "Ready to Submit" in App Store Connect');
          console.warn('  3. Agreements/Banking/Tax not completed');
          console.warn('  4. Products just created (wait 2-24 hours for propagation)');
          console.warn('  5. Bundle ID mismatch');
        } else {
          console.log('✅ IAP: Successfully fetched products:');
          this.products.forEach(product => {
            console.log(`  - ${product.productId}: ${product.title} (${product.price})`);
          });
        }
        
        return this.products;
      } else {
        const errorMessage = this.getResponseCodeMessage(responseCode);
        console.error('IAP: Failed to fetch products, response code:', responseCode, '-', errorMessage);
        throw new Error(`Failed to fetch IAP products: ${errorMessage}`);
      }
    } catch (error) {
      console.error('IAP: Failed to fetch products:', error);
      throw new Error('Failed to fetch IAP products');
    }
  }

  /**
   * Get human-readable message for response code
   */
  private getResponseCodeMessage(code: InAppPurchases.IAPResponseCode): string {
    switch (code) {
      case InAppPurchases.IAPResponseCode.OK:
        return 'Success';
      case InAppPurchases.IAPResponseCode.USER_CANCELED:
        return 'User cancelled';
      case InAppPurchases.IAPResponseCode.ERROR:
        return 'Error occurred';
      case InAppPurchases.IAPResponseCode.DEFERRED:
        return 'Purchase deferred (awaiting approval)';
      default:
        return `Unknown code: ${code}`;
    }
  }

  /**
   * Get a specific product by product ID
   */
  getProduct(productId: string): InAppPurchases.IAPItemDetails | undefined {
    return this.products.find(p => p.productId === productId);
  }

  /**
   * Get all available products
   */
  getProducts(): InAppPurchases.IAPItemDetails[] {
    return this.products;
  }

  /**
   * Purchase a product
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
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'IAP only available on iOS' };
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!isValidProductId(productId)) {
      return { success: false, error: 'Invalid product ID' };
    }

    try {
      console.log('IAP: Requesting purchase for:', productId);
      
      // Check if the product has been retrieved from the store
      let product = this.getProduct(productId);
      
      // If we don't have it loaded in memory, try fetching again
      if (!product) {
        console.log('IAP: Product not found in local cache, fetching again...');
        await this.fetchProducts();
        product = this.getProduct(productId);
        
        if (!product) {
          return { 
            success: false, 
            error: 'Apple could not find this product block. Please ensure products are "Ready to Submit" in App Store Connect and wait 24hrs.' 
          };
        }
      }

      
      // Request purchase from App Store
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
        console.log('IAP: Purchase successful, verifying receipt...');
        
        // Get the purchase details
        const purchase = results[0];
        
        // Get the receipt
        const receiptData = purchase.transactionReceipt;
        
        if (!receiptData) {
          throw new Error('No receipt available');
        }

        // Verify receipt with backend
        const verificationResult = await api.verifyIAPReceipt(receiptData, userEmail, token);

        if (verificationResult.success) {
          // Finish the transaction
          await InAppPurchases.finishTransactionAsync(purchase, true);
          
          console.log('IAP: Purchase verified and completed');
          
          return {
            success: true,
            credits: verificationResult.credits,
            creditsAdded: verificationResult.creditsAdded,
          };
        } else {
          throw new Error(verificationResult.error || 'Verification failed');
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        return { success: false, error: 'Purchase cancelled' };
      } else {
        throw new Error(`Purchase failed with code: ${responseCode}`);
      }
    } catch (error: any) {
      console.error('IAP: Purchase failed:', error);
      
      // Handle user cancellation
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        return { success: false, error: 'Purchase cancelled' };
      }
      
      return { 
        success: false, 
        error: error.message || 'Purchase failed' 
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
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'IAP only available on iOS' };
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('IAP: Restoring purchases...');
      
      // Get purchase history
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync(false);
      
      if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results || results.length === 0) {
        return { 
          success: true, 
          restoredCount: 0,
          creditsAdded: 0,
          message: 'No purchases to restore' 
        };
      }

      // Get the most recent receipt
      const latestPurchase = results[results.length - 1];
      const receiptData = latestPurchase.transactionReceipt;
      
      if (!receiptData) {
        return { 
          success: true, 
          restoredCount: 0,
          creditsAdded: 0,
          message: 'No purchases to restore' 
        };
      }

      // Verify and restore with backend
      const restoreResult = await api.restoreIAPPurchases(receiptData, userEmail, token);

      console.log('IAP: Restore result:', restoreResult);

      // Finish all transactions
      for (const purchase of results) {
        await InAppPurchases.finishTransactionAsync(purchase, true);
      }

      return {
        success: true,
        restoredCount: restoreResult.restoredCount || 0,
        creditsAdded: restoreResult.creditsAdded || 0,
        message: restoreResult.message,
      };
    } catch (error: any) {
      console.error('IAP: Restore failed:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to restore purchases' 
      };
    }
  }

  /**
   * Handle pending purchases on app launch
   * Call this when app starts to finish any incomplete transactions
   */
  async handlePendingPurchases(
    userEmail: string,
    token?: string | null
  ): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      // Get purchase history to check for pending transactions
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync(false);
      
      if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results || results.length === 0) {
        console.log('IAP: No pending purchases');
        return;
      }

      console.log('IAP: Found purchase history:', results.length);

      // Get the latest receipt and verify with backend
      const latestPurchase = results[results.length - 1];
      const receiptData = latestPurchase.transactionReceipt;
      
      if (receiptData) {
        await api.verifyIAPReceipt(receiptData, userEmail, token);
      }

      // Finish all transactions
      for (const purchase of results) {
        await InAppPurchases.finishTransactionAsync(purchase, true);
      }

      console.log('IAP: Finished pending purchases');
    } catch (error) {
      console.error('IAP: Failed to handle pending purchases:', error);
    }
  }

  /**
   * Cleanup IAP connection
   * Call when app is closing
   */
  async cleanup(): Promise<void> {
    if (Platform.OS !== 'ios' || !this.isInitialized) {
      return;
    }

    try {
      await InAppPurchases.disconnectAsync();
      this.isInitialized = false;
      this.products = [];
      console.log('IAP: Connection closed');
    } catch (error) {
      console.error('IAP: Failed to cleanup:', error);
    }
  }
}

// Export singleton instance
export const iapService = IAPService.getInstance();
