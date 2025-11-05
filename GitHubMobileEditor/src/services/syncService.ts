import { githubApi } from './githubApi';
import { storageService } from './storage';
import { SyncQueueItem } from '../types';
import { v4 as uuidv4 } from 'react-native-uuid';

const MAX_RETRIES = 5;

export const syncService = {
  async addToQueue(
    repoFullName: string,
    filePath: string,
    content: string,
    sha: string | null
  ): Promise<SyncQueueItem> {
    const queueItem: SyncQueueItem = {
      id: uuidv4() as string,
      repoFullName,
      filePath,
      content,
      sha,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue = await storageService.getSyncQueue();
    const existingIndex = queue.findIndex(
      item => item.repoFullName === repoFullName && item.filePath === filePath
    );

    if (existingIndex >= 0) {
      queue[existingIndex] = queueItem;
    } else {
      queue.push(queueItem);
    }

    await storageService.saveSyncQueue(queue);
    return queueItem;
  },

  async syncQueueItem(item: SyncQueueItem): Promise<{ success: boolean; sha?: string; error?: string }> {
    try {
      const [owner, repo] = item.repoFullName.split('/');
      const result = await githubApi.updateFile(
        owner,
        repo,
        item.filePath,
        item.content,
        item.sha,
        `Update ${item.filePath} from mobile`
      );

      return { success: true, sha: result.sha };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  },

  async processQueue(): Promise<{ processed: number; failed: number }> {
    const queue = await storageService.getSyncQueue();
    let processed = 0;
    let failed = 0;

    const remainingQueue: SyncQueueItem[] = [];

    for (const item of queue) {
      const result = await this.syncQueueItem(item);

      if (result.success) {
        processed++;
        // Update cached file with new SHA
        const [owner, repo] = item.repoFullName.split('/');
        const cachedFile = await storageService.getCachedFile(item.repoFullName, item.filePath);
        if (cachedFile && result.sha) {
          cachedFile.sha = result.sha;
          cachedFile.isDirty = false;
          cachedFile.lastSynced = Date.now();
          await storageService.saveCachedFile(item.repoFullName, cachedFile);
        }
      } else {
        if (item.retries < MAX_RETRIES) {
          item.retries++;
          remainingQueue.push(item);
        } else {
          failed++;
        }
      }
    }

    await storageService.saveSyncQueue(remainingQueue);
    return { processed, failed };
  },

  async clearQueue(): Promise<void> {
    await storageService.clearSyncQueue();
  },

  async getQueueLength(): Promise<number> {
    const queue = await storageService.getSyncQueue();
    return queue.length;
  },
};
