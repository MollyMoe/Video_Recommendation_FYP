import React from 'react'
import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react';
import {BadgeCheck} from "lucide-react"
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

const AdEditProfilePage = () => {
  const [showConfirm, setShowConfirm] = useState(false)
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const modalRef = useRef(null)

    // const SideButton = ({ to, label, current, children }) => {
    //   return (
    //     <Link
    //       to={to}
    //       className={`block p-1 rounded-lg ${
    //         current ? 'bg-gray-200 text-black font-semibold' : 'hover:bg-gray-200 '
    //       }`}
    //     >
    //       {children || label}
    //     </Link>
    //   );
    // };

    const [formData, setFormData] = useState({
        username: '',
        contact: '',
        password: '',
        genre: '',
        profileImage: null,
      });
      
      const { profileImage, updateProfileImage, setCurrentRole } = useUser();
      const [previewImage, setPreviewImage] = useState(null);
      const [showSuccessModal, setShowSuccessModal] = useState(false);
      const fileInputRef = useRef(null);
    
    useEffect(() => {
      const savedUser = JSON.parse(localStorage.getItem('user'));
    
      if (savedUser) {
        setFormData((prev) => ({
          ...prev,
          username: savedUser.username || '',
          contact: savedUser.email || '',
          genre: '',
          password: '',
          profileImage: null
        }));
      }
    }, []);

    useEffect(() => {
    setCurrentRole('admin');
  }, []);

    const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileImage') {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          updateProfileImage(base64,'admin');     // 💡 Shared state update
          setPreviewImage(base64);        // For preview in this page
          setFormData((prev) => ({ ...prev, profileImage: file }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
    
      const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
    
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 500);
      };
    
      const closeModal = () => {
        setShowSuccessModal(false);
      };
    
      const triggerFileInput = () => {
        fileInputRef.current.click();
      };

  const handleDelete = async (userType, username) => {
    console.log('handleDelete called with:', { userType, username });
    try {
      const res = await fetch(`http://localhost:3001/api/auth/delete/${userType}/${username}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        alert('Deleted successfully');
         localStorage.removeItem('user');
         navigate('/signin');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showConfirm && modalRef.current && !modalRef.current.contains(e.target)) {
        setShowConfirm(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showConfirm])

  return (
    <div className="min-h-screen pt-30 px-4 sm:px-8 dark:bg-gray-800 ">

          <div className="fixed top-17 px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
            <button className="bg-white border border-gray-400 text-black text-md px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                <Link to="/admin">Back</Link>
            </button>

        </div>
        
        
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center p-4 font-sans dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                
                <form onSubmit={handleSubmit} className="w-full">
                    {/* Profile Image Section */}
                    <div className="mb-5 flex flex-row items-center space-x-4">
                        <img src={profileImage || previewImage} className="w-32 h-32 rounded-full shadow-lg border border-gray-300" />
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
                                border border-gray-300 font-small rounded-lg text-sm px-5 py-2.5 
                                text-center"
                            >
                                Change Profile Pic
                            </button>
                        </div>
                    </div>
        
                    {/* Username */}
                    <div className="mb-5">
                    <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Username
                    </label>
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
                    <label htmlFor="contact" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Reset password
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
        
                    <div className="flex flex-col items-end space-y-2 mt-4">
                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-32 bg-white text-black text-xs px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 border border-gray-300"
                        >
                            Save Changes
                        </button>
        
                    <div className="relative">
                          {/* Delete Button */}
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
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                  Are you sure you want to delete the account?
                                </h2>
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                
                {/* Success Modal */}
                {showSuccessModal && (
                <div
                    className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50"
                    aria-modal="true"
                    role="dialog"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg text-center z-60">
                        <div className="flex items-center justify-center space-x-2 mb-6 text-black">
                            <p>Changes has been saved!</p>
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
              </div>
    </div>
  )
}

export default AdEditProfilePage