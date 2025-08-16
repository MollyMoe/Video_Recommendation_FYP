import { createContext, useContext, useState, useEffect } from "react";

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [profileImage, setProfileImage] = useState(null);

//   useEffect(() => {
//     const savedImage = localStorage.getItem('profileImage');
//     if (savedImage) {
//       setProfileImage(savedImage);
//     }
//   }, []);

//   const updateProfileImage = (base64Image) => {
//     setProfileImage(base64Image);
//     localStorage.setItem('profileImage', base64Image);
//   };

//   return (
//     <UserContext.Provider value={{ profileImage, updateProfileImage }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => useContext(UserContext);

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Store both profiles separately
  const [adminProfile, setAdminProfile] = useState(null);
  const [streamerProfile, setStreamerProfile] = useState(null);
  const [currentRole, setCurrentRole] = useState(null); // Track active role

  // Load on init
  useEffect(() => {
    setAdminProfile(localStorage.getItem("admin_profileImage"));
    setStreamerProfile(localStorage.getItem("streamer_profileImage"));
  }, []);

  // Unified update function
  const updateProfileImage = (base64Image, role) => {
    if (role === "admin") {
      setAdminProfile(base64Image);
      localStorage.setItem("admin_profileImage", base64Image);
    } else {
      setStreamerProfile(base64Image);
      localStorage.setItem("streamer_profileImage", base64Image);
    }
  };

  return (
    <UserContext.Provider
      value={{
        profileImage: currentRole === "admin" ? adminProfile : streamerProfile,
        updateProfileImage,
        setCurrentRole, // Allow components to declare their role
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);