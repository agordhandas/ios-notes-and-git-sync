# Quick Start Guide

Get up and running with GitHub Mobile Editor in 5 minutes!

## Prerequisites

- Node.js installed
- Xcode installed (for iOS Simulator)
- GitHub Personal Access Token

## Step 1: Install Dependencies

```bash
cd GitHubMobileEditor
npm install
```

## Step 2: Get Your GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it "Mobile Editor"
4. Select `repo` scope
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

## Step 3: Run the App

```bash
npm run ios
```

This will:
- Start the Expo development server
- Launch iOS Simulator
- Open the app

## Step 4: First Use

1. **Enter your token** when the app opens
2. **Add a repository**: Tap "+ Add"
   - Format: `username/repo-name`
   - Example: `octocat/Hello-World`
3. **Browse files**: Tap the repository to see files
4. **Edit a file**: Tap any file to open the editor
5. **Create new file**: Tap the "+" button in file browser

## Tips

- **Auto-save**: Just type! The app saves automatically after 10 seconds
- **Offline mode**: Edit offline, changes sync when you're back online
- **Status indicator**: Watch the status at the top of the editor
- **Manual save**: Tap "Save" button to save immediately
- **Go back**: Use "‹ Back" button to navigate

## Troubleshooting

### "Token invalid" error
→ Make sure your token has the `repo` scope

### Can't find repository
→ Check the format: `owner/repo` (no spaces, forward slash)

### Simulator not opening
→ Open Xcode, go to Xcode → Open Developer Tool → Simulator

### Changes not saving
→ Check your internet connection and the status indicator

## Next Steps

- Read the full [README.md](README.md) for more details
- Check out the [AGENTS.md](../AGENTS.md) for the project requirements
- Start editing your GitHub files on mobile!

## Common Commands

```bash
# Start dev server
npm start

# Run on iOS
npm run ios

# Run on Android (not supported in MVP)
npm run android

# Run on web (not fully supported)
npm run web
```

## Need Help?

- Check the README for full documentation
- Open an issue on GitHub
- Review the project requirements in AGENTS.md

Happy editing! 🚀
