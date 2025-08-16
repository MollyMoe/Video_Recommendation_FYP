import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

// --- Best Practice: Helper function to format dates gracefully ---
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return "Invalid Date";
  }
};


const AdSuspensionDetailPage = () => {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${API}/api/auth/users/streamer/${id}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      } finally {

        setIsLoading(false);
      }
    };
    fetchUserDetails();
  }, [id]);

  // --- FIX: Added a properly styled loading state for dark mode ---
  if (isLoading) {
    return (
      <div className="w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-gray-700 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  const isSuspended = user?.status === "Suspended";

  return (
    // --- FIX: Added dark mode background, border, and text ---
    <div className="w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        User Suspension Details
      </h3>
      {/* --- FIX: Added dark mode border and isolate class for proper corner rounding --- */}
      <div className="rounded-lg shadow-inner overflow-hidden border border-gray-200 dark:border-gray-700 isolate">
        <table className="w-full table-auto">
          <thead>
            {/* --- FIX: Cleaned up structure, added dark mode background and bottom border --- */}
            <tr className="text-center bg-gray-50 dark:bg-gray-700/60">
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Last Sign-in</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Last Sign-out</th>
            </tr>
          </thead>
           {/* --- FIX: Added dark mode text color for table body --- */}
          <tbody className="bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200">
            {/* --- FIX: Removed unnecessary border row --- */}
            <tr className="text-center">
              <td className="py-4 px-4">
                {isSuspended ? (
                  // --- FIX: Added dark mode styles to the 'Suspended' pill ---
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-red-900/50 dark:text-red-300">
                    Suspended
                  </span>
                ) : (
                  // --- FIX: Added dark mode styles to the 'Active' pill ---
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-green-900/50 dark:text-green-300">
                    Active
                  </span>
                )}
              </td>
              {/* --- FIX: Used the formatting function for dates and added font-mono --- */}
              <td className="py-4 px-4 font-mono text-sm">{formatDateTime(user?.lastSignin)}</td>
              <td className="py-4 px-4 font-mono text-sm">{formatDateTime(user?.lastSignout)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdSuspensionDetailPage;