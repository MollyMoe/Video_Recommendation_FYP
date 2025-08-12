import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AdNav from "../../components/admin_components/AdNav";
import { ArrowLeft, Download } from "lucide-react";

import { API } from "@/config/api";

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
                Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-400">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
                Next
            </button>
        </div>
    );
};


const AdUserFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/api/feedback/fetch`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        const initializedData = data.map(item => ({
          ...item,
          is_not_solved: item.is_not_solved ?? false,
          is_solved: item.is_solved ?? false,
        }));
        setFeedbackList(initializedData);
      } catch (err) {
        console.error("Failed to fetch feedback:", err);
        setError(`Failed to load feedback: ${err.message}.`);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const handleDownload = (feedbackId, fileName) => {
    if (!feedbackId || !fileName) return;
    const attachmentUrl = `${API}/api/feedback/feedback/${feedbackId}/attachment`;
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

const handleStatusChange = async (feedbackId, changedField, newValue) => {
  const id = encodeURIComponent(feedbackId);
  const originalList = feedbackList;

  // optimistic UI + capture updated row for payload
    let updatedItemForPayload = null;
    const next = feedbackList.map(item => {
      if (item._id !== feedbackId) return item;
      const updated = { ...item, [changedField]: newValue };
      if (changedField === 'is_not_solved' && newValue) updated.is_solved = false;
      if (changedField === 'is_solved' && newValue)     updated.is_not_solved = false;
      updatedItemForPayload = updated;
      return updated;
    });
    setFeedbackList(next);

    if (!updatedItemForPayload) {
      setFeedbackList(originalList);
      alert("Could not find feedback row to update.");
      return;
    }

    const payload = {
      // send only the booleans your FastAPI model expects
      is_solved: !!updatedItemForPayload.is_solved,
      is_not_solved: !!updatedItemForPayload.is_not_solved,
    };

    try {
      const res = await fetch(`${API}/api/feedback/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      // FastAPI returns the updated document — use it to replace the row precisely
      const updated = await res.json();
      setFeedbackList(list =>
        list.map(item => (item._id === feedbackId ? updated : item))
      );
    } catch (err) {
      console.error("Error updating feedback status:", err);
      setFeedbackList(originalList); // rollback
      alert(`Failed to update status: ${err.message}`);
    }
  };


  const sortedFeedbackList = useMemo(() => {
      return [...feedbackList].sort((a, b) => {
          const aIsNew = !a.is_not_solved && !a.is_solved;
          const bIsNew = !b.is_not_solved && !b.is_solved;
          if (aIsNew !== bIsNew) return aIsNew ? -1 : 1;
          if (a.is_not_solved !== b.is_not_solved) return a.is_not_solved ? -1 : 1;
          if (a.is_solved !== b.is_solved) return a.is_solved ? 1 : -1;
          return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }, [feedbackList]);
  
  const totalPages = Math.ceil(sortedFeedbackList.length / ITEMS_PER_PAGE);
  const paginatedList = sortedFeedbackList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <AdNav />
      <aside className="fixed top-0 left-0 z-40 w-40 h-screen pt-20 bg-white/70 dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700">
        <div className="h-full px-4 pb-4 overflow-y-auto mt-2 space-y-2">

          <Link
            to="/admin/manageUser"
            className="flex items-center gap-3 px-4 py-2 text-gray-800 dark:text-white hover:bg-fuchsia-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

        </div>
      </aside>

      <main className="pl-48 pt-20">
        <div className="p-8 w-full max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Feedback</h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading feedback...</div>
            ) : error ? (
              <div className="p-10 text-center text-red-500">{error}</div>
            ) : paginatedList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Feedback</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attachment</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Not Solved</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solved</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedList.map((feedback) => (
                      <tr key={feedback._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{feedback.userId}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={feedback.feedback}>{feedback.feedback}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatTimestamp(feedback.timestamp)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {feedback.fileName ? (
                            <button onClick={() => handleDownload(feedback._id, feedback.fileName)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                                <Download size={16}/>
                                {feedback.fileName}
                            </button>
                          ) : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <input type="checkbox" checked={feedback.is_not_solved} onChange={(e) =>
                            handleStatusChange(feedback._id, 'is_not_solved', e.target.checked)} className="form-checkbox h-5 w-5 text-red-600 rounded border-gray-300 dark:border-gray-500 dark:bg-gray-600 focus:ring-red-500 accent-red-500" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <input type="checkbox" checked={feedback.is_solved} onChange={(e) =>
                            handleStatusChange(feedback._id, 'is_solved', e.target.checked)} className="form-checkbox h-5 w-5 text-green-600 rounded border-gray-300 dark:border-gray-500 dark:bg-gray-600 focus:ring-green-500 accent-green-500" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // --- FIX: Simplified "no results" message ---
              <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                No feedback has been submitted yet.
              </div>
            )}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdUserFeedback;