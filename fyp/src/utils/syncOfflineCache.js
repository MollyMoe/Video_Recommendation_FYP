import { API } from "@/config/api";

export const syncOfflineCache = async (user, { force = false } = {}) => {
  if (!navigator.onLine || !user?.userId) return;

  try {
    const userId = user.userId;

    // --- (A) get recommendations (force regen if asked) ---
    const fetchRecs = async () => {
      if (force) {
        const res = await fetch(`${API}/api/movies/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, excludeTitles: [] }),
        });
        return await res.json();
      }
      const res = await fetch(`${API}/api/movies/recommendations/${userId}`);
      return await res.json();
    };

    // normalize helpers
    const normalizeString = (value) => {
      if (Array.isArray(value)) return value.join(" ").toLowerCase();
      if (typeof value === "string") return value.replace(/[|,]/g, " ").toLowerCase();
      return "";
    };
    const normalizeMovie = (movie) => {
      const m = { ...movie };
      m.trailer_key = m.trailer_url?.includes("v=")
        ? m.trailer_url.split("v=")[1].split("&")[0]
        : m.trailer_url?.includes("youtu.be/")
          ? m.trailer_url.split("youtu.be/")[1].split("?")[0]
          : null;
      m.genres = normalizeString(m.genres);
      m.producers = normalizeString(m.producers);
      m.actors = normalizeString(m.actors);
      m.director = normalizeString(m.director);
      const n = parseFloat(m.predicted_rating);
      m.predicted_rating = Number.isFinite(n) ? n : 0;
      return m;
    };

    // 1) Recommended + Top 10
    const recommendedRaw = await fetchRecs();
    const processed = (recommendedRaw || [])
      .filter((m) => m.poster_url && m.trailer_url)
      .map(normalizeMovie);

    const top10 = [...processed]
      .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
      .slice(0, 10);

    await window.electron.saveRecommendedMovies(processed);
    await window.electron.saveTopRatedMovies(top10);

    // 2) Subscription
    const subRes = await fetch(`${API}/api/subscription/${userId}`);
    const subscription = await subRes.json();
    window.electron.saveSubscription(subscription);

    // 3) Genres (save array form for offline)
    const userRes = await fetch(`${API}/api/auth/users/streamer/${userId}`);
    const userData = await userRes.json();
    const genres =
      Array.isArray(userData.genres)
        ? userData.genres
        : String(userData.genre || "")
            .split(/[,|]/)
            .map((g) => g.trim())
            .filter(Boolean);
    window.electron.saveUserGenres(genres);

    // 4) Carousel Data
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

    // 🔔 >>> THIS is the “notify Filter to reload” line — put it at the END:
    window.dispatchEvent(new CustomEvent("cineit:filterDataUpdated"));

    console.log("✅ Offline cache synced successfully.");
  } catch (err) {
    console.error("❌ Failed to sync offline cache:", err);
  }
};