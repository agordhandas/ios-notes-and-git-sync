import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '../types';

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  isValidating: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearToken: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setValidating: (state, action: PayloadAction<boolean>) => {
      state.isValidating = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isValidating = false;
    },
  },
});

export const { setToken, clearToken, setValidating, setAuthError } = authSlice.actions;
export default authSlice.reducer;
