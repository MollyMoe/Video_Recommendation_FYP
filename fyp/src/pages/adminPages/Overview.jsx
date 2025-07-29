import { useOutletContext } from "react-router-dom";

const UserOverview = () => {
  const { user } = useOutletContext();

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-xl font-semibold mb-4">User Overview</h3>
      <p><strong>User ID:</strong> {user.userId}</p>
      <p><strong>Full Name:</strong> {user.fullName}</p>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Status:</strong> {user.status}</p>
      <p><strong>Genres:</strong> {user.genres?.join(", ") || "N/A"}</p>
    </div>
  );
};

export default UserOverview;