import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EditorState, SyncStatus } from '../types';

const initialState: EditorState = {
  activeFile: null,
  isDirty: false,
  syncStatus: {
    state: 'idle',
  },
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    openFile: (state, action: PayloadAction<{ path: string; content: string; sha: string }>) => {
      state.activeFile = {
        ...action.payload,
        originalContent: action.payload.content,
      };
      state.isDirty = false;
      state.syncStatus = { state: 'idle' };
    },
    updateContent: (state, action: PayloadAction<string>) => {
      if (state.activeFile) {
        state.activeFile.content = action.payload;
        state.isDirty = state.activeFile.content !== state.activeFile.originalContent;
      }
    },
    closeFile: (state) => {
      state.activeFile = null;
      state.isDirty = false;
      state.syncStatus = { state: 'idle' };
    },
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
    },
    markAsSaved: (state, action: PayloadAction<{ sha: string }>) => {
      if (state.activeFile) {
        state.activeFile.sha = action.payload.sha;
        state.activeFile.originalContent = state.activeFile.content;
        state.isDirty = false;
      }
      state.syncStatus = {
        state: 'saved',
        lastSaved: Date.now(),
      };
    },
  },
});

export const {
  openFile,
  updateContent,
  closeFile,
  setSyncStatus,
  markAsSaved,
} = editorSlice.actions;
export default editorSlice.reducer;
