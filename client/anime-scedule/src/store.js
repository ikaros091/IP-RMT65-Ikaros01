import { configureStore } from '@reduxjs/toolkit'
import animeReducer from './features/anime/animeSlice'
import authReducer from './features/auth/authSlice'

export const store = configureStore({
  reducer: {
    anime: animeReducer,
    auth: authReducer,
  },
})