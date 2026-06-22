import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { GradientText } from "@/components/ui/GradientText";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function PaymentCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing payment...");

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      // Check if this is a success or cancelled callback
      const url = params.url as string;
      const sessionId = params.session_id as string;

      if (url?.includes("payment-success") || sessionId) {
        // Payment was successful
        if (user) {
          const token = await getToken();
          const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
          
          if (!userEmail) {
            setStatus("error");
            setMessage("Unable to get your email address.");
            return;
          }

          // First, verify payment and update credits if webhook hasn't processed yet
          if (sessionId) {
            try {
              console.log("Verifying payment session:", sessionId);
              const verifyResult = await api.verifyPayment(sessionId, userEmail, token);
              
              if (verifyResult.success) {
                console.log("Payment verified and credits updated:", verifyResult.credits);
                setStatus("success");
                setMessage(`Payment successful! You now have ${verifyResult.credits || 0} credits.`);
              } else {
                // If verification fails, still check current credits (webhook might have processed)
                console.log("Payment verification returned error, checking current credits...");
                const result = await api.verifyUser(user, token);
                setStatus("success");
                setMessage(`Payment successful! You now have ${result.result?.credits || 0} credits.`);
              }
            } catch (verifyError: any) {
              console.error("Error verifying payment:", verifyError);
              // Fallback: just check current credits (webhook might have processed)
              const result = await api.verifyUser(user, token);
              setStatus("success");
              setMessage(`Payment successful! You now have ${result.result?.credits || 0} credits.`);
            }
          } else {
            // No session ID, just check current credits
            const result = await api.verifyUser(user, token);
            setStatus("success");
            setMessage(`Payment successful! You now have ${result.result?.credits || 0} credits.`);
          }
          
          // Redirect to credit screen after 2 seconds
          setTimeout(() => {
            router.replace("/(tabs)/credit");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Unable to verify payment. Please check your account.");
        }
      } else if (url?.includes("payment-cancelled")) {
        // Payment was cancelled
        setStatus("error");
        setMessage("Payment was cancelled.");
        
        // Redirect to credit screen after 2 seconds
        setTimeout(() => {
          router.replace("/(tabs)/credit");
        }, 2000);
      } else {
        // Unknown status, refresh credits anyway
        if (user) {
          const token = await getToken();
          await api.verifyUser(user, token);
        }
        setStatus("success");
        setMessage("Payment processed. Refreshing your credits...");
        
        setTimeout(() => {
          router.replace("/(tabs)/credit");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Payment callback error:", error);
      setStatus("error");
      setMessage("An error occurred while processing your payment. Please check your account.");
      
      setTimeout(() => {
        router.replace("/(tabs)/credit");
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === "loading" && (
          <>
            <ActivityIndicator size="large" color="#28D4FA" />
            <GradientText style={styles.title}>Processing Payment</GradientText>
            <Text style={styles.message}>{message}</Text>
          </>
        )}

        {status === "success" && (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <GradientText style={styles.title}>Payment Successful!</GradientText>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/credit")}
              style={styles.button}
            >
              <LinearGradient
                colors={["#28D4FA", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {status === "error" && (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <GradientText style={styles.title}>Payment Issue</GradientText>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/credit")}
              style={styles.button}
            >
              <LinearGradient
                colors={["#28D4FA", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  button: {
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});

