// //needed for user-specific recommendations
// import React, { useEffect, useState } from "react";
// import axios from "axios";

// function Recommendations({ userId }) {
//   const [movies, setMovies] = useState([]);
//   const [loading, setLoading] = useState(true); 
//   const [error, setError] = useState(null);     

//   useEffect(() => {
//     if (!userId) return;

//     axios.get(`http://localhost:3001/api/movies/recommendations/${userId}`)
//       .then(res => {
//         const rawMovies = res.data || [];

//         const cleanedMovies = rawMovies
//           .filter(movie =>
//             movie.poster_url &&
//             movie.trailer_url &&
//             typeof movie.poster_url === "string" &&
//             typeof movie.trailer_url === "string" &&
//             movie.poster_url.toLowerCase() !== "nan" &&
//             movie.trailer_url.toLowerCase() !== "nan" &&
//             movie.poster_url.trim() !== "" &&
//             movie.trailer_url.trim() !== "" &&
//             movie.director && movie.director.trim().toLowerCase() !== "n/a" &&
//             movie.overview && movie.overview.trim().toLowerCase() !== "n/a"
//           )
//           .map(movie => {
//             if (typeof movie.genres === "string") {
//               movie.genres = movie.genres.split(/[,|]/).map(g => g.trim());
//             }
//             return movie;
//           });

//         setMovies(cleanedMovies);
//         setLoading(false);
//       })
//       .catch(err => {
//         console.error("Error fetching recommendations:", err);
//         setError("Failed to fetch recommendations");
//         setLoading(false);
//       });
//   }, [userId]);

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p className="text-red-500">{error}</p>;
//   if (movies.length === 0) return <p>No recommendations found.</p>;

//   return (
//     <div className="text-white p-4">
//       <h2 className="text-xl font-bold mb-4">Your Recommended Movies</h2>
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//         {movies.map(movie => (
//           <div key={movie._id} className="bg-gray-800 p-4 rounded-lg shadow-md">
//             <h3 className="font-semibold">{movie.title || "Untitled"}</h3>

//             {movie.poster_url ? (
//               <img src={movie.poster_url} alt={movie.title} className="w-full h-48 object-cover rounded mt-2" />
//             ) : (
//               <div className="w-full h-48 bg-gray-600 flex items-center justify-center rounded mt-2">
//                 <span>No image</span>
//               </div>
//             )}

//             <p className="text-sm mt-2"><strong>Genres:</strong> {movie.genres?.join(", ") || "N/A"}</p>
//             <p className="text-sm mt-1"><strong>Director:</strong> {movie.director || "N/A"}</p>
//             <p className="text-sm mt-1"><strong>Overview:</strong> {movie.overview || "N/A"}</p>
//             <p className="text-sm mt-1"><strong>Rating:</strong> ⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}</p>

//             {movie.trailer_url && (
//               <a
//                 href={movie.trailer_url}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="text-blue-400 text-sm underline block mt-2"
//               >
//                 Watch Trailer
//               </a>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Recommendations;

import React, { useEffect, useState } from "react";
import axios from "axios";

function Recommendations({ userId }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  if (!userId) return;

  axios
    .get(`http://localhost:3001/api/movies/recommendations/${userId}`)
    .then((res) => {
      const rawMovies = res.data || [];

      console.log("RAW MOVIES:", rawMovies); // ✅ Debug after assignment
      console.log("Example movie detail:", rawMovies.find(m => m.title === "Crazy Love")); // ✅ After rawMovies is defined

      const cleanedMovies = rawMovies
        .filter((movie) =>
          movie.poster_url &&
          movie.trailer_url &&
          typeof movie.poster_url === "string" &&
          typeof movie.trailer_url === "string" &&
          movie.poster_url.toLowerCase() !== "nan" &&
          movie.trailer_url.toLowerCase() !== "nan" &&
          movie.poster_url.trim() !== "" &&
          movie.trailer_url.trim() !== ""
        )
        .map((movie) => {
          // Normalize genres
          if (typeof movie.genres === "string") {
            movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
          }

          // Normalize actors
          if (typeof movie.actors === "string") {
            movie.actors = movie.actors.split(",").map((a) => a.trim()).filter(Boolean);
          } else if (!Array.isArray(movie.actors)) {
            movie.actors = [];
          }

          // Normalize producers
          if (typeof movie.producers === "string") {
            movie.producers = movie.producers.split(",").map((p) => p.trim()).filter(Boolean);
          } else if (!Array.isArray(movie.producers)) {
            movie.producers = [];
          }

          // Normalize director & overview
          movie.director = typeof movie.director === "string" && movie.director.trim() !== "" ? movie.director : "N/A";
          movie.overview = typeof movie.overview === "string" && movie.overview.trim() !== "" ? movie.overview : "N/A";

          // Debug if missing
          if (movie.director === "N/A") console.warn("Missing director for:", movie.title);
          if (movie.actors.length === 0) console.warn("Missing actors for:", movie.title);
          if (movie.producers.length === 0) console.warn("Missing producers for:", movie.title);
          if (movie.overview === "N/A") console.warn("Missing overview for:", movie.title);

          return movie;
        });

      setMovies(cleanedMovies);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching recommendations:", err);
      setError("Failed to fetch recommendations");
      setLoading(false);
    });
}, [userId]);


  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (movies.length === 0) return <p>No recommendations found.</p>;

  return (
    <div className="text-white p-4">
      <h2 className="text-xl font-bold mb-4">Your Recommended Movies</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <div key={movie._id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold">{movie.title || "Untitled"}</h3>

            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-48 object-cover rounded mt-2"
              />
            ) : (
              <div className="w-full h-48 bg-gray-600 flex items-center justify-center rounded mt-2">
                <span>No image</span>
              </div>
            )}

            <p className="text-sm mt-2"><strong>Genres:</strong> {movie.genres?.join(", ") || "N/A"}</p>
            <p className="text-sm mt-1"><strong>Director:</strong> {movie.director}</p>
            <p className="text-sm mt-1"><strong>Overview:</strong> {movie.overview}</p>
            <p className="text-sm mt-1"><strong>Actors:</strong> {movie.actors.length > 0 ? movie.actors.join(", ") : "N/A"}</p>
            <p className="text-sm mt-1"><strong>Producers:</strong> {movie.producers.length > 0 ? movie.producers.join(", ") : "N/A"}</p>
            <p className="text-sm mt-1"><strong>Rating:</strong> ⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}</p>

            {movie.trailer_url && (
              <a
                href={movie.trailer_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 text-sm underline block mt-2"
              >
                Watch Trailer
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


export default Recommendations;
