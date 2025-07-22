const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

// This path is persistent and works in both dev and prod
const sessionFilePath = path.join(os.homedir(), 'cineit-user-session.json');

contextBridge.exposeInMainWorld('electron', {
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
});
