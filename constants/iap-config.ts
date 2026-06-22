/**
 * IAP (In-App Purchase) Configuration for iOS
 * 
 * These product IDs must match exactly with the products configured in App Store Connect.
 * See APPSTORE_IAP_SETUP.md for detailed setup instructions.
 */

export interface IAPProduct {
  id: 'starter' | 'popular' | 'pro';
  productId: string; // Apple Product ID
  credits: number;
  price: number; // Price in dollars (for display purposes)
}

/**
 * IAP Product IDs - Must match App Store Connect configuration
 */
export const IAP_PRODUCTS: IAPProduct[] = [
  {
    id: 'starter',
    productId: 'com.hexerve.AnimateMemories.credits.starter',
    credits: 30,
    price: 9.99,
  },
  {
    id: 'popular',
    productId: 'com.hexerve.AnimateMemories.credits.popular',
    credits: 100,
    price: 24.99,
  },
  {
    id: 'pro',
    productId: 'com.hexerve.AnimateMemories.credits.pro',
    credits: 200,
    price: 44.99,
  },
];

/**
 * Get all Apple product IDs
 */
export const getProductIds = (): string[] => {
  return IAP_PRODUCTS.map(product => product.productId);
};

/**
 * Map Apple product ID to our pack ID
 */
export const getPackIdFromProductId = (productId: string): string | null => {
  const product = IAP_PRODUCTS.find(p => p.productId === productId);
  return product ? product.id : null;
};

/**
 * Get product details by pack ID
 */
export const getProductByPackId = (packId: 'starter' | 'popular' | 'pro'): IAPProduct | null => {
  return IAP_PRODUCTS.find(p => p.id === packId) || null;
};

/**
 * Get product details by Apple product ID
 */
export const getProductByProductId = (productId: string): IAPProduct | null => {
  return IAP_PRODUCTS.find(p => p.productId === productId) || null;
};

/**
 * Validate if a product ID is one of our configured products
 */
export const isValidProductId = (productId: string): boolean => {
  return IAP_PRODUCTS.some(p => p.productId === productId);
};
