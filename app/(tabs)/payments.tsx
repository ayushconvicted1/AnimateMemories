import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { getFontFamily } from "@/constants/Fonts";
import {
  VisaIcon,
  MastercardIcon,
  ApplePayIcon,
  GooglePayIcon,
  PaypalIcon,
} from "@/components/images/PaymentIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

interface Transaction {
  id: string;
  type: "purchase" | "usage";
  description: string;
  amount: number;
  credits: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

export default function PaymentsScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchUserCredits = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const result = await api.verifyUser(user, token);
      setUserCredits(result.result?.credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
      setUserCredits(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const userEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) return;

      const token = await getToken();
      const res = await api.getTransactions(userEmail, token);
      if (res?.result && Array.isArray(res.result)) {
        const mappedTx: Transaction[] = res.result.map((tx: any) => ({
          id: tx.id?.toString() || Math.random().toString(),
          type: "purchase",
          description: tx.packId
            ? `${tx.packId.charAt(0).toUpperCase() + tx.packId.slice(1)} Pack - ${tx.credits} Credits`
            : `${tx.credits} Credits Purchase`,
          amount: Number(tx.amount) || 0,
          credits: Number(tx.credits) || 0,
          date: tx.createdAt
            ? new Date(tx.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Recent",
          status: tx.status === "completed" ? "completed" : tx.status === "failed" ? "failed" : "pending",
        }));
        setTransactions(mappedTx);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [user, getToken]);

  useEffect(() => {
    if (user) {
      fetchUserCredits();
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [user, fetchUserCredits, fetchTransactions]);

  return (
    <ScreenWrapper addBottomPadding={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/you")}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <GradientText style={styles.title}>Payments</GradientText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Credits Card */}
          <View style={styles.creditsCard}>
            <Text style={styles.creditsCardTitle}>Current Credits</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#28D4FA" />
            ) : (
              <GradientText style={styles.creditsCardValue}>
                {userCredits !== null ? `${userCredits} Credits` : "0 Credits"}
              </GradientText>
            )}
          </View>

          {/* Buy Credits Button */}
          <View style={styles.buySection}>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => router.push("/(tabs)/credit")}
            >
              <LinearGradient
                colors={["#28D4FA", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buyButtonGradient}
              >
                <Text style={styles.buyButtonText}>Buy Credits</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                We accept all major credit cards, debit cards, and digital
                wallets powered securely by Stripe:
              </Text>
              <View style={styles.paymentIconsRow}>
                <VisaIcon style={styles.paymentBadge} />
                <MastercardIcon style={styles.paymentBadge} />
                <ApplePayIcon style={styles.paymentBadge} />
                <GooglePayIcon style={styles.paymentBadge} />
                <PaypalIcon style={styles.paymentBadge} />
              </View>
            </View>
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </Text>
                    </View>
                    <View style={styles.transactionRight}>
                      {transaction.type === "purchase" ? (
                        <Text style={styles.transactionAmount}>
                          +${transaction.amount}
                        </Text>
                      ) : (
                        <Text style={styles.transactionCredits}>
                          {transaction.credits > 0 ? "+" : ""}
                          {transaction.credits} Credits
                        </Text>
                      )}
                      <View
                        style={[
                          styles.statusBadge,
                          transaction.status === "completed" &&
                            styles.statusBadgeCompleted,
                          transaction.status === "pending" &&
                            styles.statusBadgePending,
                          transaction.status === "failed" &&
                            styles.statusBadgeFailed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            transaction.status === "completed" &&
                              styles.statusTextCompleted,
                            transaction.status === "pending" &&
                              styles.statusTextPending,
                            transaction.status === "failed" &&
                              styles.statusTextFailed,
                          ]}
                        >
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Credit Usage Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credit Usage</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How Credits Work</Text>
              <Text style={styles.infoText}>
                • Photo restoration: 1 credit{"\n"}• Photo animation: Starts from 3 credits (varies by model & duration)
                {"\n"}• Credits never expire{"\n"}• Unused credits remain in
                your account
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 15,
    color: "#000",
    fontFamily: getFontFamily("600"),
  },
  title: {
    fontSize: 24,
    fontFamily: getFontFamily("700"),
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  creditsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  creditsCardTitle: {
    fontSize: 14,
    color: "#979797",
    marginBottom: 8,
    fontFamily: getFontFamily("500"),
  },
  creditsCardValue: {
    fontSize: 32,
    fontFamily: getFontFamily("700"),
  },
  buySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  buyButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  buyButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: getFontFamily("600"),
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    color: "#000",
    marginBottom: 12,
    fontFamily: getFontFamily("700"),
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoTitle: {
    fontSize: 15,
    color: "#000",
    marginBottom: 8,
    fontFamily: getFontFamily("600"),
  },
  infoText: {
    fontSize: 13,
    color: "#979797",
    lineHeight: 20,
    fontFamily: getFontFamily("400"),
  },
  paymentIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  paymentBadge: {
    borderRadius: 4,
    overflow: "hidden",
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#979797",
    fontFamily: getFontFamily("400"),
  },
  transactionsList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    color: "#000",
    marginBottom: 4,
    fontFamily: getFontFamily("600"),
  },
  transactionDate: {
    fontSize: 12,
    color: "#979797",
    fontFamily: getFontFamily("400"),
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 15,
    color: "#28D4FA",
    marginBottom: 4,
    fontFamily: getFontFamily("700"),
  },
  transactionCredits: {
    fontSize: 14,
    color: "#D229FF",
    marginBottom: 4,
    fontFamily: getFontFamily("600"),
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  statusBadgeCompleted: {
    backgroundColor: "#d1fae5",
  },
  statusBadgePending: {
    backgroundColor: "#fef3c7",
  },
  statusBadgeFailed: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 11,
    color: "#6b7280",
    fontFamily: getFontFamily("600"),
  },
  statusTextCompleted: {
    color: "#059669",
  },
  statusTextPending: {
    color: "#d97706",
  },
  statusTextFailed: {
    fontSize: 14,
    color: "#979797",
    fontFamily: getFontFamily("400"),
  },
});
