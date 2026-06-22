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

  useEffect(() => {
    if (user) {
      fetchUserCredits();
      // Mock transaction data - in production, fetch from API
      setTransactions([
        {
          id: "1",
          type: "purchase",
          description: "Popular Pack - 100 Credits",
          amount: 25,
          credits: 100,
          date: "2024-01-15",
          status: "completed",
        },
        {
          id: "2",
          type: "usage",
          description: "Photo Animation",
          amount: 0,
          credits: -3,
          date: "2024-01-14",
          status: "completed",
        },
        {
          id: "3",
          type: "usage",
          description: "Photo Restoration",
          amount: 0,
          credits: -1,
          date: "2024-01-13",
          status: "completed",
        },
        {
          id: "4",
          type: "purchase",
          description: "Starter Pack - 30 Credits",
          amount: 10,
          credits: 30,
          date: "2024-01-10",
          status: "completed",
        },
      ]);
    } else {
      setLoading(false);
    }
  }, [user, fetchUserCredits]);

  return (
    <ScreenWrapper addBottomPadding={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
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
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                We accept all major credit cards, debit cards, and digital
                payment methods including:
              </Text>
              <View style={styles.paymentMethodsList}>
                <Text style={styles.paymentMethodItem}>• Visa</Text>
                <Text style={styles.paymentMethodItem}>• Mastercard</Text>
                <Text style={styles.paymentMethodItem}>• American Express</Text>
                <Text style={styles.paymentMethodItem}>• PayPal</Text>
                <Text style={styles.paymentMethodItem}>• Apple Pay</Text>
                <Text style={styles.paymentMethodItem}>• Google Pay</Text>
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
                • Photo restoration: 1 credit{"\n"}• Photo animation: 3 credits
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
    fontWeight: "600",
    color: "#000",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
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
    fontWeight: "500",
    color: "#979797",
    marginBottom: 12,
  },
  creditsCardValue: {
    fontSize: 30,
    fontWeight: "700",
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
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 22,
  },
  paymentMethodsList: {
    marginTop: 12,
  },
  paymentMethodItem: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    marginBottom: 8,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: "400",
    color: "#979797",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#28D4FA",
    marginBottom: 4,
  },
  transactionCredits: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D229FF",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: "#d4edda",
  },
  statusBadgePending: {
    backgroundColor: "#fff3cd",
  },
  statusBadgeFailed: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusTextCompleted: {
    color: "#155724",
  },
  statusTextPending: {
    color: "#856404",
  },
  statusTextFailed: {
    color: "#721c24",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#979797",
  },
});
