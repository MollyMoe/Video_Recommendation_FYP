
import { useOutletContext } from "react-router-dom";

const AdUserOverview = () => {
  const { user } = useOutletContext();

  if (!user) {
    return (
      <div className="w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
        User data not available.
      </div>
    );
  }

  const isSuspended = user.status === "Suspended";

  return (
    <div className="w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        User Details
      </h3>
      <div className="rounded-lg shadow-inner overflow-hidden border border-gray-200 dark:border-gray-700 isolate">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-center bg-gray-50 dark:bg-gray-700/60">
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">User ID</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Full Name</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Username</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Email</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase">Genres</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200">
            <tr className="text-center">
              <td className="py-4 px-4 font-mono">{user.userId}</td>
              <td className="py-4 px-4">{user.fullName}</td>
              <td className="py-4 px-4 font-semibold">{user.username}</td>
              <td className="py-4 px-4">{user.email}</td>
              <td className="py-4 px-4">
                {isSuspended ? (
                  <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-red-900/50 dark:text-red-300">
                    Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-green-900/50 dark:text-green-300">
                    Active
                  </span>
                )}
              </td>
              <td className="py-4 px-4 align-middle">
              <div className="flex flex-wrap justify-center gap-2">
                {user.genres?.length > 0 ? (
                  user.genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-sky-100 text-sky-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-sky-900/70 dark:text-sky-300"
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">
                    No genres selected
                  </span>
                )}
              </div>
            </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdUserOverview;
