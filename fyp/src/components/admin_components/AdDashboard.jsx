import React from "react"; 
import { Link, NavLink } from "react-router-dom"; 
import { Video, Users } from "lucide-react"; 
import { useUser } from '../../context/UserContext';

const AdDashboard = () => { 

  const { profileImage } = useUser();
  const defaultImage = "https://res.cloudinary.com/dnbyospvs/image/upload/v1751267557/beff3b453bc8afd46a3c487a3a7f347b_tqgcpi.jpg";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/api/auth/users/admin/${savedUser.userId}`);
        const data = await res.json();

        console.log("Fetched user from backend:", data);

        setFormData((prev) => ({
          ...prev,
          username: data.username || "",
          contact: data.email || ""
        }));
      }
    }catch (err){
      console.error("Failed to fecth user:", err);
    }
    }
  })

   return ( 
       <div className="flex h-screen bg-gray-100 dark:bg-gray-900"> 
          {/* Sidebar */} 
          <aside className="w-120 bg-white dark:bg-gray-800 shadow-md">
          <nav className="mt-40 p-4">

            {/* Profile Image Section */}
            <div className="flex justify-center">
                <img
                    src={profileImage || defaultImage}
                    alt="User Profile"
                    className="w-28 h-28 rounded-full shadow-lg border-2 border-purple-500 dark:border-purple-400"
                />
            </div>

            <div className="mt-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-inner">
                
                {/* Info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Your Name
                  </h3>
                </div>

                <hr className="my-4 border-gray-200 dark:border-gray-600" />

                {/* Stats or Quick Info */}
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">Email</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@gmail.com</p>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full mt-5 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
                  Edit Profile
                </button>
              </div>
            </div>
            
          </nav>
        </aside> 

           {/* Main Content */} 
           <main className="flex-1 p-8 mt-20"> 
               <header className="flex items-center justify-between mb-8"> 
                   <h1 className="text-4xl font-bold text-gray-800 dark:text-white"> 
                       Welcome Back, Admin! 
                   </h1> 
               </header>

               {/* Quick Actions */} 
               <div className="mt-12"> 
                   <div className="grid grid-cols-1 gap-8 md:grid-cols-2"> 
                       <Link to="/admin/manageUser"> 
                           <div className="p-8 text-center bg-white rounded-lg shadow-md hover:shadow-xl dark:bg-gray-800 dark:hover:bg-gray-700"> 
                               <Users className="w-16 h-16 mx-auto mb-4 text-blue-500" /> 
                               <h3 className="text-xl font-semibold text-gray-800 dark:text-white"> 
                                   Manage User Profile 
                               </h3> 
                           </div> 
                       </Link> 
                       <Link to="/admin/video"> 
                           <div className="p-8 text-center bg-white rounded-lg shadow-md hover:shadow-xl dark:bg-gray-800 dark:hover:bg-gray-700"> 
                               <Video className="w-16 h-16 mx-auto mb-4 text-red-500" /> 
                               <h3 className="text-xl font-semibold text-gray-800 dark:text-white"> 
                                   Manage Video Content 
                               </h3> 
                           </div> 
                       </Link> 
                   </div> 
               </div> 
           </main> 
       </div> 
   ); 
}; 

export default AdDashboard;