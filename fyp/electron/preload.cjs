const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

// File paths – persistent across sessions
const sessionFilePath = path.join(os.homedir(), 'cineit-user-session.json');
const profileFilePath = path.join(os.homedir(), 'cineit-profile-update.json');
const feedbackFilePath = path.join(os.homedir(), 'cineit-feedback-queue.json');

contextBridge.exposeInMainWorld('electron', {
  // Session management
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
      const raw = fs.readFileSync(sessionFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Profile updates
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

  // Feedback queue
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
  }
});
