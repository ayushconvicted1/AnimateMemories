import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";

export interface PricingData {
  [packId: string]: {
    productId: string;
    priceId: string;
    amount: number;
    currency: string;
    credits: number;
  };
}

interface PricingContextType {
  pricingData: PricingData | null;
  loading: boolean;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const PricingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await api.getPricing();
        if (response && response.pricing) {
          setPricingData(response.pricing);
        }
      } catch (error) {
        console.error("Failed to fetch dynamic pricing, falling back to hardcoded values", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  return (
    <PricingContext.Provider value={{ pricingData, loading }}>
      {children}
    </PricingContext.Provider>
  );
};

export const usePricing = (): PricingContextType => {
  const context = useContext(PricingContext);
  if (context === undefined) {
    throw new Error("usePricing must be used within a PricingProvider");
  }
  return context;
};
