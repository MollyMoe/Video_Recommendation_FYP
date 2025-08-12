import { API } from "@/config/api";

const toGenresArray = (g) =>
  Array.isArray(g)
    ? g
    : String(g ?? "")
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);

const toNumber = (n) => (Number.isFinite(+n) ? +n : 0);

const pick = (obj, ...keys) => {
  for (const k of keys) if (obj && obj[k] != null) return obj[k];
  return undefined;
};

const normalizeGenres = (src) => {
  const raw = pick(
    src,
    "genres",
    "genre",
    "preferredGenres",
    "preferred_genres",
    "preferredGenre"
  );
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
  return [];
};

export const normalizeStreamerProfile = (raw) => {
  const u = pick(raw, "user", "data", "streamer", "profile") || raw || {};
  const genresArr = normalizeGenres(u);
  return {
    userId: pick(u, "userId", "_id", "id") || "",
    username: pick(u, "username", "name") || "",
    email: pick(u, "email", "contact") || "",
    profileImage: pick(u, "profileImage", "avatar", "imageUrl") || "",
    genres: genresArr,              // array form
    genre: genresArr.join(", "),    // string form for inputs
  };
};

// ========== main (single definition) ==========
export const syncOfflineCache = async (user, { force = false } = {}) => {
  if (!navigator.onLine || !user?.userId) return;
  const userId = user.userId;

  // 1) recommendations (force regenerate or fetch existing)
  const fetchRecs = async () => {
    if (force) {
      const res = await fetch(`${API}/api/movies/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, excludeTitles: [] }),
      });
      if (!res.ok) throw new Error(`Regenerate failed ${res.status}`);
      return res.json();
    }
    const res = await fetch(`${API}/api/movies/recommendations/${userId}`);
    if (!res.ok) throw new Error(`Recommendations fetch failed ${res.status}`);
    return res.json();
  };

  try {
    const raw = await fetchRecs();

    const recs = (raw || [])
      .filter((m) => m.poster_url && m.trailer_url)
      .map((m) => {
        const u = m.trailer_url || "";
        const trailer_key =
          u.includes("v=")
            ? u.split("v=")[1].split("&")[0]
            : u.includes("youtu.be/")
            ? u.split("youtu.be/")[1].split("?")[0]
            : m.trailer_key || null;

        return {
          ...m,
          genres: toGenresArray(m.genres),           // keep ARRAY
          predicted_rating: toNumber(m.predicted_rating),
          trailer_key,
        };
      });

    const top10 = [...recs]
      .sort((a, b) => (b.predicted_rating || 0) - (a.predicted_rating || 0))
      .slice(0, 10);

    // 2) cache movies (replace, no merge)
    await window.electron?.replaceRecommendedMovies?.(recs);
    await window.electron?.replaceTopRatedMovies?.(top10);

    // 3) subscription (cache for offline, best effort)
    try {
      const subRes = await fetch(`${API}/api/subscription/${userId}`);
      if (subRes.ok) {
        const sub = await subRes.json();
        await window.electron?.saveSubscription?.(sub);
      }
    } catch (e) {
      console.warn("Subscription fetch failed:", e);
    }

    // 4) profile (fetch once, normalize, persist)
    const profileRes = await fetch(`${API}/api/auth/users/streamer/${userId}`);
    if (!profileRes.ok) throw new Error(`Profile fetch failed ${profileRes.status}`);
    const profileRaw = await profileRes.json();

    const normalizedProfile = normalizeStreamerProfile(profileRaw);

    await window.electron?.saveProfileUpdate?.(normalizedProfile);
    try {
      localStorage.setItem("profile", JSON.stringify(normalizedProfile));
    } catch {
      /* ignore quota errors */
    }

    // 5) persist genres for offline use
    const genresToSave = Array.isArray(normalizedProfile.genres)
      ? normalizedProfile.genres.map((g) => String(g).trim()).filter(Boolean)
      : [];
    await window.electron?.saveUserGenres?.(genresToSave);

    // also merge onto stored `user` if it lacks genres
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        const u = JSON.parse(userJson);
        if (!Array.isArray(u.genres) || u.genres.length === 0) {
          u.genres = genresToSave;
          localStorage.setItem("user", JSON.stringify(u));
        }
      }
    } catch {
      /* ignore */
    }

    // 6) notify UI
    window.dispatchEvent(new CustomEvent("cineit:filterDataUpdated"));
  } catch (e) {
    console.error("❌ syncOfflineCache failed:", e);
  }
};
