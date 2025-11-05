import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import repositoriesReducer from './repositoriesSlice';
import filesReducer from './filesSlice';
import editorReducer from './editorSlice';
import syncReducer from './syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    repositories: repositoriesReducer,
    files: filesReducer,
    editor: editorReducer,
    sync: syncReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
