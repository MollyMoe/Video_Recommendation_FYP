
import { useEffect, useState } from "react";

import { API } from "@/config/api";

const StPaymentSuccessPage = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const finalizeSubscription = async () => {
      const params = new URLSearchParams(window.location.hash.split("?")[1]);

      const userId = params.get("userId");
      const plan = params.get("plan");
      const cycle = params.get("cycle");
      const price = params.get("price");
      const email = params.get("email");

      if (!userId || !plan || !cycle || !price || !email) {
        setError("Missing subscription data in URL.");
        setIsProcessing(false);
        return;
      }

      const payload = {
        userId,
        plan,
        cycle,
        price: parseFloat(price),
        email,
      };

      try {
        const res = await fetch(`${API}/api/subscription/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log("✅ Finalized subscription:", data);
      } catch (err) {
        console.error("❌ Failed to finalize subscription:", err);
        setError("There was a problem confirming your subscription.");
      } finally {
        setIsProcessing(false);
      }
    };

    finalizeSubscription();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4">
      {isProcessing ? (
        <p className="text-lg text-gray-600">Processing your subscription...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            🎉 Payment Successful!
          </h2>
          <p className="text-gray-700 mb-6">
            Thank you for subscribing to CineIt. Your subscription is confirmed.
            You can now return to the app to enjoy pro features.
          </p>
          <a
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Go to App
          </a>
        </>
      )}
    </div>
  );
};

export default StPaymentSuccessPage;
