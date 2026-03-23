#!/bin/bash
# Deployment script to run on the server
# This can be run manually or via cron

cd ~/marketing-agent-generation

echo "Starting deployment at $(date)"

# Pull latest changes
git pull origin main

# Install dependencies
npm ci

# Build the application
npm run build

# Restart PM2
npx pm2 restart marketing-agent

# Show status
npx pm2 status

echo "Deployment completed at $(date)"
