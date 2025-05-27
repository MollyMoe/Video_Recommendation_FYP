import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoPic from '../images/Cine-It.png';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

function SignInPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userType) newErrors.userType = "Please select user type";
    if (!formData.username.trim()) newErrors.username = "Username required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
  
    if (!validateForm()) return;
  
    setIsLoading(true);
  
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setMessage({ type: 'success', text: 'Login successful!' });
        localStorage.setItem('token', data.token); // Save JWT if needed
        navigate('/');
      } else {
        setMessage({ type: 'error', text: data.error || 'Login failed. Please try again.' });
      }
  
    } catch (error) {
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };


  // FIXED: Return needs to be inside the component
  return (
    <div className="flex flex-col inset-0 items-center justify-center p-4 font-sans mt-16 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
      <div className="w-full max-w-sm mx-auto flex flex-col">
        {/* Header */}
        <div className="text-center py-4">
          <img src={logoPic} alt="Cine It" className="mx-auto h-12 mb-1 rounded-full" />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Sign In</h2>

        </div>

        {/* Form Box */}
        <div className="bg-purple-100 rounded-lg shadow-xl p-4 mt-2 dark:bg-gray-600 dark:border-white">

          {message && (
            <div className={`mb-4 p-2 rounded-md text-center text-sm ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 w-full">
            {/* User Type */}
          <div className="relative" ref={dropdownRef}>
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
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
              {formData.userType === 'admin'
                ? 'System Admin'
                : formData.userType === 'guest'
                ? 'Streamer'
                : 'Choose'}
            </span>
            <ChevronDownIcon className="w-5 h-5 ml-2 text-gray-500 dark:text-white" />
          </button>

          {dropdownOpen && (
            <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 rounded-md shadow-md">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    handleChange({ target: { name: 'userType', value: 'admin' } });
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
                    handleChange({ target: { name: 'userType', value: 'guest' } });
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
              <label htmlFor="username" className="block text-md font-medium text-gray-700 mb-1 dark:text-white">Username</label>
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
              {errors.username && <p className="text-red-500 text-sm mt-1 ">{errors.username}</p>}

            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-md font-medium text-gray-700 mb-1 dark:text-white">Email</label>
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
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}

            </div>

            {/* Password */}
            <div>

              <label htmlFor="password" className="block text-md font-medium text-gray-700 mb-1 dark:text-white">Password</label>
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
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}

            </div>

            {/* Forgot Password */}
            <div className="text-sm text-gray-900 ml-2 block dark:text-white">
              Forgot Password?{" "}
              <Link to="/reset-password" className="text-purple-600 hover:underline dark:text-violet-200">
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
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

            </div>

            {/* Sign Up */}
            <div className="text-sm text-center text-gray-900 ml-2 block dark:text-white">

              Don't have an account?{" "}
              <Link to="/signup" className="text-purple-600 hover:underline dark:text-violet-200">
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

