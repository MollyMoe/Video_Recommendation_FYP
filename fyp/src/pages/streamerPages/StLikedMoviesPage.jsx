// import { useEffect, useState } from "react";
// import StNav from "../../components/streamer_components/StNav";
// import StSideBar from "../../components/streamer_components/StSideBar";
// import StSearchBar from "../../components/streamer_components/StSearchBar";

// const API = import.meta.env.VITE_API_BASE_URL;

// const StLikedMoviesPage = () => {
//   const [likedMovies, setLikedMovies] = useState([]);

//   const fetchLikedMovies = async (userId) => {
//     try {
//       const res = await fetch(`${API}/api/movies/likedMovies/${userId}`);
//       const data = await res.json();

//       console.log("🎬 Liked movies response:", data);

//       // Remove duplicates by _id or movieId
//       const uniqueMovies = [];
//       const seen = new Set();

//       for (const movie of data.likedMovies || []) {
//         const id = movie._id || movie.movieId;
//         if (!seen.has(id)) {
//           seen.add(id);
//           uniqueMovies.push(movie);
//         }
//       }

//       setLikedMovies(uniqueMovies);
//     } catch (err) {
//       console.error("❌ Failed to fetch liked movies:", err);
//     }
//   };

//   useEffect(() => {
//     const savedUser = JSON.parse(localStorage.getItem("user"));
//     if (savedUser?.userId) {
//       fetchLikedMovies(savedUser.userId);
//     }
//   }, []);


//   const handlePlay = async (movie) => {
//     try {
//       await fetch(`${API}/api/movies/history`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId: savedUser.userId,
//           movieId: movie.movieId,
//         }),
//       });
//       if (movie.trailer_url) {
//         window.open(movie.trailer_url, "_blank");
//       }
//     } catch (err) {
//       console.error("❌ Failed to play movie:", err);
//     }
//   };
  
//   const handleRemoveLike = async (movieId) => {
//     try {
//       const res = await fetch(`${API}/api/movies/unlike`, {
//         method: "POST", // or DELETE depending on your backend
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId: savedUser.userId,
//           movieId,
//         }),
//       });
  
//       if (res.ok) {
//         setMovies((prev) => prev.filter((m) => m.movieId !== movieId));
//       } else {
//         console.error("❌ Failed to remove from liked movies");
//       }
//     } catch (err) {
//       console.error("❌ Error removing like:", err);
//     }
//   };
  

//   return (
//     <div className="p-4">
//       <StNav />
//       <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
//         <StSearchBar />
//       </div>
//       <StSideBar />
//       <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
//         <div className="max-w-6xl mx-auto">
//           {likedMovies.length === 0 ? (
//             <p className="text-center mt-10 text-white">No liked movies found.</p>
//           ) : (
//             // <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
//             //   {likedMovies.map((movie) => (
//             //     <div key={movie._id || movie.movieId} className="bg-white rounded-lg shadow p-2">
//             //       <img
//             //         src={movie.poster_url || "https://via.placeholder.com/150"}
//             //         alt={movie.title || "No Title"}
//             //         className="rounded mb-2 w-full h-60 object-cover"
//             //       />
//             //       <h3 className="text-sm font-semibold">{movie.title}</h3>
//             //     </div>
//             //   ))}
//             // </div>

//             <div key={movie._id || movie.movieId} className="bg-white rounded-lg shadow p-2">
//   <img
//     src={movie.poster_url || "https://via.placeholder.com/150"}
//     alt={movie.title || "No Title"}
//     className="rounded mb-2 w-full h-60 object-cover"
//   />
//   <h3 className="text-sm font-semibold mb-2">{movie.title}</h3>

//   <div className="flex justify-between">
//     <button
//       onClick={() => handlePlay(movie)}
//       className="bg-blue-600 text-white px-3 py-1 text-xs rounded hover:bg-blue-700"
//     >
//       ▶ Play
//     </button>

//     <button
//       onClick={() => handleRemoveLike(movie.movieId)}
//       className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600"
//     >
//       ✖ Remove
//     </button>
//   </div>
// </div>

//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StLikedMoviesPage;


import { useEffect, useState } from "react";
import StNav from "../../components/streamer_components/StNav";
import StSideBar from "../../components/streamer_components/StSideBar";
import StSearchBar from "../../components/streamer_components/StSearchBar";

const API = import.meta.env.VITE_API_BASE_URL;

const StLikedMoviesPage = () => {
  const [likedMovies, setLikedMovies] = useState([]);
  const savedUser = JSON.parse(localStorage.getItem("user"));

  
  // Fetch liked movies
  const fetchLikedMovies = async (userId) => {
    try {
      const res = await fetch(`${API}/api/movies/likedMovies/${userId}`);
      const data = await res.json();

      console.log("🎬 Liked movies response:", data);

      // Remove duplicates by _id or movieId
      const uniqueMovies = [];
      const seen = new Set();

      for (const movie of data.likedMovies || []) {
        const id = movie._id || movie.movieId;
        if (!seen.has(id)) {
          seen.add(id);
          uniqueMovies.push(movie);
        }
      }

      setLikedMovies(uniqueMovies);
    } catch (err) {
      console.error("❌ Failed to fetch liked movies:", err);
    }
  };



  useEffect(() => {
    if (savedUser?.userId) {
      fetchLikedMovies(savedUser.userId);
    }
  }, []);

  // Handle play
  const handlePlay = async (movie) => {
    try {
      await fetch(`${API}/api/movies/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId: movie.movieId,
        }),
      });

      if (movie.trailer_url) {
        window.open(movie.trailer_url, "_blank");
      }
    } catch (err) {
      console.error("❌ Failed to play movie:", err);
    }
  };

  const handleRemoveLike = async (movieId) => {
    try {
      const res = await fetch(`${API}/api/movies/unlike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: savedUser.userId,
          movieId,
        }),
      });

      if (res.ok) {
        setLikedMovies((prev) => prev.filter((m) => m.movieId !== movieId));
      } else {
        console.error("❌ Failed to remove from liked movies");
      }
    } catch (err) {
      console.error("❌ Error removing like:", err);
    }
  };


  //handle remove
  

  return (
    <div className="p-4">
      <StNav />
      <div className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
        <StSearchBar />
      </div>
      <StSideBar />
      <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {likedMovies.length === 0 ? (
            <p className="text-center mt-10 text-white">No liked movies found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {likedMovies.map((movie) => (
                <div key={movie._id || movie.movieId} className="bg-white rounded-lg shadow p-2">
                  <img
                    src={movie.poster_url || "https://via.placeholder.com/150"}
                    alt={movie.title || "No Title"}
                    className="rounded mb-2 w-full h-60 object-cover"
                  />
                  <h3 className="text-sm font-semibold mb-2">{movie.title}</h3>
{/* 
                  <div className="flex justify-between">
                    <button
                      onClick={() => handlePlay(movie)}
                      className="bg-blue-600 text-white px-3 py-1 text-xs rounded hover:bg-blue-700"
                    >
                      ▶ Play
                    </button>

                    <button
                      onClick={() => handleRemoveLike(movie.movieId)}
                      className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600"
                    >
                      ✖ Remove
                    </button>
                  </div> */}

              <div className="flex justify-between">
                    <button
                      className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
                      onClick={() => handlePlay(movie)}
                    >
                      <Play className="w-3 h-3 mr-1 fill-black" />
                      Play
                    </button>
{/* 
                    <button
                      onClick={() => handleRemoveLike(movie.movieId)}
                      className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600"
                    >
                      ✖ Remove
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StLikedMoviesPage;

