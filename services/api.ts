import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@clerk/clerk-expo";

// Base URL for the Next.js backend
// Update this to your actual backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

export const apiRequest = async (
  endpoint: string,
  options: ApiOptions = {}
): Promise<any> => {
  const { method = "GET", body, headers = {} } = options;

  try {
    // Get Clerk session token
    const token = await getToken();
    
    const url = `${API_BASE_URL}${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add Clerk auth token if available
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new Error(errorData.error || `API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// API Methods
export const api = {
  // Verify user and get credits
  verifyUser: async (user: any) => {
    return apiRequest("/api/verify-user", {
      method: "POST",
      body: { user },
    });
  },

  // Restore image
  restoreImage: async (inputImageUrl: string, userEmail: string) => {
    return apiRequest("/api/fix-image", {
      method: "POST",
      body: { inputImageUrl, userEmail },
    });
  },

  // Animate photo
  animatePhoto: async (
    inputImageUrl: string,
    userEmail: string,
    customPrompt: string = "",
    duration: number = 6
  ) => {
    return apiRequest("/api/old-photo-animation", {
      method: "POST",
      body: { inputImageUrl, userEmail, customPrompt, duration },
    });
  },

  // Get user gallery/history
  getGallery: async (userEmail: string) => {
    // This will need to be implemented as an API route in Next.js
    // For now, we'll need to create this endpoint
    return apiRequest(`/api/gallery?userEmail=${encodeURIComponent(userEmail)}`, {
      method: "GET",
    });
  },

  // Delete image
  deleteImage: async (userEmail: string, imageId: number) => {
    return apiRequest("/api/delete-image", {
      method: "POST",
      body: { userEmail, imageId },
    });
  },

  // Create payment intent
  createPaymentIntent: async (
    amount: number,
    credits: number,
    userDetails: { email: string; name: string }
  ) => {
    return apiRequest("/api/create-payment-intent", {
      method: "POST",
      body: { amount, credits, userDetails },
    });
  },
};



