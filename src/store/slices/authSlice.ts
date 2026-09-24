import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
  initialized: false,
};

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) return rejectWithValue(error.message);
    return data as Profile;
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue, dispatch }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return rejectWithValue(error.message);
    if (data.user) {
      const result = await dispatch(fetchProfile(data.user.id));
      return result.payload;
    }
    return rejectWithValue('No user returned');
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    { email, password, fullName, phone, role }: { email: string; password: string; fullName: string; phone: string; role: UserRole },
    { rejectWithValue, dispatch }
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return rejectWithValue(error.message);
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
        role,
        is_approved: role === 'patient',
      });
      if (profileError) return rejectWithValue(profileError.message);
      const result = await dispatch(fetchProfile(data.user.id));
      return result.payload;
    }
    return rejectWithValue('No user returned');
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates: Partial<Profile>, { rejectWithValue, getState }) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.profile) return rejectWithValue('No profile');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.auth.profile.id)
      .select()
      .maybeSingle();
    if (error) return rejectWithValue(error.message);
    return data as Profile;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; email: string } | null>) => {
      state.user = action.payload;
      if (!action.payload) {
        state.profile = null;
      }
    },
    setProfile: (state, action: PayloadAction<Profile | null>) => {
      state.profile = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    signOut: (state) => {
      state.user = null;
      state.profile = null;
      state.error = null;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { setUser, setProfile, clearError, signOut, setInitialized } = authSlice.actions;
export default authSlice.reducer;
