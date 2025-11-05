import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Repository, CachedFile, SyncQueueItem } from '../types';

const KEYS = {
  TOKEN: 'github_token',
  REPOSITORIES: 'repositories',
  FILE_CACHE: 'file_cache',
  SYNC_QUEUE: 'sync_queue',
};

export const storageService = {
  // Token management (secure storage)
  async saveToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.TOKEN);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
  },

  // Repositories management
  async saveRepositories(repositories: Repository[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.REPOSITORIES, JSON.stringify(repositories));
  },

  async getRepositories(): Promise<Repository[]> {
    const data = await AsyncStorage.getItem(KEYS.REPOSITORIES);
    return data ? JSON.parse(data) : [];
  },

  // File cache management
  async saveCachedFile(repoFullName: string, file: CachedFile): Promise<void> {
    const cacheKey = `${KEYS.FILE_CACHE}:${repoFullName}`;
    const existingCache = await this.getFileCache(repoFullName);
    existingCache[file.path] = file;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(existingCache));
  },

  async getFileCache(repoFullName: string): Promise<Record<string, CachedFile>> {
    const cacheKey = `${KEYS.FILE_CACHE}:${repoFullName}`;
    const data = await AsyncStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : {};
  },

  async getCachedFile(repoFullName: string, filePath: string): Promise<CachedFile | null> {
    const cache = await this.getFileCache(repoFullName);
    return cache[filePath] || null;
  },

  async removeCachedFile(repoFullName: string, filePath: string): Promise<void> {
    const cache = await this.getFileCache(repoFullName);
    delete cache[filePath];
    const cacheKey = `${KEYS.FILE_CACHE}:${repoFullName}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
  },

  async clearFileCache(repoFullName?: string): Promise<void> {
    if (repoFullName) {
      const cacheKey = `${KEYS.FILE_CACHE}:${repoFullName}`;
      await AsyncStorage.removeItem(cacheKey);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(KEYS.FILE_CACHE));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  },

  // Sync queue management
  async saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const data = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async clearSyncQueue(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SYNC_QUEUE);
  },
};
