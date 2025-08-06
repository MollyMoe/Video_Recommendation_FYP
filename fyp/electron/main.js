// // electron/main.js
// import { app, BrowserWindow } from 'electron';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import fs from 'fs';

// import fetch from 'node-fetch';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const isDev = process.env.NODE_ENV === 'development';
// const API = 'http://localhost:8000'; // or your deployed backend

// let mainWindow;

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.cjs'),
//       contextIsolation: true,
//       nodeIntegration: false,
//       sandbox: false,
//     },
//   });

//   if (isDev) {
//     mainWindow.loadURL('http://localhost:3000');
//   } else {
//     const indexPath = path.join(__dirname, '../dist/index.html');
//     mainWindow.loadFile(indexPath);
//   }

//   // mainWindow.webContents.openDevTools(); // optional
// }

// app.whenReady().then(() => {
//   createWindow();

//   // ✅ When app boots, sync any offline signout
//   setTimeout(async () => {
//   const userSessionPath = path.join(__dirname, 'user-session.json');
//   if (fs.existsSync(userSessionPath)) {
//     try {
//       const raw = fs.readFileSync(userSessionPath, 'utf-8');
//       console.log("data in raw" , raw);

//       if (!raw?.trim()) {
//         console.warn("⚠️ user-session.json is empty. Skipping sync.");
//         return;
//       }

//       const userData = JSON.parse(raw);
//       const userId = userData?.userId;
//       const lastSignout = userData?.lastSignout;

//       if (userId && lastSignout) {
//         const res = await fetch(`${API}/api/auth/update-signout-time`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ userId, time: lastSignout, reason: 'offline recovery' }),
//         });

//         if (res.ok) {
//           console.log(`✅ Synced offline signout for user ${userId}`);
//           fs.unlinkSync(userSessionPath);
//         } else {
//           console.warn("⚠️ Failed to sync offline signout:", await res.text());
//         }
//       } else {
//         console.warn("⚠️ Incomplete user data:", userData);
//       }

//     } catch (err) {
//       console.error("❌ Failed to process offline signout sync:", err);
//     }
//   }
// }, 1500);

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// // ✅ When quitting, update lastSignout to now
// app.on('before-quit', async () => {
//   try {
//     const userSessionPath = path.join(__dirname, 'user-session.json');
//     if (fs.existsSync(userSessionPath)) {
//       const userData = JSON.parse(fs.readFileSync(userSessionPath, 'utf-8'));
//       const userId = userData?.userId;

//       if (userId) {
//         const now = new Date().toISOString();
//         const res = await fetch(`${API}/api/auth/update-signout-time`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             userId,
//             time: now,
//             reason: 'before-quit',
//           }),
//         });

//         if (res.ok) {
//           console.log(`✅ Updated lastSignout (before quit) for ${userId}`);
//         } else {
//           console.warn("⚠️ Failed to update signout (quit):", await res.text());
//         }
//       }
//     }
//   } catch (err) {
//     console.error("❌ Error during before-quit signout update:", err);
//   }
// });

// // Exit app when all windows closed (except on macOS)
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });



//.bat trigger
// backend/electron/main.js
// backend/electron/main.js

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconPath = process.platform === 'darwin'
  ? path.join(__dirname, 'assets', 'cineitwhite.icns')
  : path.join(__dirname, 'assets', 'cineitwhite.ico');

let mainWindow;

// Session file path
const sessionFilePath = path.join(os.homedir(), 'cineit-user-session.json');

// ✅ Save lastSignout to file when user closes app
app.on('before-quit', () => {
  try {
    if (fs.existsSync(sessionFilePath)) {
      const session = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));

      if (session.userId) {
        const now = new Date().toISOString();
        session.lastSignout = now;

        fs.writeFileSync(sessionFilePath, JSON.stringify(session, null, 2), 'utf-8');
        console.log(`📌 Session lastSignout updated to ${now}`);
      }
    }
  } catch (err) {
    console.error("❌ Failed to update signout before quit:", err);
  }
});

// ✅ Create app window
function createWindow() {
  console.log('Icon path:', iconPath);
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

  // Load frontend
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }
}

// ✅ App lifecycle
// ✅ App lifecycle
app.whenReady().then(() => {
  createWindow();

  // ✅ Delay sync of offline signout (2s after launch)
  setTimeout(() => {
    if (fs.existsSync(sessionFilePath)) {
      const session = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
      const { userId, lastSignout } = session;

      if (userId && lastSignout) {
        fetch('http://localhost:8000/api/auth/update-signout-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, time: lastSignout, reason: 'offline-recovery' }),
        }).then(async (res) => {

          // ✅ ⬇️ PLACE IT RIGHT HERE
          if (res.ok) {
            console.log(`✅ Synced offline signout for user ${userId}`);
            fs.unlinkSync(sessionFilePath);
            console.log("🧹 Deleted synced session file.");
          } else {
            console.warn('⚠️ Failed to sync offline signout:', await res.text());
          }

        }).catch(err => {
          console.error('❌ Network error during signout sync:', err);
        });
      }
    }
  }, 2000);
});

// ✅ Handle backup/restore .bat triggers
function runBackupScript() {
  const backupPath = path.join(__dirname, 'mongo_backup', 'backup_mongo.bat');
  exec(`"${backupPath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Backup failed:', err.message);
      return;
    }
    console.log('✅ Backup completed:\n', stdout);
  });
}

function runRestoreScript() {
  const restorePath = path.join(__dirname, 'mongo_backup', 'restore_mongo.bat');
  exec(`"${restorePath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Restore failed:', err.message);
      return;
    }
    console.log('✅ Restore completed:\n', stdout);
  });
}

// ✅ Listen for frontend events
ipcMain.on('run-backup', runBackupScript);
ipcMain.on('run-restore', runRestoreScript);

ipcMain.on('reload-window', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.reload();
});

// ✅ Quit app when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});