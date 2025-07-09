import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoPic from "../images/Cine-It.png";

const API = import.meta.env.VITE_API_BASE_URL;

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const validateEmail = () => {
    const newErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage(null);

  if (!validateEmail()) return;

  setIsLoading(true);
  try {
    const res = await fetch(`${API}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({
        type: 'success',
        text: 'Password reset link sent to your email!',
      });
      setTimeout(() => navigate('/signin'), 3000);
    } else {
      setMessage({
        type: 'error',
        text: data.error || 'Failed to send reset link.',
      });
    }
  } catch {
    setMessage({
      type: 'error',
      text: 'Something went wrong. Try again later.',
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 font-sans mb-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
      <div className="w-full max-w-lg h-100 mx-auto flex flex-col">
        {/* Logo Header */}
        <div className="text-center py-4">
          <img src={logoPic} alt="Cine It" className="mx-auto h-12 mb-1" />
          <h2 className="text-2xl font-semibold text-gray-800">
            Reset Password
          </h2>
        </div>

        <div className="bg-purple-100 rounded-lg shadow-xl p-4 mt-2 dark:bg-gray-600 dark:border-white">
          {/* Message display */}
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

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3 w-full">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 text-sm border text-black border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-white text-gray-600 rounded-md shadow-md border border-gray-300 hover:bg-gray-100 text-sm transition duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
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
                    Sending...
                  </span>
                ) : (
                  <strong>Send Reset Link</strong>
                )}
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">
              Remember your password?{" "}
              <Link
                to="/signin"
                className="font-medium text-purple-500 hover:underline"
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

export default ResetPasswordPage;

