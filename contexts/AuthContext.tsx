import React, { createContext, ReactNode, useContext } from "react";
import { ClerkProvider, useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: any;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </ClerkProvider>
  );
};

const AuthContextProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user } = useUser();

  const value = {
    isSignedIn: !!isSignedIn,
    isLoaded,
    user,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};