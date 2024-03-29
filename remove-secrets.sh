#!/bin/bash
# Script to remove exposed secrets from git history

# Replace the exposed API key with a placeholder
git filter-branch --force --tree-filter '
  find . -type f -name "*.json" -exec sed -i "s/AIzaSyAj0btu828R6Vz2275gMktnE7eOt53oJbQ/YOUR_GEMINI_API_KEY_HERE/g" {} +
  find . -type f -name "*.local" -exec sed -i "s/AIzaSyAj0btu828R6Vz2275gMktnE7eOt53oJbQLogs/YOUR_GEMINI_API_KEY_HERE/g" {} +
' --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

