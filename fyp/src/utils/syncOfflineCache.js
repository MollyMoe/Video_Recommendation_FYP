// src/utils/syncOfflineCache.js
import { getAPI } from "@/config/api";

const API = getAPI();

export const syncOfflineCache = async (user) => {
  if (!navigator.onLine || !user?.userId) return;

  try {
    const userId = user.userId;

    // 1. Recommended and Top-Rated for filter
    const recommendedRes = await fetch(`${API}/api/movies/recommendations/${userId}`);
    const recommendedData = await recommendedRes.json();
    
     // ✅ Normalize helper
  const normalizeString = (value) => {
    if (Array.isArray(value)) return value.join(" ").toLowerCase();
    if (typeof value === "string") return value.replace(/[|,]/g, " ").toLowerCase();
    return "";
  };

    // Process recommended
const processed = recommendedData
  .filter(m => m.poster_url && m.trailer_url)
  .map(movie => ({
    ...movie,
    trailer_key: movie.trailer_url?.includes("v=")
      ? movie.trailer_url.split("v=")[1].split("&")[0]
      : movie.trailer_url?.includes("youtu.be/")
        ? movie.trailer_url.split("youtu.be/")[1].split("?")[0]
        : null,
    genres: normalizeString(movie.genres),
    producers: normalizeString(movie.producers),
    actors: normalizeString(movie.actors),
    director: normalizeString(movie.director),
  }));

const top10 = processed
  .slice()
  .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
  .slice(0, 10);

await window.electron.saveRecommendedMovies(processed);
await window.electron.saveTopRatedMovies(top10);

    // 2. Subscription
    const subRes = await fetch(`${API}/api/subscription/${userId}`);
    const subscription = await subRes.json();
    window.electron.saveSubscription(subscription);

    // 3. Genres from user profile
    const userRes = await fetch(`${API}/api/auth/users/streamer/${userId}`);
    const userData = await userRes.json();
    const genres = userData.genres || [];
    window.electron.saveUserGenres(genres);

    // 4. Carousel Data
    const [topLikedRes, likedTitlesRes, savedTitlesRes, watchedTitlesRes] = await Promise.all([
      fetch(`${API}/api/movies/top-liked`),
      fetch(`${API}/api/movies/likedMovies/${userId}`),
      fetch(`${API}/api/movies/watchLater/${userId}`),
      fetch(`${API}/api/movies/historyMovies/${userId}`),
    ]);

    window.electron.saveCarouselData("topLiked", await topLikedRes.json());
    window.electron.saveCarouselData("likedTitles", await likedTitlesRes.json());
    window.electron.saveCarouselData("savedTitles", await savedTitlesRes.json());
    window.electron.saveCarouselData("watchedTitles", await watchedTitlesRes.json());


    console.log("✅ Offline cache synced successfully.");
  } catch (err) {
    console.error("❌ Failed to sync offline cache:", err);
  }
};