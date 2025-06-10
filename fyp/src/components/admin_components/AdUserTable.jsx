import React, { useMemo, useState } from 'react';

const initialUsers = [
  {
    id: 1,
    name: 'Vera Carpenter',
    email: 'vera@example',
    createdAt: '2020-01-21',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80',
  },
  {
    id: 2,
    name: 'Blake Bowman',
    email: 'blake@example',
    createdAt: '2020-01-01',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80',
  },
  {
    id: 3,
    name: 'Dana Moore',
    email: 'dana@example',
    createdAt: '2020-01-10',
    status: 'Suspended',
    avatarUrl: 'https://images.unsplash.com/photo-1540845511934-7721dd7adec3?auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80',
  },
  {
    id: 4,
    name: 'Alonzo Cox',
    email: 'alonzo@example',
    createdAt: '2020-01-18',
    status: 'Inactive',
    avatarUrl: 'https://images.unsplash.com/photo-1522609925277-66fea332c575?auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80',
  },
  {
    id: 5,
    name: 'Blake Blackwell',
    email: 'blackwell@example',
    createdAt: '2020-01-18',
    status: 'Inactive',
    avatarUrl: 'https://images.unsplash.com/photo-1522609925277-66fea332c575?auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80',
  },
];

const AdUserTable = ({ searchQuery }) => {
  const [users, setUsers] = useState(initialUsers);

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
    alert(`Viewing user: ${user.name}`);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return [];
    return users.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <img className="w-10 h-10 rounded-full" src={user.avatarUrl} alt={user.name} />
                    <div className="ml-3">
                      <p className="text-gray-900">{user.name}</p>
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
