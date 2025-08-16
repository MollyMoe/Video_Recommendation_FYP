
import { useState, useRef, useEffect } from "react";
import { BadgeCheck, Info, UploadCloud, X, Send } from "lucide-react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import { API } from "@/config/api";

const StSendFeedbackPage = () => {
  const [feedback, setFeedback] = useState("");
  const [file, setFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Load userId from localStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.userId) {
      setCurrentUserId(savedUser.userId);
    } else {
      setErrorMessage("User not logged in. Please log in to submit feedback.");
    }
  }, []);

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync queued feedbacks on reconnect
  useEffect(() => {
    const syncFeedbacks = async () => {
      const queue = window.electron?.getFeedbackQueue?.();
      if (!queue || queue.length === 0) return;

      console.log(`Syncing ${queue.length} queued feedback items...`);
      for (const item of queue) {
        try {
          const formData = new FormData();
          formData.append("feedback", item.feedback);
          formData.append("userId", item.userId);

          if (item.fileName && item.fileContent) {
            const blob = await fetch(item.fileContent).then(res => res.blob());
            const file = new File([blob], item.fileName, { type: blob.type });
            formData.append("file", file);
          }

          const res = await fetch(`${API}/api/feedback/streamer`, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            console.log("✅ Synced feedback:", item.feedback.slice(0, 50));
          } else {
            const errorText = await res.text();
            console.warn(`⚠️ Failed to sync a feedback: ${errorText}`);
          }
        } catch (err) {
          console.error("❌ Sync error:", err);
        }
      }

      window.electron?.clearFeedbackQueue?.();
    };

    if (isOnline) syncFeedbacks();
  }, [isOnline]);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setFeedback("");
    clearFile();
    setErrorMessage("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!feedback.trim()) {
      setErrorMessage("Feedback description cannot be empty.");
      setIsSubmitting(false);
      return;
    }

    if (!currentUserId) {
      setErrorMessage("User ID is missing. Cannot submit feedback.");
      setIsSubmitting(false);
      return;
    }

    // --- Offline Handling ---
    if (!isOnline) {
      const queued = { userId: currentUserId, feedback };
      if (file) {
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          queued.fileName = file.name;
          queued.fileContent = base64;
        } catch (err) {
          console.error("⚠️ Failed to convert file to base64:", err);
        }
      }
      window.electron?.queueFeedback?.(queued);
      setSuccessMessage("You're offline. Feedback has been queued and will be sent when you're back online.");
      resetForm();
      setIsSubmitting(false);
      return;
    }

    // --- Online Submission ---
    const formData = new FormData();
    formData.append("feedback", feedback);
    if (file) formData.append("file", file);
    formData.append("userId", currentUserId);

    try {
      const res = await fetch(`${API}/api/feedback/streamer`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed due to a server error.");

      setSuccessMessage("Thank you! Your feedback has been sent successfully.");
      resetForm();
    } catch (err) {
      setErrorMessage(err.message || "An unknown error occurred.");
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <StNav />
      <StSideBar />
      {/* Main Content */}
      <div className="sm:ml-64 flex items-center justify-center min-h-screen p-10">
        {/* Changed max-w-2xl to max-w-lg */}
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          
          <div className="text-center">
             <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Share Your Feedback</h1>
             <p className="text-gray-500 dark:text-gray-400 mt-2">We value your input. Help us improve Cine It!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="feedback-desc" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Describe your feedback
                <Info className="inline ml-1.5 w-4 h-4 text-gray-400" />
              </label>
              <textarea
                id="feedback-desc"
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                placeholder="Let us know what's on your mind..."
                rows={3}
                className="w-full p-3 bg-gray-50 text-black placeholder-gray-400 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                required
              ></textarea>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Attach a screenshot (Optional)
              </label>
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 mb-3 text-gray-400"/>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, or GIF (MAX. 5MB)</p>
                  </div>
                  <input id="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/gif"/>
              </label>
              {file && (
                <div className="mt-3 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate pr-2">{file.name}</span>
                    <button onClick={clearFile} type="button" className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
              )}
            </div>
            
            {errorMessage && (
                <div className="flex items-center space-x-3 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{errorMessage}</span>
                </div>
            )}

            {successMessage && (
              <div className="flex items-center space-x-3 text-green-700 dark:text-green-200 bg-green-100 dark:bg-green-900/40 p-3 rounded-lg">
                <BadgeCheck className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 text-white font-medium px-5 py-3 rounded-lg shadow-md transition-all duration-300 disabled:bg-purple-400 dark:disabled:bg-purple-800 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5"/>
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StSendFeedbackPage;
