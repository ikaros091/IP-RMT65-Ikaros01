import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { phase2Api } from '../../helpers/http-client'

// fetch animes with optional params
export const fetchAnimes = createAsyncThunk('anime/fetchAnimes', async (params = {}, { rejectWithValue }) => {
	try {
		const res = await phase2Api.get('/animes', { params });
		return res.data;
	} catch (err) {
		return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
	}
});

export const fetchAnimeById = createAsyncThunk('anime/fetchAnimeById', async (id, { rejectWithValue }) => {
	try {
		const res = await phase2Api.get(`/animes/${id}`);
		return res.data;
	} catch (err) {
		return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
	}
});

export const fetchMyList = createAsyncThunk('anime/fetchMyList', async (_, { rejectWithValue }) => {
	try {
		const token = localStorage.getItem('access_token');
		const res = await phase2Api.get('/mylist', { headers: { Authorization: `Bearer ${token}` } });
		return res.data;
	} catch (err) {
		return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
	}
});

export const addToMyList = createAsyncThunk('anime/addToMyList', async (anime_id, { rejectWithValue }) => {
	try {
		const token = localStorage.getItem('access_token');
		const res = await phase2Api.post('/mylist', { anime_id }, { headers: { Authorization: `Bearer ${token}` } });
		return res.data;
	} catch (err) {
		return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
	}
});

export const deleteFromMyList = createAsyncThunk('anime/deleteFromMyList', async (id, { rejectWithValue }) => {
	try {
		const token = localStorage.getItem('access_token');
		const res = await phase2Api.delete(`/mylist/${id}`, { headers: { Authorization: `Bearer ${token}` } });
		return { id, data: res.data };
	} catch (err) {
		return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
	}
});

export const updateMyListProgress = createAsyncThunk('anime/updateMyListProgress', async ({ id, progress }, { rejectWithValue }) => {
	try {
		const token = localStorage.getItem('access_token');
		const res = await phase2Api.put(`/mylist/${id}`, { progress }, { headers: { Authorization: `Bearer ${token}` } });
		return res.data;
	} catch (err) {
		return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
	}
});

export const fetchRecommendations = createAsyncThunk('anime/fetchRecommendations', async (_, { rejectWithValue }) => {
	try {
		const token = localStorage.getItem('access_token');
		const res = await phase2Api.get('/recommendations', { headers: { Authorization: `Bearer ${token}` } });
		return res.data.recommendations || [];
	} catch (err) {
		return rejectWithValue(err.response && err.response.data ? err.response.data : { message: err.message });
	}
});

const initialState = {
	animes: [],
	animesMeta: { page: 1, limit: 8, totalPages: 0, totalData: 0 },
	animeById: null,
	myList: [],
	recommendations: [],
	loading: false,
	error: null,
};

const animeSlice = createSlice({
	name: 'anime',
	initialState,
	reducers: {
		clearAnimeById(state) { state.animeById = null },
		clearError(state) { state.error = null }
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAnimes.pending, (state) => { state.loading = true; state.error = null })
			.addCase(fetchAnimes.fulfilled, (state, action) => {
				state.loading = false;
				state.animes = action.payload.data || [];
				state.animesMeta = { page: action.payload.page, limit: action.payload.limit, totalPages: action.payload.totalPages, totalData: action.payload.totalData };
			})
			.addCase(fetchAnimes.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })

			.addCase(fetchAnimeById.pending, (state) => { state.loading = true; state.error = null })
			.addCase(fetchAnimeById.fulfilled, (state, action) => { state.loading = false; state.animeById = action.payload })
			.addCase(fetchAnimeById.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })

			.addCase(fetchMyList.pending, (state) => { state.loading = true; state.error = null })
			.addCase(fetchMyList.fulfilled, (state, action) => { state.loading = false; state.myList = action.payload })
			.addCase(fetchMyList.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })

			.addCase(addToMyList.pending, (state) => { state.loading = true; state.error = null })
			.addCase(addToMyList.fulfilled, (state, action) => { state.loading = false; state.myList.push(action.payload) })
			.addCase(addToMyList.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })

			.addCase(deleteFromMyList.pending, (state) => { state.loading = true; state.error = null })
			.addCase(deleteFromMyList.fulfilled, (state, action) => {
				state.loading = false;
				state.myList = state.myList.filter(item => item.id !== action.payload.id);
			})
			.addCase(deleteFromMyList.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })

			.addCase(updateMyListProgress.pending, (state) => { state.loading = true; state.error = null })
			.addCase(updateMyListProgress.fulfilled, (state, action) => {
				state.loading = false;
				const idx = state.myList.findIndex(i => i.id === action.payload.id);
				if (idx >= 0) state.myList[idx] = action.payload;
			})
			.addCase(updateMyListProgress.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })

			.addCase(fetchRecommendations.pending, (state) => { state.loading = true; state.error = null })
			.addCase(fetchRecommendations.fulfilled, (state, action) => { state.loading = false; state.recommendations = action.payload })
			.addCase(fetchRecommendations.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error })
	}
})

export const { clearAnimeById, clearError } = animeSlice.actions
export default animeSlice.reducer
