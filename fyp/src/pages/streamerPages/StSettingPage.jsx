import React, { useState, useEffect, useRef } from "react";
import { BadgeCheck } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { API } from "@/config/api";


const writeRecsAndBroadcast = async (recs) => {
  try {
    // 1) Replace the full recommendation pool used by Home & Filter
    await window.electron?.replaceRecommendedMovies?.(recs);

    // 2) Compute and store Top-10 used by Filter’s “Top Rated” and Home (offline sync)
    const top10 = recs
      .slice()
      .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
      .slice(0, 10);
    await window.electron?.saveTopRatedMovies?.(top10);

    // 3) Nudge every open page to reload (both same-tab and other tabs)
    localStorage.setItem("recs_version", String(Date.now()));
    window.dispatchEvent(new Event("cineit:recommendationsUpdated"));
  } catch (e) {
    console.warn("writeRecsAndBroadcast failed:", e);
  }
};

const defaultImage = "https://res.cloudinary.com/dnbyospvs/image/upload/v1751267557/beff3b453bc8afd46a3c487a3a7f347b_tqgcpi.jpg";

const StSettingPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    contact: "",
    password: "",
    genre: "",
    profileImage: "",
  });

  const parseGenres = (val) =>
  (val || "")
    .split(/[|,]/)           // support comma or |
    .map(g => g.trim())
    .filter(Boolean);

  const initialRef = useRef({ username: "", genre: "" });
  const normGenres = (v) => parseGenres(v).map(s => s.toLowerCase()).sort().join("|");

  const [previewImage, setPreviewImage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [redirectAfterModal, setRedirectAfterModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState("verify");
  const [isLoading, setIsLoading] = useState(false); // Changed initial state to false

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const { profileImage, updateProfileImage, setCurrentRole } = useUser();;
  const savedUser = JSON.parse(localStorage.getItem("user"));

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
      const handleNetworkChange = () => setIsOnline(navigator.onLine);
      window.addEventListener("online", handleNetworkChange);
      window.addEventListener("offline", handleNetworkChange);
      return () => {
        window.removeEventListener("online", handleNetworkChange);
        window.removeEventListener("offline", handleNetworkChange);
      };
    }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser?.userId) return;

  setCurrentRole("streamer");

  const cachedImage = localStorage.getItem("streamer_profileImage");
  const fallbackImage = cachedImage || savedUser.profileImage || defaultImage;
  updateProfileImage(fallbackImage, "streamer");


  const fetchSubscription = async (userId) => {
    try {
      const res = await fetch(`${API}/api/subscription/${userId}`);
      const data = await res.json();
      console.log("🔑 Subscription data:", data);
      setIsSubscribed(data.isActive); // true if trial or paid & not expired
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setIsSubscribed(false); // fail-safe
    }
  };


  //fetch user
  const fetchUser = async () => {
    if (!isOnline) {
      console.warn("⚠️ Offline — using cached profile");

      const cached = window.electron?.getProfileUpdate?.();
      if (cached) {
        setFormData({
          username: cached.username || "",
          contact: cached.email || "",
          genre: cached.genre || "",
        });

        const image = cached.profileImage || cachedImage || defaultImage;
        updateProfileImage(image, "streamer");
      }
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/users/streamer/${savedUser.userId}`);

      if (!res.ok) {
        const errorText = await res.text(); // prevent parsing non-JSON
        throw new Error(`Server responded with ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      setFormData({
        username: data.username || "",
        contact: data.email || "",
        genre: Array.isArray(data.genres)
          ? data.genres.join(", ")
          : typeof data.genre === "string"
          ? data.genre
          : "",
      });

      initialRef.current = {
        username: data.username || "",
        genre: Array.isArray(data.genres)
          ? data.genres.join(", ")
          : typeof data.genre === "string" ? data.genre : "",
      };

      if (data.profileImage) {
        updateProfileImage(data.profileImage, "streamer");
        localStorage.setItem("streamer_profileImage", data.profileImage);
      }

      window.electron?.saveProfileUpdate({
        userId: data.userId,
        username: data.username,
        email: data.email,
        genre: Array.isArray(data.genres)
          ? data.genres.join(", ")
          : typeof data.genre === "string"
          ? data.genre
          : "",
        profileImage: data.profileImage,
      });
    } catch (err) {
      console.warn("⚠️ Failed to fetch profile:", err.message);
    }
  };

  fetchUser();
  fetchSubscription(savedUser.userId);
}, [isOnline]);

// for profile image
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
            `${API}/api/profile/upload/streamer/${user.userId}`, //backend connect
            {
              method: "PUT",
              body: formDataToSend,
            }
          );
          const data = await res.json();
          if (res.ok) {
            const imageUrl = data.profileImage;
            updateProfileImage(imageUrl, "streamer");
            localStorage.setItem("streamer_profileImage", imageUrl);
            setPreviewImage(imageUrl); // update preview to final version
            console.log("data.profileImage:", data.profileImage);
            console.log("imageUrl used:", imageUrl);
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

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  //submitting
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser?.userId) {
      alert("User session expired. Please sign in again.");
      setIsLoading(false);
      return;
    }

    const updatePayload = {
      userId: savedUser.userId,
      username: formData.username,
      genre: formData.genre, // backend expects string
    };
    const genreArray = parseGenres(formData.genre);

    const usernameChanged = formData.username.trim() !== initialRef.current.username.trim();
    const genreChanged    = normGenres(formData.genre) !== normGenres(initialRef.current.genre);

  // ---------------- OFFLINE ----------------
  if (!isOnline) {
    try {
      // always cache the basic profile update
      window.electron?.saveProfileUpdate?.(updatePayload);

      if (genreChanged) {
        // only re-filter + write top10 when genres changed
        await window.electron?.saveUserGenres?.(genreArray);
        const pool = (await window.electron?.getRecommendedMovies?.()) || [];
        const hasAll = (movieGenres) => {
          const arr = Array.isArray(movieGenres)
            ? movieGenres
            : String(movieGenres || "").split(/[,|]/).map(s => s.trim());
          return genreArray.length > 0 && genreArray.every((g) => arr.includes(g));
        };
        const filtered = pool.filter((m) => hasAll(m.genres));

        // 🔔 Single, consistent writer + broadcaster
        await writeRecsAndBroadcast(filtered);
      }

      setSuccessMessage(
        genreChanged ? "You're offline. Changes saved locally; filter updated." : "You're offline. Username saved locally."
      );
      setShowSuccessModal(true);

      // NEW: only go to Filter if genre changed
      if (genreChanged) navigate("/home/filter", { replace: true });

      // NEW: update the baseline so further saves compare correctly
      initialRef.current = { username: formData.username, genre: formData.genre };
    } catch (err) {
      console.error("❌ Offline save failed:", err);
      alert("Offline save failed. Please reconnect and try again.");
    } finally {
      setIsLoading(false);
    }
    return;
  }

    // ---------------- ONLINE ----------------
    try {
      const res = await fetch(`${API}/api/editProfile/streamer/${savedUser.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!res.ok) throw new Error(`Failed to update profile: ${res.status}`);

      const updated = await res.json();
      localStorage.setItem("user", JSON.stringify(updated));

      // only sync/recompute if genres changed
      if (genreChanged) {
        await window.electron?.saveUserGenres?.(genreArray);

      // This should refresh server-side + preload cache you use elsewhere
      const { syncOfflineCache } = await import("@/utils/syncOfflineCache");
      await syncOfflineCache(updated, { force: true });

      // Pull the fresh recommendations (GET or POST regenerate — pick your source of truth)
      let fresh = [];
      try {
        const recRes = await fetch(`${API}/api/movies/recommendations/${savedUser.userId}`);
        const data = await recRes.json();
        fresh = Array.isArray(data) ? data : [];
      } catch (e) {
        console.warn("Couldn’t fetch fresh recommendations after save, falling back to local cache:", e);
        fresh = (await window.electron?.getRecommendedMovies?.()) || [];
      }

      // 🔔 Single, consistent writer + broadcaster
      await writeRecsAndBroadcast(fresh);
      }

      setSuccessMessage(genreChanged ? "Profile updated! New recommendations ready." : "Username updated!");
      setShowSuccessModal(true);

      // only navigate if genre changed
      if (genreChanged) navigate("/home/filter", { replace: true });

      // refresh the baseline after success
      initialRef.current = { username: formData.username, genre: formData.genre };
    } catch (err) {
      console.error("❌ Update error:", err);
      alert("Could not update profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const refreshUser = async () => {
      if (!isOnline || !savedUser?.userId) return;
      try {
        const res = await fetch(`${API}/api/auth/users/streamer/${savedUser.userId}`);
        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        console.warn("Failed to refresh user:", err);
      }
    };
    refreshUser();
  }, [isOnline, savedUser?.userId]);

  useEffect(() => {
    const syncOfflineChanges = async () => {
      if (!window.electron?.getProfileUpdate) return;

      const offlineData = window.electron.getProfileUpdate();
      if (!offlineData || !offlineData.userId) return;

      try {
        const res = await fetch(`${API}/api/editProfile/streamer/${offlineData.userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: offlineData.username,
            genre: offlineData.genre,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server error ${res.status}: ${errText}`);
        }
        const updated = await res.json();
        localStorage.setItem("user", JSON.stringify(updated));
        localStorage.setItem("refreshAfterSettings", "true");
        window.electron?.clearProfileUpdate?.();
      } catch (err) {
        console.warn("❌ Failed to sync offline profile update:", err.message || err);
      }
    };
    if (isOnline) syncOfflineChanges();
  }, [isOnline]);

  const closeModal = () => {
    setShowSuccessModal(false);
    if (redirectAfterModal) navigate("/signin");
  };

  const handleDelete = async (userType, username) => {
    try {
      const res = await fetch(`${API}/api/auth/delete/${userType}/${username}`, {
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
      const response = await fetch(`${API}/api/password/verify-password`, {
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
      const updateRes = await fetch(`${API}/api/password/update-password`, {
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
    <div className="min-h-screen sm:ml-64 pt-30 px-4 sm:px-8 bg-white dark:bg-gray-800">
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center p-4 font-sans dark:bg-gray-800 bg-white dark:text-white">
        <form onSubmit={handleSubmit} className="w-full">
          {/* Profile Image */}
          <div className="mb-5 flex items-center space-x-4">
            <img src={previewImage || profileImage || defaultImage} className="w-32 h-32 rounded-full shadow-lg border border-gray-300" />
            <div className="flex flex-col space-y-2">
              <input type="file" accept="image/*" name="profileImage" ref={fileInputRef} onChange={handleChange} className="hidden" />
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={!isOnline}
                className={`mt-20 mx-20 shadow-md font-small rounded-lg text-sm px-5 py-2.5 text-center ${
                  isOnline
                    ? "bg-white text-black hover:bg-gray-200 border border-gray-300"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
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
                disabled={
                  !isOnline
                    ? ["contact", "username", "genre"].includes(field)
                    : field === "contact" || (field === "genre" && !isSubscribed)
                }
                className={`shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                  focus:ring-purple-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700
                  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
                  ${
                   isOnline
                      ? (field === "contact" || (field === "genre" && !isSubscribed))
                        ? "cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                        : ""
                      : ["contact", "username", "genre"].includes(field)
                        ? "cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                        : ""
                  }`}
              />
            </div>
          ))}

          {/* Password Modal Button */}
          <div className="mb-5">
            <button type="submit" 
              disabled={!isOnline}
              className="w-32 bg-white text-black text-xs px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
              Save Changes
            </button>
          </div>

          {/* Submit & Delete */}
          <div className="flex flex-col items-end space-y-2 mt-4">

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              disabled={!isOnline}
              className={`w-32 text-xs px-6 py-2 rounded-lg shadow-md ${
                isOnline
                  ? "bg-white text-black hover:bg-gray-200 border border-gray-300"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Change Password
            </button>


            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={!isOnline}
                className={`w-32 text-xs px-5 py-2.5 font-medium rounded-lg text-center ${
                  isOnline
                    ? "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
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
                      className="w-full p-2 border rounded-md dark:bg-gray-700 bg-white text-black dark:text-white"
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
                      className="w-full p-2 border rounded-md dark:bg-gray-700 bg-white dark:text-white"
                    />
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm New Password"
                      className="w-full p-2 border rounded-md dark:bg-gray-700 bg-white dark:text-white"
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

        {/* Loading Modal */}
        {isLoading && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
              <p className="text-lg font-semibold text-gray-900">Saving Changes...</p>
              <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
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