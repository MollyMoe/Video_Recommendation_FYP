// import { useEffect, useState } from "react";
// import axios from "axios";
// import { Dialog } from "@headlessui/react";
// import { Play, Heart, Bookmark, Trash2 } from "lucide-react";
// import { debounce } from "lodash";
// import { API } from "@/config/api";


// function StHomeContent({searchQuery }) {
//   const [movies, setMovies] = useState([]);
//   const [allFetchedMovies, setAllFetchedMovies] = useState([]);
//   const [preferredGenres, setPreferredGenres] = useState([]);
//   const [selectedMovie, setSelectedMovie] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [lastRecommendedMovies, setLastRecommendedMovies] = useState([]);
//   const [actionLoading, setActionLoading] = useState(false); // aft clicking delete btn, loads UI
  
//   const savedUser = JSON.parse(localStorage.getItem("user"));
//   const username = savedUser?.username;
//   //pop up message, loading
//     const [popupMessage, setPopupMessage] = useState("");
//     const [showPopup, setShowPopup] = useState(false);

//   const [isOnline, setIsOnline] = useState(navigator.onLine);

//   useEffect(() => {
//     const handleOnlineStatus = () => setIsOnline(navigator.onLine);

//     window.addEventListener("online", handleOnlineStatus);
//     window.addEventListener("offline", handleOnlineStatus);

//     return () => {
//       window.removeEventListener("online", handleOnlineStatus);
//       window.removeEventListener("offline", handleOnlineStatus);
//     };
//   }, []);
    

//       // fetch recommendation again
//  const fetchRecommended = async () => {
//   if (!username || !savedUser?.userId) return [];

//   setActionLoading(true);
//   let data = [];

//   try {
//     if (isOnline) {
//       const res = await fetch(`${API}/api/movies/recommendations/${savedUser.userId}`);
//       if (!res.ok) throw new Error(`HTTP error ${res.status}`);
//       data = await res.json();

//       setMovies(data || []);
//       setLastRecommendedMovies(data || []);

//       // ✅ Save offline copy
//       if (window.electron?.saveRecommendedMovies) {
//         window.electron.saveRecommendedMovies(data.slice(0, 500)); // optional limit
//       }
//     } else {
//       // 🔌 Offline fallback
//       if (window.electron?.getRecommendedMovies) {
//         try {
//           data = await window.electron.getRecommendedMovies();
//           setMovies(data || []);
//           setLastRecommendedMovies(data || []);
//         } catch (e) {
//           console.warn("⚠️ Failed to load recommended movies offline:", e);
//         }
//       }
//     }
//   } catch (err) {
//     console.error("❌ Fetch error:", err);
//   } finally {
//     setActionLoading(false);
//     return data || [];
//   }
// };


// useEffect(() => {
//   const fetchUserAndMovies = async () => {
//     if (!username || !savedUser?.userId) return;
//     setIsLoading(true);

//     try {
//       let userGenres = [];

//       // ✅ Fetch user genres
//       if (isOnline) {
//         try {
//           const userRes = await axios.get(`${API}/api/auth/users/streamer/${savedUser.userId}`);
//           userGenres = userRes.data.genres || [];

//           if (window.electron?.saveUserGenres) {
//             window.electron.saveUserGenres(userGenres);
//           }
//         } catch (err) {
//           console.warn("⚠️ Failed to fetch user genres online:", err);
//         }
//       } else if (window.electron?.getUserGenres) {
//         try {
//           userGenres = await window.electron.getUserGenres();
//         } catch (e) {
//           console.warn("⚠️ Failed to load user genres offline:", e);
//         }
//       }

//       setPreferredGenres(userGenres);

//       // ✅ Fetch all movies
//       let allMovies = [];

//       if (isOnline) {
//         try {
//           const allRes = await axios.get(`${API}/api/movies/all`);
//           allMovies = allRes.data;

//           // Cache only top 500 movies offline
//           const limited = allMovies.slice(0, 500);
//           if (window.electron?.saveAllMovies) {
//             window.electron.saveAllMovies(limited);
//           }
//         } catch (err) {
//           console.warn("⚠️ Failed to fetch all movies online:", err);
//         }
//       } else if (window.electron?.getAllMovies) {
//         try {
//           allMovies = await window.electron.getAllMovies();
//         } catch (e) {
//           console.warn("⚠️ Failed to load all movies offline:", e);
//         }
//       }

//       // ✅ Filter & normalize movie data
//       const validMovies = allMovies
//         .filter(
//           (movie) =>
//             movie.poster_url &&
//             movie.trailer_url &&
//             typeof movie.poster_url === "string" &&
//             typeof movie.trailer_url === "string" &&
//             movie.poster_url.toLowerCase() !== "nan" &&
//             movie.trailer_url.toLowerCase() !== "nan" &&
//             movie.poster_url.trim() !== "" &&
//             movie.trailer_url.trim() !== ""
//         )
//         .map((movie) => {
//           if (typeof movie.genres === "string") {
//             movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
//           }
//           const match = movie.trailer_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
//           movie.trailer_key = match ? match[1] : null;
//           return movie;
//         });

//       // ✅ Deduplicate movies by title
//       const seen = new Set();
//       const unique = validMovies.filter((movie) => {
//         if (seen.has(movie.title)) return false;
//         seen.add(movie.title);
//         return true;
//       });

//       setAllFetchedMovies(unique);

//       // ✅ Recommendations
//       let fetchedMovies = [];
//       const refreshNeeded = localStorage.getItem("refreshAfterSettings") === "true";

//       if (!refreshNeeded && isOnline) {
//         try {
//           const recRes = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
//           fetchedMovies = recRes.data;

//           // Optionally cache recommended movies offline (top 100)
//           if (window.electron?.saveRecommendedMovies) {
//             window.electron.saveRecommendedMovies(fetchedMovies.slice(0, 500));
//           }
//         } catch (e) {
//           console.warn("⚠️ Failed to fetch recommendations online:", e);
//         }
//       } else if (window.electron?.getRecommendedMovies) {
//         try {
//           fetchedMovies = await window.electron.getRecommendedMovies();
//         } catch (e) {
//           console.warn("⚠️ Failed to load offline recommendations:", e);
//         }
//       }

//       // ✅ Fallback to genre-matched movies if nothing fetched
//       if (refreshNeeded || !fetchedMovies || fetchedMovies.length === 0) {
//         localStorage.removeItem("refreshAfterSettings");

//         const normalizedPreferred = userGenres.map((g) => g.toLowerCase().trim());
//         fetchedMovies = unique.filter(
//           (movie) =>
//             Array.isArray(movie.genres) &&
//             movie.genres.some((genre) =>
//               normalizedPreferred.some((pref) => genre.toLowerCase().includes(pref))
//             )
//         );

//         if (isOnline) {
//           try {
//             await axios.post(`${API}/api/movies/store-recommendations`, {
//               userId: savedUser.userId,
//               movies: fetchedMovies,
//             });
//           } catch (e) {
//             console.warn("⚠️ Failed to store recommendations:", e);
//           }
//         }
//       }

//       // ✅ Apply recommendation limit
//       setMovies(fetchedMovies.slice(0, 99));
//       setLastRecommendedMovies(fetchedMovies.slice(0, 99));
//     } catch (err) {
//       console.error("❌ Error in fetchUserAndMovies:", err);
//       setMovies([]);
//       setPreferredGenres([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   fetchUserAndMovies();
// }, [username, isOnline]);

// // useEffect(() => {
// //     const fetchUserAndMovies = async () => {
// //       if (!username || !savedUser?.userId) return;
// //       setIsLoading(true);

// //           try {
// //       let userGenres = [];

// //       // ✅ Fetch user genres
// //       if (isOnline) {
// //         try {
// //           const userRes = await axios.get(`${API}/api/auth/users/streamer/${savedUser.userId}`);
// //           userGenres = userRes.data.genres || [];

// //           if (window.electron?.saveUserGenres) {
// //             window.electron.saveUserGenres(userGenres);
// //           }
// //         } catch (err) {
// //           console.warn("⚠️ Failed to fetch user genres online:", err);
// //         }
// //       } else if (window.electron?.getUserGenres) {
// //         try {
// //           userGenres = await window.electron.getUserGenres();
// //         } catch (e) {
// //           console.warn("⚠️ Failed to load user genres offline:", e);
// //         }
// //       }

// //       setPreferredGenres(userGenres);


// //         // ✅ Always fetch the full movie list for searching
// //         const allRes = await axios.get(`${API}/api/movies/all`);
// //         const validMovies = allRes.data
// //           .filter(
// //             (movie) =>
// //               movie.poster_url &&
// //               movie.trailer_url &&
// //               typeof movie.poster_url === "string" &&
// //               typeof movie.trailer_url === "string" &&
// //               movie.poster_url.toLowerCase() !== "nan" &&
// //               movie.trailer_url.toLowerCase() !== "nan" &&
// //               movie.poster_url.trim() !== "" &&
// //               movie.trailer_url.trim() !== ""
// //           )
// //           .map((movie) => {
// //             if (typeof movie.genres === "string") {
// //               movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
// //             }
// //             const match = movie.trailer_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
// //             movie.trailer_key = match ? match[1] : null;
// //             return movie;
// //           });

// //         // ✅ Remove duplicates
// //         const seen = new Set();
// //         const unique = validMovies.filter((movie) => {
// //           if (seen.has(movie.title)) return false;
// //           seen.add(movie.title);
// //           return true;
// //         });

// //         // ✅ Save full list for searching
// //         setAllFetchedMovies(unique);

// //       //  ✅ Recommendations
// //       let fetchedMovies = [];
// //       const refreshNeeded = localStorage.getItem("refreshAfterSettings") === "true";

// //       if (!refreshNeeded && isOnline) {
// //         try {
// //           const recRes = await axios.get(`${API}/api/movies/recommendations/${savedUser.userId}`);
// //           fetchedMovies = recRes.data;

// //           // Optionally cache recommended movies offline (top 100)
// //           if (window.electron?.saveRecommendedMovies) {
// //             window.electron.saveRecommendedMovies(fetchedMovies.slice(0, 100));
// //           }
// //         } catch (e) {
// //           console.warn("⚠️ Failed to fetch recommendations online:", e);
// //         }
// //       } else if (window.electron?.getRecommendedMovies) {
// //         try {
// //           fetchedMovies = await window.electron.getRecommendedMovies();
// //         } catch (e) {
// //           console.warn("⚠️ Failed to load offline recommendations:", e);
// //         }
// //       }

// //       // ✅ Fallback to genre-matched movies if nothing fetched
// //       if (refreshNeeded || !fetchedMovies || fetchedMovies.length === 0) {
// //         localStorage.removeItem("refreshAfterSettings");

// //         const normalizedPreferred = userGenres.map((g) => g.toLowerCase().trim());
// //         fetchedMovies = unique.filter(
// //           (movie) =>
// //             Array.isArray(movie.genres) &&
// //             movie.genres.some((genre) =>
// //               normalizedPreferred.some((pref) => genre.toLowerCase().includes(pref))
// //             )
// //         );

// //         if (isOnline) {
// //           try {
// //             await axios.post(`${API}/api/movies/store-recommendations`, {
// //               userId: savedUser.userId,
// //               movies: fetchedMovies,
// //             });
// //           } catch (e) {
// //             console.warn("⚠️ Failed to store recommendations:", e);
// //           }
// //         }
// //       }

// //       // ✅ Apply recommendation limit
// //       setMovies(fetchedMovies.slice(0, 99));
// //       setLastRecommendedMovies(fetchedMovies.slice(0, 99));
// //     } catch (err) {
// //       console.error("❌ Error in fetchUserAndMovies:", err);
// //       setMovies([]);
// //       setPreferredGenres([]);
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   fetchUserAndMovies();
// // }, [username, isOnline]);

// const handleRegenerate = async () => {
//   console.log("🔁 Regenerate clicked");
//   setIsLoading(true);

//   try {
//     let regenerated = [];

//     if (isOnline) {
//       // ✅ Online: Ask backend to regenerate with genre filter and exclusion list
//       const res = await axios.post(`${API}/api/movies/regenerate`, {
//         genres: preferredGenres,
//         excludeTitles: movies.map((m) => m.title),
//       });
//       regenerated = res.data || [];
//     } else if (window.electron?.getRecommendedMovies) {
//       // ✅ Offline: Fallback to saved all movies
//       try {
//         const allOffline = await window.electron.getRecommendedMovies();
//         const normalizedPreferred = preferredGenres.map((g) => g.toLowerCase().trim());

//         regenerated = allOffline.filter((movie) => {
//           const movieGenres = Array.isArray(movie.genres)
//             ? movie.genres
//             : typeof movie.genres === "string"
//             ? movie.genres.split(/[,|]/).map((g) => g.trim())
//             : [];

//           return (
//             movieGenres.some((genre) =>
//               normalizedPreferred.some((pref) =>
//                 genre.toLowerCase().includes(pref)
//               )
//             ) && !movies.some((m) => m.title === movie.title)
//           );
//         });
//       } catch (err) {
//         console.warn("⚠️ Failed to load offline movies:", err);
//       }
//     }

//     // ✅ Clean and prepare
//     regenerated = regenerated
//       .filter(
//         (movie) =>
//           movie.poster_url &&
//           movie.trailer_url &&
//           typeof movie.poster_url === "string" &&
//           typeof movie.trailer_url === "string" &&
//           movie.poster_url.trim() !== "" &&
//           movie.trailer_url.trim() !== "" &&
//           movie.poster_url.toLowerCase() !== "nan" &&
//           movie.trailer_url.toLowerCase() !== "nan"
//       )
//       .map((movie) => {
//         // Normalize genres if needed
//         if (typeof movie.genres === "string") {
//           movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
//         }

//         // Extract trailer key
//         const match = movie.trailer_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
//         movie.trailer_key = match ? match[1] : null;

//         return movie;
//       });

//     // ✅ Deduplicate by title
//     const combined = [...regenerated, ...movies];
//     const seen = new Set();
//     const deduped = combined.filter((m) => {
//       if (seen.has(m.title)) return false;
//       seen.add(m.title);
//       return true;
//     });

//     // ✅ Shuffle and take 99
//     const shuffled = deduped.sort(() => 0.5 - Math.random());
//     const finalSet = shuffled.slice(0, 99);

//     // ✅ Update UI
//     setMovies(finalSet);
//     setLastRecommendedMovies(finalSet); // Keep latest set for later return

//     // ✅ Save recommendation set
//     if (isOnline) {
//       await axios.post(`${API}/api/movies/store-recommendations`, {
//         userId: savedUser.userId,
//         movies: finalSet,
//       });
//     } else if (window.electron?.saveRecommendedMovies) {
//       window.electron.saveRecommendedMovies(finalSet);
//     }
//   } catch (err) {
//     console.error("❌ Failed to regenerate movies:", err);
//   } finally {
//     setIsLoading(false);
//   }
// };

// // const handleRegenerate = async () => {
// //   setIsLoading(true);
// //   try {
// //     let regenerated = [];

// //     if (isOnline) {
// //       // ✅ Online: get new recommendations from backend
// //       const response = await axios.post(`${API}/api/movies/regenerate`, {
// //         genres: preferredGenres,
// //         excludeTitles: movies.map((m) => m.title),
// //       });

// //       regenerated = response.data || [];
// //     } else if (window.electron?.getRecommendedMovies) {
// //       // ✅ Offline: regenerate locally from saved recommended movies
// //       try {
// //         const Offline = await window.electron.getRecommendedMovies();
// //         const normalizedPreferred = preferredGenres.map((g) => g.toLowerCase().trim());

// //         regenerated = Offline.filter((movie) => {
// //           const genresArray =
// //             Array.isArray(movie.genres)
// //               ? movie.genres
// //               : typeof movie.genres === "string"
// //               ? movie.genres.split(/[,|]/).map((g) => g.trim())
// //               : [];

// //           return (
// //             genresArray.some((genre) =>
// //               normalizedPreferred.some((pref) =>
// //                 genre.toLowerCase().includes(pref)
// //               )
// //             ) && !movies.some((m) => m.title === movie.title)
// //           );
// //         });
// //       } catch (err) {
// //         console.warn("⚠️ Failed to load offline all movies:", err);
// //       }
// //     }

// //     // ✅ Clean + transform
// //     regenerated = regenerated
// //       .filter(
// //         (movie) =>
// //           movie.poster_url &&
// //           movie.trailer_url &&
// //           typeof movie.poster_url === "string" &&
// //           typeof movie.trailer_url === "string" &&
// //           movie.poster_url.toLowerCase() !== "nan" &&
// //           movie.trailer_url.toLowerCase() !== "nan" &&
// //           movie.poster_url.trim() !== "" &&
// //           movie.trailer_url.trim() !== ""
// //       )
// //       .map((movie) => {
// //         if (typeof movie.genres === "string") {
// //           movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
// //         }
// //         const match = movie.trailer_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
// //         movie.trailer_key = match ? match[1] : null;
// //         return movie;
// //       });

// //     const combined = [...regenerated, ...movies];
// //     const seen = new Set();
// //     const deduped = combined.filter((m) => {
// //       if (seen.has(m.title)) return false;
// //       seen.add(m.title);
// //       return true;
// //     });

// //     // ✅ Show latest 99
// //     const displaySet = regenerated.slice(0, 99);
// //     setMovies(displaySet);
// //     setLastRecommendedMovies(deduped.slice(0, 99));

// //     // ✅ Save recommendations
// //     if (isOnline) {
// //       await axios.post(`${API}/api/movies/store-recommendations`, {
// //         userId: savedUser.userId,
// //         movies: displaySet,
// //       });
// //     } else if (window.electron?.saveRecommendedMovies) {
// //       window.electron.saveRecommendedMovies(displaySet);
// //     }
// //   } catch (err) {
// //     console.error("❌ Failed to regenerate movies:", err);
// //   } finally {
// //     setIsLoading(false);
// //   }
// // };



// useEffect(() => {
//   const trimmed = searchQuery?.trim();
//   if (!trimmed) {
//     setMovies(lastRecommendedMovies.slice(0, 99));
//     return;
//   }

//   const debouncedFetch = debounce(async () => {
//     try {
//       const res = await axios.get(`${API}/api/movies/search`, {
//         params: { q: trimmed },
//       });
//       const results = res.data;

//       const seen = new Set();
//       const deduped = results
//         .filter((movie) => {
//           if (!movie.title || seen.has(movie.title)) return false;
//           seen.add(movie.title);
//           return true;
//         })
//         .map((movie) => {
//           if (typeof movie.genres === "string") {
//             movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
//           }

//           const match =
//             movie.trailerurl?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/) ||
//             movie.trailer_url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
//           movie.trailer_key = match ? match[1] : null;

//           return movie;
//         });

//       setMovies(deduped.slice(0, 99));
//     } catch (err) {
//       console.error("❌ Search failed:", err);
//       setMovies([]);
//     }
//   }, 500);

//   debouncedFetch();
//   return () => debouncedFetch.cancel();
// }, [searchQuery, isOnline]);


// const handleHistory = async (movieId) => {
//   const savedUser = JSON.parse(localStorage.getItem("user"));
//   if (!movieId || !savedUser?.userId) {
//     console.warn("❌ Missing movieId or userId");
//     return;
//   }

//   if (isOnline) {
//     try {
//       const res = await fetch(`${API}/api/movies/history`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId: savedUser.userId, movieId }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.detail || res.status);

//       console.log("✅ History saved:", data);
//     } catch (err) {
//       console.error("❌ Error saving history:", err);
//     }
//   } else if (window.electron?.queueHistory) {
//     window.electron.queueHistory({
//       type: "history",
//       userId: savedUser.userId,
//       movieId,
//       timestamp: new Date().toISOString(),
//     });
//   }
// };

// const handleWatchLater = async (movie) => {
//   const savedUser = JSON.parse(localStorage.getItem("user"));

//   if (!movie || !savedUser?.userId) {
//     console.warn("❌ Missing movie or user");
//     return;
//   }

//   if (!isOnline) {
//     try {
//       window.electron.queueSaved({
//         type: "save",
//         userId: savedUser.userId,
//         movie,
//         timestamp: new Date().toISOString(),
//       });
//       console.log("✅ Queued save action offline:", movie.title);
//     } catch (err) {
//       console.error("❌ Failed to queue save:", err);
//     }
//     return;
//   }

//   // Online mode
//   try {
//     const res = await fetch(`${API}/api/movies/save`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         userId: savedUser.userId,
//         movie,
//       }),
//     });

//     if (!res.ok) throw new Error("Server save failed");

//     console.log("✅ Movie saved online:", movie.title);
//   } catch (err) {
//     console.error("❌ Online save error:", err);
//   }
// };

// // const handleWatchLater = async (movie) => {
// //   const savedUser = JSON.parse(localStorage.getItem("user"));
// //   if (!movieId || !savedUser?.userId) return;

// //   if (isOnline) {
// //     try {
// //       const res = await fetch(`${API}/api/movies/watchLater`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ userId: savedUser.userId, movieId }),
// //       });

// //       const data = await res.json();
// //       if (!res.ok) throw new Error(data?.detail || res.status);

// //       setPopupMessage("Saved to Watch Later!");
// //       setShowPopup(true);
// //       setTimeout(() => setShowPopup(false), 2000);
// //     } catch (err) {
// //       console.error("Save Watch Later error:", err);
// //     }
// //   } else if (window.electron?.queueSaved) {
// //     window.electron.queueSaved({
// //       type: "saved",
// //       userId: savedUser.userId,
// //       movie,
// //       timestamp: new Date().toISOString(),
// //     });

// //     setPopupMessage("Saved to Watch Later (Offline)");
// //     setShowPopup(true);
// //     setTimeout(() => setShowPopup(false), 2000);
// //   }
// // };


// const handleLike = async (movie) => {
//   const savedUser = JSON.parse(localStorage.getItem("user"));
//   if (!movieId || !savedUser?.userId) return;

//   if (isOnline) {
//     try {
//       await fetch(`${API}/api/movies/like`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId: savedUser.userId, movieId }),
//       });

//       setPopupMessage("Movie liked!");
//       setShowPopup(true);
//       setTimeout(() => setShowPopup(false), 2000);
//     } catch (err) {
//       console.error("Error liking movie:", err);
//     }
//   } else if (window.electron?.queueLiked) {
//     window.electron.queueLiked({
//       type: "liked",
//       userId: savedUser.userId,
//       movie,
//       timestamp: new Date().toISOString(),
//     });

//     setPopupMessage("Liked offline!");
//     setShowPopup(true);
//     setTimeout(() => setShowPopup(false), 2000);
//   }
// };

//    // remove the movie
//   const handleRemoveRecommended = async (movieId) => {
//     const savedUser = JSON.parse(localStorage.getItem("user"));
//     if (!savedUser || !savedUser.userId) return;

//     try {
//       const res = await fetch(`${API}/api/movies/recommended/delete`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           userId: savedUser.userId,
//           movieId: movieId,
//         }),
//       });

//       const data = await res.json();
//       // Re-fetch updated data
//       const updated = await fetchRecommended();

//       // ✅ Log total movie count after reload
//       console.log(
//         "🎬 Recommended movies count (after delete):",
//         updated.length
//       );

//       // Optionally refresh UI or show pop-up
//       setPopupMessage("Removed from recommended");
//       setShowPopup(true);
//       setTimeout(() => setShowPopup(false), 2000); // if using a success popup
//       fetchRecommended(); // or re-fetch data to update UI
//     } catch (error) {
//       console.error("❌ Failed to remove from recommended:", error);
//     }
//   };

//   return (
//       <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
//         <div className="max-w-6xl mx-auto">
//           <div className="fixed top-[23px] left-4/10 transform -translate-x-1/2 z-50 w-full max-w-md px-5">
//             <button
//               onClick={handleRegenerate}
//               className="bg-white font-medium text-black border border-gray-400 hover:bg-gray-200 px-7.5 py-2.5 rounded-lg text-sm shadow-md"
//             >
//               Regenerate Movies
//             </button>
//           </div>
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
//             {movies.map((movie) => (
//               <div
//                 key={movie._id}
//                 className="relative cursor-pointer group w-[180px] mx-auto"
//                 onClick={() => setSelectedMovie(movie)}
//               >
//                 <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
//                   <img
//                     src={movie.poster_url || "https://via.placeholder.com/150"}
//                     alt={movie.title || "No title"}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
  
//                 <div className="absolute left-1/2 top-9 transform -translate-x-1/2 w-[350px] z-10 hidden group-hover:block">
//                   <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
//                     {isOnline && movie.trailer_key ? (
//                       <iframe
//                         src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&mute=1&loop=1&playlist=${movie.trailer_key}`}
//                         frameBorder="0"
//                         allow="autoplay; encrypted-media"
//                         allowFullScreen
//                         className="w-full h-full object-cover"
//                         title={movie.title}
//                       />
//                     ) : (
//                       <img
//                         src={movie.poster_url}
//                         alt={movie.title}
//                         className="w-full h-full object-cover"
//                       />
//                     )}
//                   </div>

//                   <div className="bg-black/60 text-white text-xs p-2 rounded-b-xl space-y-1">
//                     <div>{movie.genres?.join(", ")}</div>
//                     <div className="font-semibold text-sm">
//                       ⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}
//                     </div>
//                   </div>
//                 </div>


//               </div>
//             ))}
//           </div>
//         </div>
  
//         {/* Modal */}
//         <Dialog
//           open={!!selectedMovie}
//           onClose={() => setSelectedMovie(null)}
//           className="relative z-50"
//         >
//           <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
//           <div className="fixed inset-0 flex items-center justify-center p-4">
//             <Dialog.Panel className="relative bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
//               <div className="flex space-x-6">
//                 <img
//                   src={selectedMovie?.poster_url}
//                   alt={selectedMovie?.title}
//                   className="rounded-lg w-40 h-auto object-cover"
//                 />
//                 <div className="flex flex-col justify-center space-y-3 flex-grow">
//                   <h2 className="text-2xl font-semibold">
//                     {selectedMovie?.title}
//                   </h2>
//                   <p className="text-sm text-gray-700">
//                     {selectedMovie?.genres?.join(", ")}
//                   </p>
//                   <p className="text-sm text-gray-700">
//                     <strong>Director:</strong> {selectedMovie?.director || "N/A"}
//                   </p>
//                   <p className="text-sm text-gray-700">
//                     <strong>Actors:</strong>{" "}
//                     {Array.isArray(selectedMovie?.actors)
//                       ? selectedMovie.actors.join(", ")
//                       : selectedMovie?.actors || "N/A"}
//                   </p>
//                   <p className="text-sm text-gray-700">
//                     <strong>Overview:</strong> {selectedMovie?.overview || "N/A"}
//                   </p>
//                   <p className="text-sm text-gray-700">
//                     <strong>Rating: ⭐</strong>{" "}
//                     {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
//                 <button
//                   onClick={() => {
//                     console.log("▶️ Play clicked for:", selectedMovie?.movieId);
//                     handleHistory(selectedMovie?.movieId);
  
//                     // Optional: open trailer
//                     if (selectedMovie?.trailer_url) {
//                       window.open(selectedMovie.trailer_url, "_blank");
//                     }
//                   }}
//                   className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
//                 >
//                   <Play className="w-3 h-3 mr-1 fill-black" />
//                   Play
//                 </button>
//                 <button
//                   onClick={() => handleLike(selectedMovie)}
//                   className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
//                 >
//                   <Heart className="w-4 h-4 mr-1 fill-black" />
//                   Like
//                 </button>
//                 <button
//                   onClick={() => handleWatchLater(selectedMovie)}
//                   className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
//                 >
//                   <Bookmark className="w-4 h-4 mr-1 fill-black" />
//                   Save
//                 </button>
//                 <button
//                   onClick={() => handleRemoveRecommended(selectedMovie.movieId)}
//                   className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200"
//                 >
//                   <Trash2 className="w-4 h-4 mr-1 stroke-black" />
//                   Delete
//                 </button>
//               </div>
  
//               {showPopup && (
//                 <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2  text-purple-800 px-4 py-2 rounded shadow text-sm z-50">
//                   {popupMessage}
//                 </div>
//               )}
  
//               <div className="flex justify-end pt-4">
//                 <button
//                   onClick={() => setSelectedMovie(null)}
//                   className="border border-gray-400 text-gray-800 py-1 px-6 rounded-xl hover:bg-gray-100 text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//             </Dialog.Panel>
//           </div>
//         </Dialog>
  
//         {isLoading && (
//           <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
//             <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
//               <p className="text-lg font-semibold">Loading movies...</p>
//               <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
//             </div>
//           </div>
//         )}
//         {showPopup && (
//           <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)]  flex items-center justify-center z-50">
//             <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
//               <p className="text-lg font-semibold">{popupMessage}</p>
//             </div>
//           </div>
//         )}
  
//         {actionLoading && (
//           <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
//             <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
//               <p className="text-lg font-semibold">Loading...</p>
//               <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }
  
//   export default StHomeContent;