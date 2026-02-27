#!/usr/bin/env bash
# Force update from git - overwrites any local changes

echo "Forcing git update..."
git fetch origin
git reset --hard origin/main
echo "Git updated successfully!"
