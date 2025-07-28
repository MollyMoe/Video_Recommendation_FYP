#!/bin/bash

echo "🟣 Starting MongoDB backup from Atlas..."

# Set your backup directory (change to your desired location)
BACKUP_DIR="$HOME/Desktop/mongo_backup"

# Create the backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Dump all databases from MongoDB Atlas
mongodump --uri="mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net" --out="$BACKUP_DIR"

echo "✅ Backup completed to: $BACKUP_DIR"
