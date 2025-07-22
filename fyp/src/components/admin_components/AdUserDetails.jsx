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
    try {
      const res = await fetch(`${API}/api/subscription/${userId}`);
      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`No subscription found for user ${userId}`);
        } else {
          throw new Error(`Server error ${res.status}`);
        }
        setSubscription(null);
        return;
      }
      const data = await res.json();
      setSubscription(data);
    } catch (err) {
      console.error("Subscription fetch failed:", err);
      setSubscription(null);
    }
  };

  fetchUser(id);
  fetchSubscription(id);
}, [id]);

  if (!user) return <div className="text-red-600">User not found</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 pt-20">
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
        aria-label="Sidebar"
      >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
        <Link
          to="/admin"
          className="block px-4 py-2 rounded-lg my-2 text-left text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
        >
          Home
        </Link>
        <Link
          to="/admin/manageUser"
          className="block px-4 py-2 rounded-lg my-2 text-left text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
        >
        Users
        </Link>
        <Link
          to="/admin"
          className="block px-4 py-2 rounded-lg my-2 text-left text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
        >
        Subscription
        </Link>
        <Link
          to="/admin/manageUser"
          state={{ searchQuery }}
          className="block px-4 py-2 rounded-lg my-2 text-left text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
        >
        Back
        </Link>
      </div>
    </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 ml-40">
        {/* Back Button
        <div className="mb-4">
          <Link
            to="/admin/manageUser"
            state={{ searchQuery }}
            className="bg-white border border-gray-400 text-black px-4 py-2 rounded shadow hover:bg-gray-200"
          >
            ← Back
          </Link>
        </div> */}

        {/* User Header */}
        <div className="flex items-center space-x-6 bg-white p-6 rounded shadow">
          <img
            src={user.profileImage}
            alt="Profile"
            className="w-20 h-20 rounded-full border-4 border-white shadow-md"
          />
          <div>
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">Genres: {user.genres?.join(", ")}</p>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="mt-8 bg-white p-6 rounded shadow">
          <h3 className="text-xl font-semibold mb-4">Subscription Details</h3>

          {subscription && subscription.plan ? (
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
                {/* Horizontal divider row */}
              <tr>
                <td colSpan="6">
                  <div className="border-b border-gray-300"></div>
                </td>
              </tr>
               <tr className="text-gray-700 text-center border-t-10 border-transparent">
                  <td className="p-2">{subscription.plan || "N/A"}</td>
                  <td className="p-2 ">{subscription.cycle || "N/A"}</td>
                  <td className="p-2 ">
                    {subscription.price !== undefined ? `$${subscription.price.toFixed(2)}` : "N/A"}
                  </td>
                  <td className="p-2 ">
                    {subscription.expiresOn
                      ? new Date(subscription.expiresOn).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-2 ">
                    {subscription.nextPayment
                      ? new Date(subscription.nextPayment).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-2 ">
                    {subscription.isActive ? (
                      <><span class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Active</span></>
                    ) : (
                      <><span class="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-1 rounded-full dark:bg-red-900 dark:text-red-300">Cancelled</span></>
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
