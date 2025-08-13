import { Link, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { API } from "@/config/api";

// --- Best Practice: Helper function to format dates gracefully ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return "Invalid Date";
  }
};


const AdUserDetails = () => {

  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    const fetchSubscription = async (userId) => {
      setLoadingSubscription(true);
      try {

        const res = await fetch(`${API}/api/subscription/${userId}`);
        if (!res.ok) {
          setSubscription(null);
        } else {
          const data = await res.json();
          setSubscription(data);
        }
      } catch (err) {
        console.error("Subscription fetch failed:", err);
        setSubscription(null);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscription(id);
  }, [id]);

  return (

    // The parent already handles the screen background, so we only style this component's container
    <div className="w-full">
      {/* --- FIX: Added dark mode background, border, and text --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Subscription Details
        </h3>

        {loadingSubscription ? (
          // --- FIX: Added dark mode text color for loading state ---
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            Loading subscription...
          </div>
        ) : subscription && subscription.plan ? (
          // --- FIX: Added dark mode border and isolate class for proper corner rounding ---
          <div className="rounded-lg shadow-inner overflow-hidden border border-gray-200 dark:border-gray-700 isolate">
            <table className="w-full table-auto">
              <thead>
                {/* --- FIX: Added dark mode background and bottom border --- */}
                <tr className="text-center bg-gray-50 dark:bg-gray-700/60">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Plan</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Cycle</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Price</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Expires On</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Next Payment</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              {/* --- FIX: Added dark mode text color for table body --- */}
              <tbody className="bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200">
                <tr className="text-center">
                  <td className="py-4 px-4">{subscription.plan || "N/A"}</td>
                  <td className="py-4 px-4">{subscription.cycle || "N/A"}</td>
                  <td className="py-4 px-4 font-mono">
                    {subscription.price !== undefined ? `$${subscription.price.toFixed(2)}` : "N/A"}
                  </td>
                  {/* --- FIX: Used the formatting function for dates --- */}
                  <td className="py-4 px-4 font-mono text-sm">{formatDate(subscription.expiresOn)}</td>
                  <td className="py-4 px-4 font-mono text-sm">{formatDate(subscription.nextPayment)}</td>
                  <td className="py-4 px-4">
                    {subscription.isActive ? (
                      // --- FIX: Added dark mode styles to the 'Active' pill ---
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-green-900/50 dark:text-green-300">
                        Active
                      </span>
                    ) : (
                      // --- FIX: Added dark mode styles to the 'Cancelled' pill ---
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-red-900/50 dark:text-red-300">
                        Cancelled
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          // --- FIX: Added dark mode text color for 'no subscription' state ---
          <div className="text-center p-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            No active subscription found for this user.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdUserDetails;