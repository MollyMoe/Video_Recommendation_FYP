const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// File paths
const sessionFilePath = path.join(os.homedir(), 'cineit-user-session.json');
const profileFilePath = path.join(os.homedir(), 'cineit-profile-update.json');
const feedbackFilePath = path.join(os.homedir(), 'cineit-feedback-queue.json');
const userGenrePath = path.join(os.homedir(), 'cineit-user-genres.json');
const allMoviesPath = path.join(os.homedir(), 'cineit-all-movies.json');
const recommendedPath = path.join(os.homedir(), 'cineit-recommended.json');
const backupScript = path.join(__dirname, "..", "scripts", "backup.sh");
const restoreScript = path.join(__dirname, "..", "scripts", "restore.sh");
const historyQueuePath = path.join(os.homedir(), "cineit-history-queue.json");
const savedQueuePath = path.join(os.homedir(), "cineit-saved-queue.json");
const likedQueuePath = path.join(os.homedir(), "cineit-liked-queue.json");

// ✅ Helper to queue actions
function queueAction(filePath, action) {
  try {
    let list = [];
    if (fs.existsSync(filePath)) {
      list = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    list.push(action);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
    console.log(`📦 Queued offline action for ${action.type}`);
  } catch (err) {
    console.error("❌ Failed to queue action:", err);
  }
}

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


contextBridge.exposeInMainWorld('electron', {
  // ✅ Session
  saveSession: (data) => {
    try {
      fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log("✅ Session saved offline.");
    } catch (err) {
      console.error("❌ Failed to save session offline:", err);
    }
  },
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

  // ✅ All Movies
  saveAllMovies: (movies) => {
    try {
      fs.writeFileSync(allMoviesPath, JSON.stringify(movies, null, 2), 'utf-8');
      console.log("💾 Saved all movies.");
    } catch (err) {
      console.error("❌ Failed to save all movies:", err);
    }
  },
  getAllMovies: () => {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(allMoviesPath)) return resolve([]);
        const raw = fs.readFileSync(allMoviesPath, 'utf-8');
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
  },

  // ✅ Recommended Movies
  saveRecommendedMovies: (movies) => {
    try {
      fs.writeFileSync(recommendedPath, JSON.stringify(movies, null, 2), 'utf-8');
      console.log("💾 Saved recommended movies.");
    } catch (err) {
      console.error("❌ Failed to save recommended movies:", err);
    }
  },
  getRecommendedMovies: () => {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(recommendedPath)) return resolve([]);
        const raw = fs.readFileSync(recommendedPath, 'utf-8');
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
  queueHistory: (action) => queueAction(historyQueuePath, action),
  queueSaved: (action) => queueAction(savedQueuePath, action),
  queueLiked: (action) => queueAction(likedQueuePath, action),

  // ✅ Offline remove actions for history, saved, liked
  removeFromLikedQueue: (movieId) =>
  queueAction(likedQueuePath, { type: "delete", movieId }),

  removeFromSavedQueue: (movieId) =>
  queueAction(savedQueuePath, { type: "delete", movieId }),

  removeFromHistoryQueue: (movieId) =>
  queueAction(historyQueuePath, { type: "delete", movieId }),


  //History page
  saveHistoryQueue: (historyMovies) => {
  try {
    fs.writeFileSync(historyQueuePath, JSON.stringify(historyMovies, null, 2), 'utf-8');
    console.log("💾 Saved history queue.");
  } catch (err) {
    console.error("❌ Failed to save history queue:", err);
  }
},

  getHistoryQueue: () => {
  try {
    if (fs.existsSync(historyQueuePath)) {
      return JSON.parse(fs.readFileSync(historyQueuePath, 'utf-8'));
    }
    return [];
  } catch {
    return [];
  }
},

getRawHistoryQueue: () => {
  try {
    if (fs.existsSync(historyQueuePath)) {
      return JSON.parse(fs.readFileSync(historyQueuePath, 'utf-8'));
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
    fs.writeFileSync(historyQueuePath, JSON.stringify(filtered, null, 2), "utf-8");
    console.log("🧹 Cleared history queue for user:", userId);
  } catch (err) {
    console.error("❌ Failed to clear user history queue:", err);
  }
},

//Liked Movies Page
 saveLikedQueue: (likedMovies) => {
    try {
      fs.writeFileSync(likedQueuePath, JSON.stringify(likedMovies, null, 2), 'utf-8');
      console.log("💾 Saved liked queue.");
    } catch (err) {
      console.error("❌ Failed to save liked queue:", err);
    }
  },

  getLikedQueue: () => {
  try {
    if (!fs.existsSync(likedQueuePath)) return [];

    const actions = JSON.parse(fs.readFileSync(likedQueuePath, 'utf-8'));
    const seen = new Set();
    const movies = [];

    for (const action of actions) {
      const movie = action.movie;
      const id = movie?._id || movie?.movieId;
      if (movie && id && !seen.has(id)) {
        seen.add(id);
        movies.push(movie);
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
      return JSON.parse(fs.readFileSync(likedQueuePath, 'utf-8'));
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
  saveSavedQueue: (savedMovies) => {
    try {
      fs.writeFileSync(savedQueuePath, JSON.stringify(savedMovies, null, 2), 'utf-8');
      console.log("💾 Saved watch later queue.");
    } catch (err) {
      console.error("❌ Failed to save saved queue:", err);
    }
  },

   getSavedQueue: () => {
  try {
    if (!fs.existsSync(savedQueuePath)) return [];

    const actions = JSON.parse(fs.readFileSync(savedQueuePath, "utf-8"));
    const seen = new Set();
    const movies = [];

    for (const action of actions) {
      if (action.movie) {
        const id = action.movie.movieId || action.movie._id;
        if (id && !seen.has(id)) {
          seen.add(id);
          movies.push(action.movie);
        }
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
      return JSON.parse(fs.readFileSync(savedQueuePath, 'utf-8'));
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

});
