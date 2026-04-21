# Deploy Chronos Field Timekeeper to GitHub Pages

This guide will help you publish your Chronos app as a web app on GitHub Pages.

## Prerequisites

- Git installed and configured
- A GitHub account
- Node.js and npm installed

## Step 1: Update Configuration

Open `package.json` and update the `homepage` field with your GitHub username:

```json
"homepage": "https://YOUR_USERNAME.github.io/chronos-field-timekeeper"
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Initialize Git Repository (if not already done)

```bash
cd chronos
git init
git add .
git commit -m "Initial commit"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `chronos-field-timekeeper`
3. Don't initialize it with README, .gitignore, or license
4. Copy the repository URL

## Step 4: Connect Local Repo to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/chronos-field-timekeeper.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:
1. Build your app for production
2. Create a `gh-pages` branch
3. Push the built files to GitHub Pages

## Step 6: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select branch: **gh-pages**, folder: **/(root)**
5. Click **Save**

## Access Your App

After a few minutes, your app will be live at:
```
https://YOUR_USERNAME.github.io/chronos-field-timekeeper
```

## Update Deployment

Whenever you make changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
npm run deploy
```

## Troubleshooting

### 404 Error
- Wait a few minutes for GitHub Pages to build
- Check that the `homepage` field in package.json is correct
- Ensure GitHub Pages is enabled in repository settings

### Blank Page
- Open browser console (F12) to check for errors
- Verify base path is correct in Vite config if needed
- Check that all assets are loading correctly

## Environment Variables

For Supabase credentials in production, you have two options:

### Option 1: Hardcode in code (not recommended for public repos)
Update your Supabase client with actual values

### Option 2: Use GitHub Secrets (for CI/CD)
Set up GitHub Actions to inject environment variables at build time

## PWA Features

Users can:
- Add the app to their home screen
- Use it offline (with service worker)
- Receive notifications (if implemented)

To enhance PWA capabilities, consider adding:
- `manifest.json` file
- Service worker configuration
- App icons in multiple sizes
