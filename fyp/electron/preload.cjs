const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// File paths
const basePath = path.join(os.homedir(), "cineit-cache");
// Ensure base cache directory always exists (fixes first-run offline writes)
try { fs.mkdirSync(basePath, { recursive: true }); } catch {}


const sessionFilePath = path.join(basePath, "cineit-user-session.json");
const profileFilePath = path.join(basePath, "cineit-profile-update.json");
const feedbackFilePath = path.join(basePath, "cineit-feedback-queue.json");
const userGenrePath = path.join(basePath, "cineit-user-genres.json");
const allMoviesPath = path.join(os.homedir(), "cineit-all-movies.json");

const backupScript = path.join(__dirname, "..", "scripts", "backup.sh");
const restoreScript = path.join(__dirname, "..", "scripts", "restore.sh");
const historyQueuePath = path.join(basePath, "cineit-history-queue.json");
const savedQueuePath = path.join(basePath, "cineit-saved-queue.json");
const likedQueuePath = path.join(basePath, "cineit-liked-queue.json");

const recommendedPath = path.join(basePath, "recommended.json");
const subscriptionPath = path.join(basePath, "subscription.json");
const themePath = path.join(basePath, "theme.json");


const likedListPath = path.join(basePath, "cineit-liked.json");

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

// // ✅ Helper to queue actions //old
// function queueAction(filePath, action) {
//   try {
//     let list = [];
//     if (fs.existsSync(filePath)) {
//       list = JSON.parse(fs.readFileSync(filePath, "utf-8"));
//     }
//     list.push(action);
//     fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
//     console.log(`📦 Queued offline action for ${action.type}`);
//   } catch (err) {
//     console.error("❌ Failed to queue action:", err);
//   }
// }

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


// Download image and save to given path
// async function downloadImage(url, filePath) {
//   const res = await fetch(url);
//   const buffer = await res.arrayBuffer();
//   fs.writeFileSync(filePath, Buffer.from(buffer));
// }

// async function cacheRecommendedPosters(movies) {
//   const folderPath = path.join(basePath, "posters", "recommended");
//   fs.mkdirSync(folderPath, { recursive: true });

//   for (const movie of movies) {
//     if (movie.poster_url && movie.poster_url.startsWith("http")) {
//       const id = movie.movieId || movie._id || movie.title?.replace(/\s/g, "_");
//       const ext = path.extname(new URL(movie.poster_url).pathname) || ".jpg";
//       const posterFile = path.join(folderPath, `${id}${ext}`);

//       try {
//         await downloadImage(movie.poster_url, posterFile);
//         movie.poster_url = `file://${posterFile}`;
//       } catch (err) {
//         console.warn(`⚠️ Failed to cache poster for ${id}:`, err);
//       }
//     }
//   }
// }

// function clearRecommendedPosterCache() {
//   const folderPath = path.join(basePath, "posters", "recommended");

//   if (fs.existsSync(folderPath)) {
//     const files = fs.readdirSync(folderPath);
//     for (const file of files) {
//       const filePath = path.join(folderPath, file);
//       if (fs.statSync(filePath).isFile()) {
//         fs.unlinkSync(filePath);
//       }
//     }
//     console.log("🧹 Cleared old recommended poster cache");
//   }
// }

// function removeFromQueue(path, movieId) {
//   try {
//     if (!fs.existsSync(path)) return;
//     const actions = JSON.parse(fs.readFileSync(path, "utf-8"));
//     const filtered = actions.filter(
//       (action) => action.movie.movieId !== movieId && action.movie._id !== movieId
//     );
//     fs.writeFileSync(path, JSON.stringify(filtered, null, 2), "utf-8");
//     console.log(`🗑 Removed ${movieId} from queue`);
//   } catch (err) {
//     console.error("❌ Failed to remove from queue:", err);
//   }
// }

contextBridge.exposeInMainWorld("electron", {
  // ✅ Session
  saveSession: (data) => {
    try {
      fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 2), "utf-8");
      console.log("✅ Session saved offline.");
    } catch (err) {
      console.error("❌ Failed to save session offline:", err);
    }
  },
  getSession: () => {
    try {
      return JSON.parse(fs.readFileSync(sessionFilePath, "utf-8"));
    } catch {
      return null;
    }
  },

  // ✅ Profile
  saveProfileUpdate: (data) => {
    try {
      fs.writeFileSync(profileFilePath, JSON.stringify(data, null, 2), "utf-8");
      console.log("✅ Profile update saved offline.");
    } catch (err) {
      console.error("❌ Failed to save profile update:", err);
    }
  },
  getProfileUpdate: () => {
    try {
      if (fs.existsSync(profileFilePath)) {
        return JSON.parse(fs.readFileSync(profileFilePath, "utf-8"));
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
        list = JSON.parse(fs.readFileSync(feedbackFilePath, "utf-8"));
      }
      list.push(feedback);
      fs.writeFileSync(
        feedbackFilePath,
        JSON.stringify(list, null, 2),
        "utf-8"
      );
      console.log("📝 Feedback queued offline.");
    } catch (err) {
      console.error("❌ Failed to queue feedback:", err);
    }
  },
  getFeedbackQueue: () => {
    try {
      if (fs.existsSync(feedbackFilePath)) {
        return JSON.parse(fs.readFileSync(feedbackFilePath, "utf-8"));
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
      fs.writeFileSync(userGenrePath, JSON.stringify(genres, null, 2), "utf-8");
      console.log("💾 Saved user genres.");
    } catch (err) {
      console.error("❌ Failed to save user genres:", err);
    }
  },
  getUserGenres: () => {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(userGenrePath)) return resolve([]);
        const raw = fs.readFileSync(userGenrePath, "utf-8");
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

  // // ✅ All Movies
  // saveAllMovies: (movies) => {
  //   try {
  //     fs.writeFileSync(allMoviesPath, JSON.stringify(movies, null, 2), 'utf-8');
  //     console.log("💾 Saved all movies.");
  //   } catch (err) {
  //     console.error("❌ Failed to save all movies:", err);
  //   }
  // },
  // getAllMovies: () => {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       if (!fs.existsSync(allMoviesPath)) return resolve([]);
  //       const raw = fs.readFileSync(allMoviesPath, 'utf-8');
  //       resolve(JSON.parse(raw));
  //     } catch (err) {
  //       reject(err);
  //     }
  //   });
  // },

  // ✅ Recommended Movies
  saveRecommendedMovies: async (movies) => {
    try {
      // clearRecommendedPosterCache(); // 🧼 clear before re-saving posters

      let existing = [];
      if (fs.existsSync(recommendedPath)) {
        const raw = fs.readFileSync(recommendedPath, "utf-8");
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

      fs.writeFileSync(
        recommendedPath,
        JSON.stringify(trimmed, null, 2),
        "utf-8"
      );
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

  // // ✅ Shell backup & restore
  // backupData: () => {
  //   exec(`bash ${backupScript}`, (err, stdout, stderr) => {
  //     if (err) {
  //       console.error("❌ Backup error:", err);
  //     } else {
  //       console.log("✅ Backup successful:", stdout);
  //     }
  //   });
  // },
  // restoreData: (cb) => {
  //   exec(`bash ${restoreScript}`, (err, stdout, stderr) => {
  //     if (err) {
  //       cb({ success: false, message: stderr || err.message });
  //     } else {
  //       cb({ success: true, message: stdout });
  //     }
  //   });
  // },

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
  
  removeFromHistoryQueue: (movieId) =>
    queueAction(historyQueuePath, { type: "delete", movieId }),

  queueHistoryAction: (action) => queueAction(historyQueuePath, action),
  queueSavedAction: (action) => queueAction(savedQueuePath, action),

  removeMovieFromHistoryCache: (movieId) => {
    try {
      const data = fs.readFileSync(historyQueuePath, "utf-8");
      const parsed = JSON.parse(data);
      const filtered = parsed.filter(
        (m) => m.movieId?.toString() !== movieId.toString()
      );
      fs.writeFileSync(historyQueuePath, JSON.stringify(filtered, null, 2));
      console.log(`🗑️ Updated history cache after removing: ${movieId}`);
    } catch (err) {
      console.error("❌ Failed to update local history cache:", err);
    }
  },

  removeFromSavedQueue: (movieId) => {
    queueAction(savedQueuePath, { type: "delete", movieId });

    // Also remove immediately from cache (UI)
    try {
      const data = fs.readFileSync(savedQueuePath, "utf-8");
      const parsed = JSON.parse(data);

      // Handle both raw movie and action format
      const filtered = parsed.filter((entry) => {
        const m = entry.movie || entry;
        const id = m.movieId || m._id;
        return id?.toString() !== movieId.toString();
      });

      fs.writeFileSync(savedQueuePath, JSON.stringify(filtered, null, 2));
      console.log(`🗑️ Updated saved cache after removing: ${movieId}`);
    } catch (err) {
      console.error("❌ Failed to update saved cache:", err);
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
