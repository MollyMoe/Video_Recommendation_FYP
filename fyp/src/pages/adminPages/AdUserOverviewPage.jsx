import { useOutletContext } from "react-router-dom";

const AdUserOverviewPage = () => {
  const { user } = useOutletContext();

  return (
    <div className="w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow-md">
      
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        User Details
      </h3>
      <div className="bg-white dark:bg-gray-900 rounded shadow-lg overflow-hidden">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-center bg-gray-50 dark:bg-gray-700">
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">User ID</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Full Name</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Username</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Email</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Genres</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-gray-200">
            <tr>
              <td colSpan="6">
                  <div className="border-b border-gray-300"></div>
              </td>
            </tr>
            <tr className="text-center">
              <td className="py-4 px-4 uppercase">{user.userId}</td>
              <td className="py-4 px-4 uppercase">{user.fullName}</td>
              <td className="py-4 px-4 uppercase">{user.username}</td>
              <td className="py-4 px-4 uppercase">{user.email}</td>
              <td className="py-4 px-4 uppercase">{user.status}</td>
              <td className="py-4 px-4 uppercase">{user.genres?.join(", ")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdUserOverviewPage;