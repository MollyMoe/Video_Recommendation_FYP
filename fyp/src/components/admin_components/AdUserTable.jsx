import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const AdUserTable = ({ searchQuery }) => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/auth/users/streamer");
        const data = await res.json();
        const enriched = data.map(user => ({ ...user, status: "Active" }));
        setUsers(enriched);
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };

    fetchStreamers();
  }, []);

  const handleToggleSuspend = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId
          ? { ...user, status: user.status === "Suspended" ? "Active" : "Suspended" }
          : user
      )
    );
  };

  const handleView = (user) => {
    navigate(`/admin/view/${user._id}`, {
      state: { searchQuery },
    });
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, users]);

  if (filteredUsers.length === 0) return null;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 dark:bg-gray-800">
      <div className="shadow rounded-lg overflow-hidden dark:bg-gray-800">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-600 dark:text-white dark:bg-gray-800 uppercase">
                #
              </th>
              <th className="px-5 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-600 dark:text-white dark:bg-gray-800 uppercase">
                User
              </th>
              <th className="px-5 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-600 dark:text-white dark:bg-gray-800 uppercase">
                Email
              </th>
              <th className="px-5 py-3 bg-gray-100 text-left text-sm font-semibold text-gray-600 dark:text-white dark:bg-gray-800 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user._id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:text-white dark:bg-gray-800">
                  {index + 1}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:text-white dark:bg-gray-800">
                  <div className="flex items-center">
                    
                    <div className="ml-3">
                      <p className="text-gray-900 dark:text-white">{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:text-white dark:bg-gray-800">
                  {user.email}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:text-white dark:bg-gray-800">
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleView(user)}
                      className="bg-blue-500 text-white px-5 py-2 text-xs rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(user._id)}
                      className={`px-3 py-1 text-xs rounded text-white ${
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
  );
};

export default AdUserTable;
