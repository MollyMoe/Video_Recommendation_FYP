import React, { useEffect, useState } from "react";
import StPlans from "../../components/streamer_components/StPlans";
import StBillingForm from "../../components/streamer_components/StBillingForm";
import { FaChevronRight } from "react-icons/fa";

import { API } from "@/config/api";

const OfflineTooltipWrapper = ({ children, isOnline }) => {
  if (isOnline) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      {children}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:bg-gray-700 z-10"
        role="tooltip"
      >
        You cannot perform this action while offline
      </div>
    </div>
  );
};


const StManageSubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [step, setStep] = useState("overview");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchSubscription = async () => {
    try {
      let data;
      if (isOnline && window.electron?.saveSubscription) {
        const res = await fetch(`${API}/api/subscription/${user.userId}`);
        data = await res.json();
        setSubscription(data);
        await window.electron.saveSubscription(data);
      } else if (window.electron?.getSubscription) {
        data = await window.electron.getSubscription();
        setSubscription(data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [isOnline]);

  const cancelSubscription = async () => {
    if (!isOnline) return;
    await fetch(`${API}/api/subscription/cancel/${user.userId}`, { method: "POST" });
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
          setSubscription(data);
          setStep("overview");
          break;
        }
      } catch (e) { console.warn("Polling error:", e); }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;
    }
    setIsRedirecting(false);
  };

  return (
    <div className="min-h-screen pt-24 px-6 sm:px-12 sm:ml-64 max-w-5xl mx-auto dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-10 text-gray-900 dark:text-white">
        Manage Your Subscription
      </h1>

      {step === "overview" && subscription && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          {subscription?.plan === "Free Trial" && subscription?.isActive ? (
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400">Free Trial</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">7-day trial access to all premium features</p>
              </div>
              <div className="flex flex-col items-end gap-1 mt-4 sm:mt-0">
                {/* --- FIX: Wrapped button in tooltip component --- */}
                <OfflineTooltipWrapper isOnline={isOnline}>
                  <button
                    onClick={() => setStep("choose")}
                    disabled={!isOnline}
                    className="px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Choose a Plan
                  </button>
                </OfflineTooltipWrapper>
              </div>
            </div>
          ) : (
            <>
              {subscription?.isActive && !subscription?.wasCancelled ? (
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-purple-600 dark:text-purple-400">{subscription.plan}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{subscription.cycle || "Monthly"} subscription</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">SGD {subscription.price}</p>
                    <p className="text-xs text-gray-500 mt-1">Next payment: {subscription.nextPayment}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                    <OfflineTooltipWrapper isOnline={isOnline}>
                      <button onClick={cancelSubscription} disabled={!isOnline} className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        Cancel
                      </button>
                    </OfflineTooltipWrapper>
                    <OfflineTooltipWrapper isOnline={isOnline}>
                      <button onClick={() => setStep("choose")} disabled={!isOnline} className="px-4 py-2 border border-gray-400 text-gray-700 dark:text-white text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Change Plan
                      </button>
                    </OfflineTooltipWrapper>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{subscription?.plan || "No Plan Selected"}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{subscription?.isActive ? `${subscription?.cycle || "Monthly"} subscription` : "No active subscription yet"}</p>
                    {subscription?.expiresOn && (<p className="text-xs text-gray-400 mt-1">Expiring on: {new Date(subscription.expiresOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>)}
                  </div>
                  <div className="flex flex-col items-end gap-1 mt-4 sm:mt-0">
                    {subscription?.wasCancelled && (<span className="text-xs text-red-500 font-semibold">You have cancelled your subscription</span>)}
                    <OfflineTooltipWrapper isOnline={isOnline}>
                      <button onClick={() => setStep("choose")} disabled={!isOnline} className="px-4 py-2 border border-green-500 text-green-600 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        Buy Subscription
                      </button>
                    </OfflineTooltipWrapper>
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
            {/* --- FIX: Wrapped button in tooltip component --- */}
            <OfflineTooltipWrapper isOnline={isOnline}>
              <button onClick={() => setStep("billing")} disabled={!isOnline} className="disabled:cursor-not-allowed">
                <FaChevronRight className={`text-gray-600 dark:text-gray-300 ${!isOnline && 'opacity-50'}`} />
              </button>
            </OfflineTooltipWrapper>
          </div>
        </div>
      )}

      {step === "choose" && <StPlans isOnline={isOnline} onSelect={(plan) => { setSelectedPlan(plan); setStep("pay"); }} onBack={() => setStep("overview")} />}

      {step === "pay" && selectedPlan && (
        <div className="bg-white dark:bg-gray-800 max-w-lg mx-auto border border-gray-300 dark:border-gray-600 rounded-2xl p-8 shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-center text-black dark:text-white">Confirm Your Plan</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Plan</span><span className="text-gray-900 dark:text-white">{selectedPlan.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Cycle</span><span className="text-gray-900 dark:text-white">{selectedPlan.cycle}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Price</span><span className="text-gray-900 dark:text-white">SGD ${selectedPlan.price.toFixed(2)}</span></div>
          </div>
          <div className="flex flex-col space-y-3 items-center">
            <OfflineTooltipWrapper isOnline={isOnline}>
              <button disabled={!isOnline} className="w-full bg-purple-600 text-white font-medium py-2 px-4 rounded-lg shadow hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={async () => { /* ... */ }}>
                Proceed to Checkout
              </button>
            </OfflineTooltipWrapper>
            <button className="text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" onClick={() => setStep("choose")}>&larr; Back</button>
          </div>
        </div>
      )}

      {step === "billing" && (
        <StBillingForm
          isOnline={isOnline}
          onSuccess={() => setStep("overview")}
          onBack={() => setStep("overview")}
        />
      )}
      
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-700 px-6 py-4 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold dark:text-white">Waiting for payment confirmation...</p>
            <div className="mt-2 animate-spin h-6 w-6 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">You may close the Stripe page after payment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StManageSubscriptionPage;