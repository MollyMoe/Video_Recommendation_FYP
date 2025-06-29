import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const API = import.meta.env.VITE_API_BASE_URL;

const AdEditProfilePage = () => {
  const [formData, setFormData] = useState({
    username: '',
    contact: '',
    profileImage: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectAfterModal, setRedirectAfterModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordStep, setPasswordStep] = useState('verify');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const { profileImage, updateProfileImage, setCurrentRole } = useUser();
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const defaultImage = `${API}/uploads/profile.jpg`;

 useEffect(() => {
    const fetchUser = async () => {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser?.userId) return;
  
      try {
        const res = await fetch(`${API}/api/auth/users/admin/${savedUser.userId}`);
        const data = await res.json();
  
        console.log("Fetched user from backend:", data);
  
        setFormData((prev) => ({
          ...prev,
          username: data.username || "",
          contact: data.email || ""
        }));
          
        // ✅ Update profileImage in context if exists
        if (data.profileImage && data.profileImage !== "") {
          updateProfileImage(`${API}${data.profileImage}`, "admin");
        } else {
          updateProfileImage(defaultImage, "admin"); // fallback
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
  
    fetchUser();
    setCurrentRole("admin");
  }, []);

const handleChange = async (e) => {
    const { name, value, files } = e.target;
    const user = JSON.parse(localStorage.getItem("user"));
  
    if (name === "profileImage") {
      const file = files[0];
      if (file && user) {
        setPreviewImage(URL.createObjectURL(file)); // immediate preview
        setFormData((prev) => ({ ...prev, profileImage: file }));
  
        const formDataToSend = new FormData();
        formDataToSend.append("profileImage", file);
  
        try {
          const res = await fetch(
            `${API}/api/profile/upload/admin/${user.userId}`, //backend connect
            {
              method: "PUT",
              body: formDataToSend,
            }
          );
          const data = await res.json();
          if (res.ok) {
            const imageUrl = `${API}` + data.profileImage;
            updateProfileImage(imageUrl, "admin");
            localStorage.setItem("streamer_profileImage", imageUrl);
            setPreviewImage(imageUrl); // update preview to final version
          } else {
            alert("Upload failed: " + data.error);
          }
        } catch (err) {
          console.error("Upload error:", err);
          alert("Something went wrong.");
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));

  console.log("Using ID for update:", savedUser.userId); 

  const res = await fetch(`${API}/api/editProfile/admin/${savedUser.userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: formData.username
    }),
  });


      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();
      setSuccessMessage("Profile updated!");
      setShowSuccessModal(true);
      localStorage.setItem("user", JSON.stringify(updated));
    } catch (err) {
      console.error("Update error:", err);
      alert("Could not update profile.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    if (redirectAfterModal) navigate('/signin');
  };

  const handleDelete = async (userType, username) => {
    try {
      const res = await fetch(`${API}/api/auth/delete/${userType}/${username}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('user');
        setSuccessMessage('Account deleted successfully!');
        setRedirectAfterModal(true);
        setShowSuccessModal(true);
      } else {
        setSuccessMessage(data.error || 'Failed to delete account.');
        setRedirectAfterModal(false);
        setShowSuccessModal(true);
      }
    } catch {
      setSuccessMessage('Server error. Please try again.');
      setRedirectAfterModal(false);
      setShowSuccessModal(true);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const verifyCurrentPassword = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`${API}/api/password/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: savedUser.username,
          userType: savedUser.userType,
          currentPassword: passwordData.currentPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Current password is incorrect.');
      } else {
        setPasswordStep('update');
      }
    } catch {
      setPasswordError('Server error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      const updateRes = await fetch(`${API}/api/password/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: savedUser.username,
          userType: savedUser.userType,
          newPassword: passwordData.newPassword,
        }),
      });

      const updateData = await updateRes.json();

      if (!updateRes.ok) {
        setPasswordError(updateData.error || 'Failed to update password.');
      } else {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setPasswordStep('verify');
        setPasswordSuccess('Password updated successfully!');
      }
    } catch {
      setPasswordError('Server error. Try again.');
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showConfirm && modalRef.current && !modalRef.current.contains(e.target)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showConfirm]);

  return (
    <div className="min-h-screen pt-30 px-4 sm:px-8 dark:bg-gray-800">
      <div className="fixed top-17 px-3 pb-4 bg-white dark:bg-gray-800">
        <button className="bg-white border border-gray-400 text-black text-md px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
          <Link to="/admin">Back</Link>
        </button>
      </div>

      <div className="max-w-xl mx-auto flex flex-col items-center justify-center p-4 font-sans dark:bg-gray-800 dark:text-white">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-5 flex flex-row items-center space-x-4">
            <img
              src={profileImage|| defaultImage}
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
                border border-gray-300 font-small rounded-lg text-sm px-5 py-2.5"
              >
                Change Profile Pic
              </button>
            </div>
          </div>

          {/* Form Fields */}
          {["username", "contact"].map((field) => (
          <div className="mb-5" key={field}>
            <label className="block mb-2 text-sm font-medium">
              {field === "contact" ? "Contact Info" : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              disabled={field === "contact"}
              className={`shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
                dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
                ${field === "contact" ? "cursor-not-allowed bg-gray-100 dark:bg-gray-800" : ""}`}
            />
          </div>
        ))}

          <div className="mb-5">
            <button
              type="submit"
              className="w-32 bg-white text-black text-xs px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300"
            >
              Save Changes
            </button>
          </div>

          <div className="flex flex-col items-end space-y-2 mt-4">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-32 bg-white text-black text-xs px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300"
            >
              Change Password
            </button>


            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-32 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-xs px-5 py-2.5"
              >
                Delete Account
              </button>

              {showConfirm && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
                  <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
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
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">
                {passwordStep === 'verify' ? 'Verify Current Password' : 'Set New Password'}
              </h2>

              {passwordStep === 'verify' ? (
                <>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Current Password"
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white mb-2"
                  />
                  {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 rounded-md border text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={verifyCurrentPassword}
                      disabled={isVerifying}
                      className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {isVerifying ? 'Verifying...' : 'Next'}
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
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white mb-2"
                  />
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm New Password"
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white mb-2"
                  />
                  {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 rounded-md border text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePasswordSubmit}
                      className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Submit
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Success Modals */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg text-center z-60">
              <div className="flex items-center justify-center space-x-2 mb-6 text-black dark:text-white">
                <p>{successMessage}</p>
                <BadgeCheck className="w-4 h-4" />
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

        {passwordSuccess && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg text-center z-60">
              <div className="flex items-center justify-center space-x-2 mb-6 text-black dark:text-white">
                <p>{passwordSuccess}</p>
                <BadgeCheck className="w-4 h-4" />
              </div>
              <button
                onClick={() => setPasswordSuccess('')}
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

export default AdEditProfilePage;