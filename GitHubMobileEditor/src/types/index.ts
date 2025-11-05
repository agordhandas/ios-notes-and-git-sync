export interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  addedAt: number;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size: number;
  url: string;
}

export interface CachedFile {
  path: string;
  content: string;
  sha: string;
  lastSynced: number;
  isDirty: boolean;
}

export interface SyncStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  error?: string;
  lastSaved?: number;
}

export interface SyncQueueItem {
  id: string;
  repoFullName: string;
  filePath: string;
  content: string;
  sha: string | null;
  timestamp: number;
  retries: number;
}

export interface AppState {
  auth: AuthState;
  repositories: RepositoriesState;
  files: FilesState;
  editor: EditorState;
  sync: SyncState;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isValidating: boolean;
  error: string | null;
}

export interface RepositoriesState {
  list: Repository[];
  activeRepo: Repository | null;
  loading: boolean;
  error: string | null;
}

export interface FilesState {
  currentPath: string;
  pathHistory: string[];
  items: FileItem[];
  cache: Record<string, CachedFile>;
  loading: boolean;
  error: string | null;
}

export interface EditorState {
  activeFile: {
    path: string;
    content: string;
    sha: string;
    originalContent: string;
  } | null;
  isDirty: boolean;
  syncStatus: SyncStatus;
}

export interface SyncState {
  queue: SyncQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
}
