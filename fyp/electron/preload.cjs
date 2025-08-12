const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// File paths
const basePath = path.join(os.homedir(), "cineit-cache");

const sessionFilePath = path.join(basePath, 'cineit-user-session.json');
const profileFilePath = path.join(basePath, 'cineit-profile-update.json');
const feedbackFilePath = path.join(basePath, 'cineit-feedback-queue.json');
const userGenrePath = path.join(basePath, 'cineit-user-genres.json');
const historyQueuePath = path.join(basePath, "cineit-history-queue.json");
const savedQueuePath = path.join(basePath, "cineit-saved-queue.json");
const likedQueuePath = path.join(basePath, "cineit-liked-queue.json");

const recommendedPath = path.join(basePath, 'recommended.json');
const subscriptionPath = path.join(basePath, "subscription.json");
const themePath = path.join(basePath, "theme.json");
const topRatedPath = path.join(basePath, "topRatedMovies.json");
const savedSnapshotPath = path.join(basePath, "cineit-saved.json");

const likedListPath = path.join(basePath, "cineit-liked.json");
const recommendedQueuePath = path.join(basePath, "cineit-recommended-queue.json");

const historySnapshotPath = path.join(basePath, "cineit-history-snapshot.json");


const paths = {
  topLiked: path.join(basePath, "topLiked.json"),
  alsLiked: path.join(basePath, "alsLiked.json"),
  likedTitles: path.join(basePath, "likedTitles.json"),
  alsSaved: path.join(basePath, "alsSaved.json"),
  savedTitles: path.join(basePath, "savedTitles.json"),
  alsWatched: path.join(basePath, "alsWatched.json"),
  watchedTitles: path.join(basePath, "watchedTitles.json"),
  interactionCounts: path.join(basePath, "interactionCounts.json"),
};

// for als recommendations and top liked
function safeRead(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWrite(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Failed to write:", filePath, err);
  }
}

function queueAction(filePath, action) {
  try {
    // Make sure folder exists before any read/write
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    let list = [];
    if (fs.existsSync(filePath)) {
      list = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    list.push(action);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
    console.log(`📦 Queued offline action for ${action.type} -> ${filePath}`);
  } catch (err) {
    console.error("❌ Failed to queue action:", err);
  }
}

function readJSON(p, fallback) {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : fallback; }
  catch { return fallback; }
}
function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
}

// Keep only actions after the last clearAll (the last clear wins)
function compactAfterClearAll(q) {
  const idxFromEnd = [...q].reverse().findIndex(a => a?.type === "clearAll");
  if (idxFromEnd < 0) return q;
  const cut = q.length - 1 - idxFromEnd;
  return q.slice(cut); // includes that clearAll and everything after it
}

// Keep at most one "delete" per movieId; last one wins
function dedupeDeleteActions(q) {
  const seen = new Set();
  const out = [];
  for (let i = q.length - 1; i >= 0; i--) {
    const a = q[i];
    if (a?.type === "delete") {
      const key = `d:${String(a.movieId)}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(a);
  }
  return out.reverse();
}

function dedupeMovies(arr){
  const seen = new Set();
  return (arr||[]).filter(m=>{
    const id = String(m?.movieId ?? m?._id ?? m?.title ?? "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

contextBridge.exposeInMainWorld('electron', {
   // start from session replaced
  // ✅ Session
  saveSession: (data) => {
    try {
      fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log("✅ Session saved offline.");
    } catch (err) {
      console.error("❌ Failed to save session offline:", err);
    }
  },
  
  // ✅ Handle online/offline status
  onOnline: () => {
    window.dispatchEvent(new Event('online'));
  },
  onOffline: () => {
    window.dispatchEvent(new Event('offline'));
  },
  // until here
  
  getSession: () => {
    try {
      return JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    } catch {
      return null;
    }
  },

  // ✅ Profile
  saveProfileUpdate: (data) => {
    try {
      fs.writeFileSync(profileFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log("✅ Profile update saved offline.");
    } catch (err) {
      console.error("❌ Failed to save profile update:", err);
    }
  },
  getProfileUpdate: () => {
    try {
      if (fs.existsSync(profileFilePath)) {
        return JSON.parse(fs.readFileSync(profileFilePath, 'utf-8'));
      }
      return null;
    } catch {
      return null;
    }
  },
  clearProfileUpdate: () => {
    try {
      if (fs.existsSync(profileFilePath)) {
        fs.unlinkSync(profileFilePath);
        console.log("🧹 Cleared offline profile update.");
      }
    } catch (err) {
      console.error("❌ Failed to clear profile update:", err);
    }
  },

  // ✅ Feedback
  queueFeedback: (feedback) => {
    try {
      let list = [];
      if (fs.existsSync(feedbackFilePath)) {
        list = JSON.parse(fs.readFileSync(feedbackFilePath, 'utf-8'));
      }
      list.push(feedback);
      fs.writeFileSync(feedbackFilePath, JSON.stringify(list, null, 2), 'utf-8');
      console.log("📝 Feedback queued offline.");
    } catch (err) {
      console.error("❌ Failed to queue feedback:", err);
    }
  },
  getFeedbackQueue: () => {
    try {
      if (fs.existsSync(feedbackFilePath)) {
        return JSON.parse(fs.readFileSync(feedbackFilePath, 'utf-8'));
      }
      return [];
    } catch {
      return [];
    }
  },
  clearFeedbackQueue: () => {
    try {
      if (fs.existsSync(feedbackFilePath)) {
        fs.unlinkSync(feedbackFilePath);
        console.log("🧹 Cleared feedback queue.");
      }
    } catch (err) {
      console.error("❌ Failed to clear feedback queue:", err);
    }
  },

  // ✅ Movie genres
  saveUserGenres: (genres) => {
    try {
      fs.writeFileSync(userGenrePath, JSON.stringify(genres, null, 2), 'utf-8');
      console.log("💾 Saved user genres.");
    } catch (err) {
      console.error("❌ Failed to save user genres:", err);
    }
  },
  getUserGenres: () => {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(userGenrePath)) return resolve([]);
        const raw = fs.readFileSync(userGenrePath, 'utf-8');
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
  },

  //Theme 
  saveTheme: (data) => safeWrite(themePath, data),
  getTheme: () => safeRead(themePath, { darkMode: false }),

  //subscription
  saveSubscription: (data) => safeWrite(subscriptionPath, data),
  getSubscription: () => safeRead(subscriptionPath),

  //liked Data for filter page
  saveTopRatedMovies: (data) => {
  const normalized = (Array.isArray(data) ? data : []).map(m => ({
    ...m,
    genres: Array.isArray(m.genres)
      ? m.genres
      : String(m.genres || "")
          .split(/[|,]/).map(s => s.trim()).filter(Boolean)
  }));
  safeWrite(topRatedPath, normalized);
},

  getTopRatedMovies: () => safeRead(topRatedPath),

  // ✅ Carousel offline cache (topLiked, likedMovies, etc.)
  saveCarouselData: async (type, data) => {
    if (paths[type]) {
      safeWrite(paths[type], data);
    }
  },
  getCarouselData: (type) => {
    if (paths[type]) return safeRead(paths[type]);
    return [];
  },

  replaceRecommendedMovies: (movies) => {
    try {
      fs.mkdirSync(path.dirname(recommendedPath), { recursive: true });
      fs.writeFileSync(recommendedPath, JSON.stringify(dedupeMovies(movies), null, 2), "utf-8");
      console.log("💾 replaced recommended.json");
    } catch(e){ console.error(e); }
  },
  replaceTopRatedMovies: (movies) => {
  try {
    fs.mkdirSync(path.dirname(topRatedPath), { recursive: true });
    const normalized = (Array.isArray(movies) ? movies : []).map(m => ({
      ...m,
      genres: Array.isArray(m.genres)
        ? m.genres
        : String(m.genres || "")
            .split(/[|,]/).map(s => s.trim()).filter(Boolean)
    }));
    fs.writeFileSync(
      topRatedPath,
      JSON.stringify(dedupeMovies(normalized), null, 2),
      "utf-8"
    );
    console.log("💾 replaced topRatedMovies.json");
  } catch (e) { console.error(e); }
},

  // ✅ Recommended Movies
  saveRecommendedMovies: async (movies) => {
  try {
    // clearRecommendedPosterCache(); // 🧼 clear before re-saving posters

    let existing = [];
    if (fs.existsSync(recommendedPath)) {
      const raw = fs.readFileSync(recommendedPath, 'utf-8');
      existing = JSON.parse(raw);
    }

    const combined = [...movies, ...existing];
    const seen = new Set();
    const unique = combined.filter((movie) => {
      const id = movie.movieId || movie._id || movie.title;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const trimmed = unique.slice(0, 300);

    // ✅ Only recommended posters are cached
    // await cacheRecommendedPosters(trimmed);

    fs.writeFileSync(recommendedPath, JSON.stringify(trimmed, null, 2), "utf-8");
    console.log(`💾 Saved recommended movies. Total: ${trimmed.length}`);
  } catch (err) {
    console.error("❌ Failed to save recommended movies:", err);
  }
},

  getRecommendedMovies: () => {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(recommendedPath)) return resolve([]);
        const raw = fs.readFileSync(recommendedPath, "utf-8");
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
  },

  // ✅ Offline actions for history, saved, liked
  // queueHistory: (action) => queueAction(historyQueuePath, action),
  queueSaved: (action) => queueAction(savedQueuePath, action),
  queueLiked: (action) => queueAction(likedQueuePath, action),

  // ✅ Offline remove actions for history, saved, liked
  removeFromLikedQueue: (movieId) => {
    try {
      fs.mkdirSync(path.dirname(likedQueuePath), { recursive: true });
      const data = fs.existsSync(likedQueuePath)
        ? fs.readFileSync(likedQueuePath, "utf-8")
        : "[]";
      const parsed = JSON.parse(data);
  
      const filtered = parsed.filter((entry) => {
        const m = entry?.movie || entry;
        const id = m?.movieId || m?._id;
        return id?.toString() !== movieId.toString();
      });
  
      fs.writeFileSync(likedQueuePath, JSON.stringify(filtered, null, 2), "utf-8");
      console.log(`🗑️ Updated liked cache after removing: ${movieId}`);
    } catch (err) {
      console.error("❌ Failed to update liked cache:", err);
    }
  },
  
  removeFromHistoryQueue: (movieId) => {
    const q = readJSON(historyQueuePath, []);
    q.push({ type: "delete", movieId });
    const compacted = compactAfterClearAll(q);
    writeJSON(historyQueuePath, dedupeDeleteActions(compacted));
  },
  
  queueHistoryAction: (action) => {
    const q = readJSON(historyQueuePath, []);
    q.push(action); // e.g., { type:"movie", movie } or { type:"delete", movieId }
    const compacted = compactAfterClearAll(q);
    writeJSON(historyQueuePath, dedupeDeleteActions(compacted));
  },
  

  enqueueHistoryClearAll: () => {
    const q = readJSON(historyQueuePath, []);
    q.push({ type: "clearAll" });
    writeJSON(historyQueuePath, compactAfterClearAll(q));
  },
  replaceHistoryQueue: (next) => writeJSON(historyQueuePath, Array.isArray(next) ? next : []),
    queueSavedAction: (action) => queueAction(savedQueuePath, action),


  // --- Recommended offline queue + helpers ---
queueRecommendedAction: (action) => queueAction(recommendedQueuePath, action),

getRawRecommendedQueue: () => {
  try {
    if (fs.existsSync(recommendedQueuePath)) {
      return JSON.parse(fs.readFileSync(recommendedQueuePath, "utf-8"));
    }
    return [];
  } catch {
    return [];
  }
},

clearRecommendedQueue: () => {
  try {
    if (fs.existsSync(recommendedQueuePath)) {
      fs.unlinkSync(recommendedQueuePath);
      console.log("🧹 Cleared recommended queue.");
    }
  } catch (err) {
    console.error("❌ Failed to clear recommended queue:", err);
  }
},

removeFromRecommended: (movieId) => {
  try {
    if (!fs.existsSync(recommendedPath)) return;
    const raw = fs.readFileSync(recommendedPath, "utf-8");
    const arr = JSON.parse(raw);
    const out = arr.filter((m) => {
      const id = String(m?.movieId ?? m?._id ?? m?.title ?? "");
      return id !== String(movieId);
    });
    fs.writeFileSync(recommendedPath, JSON.stringify(out, null, 2), "utf-8");
    console.log(`🗑️ Removed ${movieId} from recommended.json`);
  } catch (err) {
    console.error("❌ Failed to remove from recommended:", err);
  }
},



// --- History snapshot (used by History page when offline) ---
saveHistorySnapshot: (movies) => writeJSON(historySnapshotPath, Array.isArray(movies) ? movies : []),

getHistorySnapshot: () => {
  const arr = readJSON(historySnapshotPath, []);
  // de-dup by ID while preserving order
  const seen = new Set(); const out = [];
  for (const m of arr) {
    const id = String(m?.movieId ?? m?._id ?? m?.tmdb_id ?? m?.title ?? "");
    if (id && !seen.has(id)) { seen.add(id); out.push(m); }
  }
  return out;
},

clearHistorySnapshot: () => {
  try {
    if (fs.existsSync(historySnapshotPath)) {
      fs.unlinkSync(historySnapshotPath);
      console.log("🧹 Cleared History snapshot.");
    }
  } catch (err) {
    console.error("❌ Failed to clear History snapshot:", err);
  }
},

// Put newest at top; also de-dup by id
prependHistorySnapshot: (movie) => {
  try {
    const list = readJSON(historySnapshotPath, []);
    const mid = String(movie?.movieId ?? movie?._id ?? "");
    const filtered = list.filter((m) => String(m?.movieId ?? m?._id ?? "") !== mid);
    filtered.unshift(movie);
    writeJSON(historySnapshotPath, filtered);
  } catch (err) {
    console.error("❌ Failed to append to History snapshot:", err);
  }
},


removeMovieFromHistoryCache: (movieId) => {
  try {
    const toStr = (v) => (v == null ? "" : String(v));
    const target = toStr(movieId);

    const snap = readJSON(historySnapshotPath, []);
    const filtered = snap.filter((m) => {
      const mid = toStr(m?.movieId);
      const oid = toStr(m?._id);
      const tmd = toStr(m?.tmdb_id);
      // drop if ANY match
      return !(mid === target || oid === target || tmd === target);
    });

    writeJSON(historySnapshotPath, filtered);
    console.log(`🗑️ Updated history snapshot after removing: ${movieId}`);
  } catch (err) {
    console.error("❌ Failed to update History snapshot:", err);
  }
},

syncQueuedHistory: async (apiBase, userId) => {
  if (!apiBase || !userId) return { ok: false, reason: "Missing apiBase or userId" };
  try {
    let queue = readJSON(historyQueuePath, []);

    // 1) If there is a clearAll, send the LAST one first
    const idxFromEnd = [...queue].reverse().findIndex(a => a?.type === "clearAll");
    if (idxFromEnd >= 0) {
      const clearIdx = queue.length - 1 - idxFromEnd;
      const res = await fetch(`${apiBase}/api/movies/historyMovies/removeAllHistory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(`clearAll failed: ${res.status}`);
      // drop everything up to and including the clearAll
      queue = queue.slice(clearIdx + 1);
      writeJSON(historyQueuePath, queue);
    }

    // 2) Replay remaining actions best-effort
    for (const action of queue) {
      try {
        if (action?.type === "delete" && action.movieId) {
          const r = await fetch(`${apiBase}/api/movies/historyMovies/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, movieId: action.movieId }),
          });
          if (!r.ok) console.warn("⚠️ delete sync failed:", r.status);
        } else if (action?.type === "movie" && action.movie) {
          const r = await fetch(`${apiBase}/api/movies/history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, movie: action.movie }),
          });
          if (!r.ok) console.warn("⚠️ movie sync failed:", r.status);
        }
      } catch (err) {
        console.warn("⚠️ Failed to sync a history action; continuing:", err);
      }
    }

    // 3) Clear queue after replay
    writeJSON(historyQueuePath, []);
    console.log("✅ History queue synced and cleared.");
    return { ok: true };
  } catch (err) {
    console.error("❌ syncQueuedHistory failed:", err);
    return { ok: false, reason: String(err?.message || err) };
  }
},



  removeFromSavedQueue: async (movieId) => {
    // 1) queue delete action (IDs only)
    queueAction(savedQueuePath, { type: "delete", movieId });
  
    // 2) prune the UI snapshot so page updates immediately
    try {
      const snap = fs.existsSync(savedSnapshotPath)
        ? JSON.parse(fs.readFileSync(savedSnapshotPath, "utf-8"))
        : [];
  
      const updated = snap.filter(
        (m) => String(m?.movieId ?? m?._id) !== String(movieId)
      );
  
      fs.writeFileSync(savedSnapshotPath, JSON.stringify(updated, null, 2), "utf-8");
      console.log(`🗑️ Updated Watch Later snapshot after removing: ${movieId}`);
    } catch (err) {
      console.error("❌ Failed to update Watch Later snapshot:", err);
    }
  },
  
  saveHistoryQueue: (queue) => {
    try {
      if (!Array.isArray(queue)) throw new Error("Queue is not array");
      const json = JSON.stringify(queue, null, 2);
      fs.writeFileSync(historyQueuePath, json);
      console.log("✅ Saved history queue to:", historyQueuePath);
    } catch (err) {
      console.error("❌ Failed to save history queue:", err);
    }
  },

  getHistoryQueue: () => {
    try {
      if (fs.existsSync(historyQueuePath)) {
        const raw = fs.readFileSync(historyQueuePath, "utf-8");
        const parsed = JSON.parse(raw);

        // ✅ Filter only movies with at least a title or poster_url
        const filtered = parsed.filter((entry) => {
          const movie = entry.movie || entry;
          return movie?.title || movie?.poster_url;
        });

        return filtered;
      }
      return [];
    } catch {
      return [];
    }
  },

  getRawHistoryQueue: () => {
    try {
      if (fs.existsSync(historyQueuePath)) {
        return JSON.parse(fs.readFileSync(historyQueuePath, "utf-8"));
      }
      return [];
    } catch {
      return [];
    }
  },

  clearHistoryQueue: () => {
    try {
      if (fs.existsSync(historyQueuePath)) {
        fs.unlinkSync(historyQueuePath);
        console.log("🧹 Cleared history queue.");
      }
    } catch (err) {
      console.error("❌ Failed to clear history queue:", err);
    }
  },

  //clear all history
  clearHistoryQueueByUser: (userId) => {
    try {
      if (!fs.existsSync(historyQueuePath)) return;
      const entries = JSON.parse(fs.readFileSync(historyQueuePath, "utf-8"));
      const filtered = entries.filter(
        (entry) => entry.movie?.userId !== userId && entry.userId !== userId
      );
      fs.writeFileSync(
        historyQueuePath,
        JSON.stringify(filtered, null, 2),
        "utf-8"
      );
      console.log("🧹 Cleared history queue for user:", userId);
    } catch (err) {
      console.error("❌ Failed to clear user history queue:", err);
    }
  },

  //Liked Movies Page
  saveLikedQueue: (likedMovies) => {
    try {
      const items = Array.isArray(likedMovies) ? likedMovies : [];
      // normalize to action entries so the file has one consistent format
      const normalized = items.map((x) => {
        const m = x?.movie || x; // tolerate either shape
        return { type: "add", movie: m };
      });
      fs.writeFileSync(likedQueuePath, JSON.stringify(normalized, null, 2), "utf-8");
      console.log("💾 Saved liked queue (normalized).");
    } catch (err) {
      console.error("❌ Failed to save liked queue:", err);
    }
  },
  

  getLikedQueue: () => {
    try {
      if (!fs.existsSync(likedQueuePath)) return [];
  
      const raw = JSON.parse(fs.readFileSync(likedQueuePath, "utf-8"));
      const seen = new Set();
      const movies = [];
  
      for (const entry of raw) {
        const m = entry?.movie || entry; // tolerate {movie} or raw movie
        const id = m?.movieId || m?._id;
        if (m && id && !seen.has(id)) {
          seen.add(id);
          movies.push(m);
        }
      }
  
      return movies;
    } catch (err) {
      console.error("❌ Failed to read liked queue:", err);
      return [];
    }
  },
  

  getRawLikedQueue: () => {
    try {
      if (fs.existsSync(likedQueuePath)) {
        return JSON.parse(fs.readFileSync(likedQueuePath, "utf-8"));
      }
      return [];
    } catch {
      return [];
    }
  },
  clearLikedQueue: () => {
    try {
      if (fs.existsSync(likedQueuePath)) {
        fs.unlinkSync(likedQueuePath);
        console.log("🧹 Cleared liked queue.");
      }
    } catch (err) {
      console.error("❌ Failed to clear liked queue:", err);
    }
  },

  //Watch Later Page
  saveSavedQueue: (movies) => {
    try {
      if (!Array.isArray(movies)) throw new Error("Invalid data");
      fs.writeFileSync(
        savedQueuePath,
        JSON.stringify(movies, null, 2),
        "utf-8"
      );
      console.log("💾 Saved watch later queue.");
    } catch (err) {
      console.error("❌ Failed to save saved queue:", err);
    }
  },

  getSavedQueue: () => {
    try {
      if (!fs.existsSync(savedQueuePath)) return [];

      const raw = JSON.parse(fs.readFileSync(savedQueuePath, "utf-8"));
      const seen = new Set();
      const movies = [];

      for (const movie of raw) {
        const id = movie?.movieId || movie?._id;
        if (movie && id && !seen.has(id)) {
          seen.add(id);
          movies.push(movie);
        }
      }

      return movies;
    } catch (err) {
      console.error("❌ Failed to read saved queue:", err);
      return [];
    }
  },

  getRawSavedQueue: () => {
    try {
      if (fs.existsSync(savedQueuePath)) {
        return JSON.parse(fs.readFileSync(savedQueuePath, "utf-8"));
      }
      return [];
    } catch {
      return [];
    }
  },

  clearSavedQueue: () => {
    try {
      if (fs.existsSync(savedQueuePath)) {
        fs.unlinkSync(savedQueuePath);
        console.log("🧹 Cleared saved queue.");
      }
    } catch (err) {
      console.error("❌ Failed to clear saved queue:", err);
    }
  },

  // Snapshot for Watch Later (full movie objects for UI)
saveSavedSnapshot: (movies) => {
  try {
    const arr = Array.isArray(movies) ? movies : [];
    fs.writeFileSync(savedSnapshotPath, JSON.stringify(arr, null, 2), "utf-8");
    console.log("💾 Saved Watch Later snapshot (objects).");
  } catch (err) {
    console.error("❌ Failed to save Watch Later snapshot:", err);
  }
},

getSavedSnapshot: () => {
  try {
    if (!fs.existsSync(savedSnapshotPath)) return [];
    const raw = JSON.parse(fs.readFileSync(savedSnapshotPath, "utf-8"));
    const seen = new Set();
    const out = [];
    for (const m of raw) {
      const id = (m?.movieId ?? m?._id ?? m?.tmdb_id ?? m?.title)?.toString();
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(m);
      }
    }
    return out;
  } catch (err) {
    console.error("❌ Failed to read Watch Later snapshot:", err);
    return [];
  }
},

clearSavedSnapshot: () => {
  try {
    if (fs.existsSync(savedSnapshotPath)) {
      fs.unlinkSync(savedSnapshotPath);
      console.log("🧹 Cleared Watch Later snapshot.");
    }
  } catch (err) {
    console.error("❌ Failed to clear Watch Later snapshot:", err);
  }
},



  // --- Liked snapshot (cineit-liked.json) ---
// A clean, UI-facing snapshot separate from the action queue.
// Used by StLikedMoviesPage and HomeContent for instant display.

saveLikedList: (movies) => {
  try {
    fs.mkdirSync(path.dirname(likedListPath), { recursive: true });
    fs.writeFileSync(likedListPath, JSON.stringify(movies ?? [], null, 2), "utf-8");
    console.log("💾 Saved liked snapshot (cineit-liked.json).");
  } catch (err) {
    console.error("❌ Failed to save liked snapshot:", err);
  }
},

getLikedList: () => {
  try {
    if (!fs.existsSync(likedListPath)) return [];
    return JSON.parse(fs.readFileSync(likedListPath, "utf-8"));
  } catch (err) {
    console.error("❌ Failed to read liked snapshot:", err);
    return [];
  }
},

addMovieToLikedList: (movie) => {
  try {
    const list = fs.existsSync(likedListPath)
      ? JSON.parse(fs.readFileSync(likedListPath, "utf-8"))
      : [];
    const idOf = (m) => (m?._id ?? m?.movieId ?? "").toString();
    const id = idOf(movie);
    if (!id) return;

    const seen = new Set(list.map(idOf));
    if (!seen.has(id)) {
      list.unshift(movie);
      fs.writeFileSync(likedListPath, JSON.stringify(list, null, 2), "utf-8");
      console.log("➕ Added movie to liked snapshot:", id);
    }
  } catch (err) {
    console.error("❌ Failed to append to liked snapshot:", err);
  }
},

});
