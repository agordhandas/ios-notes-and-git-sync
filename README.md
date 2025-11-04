# GitHub Mobile Editor - Project Requirements

## Overview
A lightweight React Native app for iOS that allows users to read and edit files in GitHub repositories with automatic syncing, similar to Google Docs' auto-save behavior.

## Problem Statement
Existing solutions like Working Copy require payment for auto-sync, and GitHub Mobile doesn't provide a smooth editing experience. This app aims to provide a free, simple alternative focused on note-taking and basic file editing.

## Target User
Users who want to:
- Edit markdown files and other text files in GitHub repos from their iPhone
- Have changes automatically sync without manual commit/push actions
- Work offline and have changes sync when connection is restored
- Manage multiple repositories

## Core Features

### 1. Authentication
- **One-time setup**: User provides GitHub Personal Access Token
- **Secure storage**: Token stored in device keychain
- **Validation**: Verify token validity on entry
- **Scope needed**: `repo` scope for private repos, `public_repo` for public only

### 2. Repository Management
- **Add repositories**: User can add repos by providing https url of the repo
- **List view**: Show all added repositories
- **Switch repos**: Tap to switch between repos
- **Remove repos**: Option to remove repos from list
- **Local storage**: Repo list persisted on device

### 3. File Browser
- **Tree structure**: Display files and folders in hierarchical view
- **Navigation**: Tap folders to expand/collapse
- **All file types**: Show all files (not filtered to just .md)
- **File selection**: Tap file to open in editor
- **Visual indicators**: Different icons for folders vs files, file extensions visible

**Open Questions:**
- File size limits for loading? (e.g., max 1MB)
- Show file metadata (last modified, size)?

### 4. File Creation
- **New file button**: Available in file browser
- **Path specification**: User specifies filename and path
- **Folder creation**: Can create files in new folders (path will be created)
- **Default content**: New files start empty
- UI for specifying path - folder picker


### 5. Text Editor
- **Plain text editing**: Simple, responsive text input
- **No formatting**: Plain text only for MVP (no markdown preview, syntax highlighting)
- **Full screen**: Maximize editing space


### 6. Auto-Save & Sync
- **Debounce timing**: 10 seconds after last keystroke
- **Save indicator**: Visual status showing:
  - "Idle" - no unsaved changes
  - "Saving..." - sync in progress
  - "Saved ✓" - successfully synced
  - "Error ⚠" - failed to sync (with retry button)
- **GitHub API**: Use REST API to update files
- **Commit messages**: Auto-generated (e.g., "Update filename.md from mobile")
- **Independent saves**: Each file debounces independently if multiple files edited

**Technical Details:**
- Use GitHub Contents API (`PUT /repos/{owner}/{repo}/contents/{path}`)
- Need file SHA for updates (track in state)
- Handle API rate limits gracefully
- commit/push to `main`

### 7. Offline Support
- **Local caching**: Cache file contents using AsyncStorage
- **Offline editing**: Allow editing while offline
- **Sync queue**: Queue changes to sync when online
- **Network detection**: Use NetInfo to detect connectivity
- **Sync on reconnect**: Automatically attempt sync when connection restored
- **Conflict assumption**: Assume file won't change on GitHub while editing (no conflict resolution)

**Open Questions:**
- How much to cache? All files in repo or only opened files? - only open ones
- Cache expiration policy? few hours?
- Clear cache option in settings? yes

### 8. Error Handling
- **Invalid token**: Show error message, prompt to re-enter token
- **Network errors**: Show error with retry option
- **Permission errors**: Show clear message if user lacks repo access
- **API rate limits**: Display message, suggest waiting
- **Non-existent repo**: Validate repo exists when adding

**Open Questions:**
- Should we retry automatically on network errors?
- How many retry attempts before giving up?
- Log errors for debugging?

## Technical Architecture

### Technology Stack
- **Framework**: React Native (Expo vs bare TBD)
- **Navigation**: React Navigation (recommended)
- **State Management**: React Context or Redux (TBD)
- **Storage**: 
  - AsyncStorage for cache and repo list
  - react-native-keychain for secure token storage
- **Network**: 
  - Axios or fetch for API calls
  - NetInfo for connectivity detection
- **Debouncing**: lodash.debounce or use-debounce hook

### Key Dependencies
```json
{
  "react-native": "^0.72.0",
  "@react-navigation/native": "^6.x",
  "@react-navigation/stack": "^6.x",
  "axios": "^1.x",
  "@react-native-async-storage/async-storage": "^1.x",
  "react-native-keychain": "^8.x",
  "@react-native-community/netinfo": "^9.x",
  "lodash.debounce": "^4.x"
}
```

### API Integration
- **Base URL**: `https://api.github.com`
- **Key Endpoints**:
  - `GET /repos/{owner}/{repo}` - Verify repo exists
  - `GET /repos/{owner}/{repo}/contents/{path}` - Get file/folder contents
  - `PUT /repos/{owner}/{repo}/contents/{path}` - Create/update file
  - `GET /user` - Verify token (optional)

### Data Models

```typescript
interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string; // "owner/name"
  addedAt: number;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size: number;
  url: string;
}

interface CachedFile {
  path: string;
  content: string;
  sha: string;
  lastSynced: number;
  isDirty: boolean; // has unsaved changes
}

interface SyncStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  error?: string;
  lastSaved?: number;
}
```

## User Flows

### First Time Setup
1. User opens app
2. Prompted to enter GitHub Personal Access Token
3. Token validated against GitHub API
4. Token stored securely
5. Navigate to repository list (empty state)

### Adding a Repository
1. User taps "Add Repository" button
2. Enter owner/repo name (e.g., "username/my-notes")
3. App validates repo exists and user has access
4. Repo added to list
5. Navigate to file browser for that repo

### Editing a File
1. User selects repo from list
2. Browse file tree, tap on a file
3. File content loads (from cache or API)
4. User edits content
5. After 10 seconds of no typing, auto-save triggers
6. Status indicator shows "Saving..." then "Saved ✓"
7. If error, show "Error ⚠" with retry button

### Creating a New File
1. From file browser, tap "New File" button
2. Enter filename and path (e.g., "notes/meeting.md")
3. File created locally
4. Open in editor with empty content
5. User types content
6. Auto-save creates file on GitHub

### Working Offline
1. User edits file while offline
2. Changes saved to local cache
3. Status shows "Offline - will sync when connected"
4. When connection restored, app detects it
5. Queued changes automatically sync
6. Status updates to "Saved ✓"

## Out of Scope (MVP)

The following features are explicitly NOT included in the MVP:
- Markdown preview or rendering
- Syntax highlighting
- File deletion or renaming
- Merge conflict resolution
- Multiple device sync conflict handling
- Commit history viewing
- Branch management
- Pull requests
- Android support (iOS only for MVP)
- Dark mode
- File search
- Collaborative editing

These may be considered for future versions.

## Success Criteria

The MVP is considered successful when:
1. User can authenticate with GitHub token
2. User can add and switch between multiple repos
3. User can browse file tree and open files
4. User can create new files with custom paths
5. User can edit files with auto-save working reliably
6. Offline editing works and syncs when reconnected
7. Error states are handled gracefully
8. App feels responsive and smooth on iOS

## Open Questions & Decisions Needed

### High Priority
1. **Expo vs Bare React Native?**
   - Expo: Easier setup, faster development
   - Bare: More control, smaller bundle size

2. **State management approach?**
   - Context API: Simpler, less boilerplate
   - Redux: More structured, better for complex state

3. **Repo input format?**
   - Just "owner/repo"
   - Full GitHub URL with parsing
   - Search/autocomplete from user's repos

4. **File creation UX?**
   - Single text input for full path
   - Separate folder picker + filename
   - Create in current folder vs root

### Medium Priority
5. **Cache strategy?**
   - Cache all files on repo load
   - Cache only opened files
   - Cache expiration time

6. **Background save completion?**
   - If user closes app while saving, should save complete?
   - Requires background task setup

7. **Manual sync button?**
   - In addition to auto-save
   - Force sync all cached files

8. **File size limits?**
   - Don't load files over X MB
   - Warning for large files

### Low Priority
9. **Analytics/crash reporting?**
10. **App icon and branding**
11. **Onboarding tutorial**

## Timeline Estimate

- **Week 1**: Setup, auth flow, repo management
- **Week 2**: File browser, navigation
- **Week 3**: Editor, auto-save, sync logic
- **Week 4**: Offline support, error handling, polish
- **Week 5**: Testing, bug fixes, refinement

Total: ~5 weeks part-time or 2-3 weeks full-time for a single developer

## Getting Started for New Engineers

1. **Read this document thoroughly**
2. **Set up development environment**:
   - Install Node.js and npm
   - Install React Native CLI or Expo CLI
   - Set up iOS simulator (Xcode)
   - Clone repository
3. **Familiarize with GitHub API**:
   - Read GitHub REST API docs
   - Test API calls with Postman
   - Generate personal access token for testing
4. **Review tech stack documentation**:
   - React Native docs
   - React Navigation
   - AsyncStorage
5. **Start with authentication flow** as first task
6. **Ask questions early** - refer to Open Questions section

## Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/) (if using Expo)

