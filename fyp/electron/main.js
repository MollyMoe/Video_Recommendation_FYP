// electron/main.js
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// for the application icon
const iconPath = process.platform === 'darwin'
  ? path.join(__dirname, 'assets', 'cineitwhite.icns')
  : path.join(__dirname, 'assets', 'cineitwhite.ico');

const isDev = process.env.NODE_ENV === 'development';
const API = 'http://localhost:8000'; // or your deployed backend

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
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

  // ✅ When app boots, sync any offline signout
  setTimeout(async () => {
  const userSessionPath = path.join(__dirname, 'user-session.json');
  if (fs.existsSync(userSessionPath)) {
    try {
      const raw = fs.readFileSync(userSessionPath, 'utf-8');
      console.log("data in raw" , raw);

      if (!raw?.trim()) {
        console.warn("⚠️ user-session.json is empty. Skipping sync.");
        return;
      }

      const userData = JSON.parse(raw);
      const userId = userData?.userId;
      const lastSignout = userData?.lastSignout;

      if (userId && lastSignout) {
        const res = await fetch(`${API}/api/auth/update-signout-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, time: lastSignout, reason: 'offline recovery' }),
        });

        if (res.ok) {
          console.log(`✅ Synced offline signout for user ${userId}`);
          fs.unlinkSync(userSessionPath);
        } else {
          console.warn("⚠️ Failed to sync offline signout:", await res.text());
        }
      } else {
        console.warn("⚠️ Incomplete user data:", userData);
      }

    } catch (err) {
      console.error("❌ Failed to process offline signout sync:", err);
    }
  }
}, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ✅ When quitting, update lastSignout to now
app.on('before-quit', async () => {
  try {
    const userSessionPath = path.join(__dirname, 'user-session.json');
    if (fs.existsSync(userSessionPath)) {
      const userData = JSON.parse(fs.readFileSync(userSessionPath, 'utf-8'));
      const userId = userData?.userId;

      if (userId) {
        const now = new Date().toISOString();
        const res = await fetch(`${API}/api/auth/update-signout-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            time: now,
            reason: 'before-quit',
          }),
        });

        if (res.ok) {
          console.log(`✅ Updated lastSignout (before quit) for ${userId}`);
        } else {
          console.warn("⚠️ Failed to update signout (quit):", await res.text());
        }
      }
    }
  } catch (err) {
    console.error("❌ Error during before-quit signout update:", err);
  }
});

// Exit app when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});