import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnimeById, addToMyList, fetchMyList } from '../features/anime/animeSlice';

function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { animeById: anime, loading, error } = useSelector((s) => s.anime);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchAnimeById(id));
  }, [dispatch, id]);

  async function handleAddToMyList() {
    if (!anime) return;
    try {
      setAdding(true);
      const res = await dispatch(addToMyList(anime.id));
      if (res.error) {
        alert('Failed to add to list.');
      } else {
        dispatch(fetchMyList());
        try { window.dispatchEvent(new CustomEvent('mylist:changed')); } catch (_) {}
        alert('Added to your list');
      }
    } catch (err) {
      alert('Failed to add to list. Make sure you are logged in.');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error && error.message ? error.message : JSON.stringify(error)}</div>;
  if (!anime) return null;

  const genres = anime.genres ? String(anime.genres).split(',').map((g) => g.trim()).filter(Boolean) : [];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-white min-h-screen flex justify-center items-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-6 max-w-3xl w-full animate-fadeIn">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg mb-4 transition transform hover:scale-105">← Back</button>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Anime Image */}
          <img src={anime.image_url || 'https://via.placeholder.com/220x320'} alt={anime.title} className="w-64 rounded-xl shadow-md transform hover:scale-105 transition duration-300 ease-in-out" />

          {/* Anime Info */}
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-blue-600">{anime.title}</h1>
            <p><span className="font-semibold">Episodes:</span> {anime.episodes || '-'}</p>
            <p><span className="font-semibold">Status:</span> {anime.status || '-'}</p>
            <p><span className="font-semibold">Demographic:</span> {anime.demographics || '-'}</p>
            <p><span className="font-semibold">Score:</span> {anime.score || '-'}</p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mt-2">
              {genres.map((genre) => (
                <span key={genre} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition cursor-pointer">{genre}</span>
              ))}
            </div>

            {/* Button - only show if logged in */}
            {localStorage.getItem('access_token') ? (
              <button onClick={handleAddToMyList} disabled={adding} className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition transform hover:scale-110">
                {adding ? 'Adding...' : '+ Add to My List'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Synopsis */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-blue-600 border-l-4 border-blue-600 pl-2 mb-2">Synopsis</h2>
          <p className="text-gray-700 leading-relaxed">{anime.synopsis || 'No synopsis available.'}</p>
        </div>
      </div>
    </div>
  );
}

export default AnimeDetail;
