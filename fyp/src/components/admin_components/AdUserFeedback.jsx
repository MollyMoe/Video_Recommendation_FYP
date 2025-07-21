import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdNav from "../../components/admin_components/AdNav";
import AdSearch from "../../components/admin_components/AdSearch";

const API = import.meta.env.VITE_API_BASE_URL;

const AdUserFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/api/feedback`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        // Initialize is_not_solved and is_solved for existing feedback items
        // Handle both old 'is_addressed' and new 'is_not_solved' for compatibility
        const initializedData = data.map(item => ({
          ...item,
          // Prioritize 'is_not_solved', fallback to 'is_addressed', then default to false
          is_not_solved: item.is_not_solved || item.is_addressed || false,
          is_solved: item.is_solved || false,
        }));
        setFeedbackList(initializedData);

      } catch (err) {
        console.error("Failed to fetch feedback:", err);
        setError(`Failed to load feedback: ${err.message}. Please ensure the backend is running and the API endpoint is correct.`);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  // Function to format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      console.error("Error formatting timestamp:", timestamp, e);
      return "Invalid Date";
    }
  };

  // Function to handle file download using the dedicated backend endpoint
  const handleDownload = (feedbackId, fileName) => {
    if (!feedbackId || !fileName) {
      console.warn("Cannot download: Missing feedback ID or file name.");
      alert("Cannot download: Missing feedback ID or file name."); // Consider a custom modal/toast
      return;
    }
    const attachmentUrl = `${API}/api/feedback/${feedbackId}/attachment`;
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New function to handle checkbox changes and update feedback status
  const handleStatusChange = async (feedbackId, changedField, newValue) => {
    // Optimistic UI update: Update the state immediately for a smoother user experience
    setFeedbackList(prevList =>
      prevList.map(item => {
        if (item._id === feedbackId) {
          const updatedItem = { ...item };
          updatedItem[changedField] = newValue; // Set the changed field's new value

          // Implement mutual exclusivity
          if (changedField === 'is_not_solved' && newValue === true) {
            updatedItem.is_solved = false; // If Not Solved is checked, uncheck Solved
          } else if (changedField === 'is_solved' && newValue === true) {
            updatedItem.is_not_solved = false; // If Solved is checked, uncheck Not Solved
          }
          // If a box is unchecked, the other remains as is (no auto-checking)

          return updatedItem;
        }
        return item;
      })
    );

    try {
      // Prepare the payload for the PATCH request
      const payload = {};
      if (changedField === 'is_not_solved') {
        payload.is_not_solved = newValue;
        payload.is_solved = newValue ? false : feedbackList.find(item => item._id === feedbackId).is_solved;
      } else if (changedField === 'is_solved') {
        payload.is_solved = newValue;
        payload.is_not_solved = newValue ? false : feedbackList.find(item => item._id === feedbackId).is_not_solved;
      }

      const res = await fetch(`${API}/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send both fields if one affects the other
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Failed to update feedback status: ${res.status}`);
      }

      // Backend should return the updated item, so we can sync
      // If the backend returns the full updated item, you can replace the optimistic update
      // const updatedItemFromServer = await res.json();
      // setFeedbackList(prevList =>
      //   prevList.map(item =>
      //     item._id === feedbackId ? { ...item, ...updatedItemFromServer } : item
      //   )
      // );

    } catch (err) {
      console.error("Error updating feedback status:", err);
      // Revert the UI if the update failed
      setFeedbackList(prevList =>
        prevList.map(item =>
          item._id === feedbackId ? { ...item, [changedField]: !newValue } : item // Revert only the changed field
        )
      );
      alert(`Failed to update status: ${err.message}`); // Inform user about the failure
    }
  };

  const filteredFeedbackList = feedbackList.filter(
    (feedback) =>
      feedback.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.feedback.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <div className="text-xl text-gray-700 dark:text-gray-300">Loading feedback...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-20">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <>
      <AdNav /> {/* This should be at the very top of your page content */}

      {/* AdSearch Component positioned at the top like AdUserManagePage */}
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <AdSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={setSearchQuery} // Passes the function to update searchQuery
        />
      </div>

      {/* Sidebar */}
      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
        aria-label="Sidebar"
      >
        <div className="py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            <li>
              <Link to="/admin/manageUser">
                <button className="flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 group w-full text-left">
                  <span className="ml-3">Back</span>
                </button>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      {/* Added `pt-[80px]` or similar to account for the fixed AdNav and AdSearch bar */}
      <div className="min-h-screen pt-20 pl-60 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 mt-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">User Feedback</h1>

          {filteredFeedbackList.length === 0 && searchQuery !== "" ? (
            <p className="text-gray-600 dark:text-gray-400">No feedback found matching "{searchQuery}".</p>
          ) : filteredFeedbackList.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No feedback submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Feedback</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Attachment</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Not Solved</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Solved</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFeedbackList.map((feedback) => (
                    <tr key={feedback._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{feedback.userId}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{feedback.feedback}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatTimestamp(feedback.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {feedback.fileName ? (
                          <button onClick={() => handleDownload(feedback._id, feedback.fileName)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 underline">
                            {feedback.fileName}
                          </button>
                        ) : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <input type="checkbox" checked={feedback.is_not_solved} onChange={(e) =>
                          handleStatusChange(feedback._id, 'is_not_solved', e.target.checked)} className="form-checkbox h-5 w-5 text-red-600" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <input type="checkbox" checked={feedback.is_solved} onChange={(e) =>
                          handleStatusChange(feedback._id, 'is_solved', e.target.checked)} className="form-checkbox h-5 w-5 text-green-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </>
  );
};
export default AdUserFeedback;