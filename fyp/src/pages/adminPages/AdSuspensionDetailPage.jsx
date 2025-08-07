import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

const AdSuspensionDetailPage = () => {
  const { id } = useParams();  // Access the 'id' parameter from the URL
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${API}/api/auth/users/streamer/${id}`);
        const data = await res.json();
        setUser(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
        setIsLoading(false);
      }
    };
    fetchUserDetails();
  }, [id]);

  if (isLoading) return <div>Loading...</div>;

  // Check if user is suspended and display appropriate message
  const isSuspended = user?.status === "Suspended";

  return (
    <div className="w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        User's Suspension Details
      </h3>
      <div className="bg-white dark:bg-gray-900 rounded shadow-lg overflow-hidden">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-center bg-gray-50 dark:bg-gray-700">
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Last Signin</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Last Signout</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-gray-200">
            <tr>
              <td colSpan="6">
                <div className="border-b border-gray-300"></div>
              </td>
            </tr>
            <tr className="text-center">
              <td className="py-4 px-4 uppercase">
                {isSuspended ? (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Suspended
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </td>
              <td className="py-4 px-4 uppercase">{user?.lastSignin}</td>
              <td className="py-4 px-4 uppercase">{user?.lastSignout}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdSuspensionDetailPage;
