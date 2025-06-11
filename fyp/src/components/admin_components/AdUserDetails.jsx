import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import userData from "../../data/userData"; // adjust the path as needed

const AdUserDetails = () => {
  const SideButton = ({ to, label, current, children }) => {
    return (
      <Link
        to={to}
        className={`block p-1 rounded-lg ${
          current
            ? "bg-gray-200 text-black font-semibold"
            : "hover:bg-gray-200 "
        }`}
      >
        {children || label}
      </Link>
    );
  };

  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // find the user with matching id (id from useParams is a string)
    const foundUser = userData.find((u) => u.id === Number(id));
    setUser(foundUser || null);
  }, [id]);

  if (!user) return <div className="text-red-600">User not found</div>;

  return (
    <div className="min-h-screen  pt-30 px-4 sm:px-8 dark:bg-gray-800 ">
      <div className="fixed top-17 px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
        <button className="  bg-white border border-gray-400 text-black text-md px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
          <SideButton
            to="/admin/manageUser"
            label="Back"
            current={location.pathname === "/admin"}
          />
        </button>
      </div>
      <div className=" p-6 max-w-xl mx-auto bg-white border border-gray-300 rounded shadow">
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="w-20 h-20 rounded-full mb-4"
        />
        <h1 className="text-xl font-semibold">{user.username}</h1>
        <br></br>
        <p>Email: {user.email}</p>
        <p>Status: {user.status}</p>
        <p>Genre: {user.genre}</p>
        <p>Created At: {user.createdAt}</p>
      </div>
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
