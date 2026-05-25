# AbbyCRM Deployment Guide

## Quick Deploy to Railway

### Option 1: GitHub Integration (Recommended)

1. Go to https://railway.com/dashboard
2. Log in with `Paisabrazilfl@gmail.com` / `1Giselle!`
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose `paisabrazilfl-cpu/AbbyCRM`
6. Select the `artifacts/mtos-crm` folder as the root
7. Click **"Deploy"**

### Option 2: CLI (if token works locally)

```bash
npm install -g @railway/cli
railway login
railway init
railway link
cd artifacts/mtos-crm
railway up
```

### Environment Variables

Set these in Railway dashboard:
- `PORT` = 3000
- `NODE_ENV` = production

## Project Structure

```
artifacts/
├── mtos-crm/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.tsx    # Main CRM UI
│   │   └── index.css  # Tailwind styles
│   ├── railway.json   # Railway config
│   └── package.json
│
├── openclaw-webhook/  # Backend API server
│   └── server.js      # Express API
│
└── abby-agent-ui/     # ABBY Chat UI
    └── src/
        └── App.jsx    # Chat interface
```

## Features

- **Dashboard**: Lead stats, recent activity
- **Intake**: Lead management with search/filter
- **Work**: Case tracking
- **Documents**: Document storage (coming soon)
- **Intelligence**: AI insights (coming soon)
- **Automation**: Workflow automation (coming soon)
- **Settings**: API configuration
- **BOS-OMEGA**: AI agent chat

## Tort Types Supported

1. Mesothelioma
2. Opioid
3. Benzene
4. Talcum Powder
5. Roundup
6. Sexual Abuse
7. Police Brutality
8. Car Accident
9. Slip & Fall
10. Medical Malpractice
