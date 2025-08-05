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
            <table className="w-full table-auto border-collapse shadow-md rounded">
              <thead>
                <tr className="text-center">
                  <th className="p-2">Plan</th>
                  <th className="p-2">Cycle</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Expires On</th>
                  <th className="p-2">Next Payment</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6">
                    <div className="border-b border-gray-300"></div>
                  </td>
                </tr>
                <tr className="text-gray-700 text-center border-t-10 border-transparent">
                  <td className="p-2">{subscription.plan || "N/A"}</td>
                  <td className="p-2">{subscription.cycle || "N/A"}</td>
                  <td className="p-2">
                    {subscription.price !== undefined ? `$${subscription.price.toFixed(2)}` : "N/A"}
                  </td>
                  <td className="p-2">
                    {subscription.expiresOn
                      ? new Date(subscription.expiresOn).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-2">
                    {subscription.nextPayment
                      ? new Date(subscription.nextPayment).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-2">
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
          ) : (
            <div className="text-center p-4 text-gray-500">No subscription found.</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdUserDetails;