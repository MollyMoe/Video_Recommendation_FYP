import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import logoPic from "../images/Cine-It.png";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { API } from "@/config/api";

console.log("API =", API); 
const defaultImage = `${API}/uploads/profile.jpg`;

function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    userType: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userType) newErrors.userType = "Please select user type";
    if (!formData.username.trim()) newErrors.username = "Username required";
    if (formData.username.length < 3)
      newErrors.username = "Username must be 3+ characters";
    if (!formData.fullName.trim()) newErrors.fullName = "Full name required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (formData.password.length < 6)
      newErrors.password = "Password must be 6+ characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords don't match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          fullName: formData.fullName,
          userType: formData.userType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Account created successfully!" });

        localStorage.setItem("user", JSON.stringify(data));

        // Reset form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          username: "",
          fullName: "",
          userType: "",
        });

        // Navigate only if successful
        if (formData.userType === "streamer") {
          localStorage.removeItem("streamer_profileImage");
          navigate("/inputgenre");
        } else if (formData.userType === "admin") {
          localStorage.removeItem("admin_profileImage");
          navigate("/signin");
        }
      } else {
        setMessage({ type: "error", text: data.error || "Signup failed." });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans dark:bg-gray-800 dark:border-gray-700 dark:text-white">
      <div className="w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center py-4">
          <img
            src={logoPic}
            alt="Cine It"
            className="mx-auto h-12 mb-1 rounded-full"
          />
          <h2 className="text-2xl text-black font-semibold text-gray-800 dark:text-white">
            Create Account
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
                <ul className="absolute z-10 mt-1 w-full text-grey-900 bg-white dark:bg-gray-700 border border-gray-300 rounded-md shadow-md">
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

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="w-full px-4 py-2 text-sm 
             border border-gray-300 rounded-md 
             bg-white text-gray-900 
             dark:bg-gray-700 dark:text-white 
             focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="w-full px-4 py-2 text-sm 
             border border-gray-300 rounded-md 
             bg-white text-gray-900 
             dark:bg-gray-700 dark:text-white 
             focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full px-4 py-2 text-sm 
             border border-gray-300 rounded-md 
             bg-white text-gray-900 
             dark:bg-gray-700 dark:text-white 
             focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-4 py-2 text-sm 
             border border-gray-300 rounded-md 
             bg-white text-gray-900 
             dark:bg-gray-700 dark:text-white 
             focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="w-full px-4 py-2 text-sm 
             border border-gray-300 rounded-md 
             bg-white text-gray-900 
             dark:bg-gray-700 dark:text-white 
             focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                required
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-900 dark:text-white"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-purple-600 hover:underline dark:text-violet-200"
                >
                  Terms and Conditions
                </a>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-white text-gray-600 rounded-md shadow-md border border-gray-300 hover:bg-gray-100 text-sm transition duration-200 ease-in-out flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <strong>Sign Up</strong>
                )}
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600 dark:text-white">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-medium text-purple-500 hover:underline dark:text-violet-200"
              >
                <strong>Sign In</strong>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;