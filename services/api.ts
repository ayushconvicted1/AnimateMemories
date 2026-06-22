import { Platform } from "react-native";

// Get the appropriate API base URL based on platform
// Android emulator uses 10.0.2.2 to access host machine's localhost
// Android physical device needs the actual local network IP
// iOS and web can use localhost
const getApiBaseUrl = (): string => {
  // If explicitly set via env var, use that
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // For Android, use 10.0.2.2 (emulator) or detect local IP
  if (Platform.OS === "android") {
    // For Android emulator, 10.0.2.2 maps to host machine's localhost
    // For physical devices, you may need to set EXPO_PUBLIC_API_BASE_URL to your local IP
    return "https://www.animatememories.com";
  }

  // For iOS and web, use localhost
  return "https://www.animatememories.com";
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to extract meaningful error messages from HTML/text responses
function extractErrorMessageFromText(text: string, statusCode: number): string {
  if (!text) {
    return `Server error (${statusCode})`;
  }

  // If it's HTML, try to extract meaningful information
  if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
    // Check for common error patterns in HTML
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      // Extract just the error message part
      const errorMatch = title.match(/(\d+:\s*)?(.+)/);
      if (errorMatch && errorMatch[2]) {
        return errorMatch[2].replace(/^\d+:\s*/, "").trim();
      }
    }

    // Check for error messages in the body
    const errorMatch =
      text.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
      text.match(/<h2[^>]*>([^<]+)<\/h2>/i) ||
      text.match(/Internal server error/i) ||
      text.match(/500[^<]*/i);

    if (errorMatch) {
      if (statusCode === 500) {
        return "Server error: The service is temporarily unavailable. Please try again in a few minutes.";
      }
      return `Server error (${statusCode}): ${errorMatch[0].substring(0, 100)}`;
    }

    // Default message for HTML errors
    if (statusCode === 500) {
      return "Server error: The service is temporarily unavailable. Please try again in a few minutes.";
    }
    return `Server error (${statusCode})`;
  }

  // For plain text, return it (but limit length)
  return text.length > 200 ? text.substring(0, 200) + "..." : text;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  token?: string | null;
}

export const apiRequest = async (
  endpoint: string,
  options: ApiOptions = {}
): Promise<any> => {
  const { method = "GET", body, headers = {}, token } = options;

  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    // Only set Content-Type for JSON, not for FormData
    if (!(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    // Add Clerk auth token if available
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.statusText}`;
      let errorData: any = { error: errorMessage };

      try {
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();

        if (contentType.includes("application/json")) {
          // Try to parse as JSON
          try {
            errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (jsonError) {
            // If JSON parsing fails, treat as text
            errorMessage = extractErrorMessageFromText(text, response.status);
          }
        } else {
          // Handle HTML or other text responses
          errorMessage = extractErrorMessageFromText(text, response.status);
        }
      } catch (parseError) {
        // If parsing fails, use the default error message
        console.warn("Failed to parse error response:", parseError);
      }

      const apiError = new Error(errorMessage);
      // @ts-ignore - Add status code for better error handling
      apiError.status = response.status;
      // @ts-ignore
      apiError.statusText = response.statusText;
      throw apiError;
    }

    return await response.json();
  } catch (error: any) {
    // Handle network errors
    if (
      error.message === "Network request failed" ||
      error.message === "Failed to fetch"
    ) {
      const networkError = new Error(
        "Network error: Please check your internet connection"
      );
      console.error(`API Network Error (${endpoint}):`, networkError);
      throw networkError;
    }

    // Re-throw API errors with status codes
    if (error.status) {
      console.error(`API Error (${endpoint}):`, error.status, error.message);
    } else {
      console.error(`API Error (${endpoint}):`, error);
    }
    throw error;
  }
};

// API Methods
export const api = {
  // Verify user and get credits
  verifyUser: async (user: any, token?: string | null) => {
    return apiRequest("/api/verify-user", {
      method: "POST",
      body: { user },
      token,
    });
  },

  // Get feature credit costs
  getFeatureCosts: async () => {
    return apiRequest("/api/feature-credits", {
      method: "GET",
    });
  },

  // Restore image
  restoreImage: async (
    inputImageUrl: string,
    userEmail: string,
    token?: string | null
  ) => {
    return apiRequest("/api/fix-image", {
      method: "POST",
      body: { inputImageUrl, userEmail },
      token,
    });
  },

  // Enhance image (Upscale, Face Enhance, Colorize)
  enhanceImage: async (
    inputImageUrl: string,
    userEmail: string,
    features: { upscale: boolean; faceEnhance: boolean; colorize: boolean },
    token?: string | null
  ) => {
    return apiRequest("/api/enhance-image", {
      method: "POST",
      body: { inputImageUrl, userEmail, features },
      token,
    });
  },

  // Animate photo
  animatePhoto: async (
    inputImageUrl: string,
    userEmail: string,
    customPrompt: string = "",
    duration: number = 6,
    token?: string | null
  ) => {
    return apiRequest("/api/old-photo-animation", {
      method: "POST",
      body: { inputImageUrl, userEmail, customPrompt, duration },
      token,
    });
  },

  // Get user gallery/history
  getGallery: async (userEmail: string, token?: string | null) => {
    return apiRequest(
      `/api/gallery?userEmail=${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        token,
      }
    );
  },

  // Delete image
  deleteImage: async (
    userEmail: string,
    imageId: number,
    token?: string | null
  ) => {
    return apiRequest("/api/delete-image", {
      method: "POST",
      body: { userEmail, imageId },
      token,
    });
  },

  // Create payment intent
  createPaymentIntent: async (
    amount: number,
    credits: number,
    userDetails: { email: string; name: string },
    token?: string | null,
    packId?: string,
    platform?: string
  ) => {
    return apiRequest("/api/create-payment-intent", {
      method: "POST",
      body: { amount, credits, userDetails, platform: platform || "mobile", packId },
      token,
    });
  },

  // Verify payment and update credits (fallback if webhook is delayed)
  verifyPayment: async (
    sessionId: string,
    userEmail: string,
    token?: string | null
  ) => {
    return apiRequest("/api/verify-payment", {
      method: "POST",
      body: { sessionId, userEmail },
      token,
    });
  },

  // Upload image to backend (which uploads to Cloudinary)
  uploadImage: async (fileUri: string, token?: string | null) => {
    const formData = new FormData();

    // React Native FormData format - backend will handle the conversion
    // @ts-ignore - React Native FormData accepts objects with uri, type, name
    formData.append("file", {
      uri: fileUri,
      type: "image/jpeg",
      name: `photo_${Date.now()}.jpg`,
    } as any);

    const result = await apiRequest("/api/upload-image", {
      method: "POST",
      body: formData,
      token,
    });

    return result.url || result.secure_url || result.imageUrl;
  },

  // Get user stats (videos created, images created, credits, shared)
  getUserStats: async (userEmail: string, token?: string | null) => {
    return apiRequest(
      `/api/user-stats?userEmail=${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        token,
      }
    );
  },

  // Update user name and/or email
  updateUser: async (
    userEmail: string,
    name?: string,
    email?: string,
    token?: string | null
  ) => {
    return apiRequest("/api/update-user", {
      method: "POST",
      body: { userEmail, name, email },
      token,
    });
  },

  // Get user's last purchased plan
  getUserPlan: async (userEmail: string, token?: string | null) => {
    return apiRequest(
      `/api/user-plan?userEmail=${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        token,
      }
    );
  },

  // Get transaction history
  getTransactions: async (userEmail: string, token?: string | null) => {
    return apiRequest(
      `/api/transactions?userEmail=${encodeURIComponent(userEmail)}`,
      {
        method: "GET",
        token,
      }
    );
  },

  // Verify iOS IAP receipt
  verifyIAPReceipt: async (
    receiptData: string,
    userEmail: string,
    token?: string | null
  ) => {
    return apiRequest("/api/iap-verify", {
      method: "POST",
      body: { receiptData, userEmail },
      token,
    });
  },

  // Restore iOS IAP purchases
  restoreIAPPurchases: async (
    receiptData: string,
    userEmail: string,
    token?: string | null
  ) => {
    return apiRequest("/api/iap-restore", {
      method: "POST",
      body: { receiptData, userEmail },
      token,
    });
  },
};
