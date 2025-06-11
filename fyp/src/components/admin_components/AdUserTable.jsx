import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userData from '../../data/userData';

const AdUserTable = ({ searchQuery }) => {
  const [users, setUsers] = useState(userData);
  const navigate = useNavigate();

  const handleToggleSuspend = (userId) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === 'Suspended' ? 'Active' : 'Suspended',
            }
          : user
      )
    );
  };


const handleView = (user) => {
    navigate(`/admin/view/${user.id}`);
  };
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return [];
    return users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, users]);

  if (filteredUsers.length === 0) return null;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8">
      <div className="shadow rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
              <th className="px-5 py-3 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
              <th className="px-5 py-3 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th className="px-5 py-3 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{index + 1}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div className="flex items-center">
                    <img className="w-10 h-10 rounded-full" src={user.avatarUrl} alt={user.username} />
                    <div className="ml-3">
                      <p className="text-gray-900">{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{user.email}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleView(user)}
                      className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(user.id)}
                      className={`px-3 py-1 text-xs rounded text-white 
                        ${user.status === 'Suspended' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                    >
                      {user.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
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