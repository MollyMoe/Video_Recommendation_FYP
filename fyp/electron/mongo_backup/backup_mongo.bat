@REM @echo off
@REM echo 🟣 Starting MongoDB backup from Atlas...

@REM :: Set your backup directory
@REM set BACKUP_DIR=C:\Users\myahm\OneDrive\Desktop\mongo_backup

@REM :: Dump all databases from MongoDB Atlas
@REM mongodump --uri="mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net" --out="%BACKUP_DIR%"

@REM echo ✅ Backup completed to: %BACKUP_DIR%
@REM pause