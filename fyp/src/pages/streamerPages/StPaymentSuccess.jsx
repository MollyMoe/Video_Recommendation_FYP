import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

const StPaymentSuccess = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const finalizeSubscription = async () => {
      const pending = JSON.parse(localStorage.getItem("pendingSubscription"));

      if (!pending) {
        setError("No subscription data found.");
        setIsProcessing(false);
        return;
      }

      try {
        const res = await fetch(`${API}/api/subscription/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
        });

        const data = await res.json();
        localStorage.removeItem("pendingSubscription");
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
            href="#/home/subscription"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Go to App
          </a>
        </>
      )}
    </div>
  );
};

export default StPaymentSuccess;