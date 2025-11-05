# GitHub Mobile Editor

A lightweight React Native app for iOS that allows users to read and edit files in GitHub repositories with automatic syncing.

## Features

✅ **Authentication** - Secure GitHub token storage using device keychain
✅ **Repository Management** - Add, view, and switch between multiple repositories
✅ **File Browser** - Navigate through files and folders with a tree structure
✅ **File Creation** - Create new files with custom paths
✅ **Text Editor** - Plain text editing with character and word count
✅ **Auto-Save** - Automatic save with 10-second debounce after typing stops
✅ **Offline Support** - Edit files offline with automatic sync when reconnected
✅ **Sync Queue** - Failed saves are queued and retried automatically
✅ **Status Indicators** - Clear visual feedback for save status (Idle, Saving, Saved, Error)

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **Axios** for GitHub API calls
- **AsyncStorage** for file caching and data persistence
- **expo-secure-store** for secure token storage
- **NetInfo** for connectivity detection
- **lodash.debounce** for auto-save debouncing

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Xcode (for iOS development)
- iOS Simulator or physical iOS device
- GitHub Personal Access Token with `repo` scope

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GitHubMobileEditor
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

## Getting Started

### 1. Generate GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Mobile Editor")
4. Select scopes:
   - `repo` (for private repositories)
   - or `public_repo` (for public repositories only)
5. Generate and copy the token

### 2. First Launch

1. Open the app
2. Enter your GitHub Personal Access Token
3. The token will be validated and securely stored
4. You'll be taken to the repository list

### 3. Add a Repository

1. Tap the "+ Add" button
2. Enter the repository in one of these formats:
   - `owner/repo` (e.g., `octocat/Hello-World`)
   - GitHub URL (e.g., `https://github.com/octocat/Hello-World`)
3. The app will verify access and add it to your list

### 4. Browse and Edit Files

1. Tap on a repository to browse its files
2. Navigate through folders by tapping on them
3. Tap on a file to open it in the editor
4. Start editing - changes auto-save after 10 seconds of inactivity
5. Watch the status indicator for save confirmation

### 5. Create New Files

1. In the file browser, tap the "+" button
2. Enter the filename (can include path, e.g., `notes/meeting.md`)
3. Start editing the new file
4. First save will create the file on GitHub

## Architecture

### Project Structure

```
GitHubMobileEditor/
├── src/
│   ├── screens/           # UI screens
│   │   ├── AuthScreen.tsx
│   │   ├── RepositoryListScreen.tsx
│   │   ├── FileBrowserScreen.tsx
│   │   └── EditorScreen.tsx
│   ├── store/             # Redux store and slices
│   │   ├── authSlice.ts
│   │   ├── repositoriesSlice.ts
│   │   ├── filesSlice.ts
│   │   ├── editorSlice.ts
│   │   ├── syncSlice.ts
│   │   └── index.ts
│   ├── services/          # API and storage services
│   │   ├── githubApi.ts
│   │   ├── storage.ts
│   │   └── syncService.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/             # Utility functions and hooks
│   │   └── useSyncManager.ts
│   └── App.tsx            # Main app component
├── App.tsx                # Entry point
├── package.json
└── README.md
```

### Key Components

#### GitHub API Service (`githubApi.ts`)
Handles all GitHub API interactions:
- Token validation
- Repository verification
- Fetching file/folder contents
- Creating and updating files

#### Storage Service (`storage.ts`)
Manages local data persistence:
- Secure token storage
- Repository list
- File caching
- Sync queue

#### Sync Service (`syncService.ts`)
Manages offline sync queue:
- Queues failed saves for retry
- Processes queue when online
- Handles retry logic with exponential backoff

#### Sync Manager Hook (`useSyncManager.ts`)
Background sync coordination:
- Monitors network connectivity
- Triggers sync on reconnection
- Periodic queue processing
- App state management

### State Management

Redux store with 5 slices:
- **auth** - Token and authentication state
- **repositories** - Repository list and active repo
- **files** - File browser state and cache
- **editor** - Active file and edit state
- **sync** - Sync queue and online status

## How Auto-Save Works

1. User types in the editor
2. Each keystroke updates local state
3. A debounced save function is triggered (10 second delay)
4. If user continues typing, the timer resets
5. After 10 seconds of inactivity:
   - If online: Save directly to GitHub
   - If offline: Add to sync queue
6. Status indicator shows save progress
7. On error: Add to queue for retry

## Offline Support

The app works seamlessly offline:

1. **File Caching** - Opened files are cached locally
2. **Offline Editing** - Edit files without connection
3. **Sync Queue** - Changes queued for later sync
4. **Auto-Sync** - Queue processes automatically when online
5. **Retry Logic** - Failed saves retry up to 5 times
6. **Status Updates** - Clear indicators show offline state

## API Endpoints Used

- `GET /user` - Validate token
- `GET /repos/{owner}/{repo}` - Verify repository access
- `GET /repos/{owner}/{repo}/contents/{path}` - Get file/folder contents
- `PUT /repos/{owner}/{repo}/contents/{path}` - Create/update files

## Known Limitations (MVP)

- No markdown preview or rendering
- No syntax highlighting
- No file deletion or renaming
- No conflict resolution for multi-device edits
- No commit history viewing
- No branch management
- iOS only (no Android support)
- No dark mode
- No file search

## Future Enhancements

- Markdown preview
- Syntax highlighting for code files
- File operations (delete, rename, move)
- Conflict resolution
- Commit history viewer
- Branch switching
- Android support
- Dark mode
- Search functionality
- Settings screen

## Troubleshooting

### Token Invalid Error
- Verify your token has the correct scopes
- Check if token has expired
- Generate a new token if needed

### Can't See Repository
- Ensure you have access to the repository
- For private repos, token must have `repo` scope
- Check repository name format is correct

### Files Not Syncing
- Check network connectivity
- View sync queue status
- Try manual save button
- Check GitHub API rate limits

### App Crashes
- Check Xcode console for errors
- Clear app data and re-authenticate
- Ensure all dependencies are installed

## Contributing

This is an MVP implementation. Contributions welcome for:
- Bug fixes
- Performance improvements
- Feature enhancements (see Future Enhancements)
- Documentation improvements

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open a GitHub issue.
