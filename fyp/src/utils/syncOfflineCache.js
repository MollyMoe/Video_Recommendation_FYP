import { API } from "@/config/api";

const toGenresArray = (g) =>
  Array.isArray(g)
    ? g
    : String(g ?? "")
        .split(/[|,]/)
        .map(s => s.trim())
        .filter(Boolean);

const toNumber = (n) => (Number.isFinite(+n) ? +n : 0);

export const syncOfflineCache = async (user, { force = false } = {}) => {
  if (!navigator.onLine || !user?.userId) return;
  const userId = user.userId;

  const fetchRecs = async () => {
    if (force) {
      const res = await fetch(`${API}/api/movies/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, excludeTitles: [] }),
      });
      return res.json();
    }
    const res = await fetch(`${API}/api/movies/recommendations/${userId}`);
    return res.json();
  };

  try {
    const raw = await fetchRecs();
    const recs = (raw || [])
      .filter(m => m.poster_url && m.trailer_url)
      .map(m => {
        const u = m.trailer_url || "";
        const trailer_key =
          u.includes("v=") ? u.split("v=")[1].split("&")[0]
          : u.includes("youtu.be/") ? u.split("youtu.be/")[1].split("?")[0]
          : m.trailer_key || null;

        return {
          ...m,
          genres: toGenresArray(m.genres),              // ← keep ARRAY
          predicted_rating: toNumber(m.predicted_rating),
          trailer_key,
        };
      });

    const top10 = [...recs].sort((a,b)=>(b.predicted_rating||0)-(a.predicted_rating||0)).slice(0,10);

    // replace files (no merge)
    await window.electron?.replaceRecommendedMovies?.(recs);
    await window.electron?.replaceTopRatedMovies?.(top10);

    // subscription + user genres (array)
    const sub = await (await fetch(`${API}/api/subscription/${userId}`)).json();
    window.electron?.saveSubscription?.(sub);

    const userData = await (await fetch(`${API}/api/auth/users/streamer/${userId}`)).json();
    const genres = toGenresArray(userData.genres ?? userData.genre);
    await window.electron?.saveUserGenres?.(genres);

    window.dispatchEvent(new CustomEvent("cineit:filterDataUpdated"));
  } catch (e) {
    console.error("❌ syncOfflineCache failed:", e);
  }
};
