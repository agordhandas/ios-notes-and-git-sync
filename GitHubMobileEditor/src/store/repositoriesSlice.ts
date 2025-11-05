import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RepositoriesState, Repository } from '../types';

const initialState: RepositoriesState = {
  list: [],
  activeRepo: null,
  loading: false,
  error: null,
};

const repositoriesSlice = createSlice({
  name: 'repositories',
  initialState,
  reducers: {
    addRepository: (state, action: PayloadAction<Repository>) => {
      const exists = state.list.find(r => r.id === action.payload.id);
      if (!exists) {
        state.list.push(action.payload);
      }
    },
    removeRepository: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(r => r.id !== action.payload);
      if (state.activeRepo?.id === action.payload) {
        state.activeRepo = null;
      }
    },
    setActiveRepository: (state, action: PayloadAction<Repository>) => {
      state.activeRepo = action.payload;
    },
    setRepositories: (state, action: PayloadAction<Repository[]>) => {
      state.list = action.payload;
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
  addRepository,
  removeRepository,
  setActiveRepository,
  setRepositories,
  setLoading,
  setError,
} = repositoriesSlice.actions;
export default repositoriesSlice.reducer;
