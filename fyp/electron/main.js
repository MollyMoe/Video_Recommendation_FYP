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
/////////////////////
// import { app, BrowserWindow, ipcMain } from 'electron';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { exec } from 'child_process';
// import fs from 'fs';
// import os from 'os';

// // Setup __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// let mainWindow;

// // Session file path
// const sessionFilePath = path.join(os.homedir(), 'cineit-user-session.json');

// // ✅ Save lastSignout to file when user closes app
// app.on('before-quit', () => {
//   try {
//     if (fs.existsSync(sessionFilePath)) {
//       const session = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));

//       if (session.userId) {
//         const now = new Date().toISOString();
//         session.lastSignout = now;

//         fs.writeFileSync(sessionFilePath, JSON.stringify(session, null, 2), 'utf-8');
//         console.log(`📌 Session lastSignout updated to ${now}`);
//       }
//     }
//   } catch (err) {
//     console.error("❌ Failed to update signout before quit:", err);
//   }
// });

// function createWindow() {
//   const mainWindow = new BrowserWindow({
//     width: 1024,
//     height: 768,
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//     },
//   });

//   // If you just want to load a local file:
//   // — in development this might live next to main.js as ../dist/index.html
//   // — once packaged, it'll live in resources/app.asar (or unpacked app folder)
//   const indexPath = app.isPackaged
//     ? path.join(process.resourcesPath, 'dist', 'index.html')
//     : path.join(__dirname, '../dist/index.html');

//   // (Optional) log out so you can confirm the exact path Electron is trying:
//   console.log('Loading index.html from:', indexPath);

//   // Load it. loadFile() automatically uses the file:// protocol.
//   mainWindow.loadFile(indexPath);
// }
// // ✅ App lifecycle
// // ✅ App lifecycle
// app.whenReady().then(() => {
//   createWindow();

//   // ✅ Delay sync of offline signout (2s after launch)
//   setTimeout(() => {
//     if (fs.existsSync(sessionFilePath)) {
//       const session = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
//       const { userId, lastSignout } = session;

//       if (userId && lastSignout) {
//         fetch('http://localhost:8000/api/auth/update-signout-time', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ userId, time: lastSignout, reason: 'offline-recovery' }),
//         }).then(async (res) => {

//           // ✅ ⬇️ PLACE IT RIGHT HERE
//           if (res.ok) {
//             console.log(`✅ Synced offline signout for user ${userId}`);
//             fs.unlinkSync(sessionFilePath);
//             console.log("🧹 Deleted synced session file.");
//           } else {
//             console.warn('⚠️ Failed to sync offline signout:', await res.text());
//           }

//         }).catch(err => {
//           console.error('❌ Network error during signout sync:', err);
//         });
//       }
//     }
//   }, 2000);
// });

// // ✅ Handle backup/restore .bat triggers
// function runBackupScript() {
//   const backupPath = path.join(__dirname, 'mongo_backup', 'backup_mongo.bat');
//   exec(`"${backupPath}"`, (err, stdout, stderr) => {
//     if (err) {
//       console.error('❌ Backup failed:', err.message);
//       return;
//     }
//     console.log('✅ Backup completed:\n', stdout);
//   });
// }

// function runRestoreScript() {
//   const restorePath = path.join(__dirname, 'mongo_backup', 'restore_mongo.bat');
//   exec(`"${restorePath}"`, (err, stdout, stderr) => {
//     if (err) {
//       console.error('❌ Restore failed:', err.message);
//       return;
//     }
//     console.log('✅ Restore completed:\n', stdout);
//   });
// }

// // ✅ Listen for frontend events
// ipcMain.on('run-backup', runBackupScript);
// ipcMain.on('run-restore', runRestoreScript);

// // ✅ Quit app when all windows closed (except on macOS)
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
////////////////////////////////

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Session file path for offline signout recovery
const sessionFilePath = path.join(os.homedir(), 'cineit-user-session.json');

// Save lastSignout to file when user closes app
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
    console.error('❌ Failed to update signout before quit:', err);
  }
});

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Resolve index.html relative to this file, works packaged or in dev
  const indexUrl = new URL('../dist/index.html', import.meta.url).href;
  console.log('▶️ Loading index.html from:', indexUrl);
  console.log('   Exists on disk?', fs.existsSync(indexUrl.replace('file://', '')));

  // Load the app
  mainWindow.loadURL(indexUrl);
}

app.whenReady().then(() => {
  createWindow();

  // Attempt to sync offline signout 2s after launch
  setTimeout(() => {
    try {
      if (fs.existsSync(sessionFilePath)) {
        const session = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
        const { userId, lastSignout } = session;
        if (userId && lastSignout) {
          fetch('http://localhost:8000/api/auth/update-signout-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, time: lastSignout, reason: 'offline-recovery' }),
          })
            .then(async res => {
              if (res.ok) {
                console.log(`✅ Synced offline signout for user ${userId}`);
                fs.unlinkSync(sessionFilePath);
                console.log('🧹 Deleted synced session file.');
              } else {
                console.warn('⚠️ Failed to sync offline signout:', await res.text());
              }
            })
            .catch(err => console.error('❌ Network error during signout sync:', err));
        }
      }
    } catch (err) {
      console.error('❌ Error reading session file:', err);
    }
  }, 2000);
});

// Handle backup script trigger
function runBackupScript() {
  const backupPath = path.join(__dirname, 'mongo_backup', 'backup_mongo.bat');
  exec(`"${backupPath}"`, (err, stdout, stderr) => {
    if (err) return console.error('❌ Backup failed:', err.message);
    console.log('✅ Backup completed:\n', stdout);
  });
}

// Handle restore script trigger
function runRestoreScript() {
  const restorePath = path.join(__dirname, 'mongo_backup', 'restore_mongo.bat');
  exec(`"${restorePath}"`, (err, stdout, stderr) => {
    if (err) return console.error('❌ Restore failed:', err.message);
    console.log('✅ Restore completed:\n', stdout);
  });
}

// Listen for frontend events
ipcMain.on('run-backup', runBackupScript);
ipcMain.on('run-restore', runRestoreScript);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
