import { useState, useRef, useEffect } from "react";
import { BadgeCheck, Info } from "lucide-react";
// import { useUser } from "../../context/UserContext";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";

const API = import.meta.env.VITE_API_BASE_URL;


const StSendFeedbackPage = () => {
  const [feedback, setFeedback] = useState("");
  const [file, setFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  // You will no longer destructure 'user' directly from useUser() for userId
  // const { user } = useUser(); // Keep this if you need profileImage, etc.

  // New state to hold the userId fetched from localStorage
  const [currentUserId, setCurrentUserId] = useState(null);

  // Use a useEffect to load userId from localStorage when the component mounts
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser && savedUser.userId) {
      setCurrentUserId(savedUser.userId);
    } else {
      // If no user is found or userId is missing, set an error message
      setErrorMessage("User not logged in. Please log in to submit feedback.");
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      setErrorMessage("Feedback cannot be empty.");
      return;
    }

    // Use currentUserId state here
    if (!currentUserId) {
      setErrorMessage("User ID is missing. Cannot submit feedback. Please ensure you are logged in.");
      console.error("User ID is missing. Cannot submit feedback.");
      return;
    }

    const formData = new FormData();
    formData.append("feedback", feedback);
    if (file) formData.append("file", file);
    formData.append("userId", currentUserId); // <--- Use the state variable here

    // Removed the console.logs for 'user' and 'user?.userId' as 'user' might not be available or used for userId here
    // console.log("User object:", user);
    // console.log("User ID from context:", user?.userId);

    try {
      const res = await fetch(`${API}/api/feedback/streamer`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSuccessMessage("Feedback sent successfully!");
      setFeedback("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setErrorMessage(""); // Clear any previous error messages
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="p-4">
      <StNav />
      <StSideBar />
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-xl mx-auto p-4 font-sans dark:bg-gray-800 dark:text-white">
          <h2 className="text-2xl font-semibold mb-6">Give your Feedback to Cine It</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium">
                Describe your feedback
                <Info className="inline ml-1 w-4 h-4 text-gray-500" />
              </label>
              <textarea
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter your feedback here..."
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                required
              ></textarea>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Additional information</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="block w-full border p-2 rounded-md"
              />
            </div>

            {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
            {successMessage && (
              <div className="flex items-center space-x-2 text-green-600">
                <BadgeCheck className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-md"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StSendFeedbackPage;
