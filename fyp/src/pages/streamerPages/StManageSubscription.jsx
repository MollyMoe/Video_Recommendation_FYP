import React, { useEffect, useState } from "react";
import StPlans from "../../components/streamer_components/StPlans";
import StBillingForm from "../../components/streamer_components/StBillingForm";
import { FaChevronRight } from "react-icons/fa";

const API = import.meta.env.VITE_API_BASE_URL;

const StManageSubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [step, setStep] = useState("overview");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API}/api/subscription/${user.userId}`);
      const data = await res.json();
      setSubscription(data);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const cancelSubscription = async () => {
    await fetch(`${API}/api/subscription/cancel/${user.userId}`, {
      method: "POST",
    });
    fetchSubscription();
  };

  return (
    <div className="min-h-screen pt-30 px-4 sm:px-10 sm:ml-64 max-w-6xl mx-auto dark:bg-gray-800 dark:border-gray-700">
      <h1 className="text-2xl font-bold mb-6">Manage Subscription</h1>

      {step === "overview" && subscription && (
        <div className="shadow-sm border border-gray-200 bg-gray-50 rounded-md p-8 w-full max-w-4xl mx-auto space-y-6 -ml-1">
          {subscription?.isActive ? (
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-xl">{subscription.plan}</p>
                <p className="text-xs text-gray-500">
                  {subscription.cycle || "Monthly"} subscription
                </p>
                <p className="text-xs text-gray-500"> SGD {subscription.price}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Next payment: {subscription.nextPayment}
                </p>
              </div>
              <div className="flex justify-between items-start space-x-2">
                <button
                  onClick={cancelSubscription}
                  className="px-3 py-1 border border-red-500 text-red-500 rounded-md text-xs hover:bg-red-50"
                >
                  Cancel Subscription
                </button>
                <button
                  onClick={() => setStep("choose")}
                  className="px-3 py-1 border border-gray-400 text-xs rounded-md hover:bg-gray-100"
                >
                  Change Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-xl">
                  {subscription?.plan || "No Plan Selected"}
                </p>
                <p className="text-xs text-gray-500">
                  {subscription?.isActive
                    ? `${subscription?.cycle || "Monthly"} subscription`
                    : "No active subscription yet"}
                </p>

                {subscription?.expiresOn && (
                  <p className="text-xs text-gray-400 mt-1">
                    Expiring on:{" "}
                    {new Date(subscription.expiresOn).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {subscription?.plan && subscription?.isActive === false && (
                  <p className="text-xs text-red-500 font-medium">
                    You have cancelled your subscription
                  </p>
                )}
                <button
                  onClick={() => setStep("choose")}
                  className="px-3 py-1 border border-green-600 text-green-600 rounded-md text-xs hover:bg-green-50"
                >
                  Buy Subscription
                </button>
              </div>
            </div>
          )}

          <hr className="border-t border-gray-300" />

          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">Billing</p>
              <p className="text-xs text-gray-500">Edit billing details</p>
            </div>
            <button onClick={() => setStep("billing")}>
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {step === "choose" && (
        <StPlans
          onSelect={(plan) => {
            setSelectedPlan(plan);
            localStorage.setItem("pendingSubscription", JSON.stringify({
              userId: user.userId,
              plan: plan.name,
              cycle: plan.cycle,
              price: plan.price,
            }));
            setStep("pay");
          }}
          onBack={() => setStep("overview")}
        />
      )}

      {step === "pay" && selectedPlan && (
        <div className="bg-purple-100 max-w-md mx-auto border border-gray-300 rounded-2xl p-6 shadow-md space-y-6">
            <h2 className="text-xl font-bold text-center text-black">Confirm Your Plan</h2>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3 shadow-sm max-w-md mx-auto">

            <div className="flex justify-between">
                <span className="font-medium text-bkack">Plan</span>
                <span className="text-gray-900">{selectedPlan.name}</span>
            </div>

            <div className="flex justify-between">
                <span className="font-medium text-bkack">Cycle</span>
                <span className="text-gray-900">{selectedPlan.cycle}</span>
            </div>

            <div className="flex justify-between">
                <span className="font-medium text-bkack">Price</span>
                <span className="text-gray-900">SGD ${selectedPlan.price.toFixed(2)}</span>
            </div>

            </div>

        <div className="flex flex-col space-y-2 items-center">
        <button 
            className="w-fit bg-white text-black text-sm py-1 px-3 rounded-md shadow-md hover:bg-gray-100"
            onClick={async () => {
            try {
                const res = await fetch(`${API}/api/stripe/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.userId,
                    plan: selectedPlan.name,
                    cycle: selectedPlan.cycle,
                    price: selectedPlan.price,
                    email: user.email
                }),
                });

                const data = await res.json();
                if (data.url) {
                window.location.href = data.url;
                } else {
                alert("Failed to create checkout session.");
                }
            } catch (err) {
                console.error("Stripe Checkout Error:", err);
                alert("An error occurred. Try again.");
            }
            }}
        >
            Proceed to Checkout
        </button>

        <button
            className="text-md text-gray-500 underline hover:text-gray-700"
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
    </div>
  );
};

export default StManageSubscriptionPage;