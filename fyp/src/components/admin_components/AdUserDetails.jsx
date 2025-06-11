import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import userData from '../../data/userData'; // adjust the path as needed

const AdUserDetails = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // find the user with matching id (id from useParams is a string)
    const foundUser = userData.find(u => u.id === Number(id));
    setUser(foundUser || null);
  }, [id]);

  if (!user) return <div className="text-red-600">User not found</div>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-full mb-4" />
      <h1 className="text-xl font-semibold">{user.username}</h1>
      <p>Email: {user.email}</p>
      <p>Status: {user.status}</p>
      <p>Genre: {user.genre}</p>
      <p>Created At: {user.createdAt}</p>
    </div>
  );
};

export default AdUserDetails;

// backend connecting

// const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await fetch(`http://localhost:3001/api/users/${id}`, {
//           method: 'GET',
//           headers: { 'Content-Type': 'application/json' },
//         });

//         if (!res.ok) {
//           throw new Error('User not found');
//         }

//         const data = await res.json();
//         setUser(data);
//       } catch (err) {
//         setError(err.message);
//       }
//     };

//     fetchUser();
//   }, [id]);

//   if (error) return <div className="text-red-600">Error: {error}</div>;
//   if (!user) return <div>Loading...</div>;