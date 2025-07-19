// electron/preload.js
const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

const sessionFilePath = path.join(__dirname, "user-session.json");

contextBridge.exposeInMainWorld("electron", {
  saveOfflineSignout: (data) => {
    try {
      fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 2));
      console.log("📁 Offline signout recorded");
    } catch (err) {
      console.error("❌ Failed to save offline signout:", err);
    }
  },
  readOfflineSignout: () => {
    try {
      if (fs.existsSync(sessionFilePath)) {
        const raw = fs.readFileSync(sessionFilePath);
        return JSON.parse(raw);
      }
      return null;
    } catch (err) {
      console.error("❌ Failed to read session file:", err);
      return null;
    }
  },
  clearOfflineSignout: () => {
    try {
      if (fs.existsSync(sessionFilePath)) {
        fs.unlinkSync(sessionFilePath);
        console.log("🧹 Session file cleared");
      }
    } catch (err) {
      console.error("❌ Failed to clear session file:", err);
    }
  },
});
