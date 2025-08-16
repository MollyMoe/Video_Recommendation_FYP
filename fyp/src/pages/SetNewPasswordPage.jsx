
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import logoPic from "../images/Cine-It.png";
import { useSearchParams } from "react-router-dom";
import { API } from "@/config/api";

const SetNewPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [successAcknowledged, setSuccessAcknowledged] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validatePassword = () => {
    const newErrors = {};
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) return;

    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setShowSuccessModal(true);
      } else {
        setMessage({ type: "error", text: data.error || "Invalid token or server error" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong. Try again later." });
    }
  };

  const closeModal = () => {
  setShowSuccessModal(false);
  setSuccessAcknowledged(true);
  
};

return (
  <div className="bg-white min-h-screen flex flex-col items-center justify-start pt-25 dark:bg-gray-800 px-4">
    {!successAcknowledged ? (
      <>
        {/* Header */}
        <div className="text-center mb-6">
          <img src={logoPic} alt="Cine It" className="mx-auto h-12 rounded-full" />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Reset Password
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-purple-100 dark:bg-gray-900 shadow-md rounded-lg p-6 w-full max-w-sm space-y-4"
        >
          {message && (
            <p
              className={`text-center text-sm ${
                message.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {message.text}
            </p>
          )}

          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md 
                bg-white text-gray-900 dark:bg-gray-700 dark:text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter new password"
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
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md 
                bg-white text-gray-900 dark:bg-gray-700 dark:text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-4 py-2 bg-white text-gray-600 font-bold rounded-md shadow-md border border-gray-300 hover:bg-gray-100 text-sm"
            >
              Save
            </button>
          </div>

          {/* Success Modal */}
          {showSuccessModal && (
            <div
              className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50"
              aria-modal="true"
              role="dialog"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg text-center z-60">
                <div className="flex items-center justify-center space-x-2 mb-6 text-black">
                  <p>Password updated successfully!</p>
                  <BadgeCheck className="w-4 h-4 stroke-black" />
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
        </form>
      </>
    ) : (
      <div className="text-center mb-6 ">
          <img src={logoPic} alt="Cine It" className="mx-auto h-12 rounded-full" />
            <div className="bg-purple-100 dark:bg-gray-900 shadow-md p-6 w-full max-w-xl space-y-4 justify-start mt-7">
              <p className="flex text-gray-800 dark:text-white text-xl text-center justify-center font-semibold">
                You can return to the application...!
              </p>
            </div>
      </div>
    )}
  </div>
);
};

export default SetNewPasswordPage;
