import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phase2Api } from '../helpers/http-client';

function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await phase2Api.get(`/animes/${id}`);
        if (!mounted) return;
        setAnime(res.data);
      } catch (err) {
        setError(err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, [id]);

  async function addToMyList() {
    try {
      setAdding(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please login to add to your list');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      // check duplicates
      const existing = await phase2Api.get('/mylist', { headers });
      const exists = Array.isArray(existing.data) && existing.data.some((it) => {
        return (it.anime_id && Number(it.anime_id) === Number(anime.id)) || (it.Anime && Number(it.Anime.id) === Number(anime.id));
      });
      if (exists) {
        alert('This anime is already in your MyList');
        return;
      }

      await phase2Api.post('/mylist', { anime_id: anime.id }, { headers });
  try { window.dispatchEvent(new CustomEvent('mylist:changed')); } catch (_) {}
  alert('Added to your list');
    } catch (err) {
      alert('Failed to add to list. Make sure you are logged in.');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!anime) return null;

  const genres = anime.genres ? String(anime.genres).split(',').map(g => g.trim()).filter(Boolean) : [];

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
              <button onClick={addToMyList} disabled={adding} className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition transform hover:scale-110">
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
