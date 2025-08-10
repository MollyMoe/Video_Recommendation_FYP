// src/utils/syncOfflineCache.js
import { API } from "@/config/api";

const processMovies = (list) => {
  if (!Array.isArray(list)) list = [];
  return list
    .filter(m => m?.poster_url && m?.trailer_url)
    .map(m => {
      const url = m.trailer_url || "";
      let trailer_key = null;
      if (url.includes("v=")) trailer_key = url.split("v=")[1].split("&")[0];
      else if (url.includes("youtu.be/")) trailer_key = url.split("youtu.be/")[1].split("?")[0];

      const norm = (v) =>
        Array.isArray(v) ? v.join(" ").toLowerCase()
        : typeof v === "string" ? v.replace(/[|,]/g, " ").toLowerCase()
        : "";

      return {
        ...m,
        trailer_key,
        genres: norm(m.genres),
        producers: norm(m.producers),
        actors: norm(m.actors),
        director: norm(m.director),
      };
    });
};

const top10From = (arr) =>
  arr.slice().sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0)).slice(0, 10);

/**
 * If `genres` is provided, call /movies/regenerate to get FRESH recs.
 * Otherwise, fall back to /movies/recommendations/:userId (cached collection).
 */
export const syncOfflineCache = async (user, { genres, force = false } = {}) => {
  if (!user?.userId || !navigator.onLine) return;

  const userId = user.userId;

  try {
    // Build a clean genres array (no blanks)
    const genresArr = (Array.isArray(genres) ? genres : String(genres || "").split(/[|,]/))
      .map(g => g.trim())
      .filter(Boolean);

    // Exclude current cached titles so regen returns fresh ones
    let excludeTitles = [];
    try {
      const cached = await Promise.resolve(window.electron?.getRecommendedMovies?.() ?? []);
      excludeTitles = Array.isArray(cached) ? cached.map(m => m?.title).filter(Boolean) : [];
    } catch { /* ignore */ }

    // ---- 1) Get fresh recommendations
    let recData = [];
    if (genresArr.length) {
      const body = { userId, genres: genresArr, excludeTitles };
      const regenRes = await fetch(`${API}/api/movies/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body),
      });
      if (!regenRes.ok) {
        const msg = await regenRes.text();
        throw new Error(`Regenerate failed ${regenRes.status}: ${msg}`);
      }
      const json = await regenRes.json();
      recData = Array.isArray(json) ? json : (json.data || []);
    } else {
      const recRes = await fetch(
        `${API}/api/movies/recommendations/${userId}${force ? `?ts=${Date.now()}` : ""}`
      );
      if (!recRes.ok) {
        const msg = await recRes.text();
        throw new Error(`Recommendations failed ${recRes.status}: ${msg}`);
      }
      const json = await recRes.json();
      recData = Array.isArray(json) ? json : (json.data || []);
    }

    const processed = processMovies(recData || []);
    const top10 = top10From(processed);

    await window.electron?.saveRecommendedMovies?.(processed);
    await window.electron?.saveTopRatedMovies?.(top10);

    // ---- 2) Subscription
    const subRes = await fetch(`${API}/api/subscription/${userId}`);
    const subscription = await subRes.json();
    await window.electron?.saveSubscription?.(subscription);

    // ---- 3) Genres from user profile (prefer the ones we just set if provided)
    const userRes = await fetch(`${API}/api/auth/users/streamer/${userId}`);
    const userData = await userRes.json();
    const genresToSave = genresArr.length ? genresArr : (userData?.genres || []);
    await window.electron?.saveUserGenres?.(genresToSave);

    // ---- 4) Carousel Data
    const [topLikedRes, likedTitlesRes, savedTitlesRes, watchedTitlesRes] = await Promise.all([
      fetch(`${API}/api/movies/top-liked`),
      fetch(`${API}/api/movies/likedMovies/${userId}`),
      fetch(`${API}/api/movies/watchLater/${userId}`),
      fetch(`${API}/api/movies/historyMovies/${userId}`),
    ]);

    await window.electron?.saveCarouselData?.("topLiked",      await topLikedRes.json());
    await window.electron?.saveCarouselData?.("likedTitles",   await likedTitlesRes.json());
    await window.electron?.saveCarouselData?.("savedTitles",   await savedTitlesRes.json());
    await window.electron?.saveCarouselData?.("watchedTitles", await watchedTitlesRes.json());

    console.log("✅ Offline cache synced successfully.");
  } catch (err) {
    console.error("❌ Failed to sync offline cache:", err);
  }
};
