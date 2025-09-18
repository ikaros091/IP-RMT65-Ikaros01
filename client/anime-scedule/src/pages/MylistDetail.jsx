import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { phase2Api } from '../helpers/http-client';

function MyListById() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null); // mylist item
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkedMap, setCheckedMap] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Please login to view this page');
          return;
        }
          const res = await phase2Api.get(`/mylist/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!mounted) return;
          let data = res.data;
          // if included Anime has no image or episodes, fetch from /animes/:anime_id
          const animeIncluded = data.Anime || {};
          if ((!animeIncluded.image_url || !animeIncluded.episodes) && data.anime_id) {
            try {
              const r2 = await phase2Api.get(`/animes/${data.anime_id}`);
              data.Anime = { ...(data.Anime || {}), ...(r2.data || {}) };
            } catch (e) {
              // ignore fallback failure
            }
          }
          setItem(data);
        // initialize checked map based on data.progress and anime.episodes
        const episodes = Number(data.Anime && data.Anime.episodes) || 0;
        const map = {};
        const watched = Number(data.progress) || 0;
        for (let i = 1; i <= episodes; i++) {
          map[i] = i <= watched;
        }
        setCheckedMap(map);
      } catch (err) {
        setError(err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!item) return null;

  const anime = item.Anime || {};
  const totalEpisodes = Number(anime.episodes) || 0;

  function computeStatusFromChecked(map) {
    const checkedCount = Object.values(map).filter(Boolean).length;
    if (checkedCount === 0) return 'Planned';
    if (checkedCount > 0 && checkedCount < totalEpisodes) return 'Watching';
    if (totalEpisodes > 0 && checkedCount >= totalEpisodes) return 'Completed';
    return 'Planned';
  }

  async function toggleEpisode(num) {
    const newMap = { ...checkedMap, [num]: !checkedMap[num] };
    setCheckedMap(newMap);
    const checkedCount = Object.values(newMap).filter(Boolean).length;
    // optimistic update: update server progress
    try {
      setUpdating(true);
      const token = localStorage.getItem('access_token');
      await phase2Api.put(`/mylist/${item.id}`, { progress: checkedCount }, { headers: { Authorization: `Bearer ${token}` } });
      // update local item.status and progress
      setItem((prev) => ({ ...prev, progress: checkedCount, status: computeStatusFromChecked(newMap) }));
    } catch (err) {
      alert('Failed to update progress');
      // revert
      setCheckedMap(checkedMap);
    } finally {
      setUpdating(false);
    }
  }

  async function removeItem() {
    if (!confirm('Remove this anime from your list?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await phase2Api.delete(`/mylist/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
  try { window.dispatchEvent(new CustomEvent('mylist:changed')); } catch (_) {}
  navigate('/myList');
    } catch (err) {
      alert('Failed to remove');
    }
  }

  return (
    <div className="p-8 bg-blue-50 min-h-screen">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:scale-105 transition mb-6">← Back</button>

      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-4xl mx-auto animate-fade-in">
        <div className="flex flex-col md:flex-row gap-6">
          <img src={anime.image_url || 'https://via.placeholder.com/220x320'} alt={anime.title} className="w-64 h-80 object-cover rounded-xl shadow-md animate-pop" />

          <div className="flex-1 space-y-3">
            <h1 className="text-3xl font-bold text-gray-800">{anime.title}</h1>
            <p className="text-gray-700"><span className="font-semibold">Demographic:</span> <span className="bg-yellow-200 px-2 py-1 rounded-full text-sm">{anime.demographics || '-'}</span></p>

            <div>
              <h2 className="text-lg font-semibold text-blue-600 mb-1">Synopsis</h2>
              <p className="bg-blue-50 p-3 rounded-md shadow-sm text-gray-700">{anime.synopsis || 'No synopsis'}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(anime.genres || '').split(',').map((g) => g && <span key={g} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm shadow-sm">{g.trim()}</span>)}
            </div>
          </div>
        </div>

        {/* Episodes grid */}
        <div className="mt-6">
          <h2 className="font-semibold text-gray-800 mb-2">Episodes</h2>
          <div className="max-h-64 overflow-y-auto p-2 border rounded grid grid-cols-2 sm:grid-cols-4 gap-3">
            {totalEpisodes === 0 && <div className="col-span-full text-gray-600">No episode data available.</div>}
            {Array.from({ length: totalEpisodes }, (_, i) => {
              const num = i + 1;
              const checked = !!checkedMap[num];
              return (
                <label key={num} className="flex items-center gap-2 border p-2 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50">
                  <input type="checkbox" checked={checked} onChange={() => toggleEpisode(num)} className="w-4 h-4" />
                  Ep {num}
                </label>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm">Status: <span className="font-semibold">{computeStatusFromChecked(checkedMap)}</span></div>
          <div>
            <button onClick={removeItem} disabled={updating} className="px-6 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 hover:scale-105 transition">Remove from My List</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyListById;
