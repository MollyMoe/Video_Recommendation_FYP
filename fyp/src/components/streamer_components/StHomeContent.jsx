import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark } from "lucide-react";


function StHomeContent({ userId }) {
  const [movies, setMovies] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  const savedUser = JSON.parse(localStorage.getItem("user"));
  const username = savedUser?.username;

  // Fetch user preferred genres
useEffect(() => {
  const fetchUserAndMovies = async () => {
    if (!username) return;

    setIsLoading(true); // start loading at the very beginning

    try {
      // Step 1: Fetch user preferred genres
      const userRes = await axios.get(`http://localhost:3001/api/users/by-username/${username}`);
      const userGenres = userRes.data.genres || [];
      console.log("Genres fetched for user:", userGenres);
      setPreferredGenres(userGenres);

      // Step 2: Fetch movies
      const movieRes = await axios.get("http://localhost:3001/api/movies/all");

      const validMovies = movieRes.data
        .filter(
          (movie) =>
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
          if (typeof movie.genres === "string") {
            movie.genres = movie.genres.split(/[,|]/).map((g) => g.trim());
          }
          return movie;
        });

      const uniqueMovies = [];
      const seenTitles = new Set();

      for (const movie of validMovies) {
        if (!seenTitles.has(movie.title)) {
          seenTitles.add(movie.title);
          uniqueMovies.push(movie);
        }
      }

      console.log("All unique movies loaded:", uniqueMovies.length);
      console.log("Preferred genres:", userGenres);

      if (userGenres.length === 0) {
        setMovies(uniqueMovies); // no filtering
      } else {
                  const normalizedPreferred = userGenres.map(g => g.toLowerCase().trim());

const filtered = uniqueMovies.filter((movie) =>
  Array.isArray(movie.genres) &&
  movie.genres.some((genre) => {
    const g = genre.toLowerCase().trim();
    return normalizedPreferred.some((pref) => g.includes(pref));
  })
);

console.log("Filtered movies by genre:", filtered.length);
setMovies(filtered);

      }
    } catch (err) {
      console.error("Error fetching user or movies:", err);
      setPreferredGenres([]);
      setMovies([]);
    } finally {
      setIsLoading(false); // loading ends only after both are done
    }
  };

  fetchUserAndMovies();
}, [username]);


  
  return (
    <div className="sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="relative cursor-pointer group w-[180px] mx-auto"
              onClick={() => setSelectedMovie(movie)}
            >
              <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
                <img
                  src={movie.poster_url || "https://via.placeholder.com/150"}
                  alt={movie.title || "No title"}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Hover Preview */}
              <div className="absolute left-1/2 top-9 transform -translate-x-1/2 w-[350px] z-10 hidden group-hover:block">
                <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&mute=1&loop=1&playlist=${movie.trailer_key}`}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="w-full h-full object-cover"
                    title={movie.title}
                  ></iframe>
                </div>

                {/* ⭐Rating below genres */}
                <div className="bg-black/60 text-white text-xs p-2 rounded-b-xl space-y-1">
                  <div>{movie.genres?.join(", ")}</div>
                  <div className="font-semibold text-sm">
                    ⭐ {movie.predicted_rating?.toFixed(1) || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog Modal */}
      <Dialog
        open={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex space-x-6">
              <img
                src={selectedMovie?.poster_url}
                alt={selectedMovie?.title}
                className="rounded-lg w-40 h-auto object-cover"
              />
              <div className="flex flex-col justify-center space-y-3 flex-grow">
                <h2 className="text-3xl font-semibold mb-10">{selectedMovie?.title}</h2>
                <p className="text-sm text-gray-700 mb-2">
                  {selectedMovie?.genres?.join(", ")}
                </p>
                {/* Show rating in modal*/}
                <p className="text-sm text-gray-700 mb-20">
                  Predicted Rating: ⭐ {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}
                </p>
                <div className="flex space-x-2 mb-10">
                  <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="bg-black rounded-full p-0.5">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                      <span>Play</span>
                    </div>
                  </button>
                  <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 fill-black" />
                      <span>Like</span>
                    </div>
                  </button>
                  <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                    <div className="flex items-center space-x-2">
                      <Bookmark className="w-4 h-4 fill-black" />
                      <span>Save</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedMovie(null)}
              className="w-15 border border-gray-400 text-gray-800 py-2 rounded-xl hover:bg-gray-100"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
      {isLoading && (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold">Loading movies...</p>
          <div className="mt-2 animate-spin h-6 w-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    )}

    </div>
  );
}

export default StHomeContent;
