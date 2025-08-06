import { Link, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

const AdUserDetails = () => {
  const location = useLocation();
  const restoredSearch = location.state?.searchQuery || "";
  const [searchQuery, setSearchQuery] = useState(restoredSearch);

  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    const fetchUser = async (userId) => {
      try {
        const res = await fetch(`${API}/api/auth/users/streamer/${userId}`);
        if (!res.ok) throw new Error("User not found");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("User fetch failed:", err);
        setUser(null);
      }
    };

    const fetchSubscription = async (userId) => {
      setLoadingSubscription(true);
      try {
        const res = await fetch(`${API}/api/subscription/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            console.warn(`No subscription found for user ${userId}`);
          } else {
            throw new Error(`Server error ${res.status}`);
          }
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

    fetchUser(id);
    fetchSubscription(id);
  }, [id]);

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Main Content */}
      <main className="flex-grow">

        {/* Subscription Details */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl font-semibold mb-4">Subscription Details</h3>

          {loadingSubscription ? (
            <div className="text-center text-gray-500">Loading subscription...</div>
          ) : subscription && subscription.plan ? (
            <div className="bg-white dark:bg-gray-900 rounded shadow-lg overflow-hidden">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-center bg-gray-50 dark:bg-gray-700">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Plan</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Cycle</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Price</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Expires On</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Next Payment</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6">
                    <div className="border-b border-gray-300"></div>
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="py-4 px-4">{subscription.plan || "N/A"}</td>
                  <td className="py-4 px-4">{subscription.cycle || "N/A"}</td>
                  <td className="py-4 px-4">
                    {subscription.price !== undefined ? `$${subscription.price.toFixed(2)}` : "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    {subscription.expiresOn
                      ? new Date(subscription.expiresOn).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    {subscription.nextPayment
                      ? new Date(subscription.nextPayment).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    {subscription.isActive ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Cancelled
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ) : (
            <div className="text-center p-4 text-gray-500">No subscription found.</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdUserDetails;
