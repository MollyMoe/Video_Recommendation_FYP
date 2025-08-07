import React, { useEffect, useState } from "react";
import StPlans from "../../components/streamer_components/StPlans";
import StBillingForm from "../../components/streamer_components/StBillingForm";
import { FaChevronRight } from "react-icons/fa";

import { getAPI } from "@/config/api";

const StManageSubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [step, setStep] = useState("overview");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const [isRedirecting, setIsRedirecting] = useState(false);

  const fetchSubscription = async () => {
  try {
    let data;

    if (navigator.onLine && window.electron?.saveSubscription) {
      // Online: fetch from backend, then save locally
      const res = await fetch(`${API}/api/subscription/${user.userId}`);
      data = await res.json();
      setSubscription(data);

      // Save to local cache
      await window.electron.saveSubscription(data);
    } else if (window.electron?.getSubscription) {
      // Offline: load from local cache
      data = await window.electron.getSubscription();
      setSubscription(data);
    } else {
      console.warn("No subscription data available offline.");
    }
  } catch (err) {
    console.error("Failed to fetch subscription:", err);
  }
};


  useEffect(() => {
    console.log("Fetched subscription:", subscription);
    fetchSubscription();
  }, []);

  const cancelSubscription = async () => {
    await fetch(`${API}/api/subscription/cancel/${user.userId}`, {
      method: "POST",
    });
    fetchSubscription();
  };

  const pollSubscriptionStatus = async () => {
  const maxAttempts = 15;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const res = await fetch(`${API}/api/subscription/${user.userId}`);
      const data = await res.json();
      if (data.isActive && data.plan !== "Free Trial") {
        console.log("✅ Subscription updated:", data);
        setSubscription(data);
        setStep("overview");
        break;
      }
    } catch (e) {
      console.warn("Polling error:", e);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000)); // wait 3 seconds
    attempts++;
  }

  setIsRedirecting(false); // hide modal even if failed after max attempts
};

useEffect(() => {
  fetchSubscription();
}, []);

  return (
    <div className="min-h-screen pt-24 px-6 sm:px-12 sm:ml-64 max-w-5xl mx-auto dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-10 text-gray-900 dark:text-white">
        Manage Your Subscription
      </h1>

      {step === "overview" && subscription && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          {/* Free trial block */}
          {subscription?.plan === "Free Trial" && subscription?.isActive ? (
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  Free Trial
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  7-day trial access to all premium features
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 mt-4 sm:mt-0">
                <button
                  onClick={() => setStep("choose")}
                  className="px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-600 dark:hover:text-white"
                >
                  Choose a Plan
                </button>
              </div>
            </div>
          ) : (
            <>
              {subscription?.isActive && !subscription?.wasCancelled ? (
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                      {subscription.plan}
                    </h2>
                    {subscription.plan && subscription.plan !== "Free Trial" && (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {subscription.cycle || "Monthly"} subscription
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          SGD {subscription.price}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Next payment: {subscription.nextPayment}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                    <button
                      onClick={cancelSubscription}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-600 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep("choose")}
                      className="px-4 py-2 border border-gray-400 text-gray-700 dark:text-white text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Change Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                      {subscription?.plan || "No Plan Selected"}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subscription?.isActive
                        ? `${subscription?.cycle || "Monthly"} subscription`
                        : "No active subscription yet"}
                    </p>
                    {subscription?.expiresOn && (
                      <p className="text-xs text-gray-400 mt-1">
                        Expiring on: {new Date(subscription.expiresOn).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 mt-4 sm:mt-0">
                    {subscription?.wasCancelled && (
                      <span className="text-xs text-red-500 font-semibold">
                        You have cancelled your subscription
                      </span>
                    )}
                    <button
                      onClick={() => setStep("choose")}
                      className="px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-600 dark:hover:text-white"
                    >
                      Buy Subscription
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <hr className="border-t border-gray-300 dark:border-gray-600 my-4" />

          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-white">Billing</p>
              <p className="text-xs text-gray-500">Edit billing details</p>
            </div>
            <button onClick={() => setStep("billing")}>
              <FaChevronRight className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      )}

      {step === "choose" && (
        <StPlans
          onSelect={(plan) => {
            setSelectedPlan(plan);
            localStorage.setItem(
              "pendingSubscription",
              JSON.stringify({
                userId: user.userId,
                plan: plan.name,
                cycle: plan.cycle,
                price: plan.price,
              })
            );
            setStep("pay");
          }}
          onBack={() => setStep("overview")}
        />
      )}

      {step === "pay" && selectedPlan && (
        <div className="bg-white dark:bg-gray-800 max-w-lg mx-auto border border-gray-300 dark:border-gray-600 rounded-2xl p-8 shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-center text-black dark:text-white">Confirm Your Plan</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Plan</span>
              <span className="text-gray-900 dark:text-white">{selectedPlan.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cycle</span>
              <span className="text-gray-900 dark:text-white">{selectedPlan.cycle}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Price</span>
              <span className="text-gray-900 dark:text-white">SGD ${selectedPlan.price.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col space-y-3 items-center">
            <button
              className="w-full bg-purple-600 text-white font-medium py-2 px-4 rounded-lg shadow hover:bg-purple-700"
              onClick={async () => {
                setIsRedirecting(true);
                try {
                  const res = await fetch(`${API}/api/stripe/create-checkout-session`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.userId,
                      plan: selectedPlan.name,
                      cycle: selectedPlan.cycle,
                      price: selectedPlan.price,
                      email: user.email,
                    }),
                  });

                  const data = await res.json();

                  if (data.url) {
                    if (window.electron?.openExternal) {
                      window.electron.openExternal(data.url); // Open Stripe externally
                    } else {
                      window.open(data.url, "_blank");
                    }

                    // 🔁 Start polling after opening Stripe
                    pollSubscriptionStatus();
                  }
                } catch (err) {
                  console.error("Stripe Checkout Error:", err);
                  alert("An error occurred. Try again.");
                  setIsRedirecting(false);
                }
              }}
            >
              Proceed to Checkout
            </button>


            <button
              className="text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              onClick={() => setStep("choose")}
            >
              &larr; Back
            </button>
          </div>
        </div>
      )}

      {step === "billing" && (
        <StBillingForm
          onSuccess={() => setStep("overview")}
          onBack={() => setStep("overview")}
        />
      )}
      
      {/* 🔁 Stripe loading modal */}
      {isRedirecting && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold">Waiting for payment confirmation...</p>
          <div className="mt-2 animate-spin h-6 w-6 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-gray-500 mt-2">You may close the Stripe page after payment.</p>
        </div>
      </div>
    )}
    </div>
  );
};

export default StManageSubscriptionPage;