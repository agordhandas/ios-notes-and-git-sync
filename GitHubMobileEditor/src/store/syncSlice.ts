import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncState, SyncQueueItem } from '../types';

const initialState: SyncState = {
  queue: [],
  isOnline: true,
  isSyncing: false,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    addToQueue: (state, action: PayloadAction<SyncQueueItem>) => {
      const existingIndex = state.queue.findIndex(
        item => item.repoFullName === action.payload.repoFullName && item.filePath === action.payload.filePath
      );
      if (existingIndex >= 0) {
        state.queue[existingIndex] = action.payload;
      } else {
        state.queue.push(action.payload);
      }
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
    },
    incrementRetry: (state, action: PayloadAction<string>) => {
      const item = state.queue.find(item => item.id === action.payload);
      if (item) {
        item.retries += 1;
      }
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    clearQueue: (state) => {
      state.queue = [];
    },
  },
});

export const {
  addToQueue,
  removeFromQueue,
  incrementRetry,
  setOnlineStatus,
  setSyncing,
  clearQueue,
} = syncSlice.actions;
export default syncSlice.reducer;
