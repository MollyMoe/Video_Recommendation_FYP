@echo off
echo 🟣 Starting MongoDB backup from Atlas...

:: Set your backup directory
set BACKUP_DIR=C:\Users\phyut\Desktop\mongo_backup

:: Dump all databases from MongoDB Atlas
mongodump --uri="mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net" --out="%BACKUP_DIR%"

echo ✅ Backup completed to: %BACKUP_DIR%
pause
