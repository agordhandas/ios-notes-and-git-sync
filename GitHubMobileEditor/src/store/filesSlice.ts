import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilesState, FileItem, CachedFile } from '../types';

const initialState: FilesState = {
  currentPath: '',
  items: [],
  cache: {},
  loading: false,
  error: null,
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.currentPath = action.payload;
    },
    setFileItems: (state, action: PayloadAction<FileItem[]>) => {
      state.items = action.payload;
    },
    setCachedFile: (state, action: PayloadAction<CachedFile>) => {
      state.cache[action.payload.path] = action.payload;
    },
    updateCachedFileContent: (state, action: PayloadAction<{ path: string; content: string; isDirty: boolean }>) => {
      if (state.cache[action.payload.path]) {
        state.cache[action.payload.path].content = action.payload.content;
        state.cache[action.payload.path].isDirty = action.payload.isDirty;
      }
    },
    removeCachedFile: (state, action: PayloadAction<string>) => {
      delete state.cache[action.payload];
    },
    clearCache: (state) => {
      state.cache = {};
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setCurrentPath,
  setFileItems,
  setCachedFile,
  updateCachedFileContent,
  removeCachedFile,
  clearCache,
  setLoading,
  setError,
} = filesSlice.actions;
export default filesSlice.reducer;
