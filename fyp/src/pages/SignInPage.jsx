import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import logoPic from "../images/Cine-It.png";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { API } from "@/config/api";


function SignInPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "",
    username: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userType) newErrors.userType = "Please select user type";
    if (!formData.username.trim()) newErrors.username = "Username required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage(null);

  if (!validateForm()) return;

  const isOnline = navigator.onLine;

  setIsLoading(true);

  try {
    if (isOnline) {
      // ✅ ONLINE LOGIN FLOW
      const res = await fetch(`${API}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          userType: formData.userType.toLowerCase(),
        }),
      });

      const data = await res.json();
      console.log("Login API response data:", data);

      if (res.ok) {
        // Save to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (window.electron && window.electron.saveSession) {
          window.electron.saveSession({
            userId: data.user.userId,
            username: data.user.username,
            userType: data.user.userType,
            password: formData.password,
            lastSignin: new Date().toISOString(),
          });
        } else {
          console.warn("⚠️ Electron API not available. Skipping offline session save.");
        }
        // Clear old profile images
        localStorage.removeItem("streamer_profileImage");
        localStorage.removeItem("admin_profileImage");

        // ✅ Fetch profile image
        if (data.user?.userId && formData.userType) {
          const endpoint = `${API}/api/auth/users/${formData.userType.toLowerCase()}/${data.user.userId}`;
          try {
            const imageRes = await fetch(endpoint);
            const userInfo = await imageRes.json();

            if (userInfo.profileImage) {
              const key = `${formData.userType.toLowerCase()}_profileImage`;
              localStorage.setItem(key, userInfo.profileImage);
            }
          } catch (error) {
            console.warn("⚠️ Could not fetch profile image:", error);
          }
        }

        // ✅ Navigate
        if (formData.userType === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }

        setMessage({ type: "success", text: "Login successful!" });
      } else if (
        res.status === 403 &&
        data.error?.toLowerCase().includes("Suspended")
      ) {
        setMessage({
          type: "error",
          text:
            "Your account has been suspended due to prolonged inactivity. Contact cineit.helpdesk@gmail.com.",
        });
      } else if (
        res.status === 400 &&
        data.detail?.toLowerCase().includes("invalid")
      ) {
        setMessage({
          type: "error",
          text: "Invalid username or password.",
        });
      } else {
        setMessage({
          type: "error",
          text: data.detail || "Login failed. Please try again.",
        });
      }
    } else {
      // ⚡ OFFLINE LOGIN FLOW
      const offlineData = window.electron.getSession();

      if (
        offlineData &&
        offlineData.username === formData.username &&
        offlineData.password === formData.password &&
        offlineData.userType === formData.userType
      ) {
        localStorage.setItem("user", JSON.stringify(offlineData));

        const key = `${formData.userType.toLowerCase()}_profileImage`;
        if (offlineData.profileImage) {
          localStorage.setItem(key, offlineData.profileImage);
        }

        navigate(formData.userType === "admin" ? "/admin" : "/home");

        setMessage({ type: "success", text: "Logged in offline." });
      } else {
        setMessage({
          type: "error",
          text: "Offline login failed. No matching saved session.",
        });
      }
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    setMessage({ type: "error", text: "Unexpected error. Try again." });
  } finally {
    setIsLoading(false);
  }
};

  // FIXED: Return needs to be inside the component
  return (
    <div className="min-h-screen flex flex-col inset-0 items-center justify-center p-4 font-sans  dark:bg-gray-800 dark:border-gray-700 dark:text-white">
      <div className="w-full max-w-sm mx-auto flex flex-col">
        {/* Header */}
        <div className="text-center py-4">
          <img
            src={logoPic}
            alt="Cine It"
            className="mx-auto h-12 mb-1 rounded-full"
          />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Sign In
          </h2>
        </div>

        {/* Form Box */}
        <div className="bg-purple-100 rounded-lg shadow-xl p-4 mt-2 dark:bg-gray-600 dark:border-white">
          {message && (
            <div
              className={`mb-4 p-2 rounded-md text-center text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 w-full">
            {/* User Type */}
            <div className="relative" ref={dropdownRef}>
              <label
                htmlFor="userType"
                className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
              >
                User Type
              </label>

              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md 
                      bg-white text-gray-900 dark:bg-gray-700 dark:text-white 
                      focus:outline-none focus:ring-2 focus:ring-purple-400 text-left flex justify-between items-center"
              >
                <span>
                  {formData.userType === "admin"
                    ? "System Admin"
                    : formData.userType === "streamer"
                    ? "Streamer"
                    : "Choose"}
                </span>
                <ChevronDownIcon className="w-5 h-5 ml-2 text-gray-500 dark:text-white" />
              </button>

              {dropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 rounded-md shadow-md">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange({
                          target: { name: "userType", value: "admin" },
                        });
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      System Admin
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange({
                          target: { name: "userType", value: "streamer" },
                        });
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Streamer
                    </button>
                  </li>
                </ul>
              )}

              {errors.userType && (
                <p className="mt-1 text-sm text-red-600">{errors.userType}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-md font-medium text-gray-700 mb-1 dark:text-white"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm 
                border border-gray-300 rounded-md 
                bg-white text-gray-900 
                dark:bg-gray-700 dark:text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Choose a username"
                required
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1 ">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-md font-medium text-gray-700 mb-1 dark:text-white"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm 
                border border-gray-300 rounded-md 
                bg-white text-gray-900 
                dark:bg-gray-700 dark:text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Enter your email"
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-md font-medium text-gray-700 mb-1 dark:text-white"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm 
             border border-gray-300 rounded-md 
             bg-white text-gray-900 
             dark:bg-gray-700 dark:text-white 
             focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Enter your password"
                required
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-sm text-gray-900 ml-2 block dark:text-white">
              Forgot Password?{" "}
              <Link
                to="/reset-password"
                className="text-purple-600 hover:underline dark:text-violet-200"
              >
                click here
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-white text-gray-600 font-bold rounded-md shadow-md border border-gray-300 hover:bg-gray-100 text-sm transition duration-200"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            {/* Sign Up */}
            <div className="text-sm text-center text-gray-900 ml-2 block dark:text-white">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-purple-600 hover:underline dark:text-violet-200"
              >
                <strong>Sign Up</strong>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;