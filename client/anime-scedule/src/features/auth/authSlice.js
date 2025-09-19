import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { phase2Api } from '../../helpers/http-client'

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await phase2Api.post('/login', { email, password });
    const token = res?.data?.access_token;
    if (token) {
      try { localStorage.setItem('access_token', token); } catch (_) {}
      phase2Api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
  }
});

export const registerUser = createAsyncThunk('auth/register', async ({ username, email, password }, { rejectWithValue }) => {
  try {
    const res = await phase2Api.post('/register', { username, email, password });
    try { localStorage.setItem('registered', '1') } catch (_) {}
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
  }
});

export const loginWithGoogle = createAsyncThunk('auth/loginWithGoogle', async ({ id_token }, { rejectWithValue }) => {
  try {
    const res = await phase2Api.post('/login/google', { id_token });
    const token = res?.data?.access_token;
    if (token) {
      try { localStorage.setItem('access_token', token); } catch (_) {}
      phase2Api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
  }
});

const initialState = {
  token: typeof window !== 'undefined' ? (localStorage.getItem('access_token') || null) : null,
  loading: false,
  error: null,
  registered: typeof window !== 'undefined' ? !!localStorage.getItem('registered') : false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      try { localStorage.removeItem('access_token'); } catch (_) {}
      try { delete phase2Api.defaults.headers.common['Authorization']; } catch (_) {}
      state.registered = false;
    },
    clearError(state) { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => { state.loading = false; state.token = action.payload && action.payload.access_token ? action.payload.access_token : state.token })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })

      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => { state.loading = false; state.registered = true })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })
      .addCase(loginWithGoogle.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginWithGoogle.fulfilled, (state, action) => { state.loading = false; state.token = action.payload && action.payload.access_token ? action.payload.access_token : state.token })
      .addCase(loginWithGoogle.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
