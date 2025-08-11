import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { API } from "@/config/api";

const AdUserTable = ({ searchQuery }) => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const res = await fetch(`${API}/api/auth/users/streamer`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };

    fetchStreamers();
  }, []);

  const handleToggleSuspend = async (userId) => {
    const updatedUsers = users.map((user) =>
      user.userId === userId
        ? { ...user, status: user.status === "Suspended" ? "Active" : "Suspended" }
        : user
    );
    setUsers(updatedUsers);

    const newStatus = updatedUsers.find((user) => user.userId === userId)?.status;
    const userType = updatedUsers.find((user) => user.userId === userId)?.userType;

    if (!userType) {
      console.error("❌ Missing userType for user:", userId);
      return;
    }

    try {
      await fetch(`${API}/api/auth/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, userType }),
      });

      if (newStatus === "Active") {
        await fetch(`${API}/api/auth/update-signout-time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userType, time: new Date().toISOString() }),
        });
      }
    } catch (err) {
      console.error("❌ Error toggling suspension:", err);
    }
  };

  const handleView = (user) => {
    navigate(`/admin/view/${user.userId}`, {
      state: { searchQuery },
    });
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, users]);

  if (filteredUsers.length === 0 && searchQuery) {
    return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No users found matching your search.
        </div>
    );
  }

  return (
    <div className="w-full dark:bg-gray-900">
    <div className="sm:ml-15 mx-auto px-4 py-8 dark:bg-gray-900">
      <div className="shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 isolate">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-10 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">
                UserID
              </th>
              <th className="px-7 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">
                User
              </th>
              <th className="px-10 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Email
              </th>
              <th className="px-15 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800/50">
            {filteredUsers.map((user) => (
              // --- FIX: Added dark mode border ---
              <tr key={user._id || user.userId} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-10 py-5 text-sm text-gray-700 dark:text-gray-300">
                  {user.userId}
                </td>
                <td className="px-5 py-5 text-sm">
                  <div className="flex items-center">
                    <div className="ml-3">
                      {/* --- FIX: Added dark mode text color --- */}
                      <p className="text-gray-900 dark:text-white font-semibold">
                        {user.username}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 text-sm text-gray-700 dark:text-gray-300">
                  {user.email}
                </td>
                <td className="px-5 py-5 text-sm">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleView(user)}
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-black dark:text-gray-200 px-5 py-2 text-xs rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(user.userId)}
                      className={`min-w-[90px] px-3 py-2 text-xs rounded-lg shadow-sm text-white ${
                        user.status === "Suspended"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {user.status === "Suspended" ? "Unsuspend" : "Suspend"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default AdUserTable;