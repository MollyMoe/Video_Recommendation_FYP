import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { Play, Heart, Bookmark } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

function StHomeContent({ userId }) {
  const [movies, setMovies] = useState([]);
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  

const savedUser = JSON.parse(localStorage.getItem("user"));
const username = savedUser?.username;

const handlePlay = async () => {
  if (!selectedMovie || !savedUser) return;

  try {
    await axios.post(`${API}/api/history/add`, {
      userId: savedUser.userId,
      movieId: selectedMovie._id
    });

    console.log("Added to history:", selectedMovie.title);

    if (selectedMovie.trailer_key) {
      window.open(`https://www.youtube.com/watch?v=${selectedMovie.trailer_key}`, '_blank');
    }
  } catch (err) {
    console.error("Error adding to history:", err);
  }
};




  // Fetch user preferred genres
  useEffect(() => {
    const fetchUserAndMovies = async () => {
      if (!username) return;

      setIsLoading(true); // start loading at the very beginning

      try {
        // Step 1: Fetch user preferred genres //connect with backend
        const userRes = await axios.get(`${API}/api/auth/users/streamer/${savedUser.userId}`);
        const userGenres = userRes.data.genres || [];
        console.log("Genres fetched for user:", userGenres);
        setPreferredGenres(userGenres);

        // Step 2: Fetch moviess //connect with backend
        const movieRes = await axios.get(`${API}/api/movies/all`);

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
            try {
              const url = new URL(movie.trailer_url);
              movie.trailer_key = url.searchParams.get("v");
            } catch {
              movie.trailer_key = null;
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
    <div className=" min h-screen sm:ml-64 pt-30 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
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
                <h2 className="text-2xl font-semibold">{selectedMovie?.title}</h2>
                <p className="text-sm text-gray-700">
                  {selectedMovie?.genres?.join(", ")}
                </p>
                <p className="text-sm text-gray-700">
                  Predicted Rating: ⭐️{" "}
                  {selectedMovie?.predicted_rating?.toFixed(1) || "N/A"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between space-x-2 pt-4 border-t border-gray-200">
              <button  onClick={handlePlay}  className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200">
                <Play className="w-3 h-3 mr-1 fill-black" />
                Play
              </button>
              <button className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200">
                <Heart className="w-4 h-4 mr-1 fill-black" />
                Like
              </button>
              <button className="flex items-center justify-center w-20 bg-white text-black text-xs px-2 py-1 rounded-lg shadow-sm hover:bg-gray-200">
                <Bookmark className="w-4 h-4 mr-1 fill-black" />
                Save
              </button>s
            </div>

            {/* Close Button BELOW action buttons */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedMovie(null)}
                className="border border-gray-400 text-gray-800 py-1 px-6 rounded-xl hover:bg-gray-100 text-sm"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default StHomeContent;
