// electron/main.js
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch'; // run: npm install node-fetch

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
const API = 'http://localhost:8000'; // or your deployed backend

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  // mainWindow.webContents.openDevTools(); // optional
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Handle Electron quit → update signout
app.on('before-quit', async (event) => {
  try {
    const userSessionPath = path.join(__dirname, 'user-session.json');
    if (fs.existsSync(userSessionPath)) {
      const userData = JSON.parse(fs.readFileSync(userSessionPath, 'utf-8'));
      const userId = userData?.userId;

      if (userId) {
        const res = await fetch(`${API}/update-signout-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (res.ok) {
          console.log(`✅ lastSignout updated for user ${userId}`);
        } else {
          const error = await res.text();
          console.warn("⚠️ Failed to update signout:", error);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error in before-quit handler:", err);
  }
});

// Exit app when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
