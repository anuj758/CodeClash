import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../../utils/axiosClient';

// Helper to extract clean error messages from Axios
const getErrorMessage = (error) => 
  error.response?.data?.message || error.response?.data || error.message || 'Something went wrong';

// Registration Thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/register', formData);
      
      const { sessionId, user } = response.data;

      return {
        sessionId,
        tempUser: user
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Login Thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credential, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/login', credential);
      return response.data; // Returns { user, message }
    } catch (error) {
      // If backend returns 403 (unverified user), preserve user payload in rejection
      if (error.response?.status === 403 && error.response?.data?.user) {
        return rejectWithValue({
          isUnverified: true,
          user: error.response.data.user,
          message: getErrorMessage(error)
        });
      }
      return rejectWithValue({
        isUnverified: false,
        message: getErrorMessage(error)
      });
    }
  }
);

// Check Auth Thunk
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/check');
      return data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Logout Thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/logout');
      return null;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    tempUser: null,       // Stores unverified user data
    sessionId: null,      // Stores session ID for polling
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTempUser: (state, action) => {
      state.tempUser = action.payload.tempUser || null;
      state.sessionId = action.payload.sessionId || null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.tempUser = null;
      state.sessionId = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.tempUser = action.payload.tempUser;
        state.sessionId = action.payload.sessionId;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tempUser = null;
        state.sessionId = null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;

        if (action.payload?.isUnverified) {
          state.tempUser = action.payload.user;
          state.error = action.payload.message;
        } else {
          state.error = action.payload?.message || action.payload;
        }
      })

      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = typeof action.payload === 'string' ? action.payload : null;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.tempUser = null;
        state.sessionId = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = typeof action.payload === 'string' ? action.payload : null;
      });
  },
});

export const { clearError, setTempUser, setCredentials } = authSlice.actions;
export default authSlice.reducer;