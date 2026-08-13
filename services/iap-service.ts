/**
 * Default payment service for non-iOS platforms.
 *
 * Android and web use the hosted checkout flow instead of react-native-iap,
 * so this file intentionally avoids importing the native IAP module.
 */

export class IAPService {
  private static instance: IAPService;

  private constructor() {}

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  async initialize(): Promise<boolean> {
    return false;
  }

  async fetchProducts(): Promise<{ products: []; subscriptions: [] }> {
    return { products: [], subscriptions: [] };
  }

  async purchaseProduct(
    _productId: string,
    _userEmail: string,
    _token?: string | null
  ): Promise<{
    success: boolean;
    credits?: number;
    creditsAdded?: number;
    error?: string;
  }> {
    return {
      success: false,
      error: 'Native IAP is only available on iOS. Android uses the hosted payment flow.',
    };
  }

  async restorePurchases(
    _userEmail: string,
    _token?: string | null
  ): Promise<{
    success: boolean;
    restoredCount?: number;
    creditsAdded?: number;
    message?: string;
    error?: string;
  }> {
    return {
      success: false,
      error: 'Restore purchases is only available for iOS App Store purchases.',
    };
  }

  async handlePendingPurchases(
    _userEmail: string,
    _token?: string | null
  ): Promise<void> {
    return;
  }

  async cleanup(): Promise<void> {
    return;
  }
}

export const iapService = IAPService.getInstance();
