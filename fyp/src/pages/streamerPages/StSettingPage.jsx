import React, { useState, useEffect, useRef } from "react";
import { BadgeCheck } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";

const StSettingPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    contact: "",
    password: "",
    genre: "",
    profileImage: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectAfterModal, setRedirectAfterModal] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const { profileImage, updateProfileImage, setCurrentRole } = useUser();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      setFormData((prev) => ({
        ...prev,
        username: savedUser.username || "",
        contact: savedUser.email || "",
      }));
    }
    setCurrentRole("streamer");
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage") {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          updateProfileImage(base64, "streamer");
          setPreviewImage(URL.createObjectURL(file)); // for instant preview
          setFormData((prev) => ({ ...prev, profileImage: file }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    const formDataToSend = new FormData();
    formDataToSend.append("profileImage", formData.profileImage);

    console.log(user); // check if _id exists and is correct

    // send to backend
    const res = await fetch(
      `http://localhost:3001/api/profile/upload/streamer/${user._id}`,
      {
        method: "PUT",
        body: formDataToSend,
      }
    );
    const data = await res.json();
    if (res.ok) {
      alert("Upload successful");
    } else {
      alert("Error: " + (data.error || "Server error"));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    if (redirectAfterModal) {
      navigate("/signin");
    }
  };

  const handleDelete = async (userType, username) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/auth/delete/${userType}/${username}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem("user");
        setSuccessMessage("Account deleted successfully!");
        setRedirectAfterModal(true);
        setShowSuccessModal(true);
      } else {
        setSuccessMessage(data.error || "Something went wrong.");
        setRedirectAfterModal(false);
        setShowSuccessModal(true);
      }
    } catch (err) {
      setSuccessMessage("Server error. Try again.");
      setRedirectAfterModal(false);
      setShowSuccessModal(true);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        showConfirm &&
        modalRef.current &&
        !modalRef.current.contains(e.target)
      ) {
        setShowConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showConfirm]);

  const savedUser = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="min-h-screen sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800">
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center p-4 font-sans dark:bg-gray-800 dark:text-white">
        <form onSubmit={handleSubmit} className="w-full">
          {/* Profile Image Section */}
          <div className="mb-5 flex flex-row items-center space-x-4">
            <img
              src={profileImage || previewImage}
              className="w-32 h-32 rounded-full shadow-lg border border-gray-300"
            />
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                accept="image/*"
                name="profileImage"
                ref={fileInputRef}
                onChange={handleChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="mt-20 mx-20 bg-white text-black shadow-md hover:bg-gray-200 
                border border-gray-300 font-small rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Change Profile Pic
              </button>
            </div>
          </div>

          {/* Username */}
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
              focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
              dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>

          {/* Contact */}
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium">
              Contact Info
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
              focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
              dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium">
              Reset Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
              focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
              dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>

          {/* Genre */}
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium">
              Preferred Genre
            </label>
            <input
              type="text"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
              focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
              dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>

          <div className="flex flex-col items-end space-y-2 mt-4">
            <button
              type="submit"
              className="w-32 bg-white text-black text-xs px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300"
            >
              Save Changes
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-32 text-white bg-red-600 hover:bg-red-700 focus:ring-4 
                focus:outline-none focus:ring-red-300 font-medium rounded-lg text-xs px-5 py-2.5 
                text-center dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800"
              >
                Delete Account
              </button>

              {/* Confirmation Modal */}
              {showConfirm && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
                  <div
                    ref={modalRef}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-sm w-full"
                  >
                    <h2 className="text-lg font-semibold mb-4">
                      Are you sure you want to delete the account?
                    </h2>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 rounded-md text-sm border text-gray-700 dark:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(
                            savedUser?.userType,
                            savedUser?.username
                          );
                          setShowConfirm(false);
                        }}
                        className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700"
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div
            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50"
            aria-modal="true"
            role="dialog"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg text-center z-60">
              <div className="flex items-center justify-center space-x-2 mb-6 text-black dark:text-white">
                <p>{successMessage}</p>
                <BadgeCheck className="w-4 h-4 stroke-black dark:stroke-white" />
              </div>
              <button
                onClick={closeModal}
                className="bg-white text-black text-sm px-4 py-1 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300"
              >
                Ok
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StSettingPage;
