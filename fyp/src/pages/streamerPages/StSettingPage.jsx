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
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [redirectAfterModal, setRedirectAfterModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState("verify");

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const { profileImage, updateProfileImage, setCurrentRole } = useUser();

  const savedUser = JSON.parse(localStorage.getItem("user"));

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
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
          setPreviewImage(base64);
          setFormData((prev) => ({ ...prev, profileImage: file }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage("Changes have been saved!");
    setRedirectAfterModal(false);
    setShowSuccessModal(true);
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    if (redirectAfterModal) navigate("/signin");
  };

  const handleDelete = async (userType, username) => {
    try {
      const res = await fetch(`http://localhost:3001/api/auth/delete/${userType}/${username}`, {
        method: "DELETE",
      });
      const data = await res.json();
      localStorage.removeItem("user");
      setSuccessMessage(res.ok ? "Account deleted successfully!" : data.error || "Something went wrong.");
      setRedirectAfterModal(res.ok);
      setShowSuccessModal(true);
    } catch (err) {
      setSuccessMessage("Server error. Try again.");
      setRedirectAfterModal(false);
      setShowSuccessModal(true);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
  };

  const verifyCurrentPassword = async () => {
    setIsVerifying(true);
    setPasswordError("");

    try {
      const response = await fetch("http://localhost:3001/api/password/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: savedUser.username,
          userType: savedUser.userType,
          currentPassword: passwordData.currentPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error || "Current password is incorrect.");
      } else {
        setPasswordStep("update");
      }
    } catch {
      setPasswordError("Server error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      const updateRes = await fetch("http://localhost:3001/api/password/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: savedUser.username,
          userType: savedUser.userType,
          newPassword: passwordData.newPassword,
        }),
      });

      const updateData = await updateRes.json();

      if (!updateRes.ok) {
        setPasswordError(updateData.error || "Failed to update password.");
      } else {
        setShowPasswordModal(false);
        setPasswordStep("verify");
        setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        setPasswordSuccess("Password updated successfully!");
      }
    } catch {
      setPasswordError("Server error. Try again.");
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showConfirm && modalRef.current && !modalRef.current.contains(e.target)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showConfirm]);

  return (
    <div className="min-h-screen sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800">
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center p-4 font-sans dark:bg-gray-800 dark:text-white">
        <form onSubmit={handleSubmit} className="w-full">
          {/* Profile Image */}
          <div className="mb-5 flex items-center space-x-4">
            <img src={profileImage || previewImage} className="w-32 h-32 rounded-full shadow-lg border border-gray-300" />
            <div className="flex flex-col space-y-2">
              <input type="file" accept="image/*" name="profileImage" ref={fileInputRef} onChange={handleChange} className="hidden" />
              <button
                type="button"
                onClick={triggerFileInput}
                className="mt-20 mx-20 bg-white text-black shadow-md hover:bg-gray-200 border border-gray-300 font-small rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Change Profile Pic
              </button>
            </div>
          </div>

          {/* Form Fields */}
          {["username", "contact", "genre"].map((field) => (
            <div className="mb-5" key={field}>
              <label className="block mb-2 text-sm font-medium">{field === "contact" ? "Contact Info" : field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
                dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
          ))}

          {/* Password Modal Button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                setPasswordStep("verify");
                setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                setPasswordError("");
                setShowPasswordModal(true);
              }}
              className="w-32 bg-white text-black text-xs px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300"
            >
              Change Password
            </button>
          </div>

          {/* Submit & Delete */}
          <div className="flex flex-col items-end space-y-2 mt-4">
            <button type="submit" className="w-32 bg-white text-black text-xs px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300">
              Save Changes
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-32 text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-xs px-5 py-2.5 
                text-center dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800"
              >
                Delete Account
              </button>

              {/* Confirm Delete */}
              {showConfirm && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
                  <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-sm w-full">
                    <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete the account?</h2>
                    <div className="flex justify-end space-x-4">
                      <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-md text-sm border text-gray-700 dark:text-gray-200">
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(savedUser?.userType, savedUser?.username);
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

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">
                {passwordStep === "verify" ? "Verify Current Password" : "Set New Password"}
              </h2>

              <div className="space-y-3">
                {passwordStep === "verify" ? (
                  <>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Current Password"
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    />
                    {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
                    <div className="flex justify-end space-x-3 pt-2">
                      <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-md border text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        Cancel
                      </button>
                      <button onClick={verifyCurrentPassword} disabled={isVerifying} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        {isVerifying ? "Verifying..." : "Next"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="New Password"
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm New Password"
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    />
                    {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
                    <div className="flex justify-end space-x-3 pt-2">
                      <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-md border text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        Cancel
                      </button>
                      <button onClick={handlePasswordSubmit} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Submit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Modals */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg text-center z-60">
              <div className="flex items-center justify-center space-x-2 mb-6 text-black dark:text-white">
                <p>{successMessage}</p>
                <BadgeCheck className="w-4 h-4 stroke-black dark:stroke-white" />
              </div>
              <button onClick={closeModal} className="bg-white text-black text-sm px-4 py-1 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300">
                Ok
              </button>
            </div>
          </div>
        )}

        {passwordSuccess && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg text-center z-60">
              <div className="flex items-center justify-center space-x-2 mb-6 text-black dark:text-white">
                <p>{passwordSuccess}</p>
                <BadgeCheck className="w-4 h-4 stroke-black dark:stroke-white" />
              </div>
              <button onClick={() => setPasswordSuccess("")} className="bg-white text-black text-sm px-4 py-1 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300">
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