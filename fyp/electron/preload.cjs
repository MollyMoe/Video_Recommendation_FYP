const { contextBridge, ipcRenderer, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const sessionFilePath = path.join(os.homedir(), 'cineit-user-session.json');

contextBridge.exposeInMainWorld('electron', {
  // 🔐 Session management
  saveSession: (data) => {
    try {
      fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log("✅ Session saved.");
    } catch (err) {
      console.error("❌ Failed to save session:", err);
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

  updateSession: (update) => {
    try {
      const raw = fs.readFileSync(sessionFilePath, 'utf-8');
      const current = JSON.parse(raw);
      const updated = { ...current, ...update };
      fs.writeFileSync(sessionFilePath, JSON.stringify(updated, null, 2), 'utf-8');
      console.log("✅ Session updated.");
    } catch (err) {
      console.error("❌ Failed to update session:", err);
    }
  },

  clearSession: () => {
    try {
      if (fs.existsSync(sessionFilePath)) {
        fs.unlinkSync(sessionFilePath);
        console.log("🧹 Session cleared.");
      }
    } catch (err) {
      console.error("❌ Failed to clear session:", err);
    }
  },

  // 🛠 Database tools
  backupDB: () => ipcRenderer.send('run-backup'),
  restoreDB: () => ipcRenderer.send('run-restore'),

  // 🌐 Open external URLs (e.g., Stripe Checkout)
  openExternal: (url) => {
    shell.openExternal(url);
  },
  reloadWindow: () => ipcRenderer.send('reload-window'),
});
