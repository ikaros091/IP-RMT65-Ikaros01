import { useEffect, useMemo, useState } from "react";
import { phase2Api } from "../helpers/http-client";
import { useNavigate } from "react-router-dom";

function AnimeList() {
  const navigate = useNavigate();

  const [allAnimes, setAllAnimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState(""); // '', 'score', 'title'
  const [selectedGenres, setSelectedGenres] = useState([]);

  // popup
  const [showFilter, setShowFilter] = useState(false);
  const [pendingSelected, setPendingSelected] = useState([]);

  // pagination (client-side)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  // fetch all animes once (use a large limit) and derive genres
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        // request many items so we can filter client-side (server supports limit)
        const res = await phase2Api.get('/animes', { params: { page: 1, limit: 1000 } });
        if (!isMounted) return;
        setAllAnimes(res.data && res.data.data ? res.data.data : []);
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false };
  }, []);

  // build unique genres from allAnimes
  const genres = useMemo(() => {
    const s = new Set();
    allAnimes.forEach((a) => {
      if (!a.genres) return;
      // assume genres is comma-separated string
      String(a.genres)
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean)
        .forEach((g) => s.add(g));
    });
    return Array.from(s).sort();
  }, [allAnimes]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Derived: filtered + sorted list
  const filtered = useMemo(() => {
    let list = allAnimes.slice();

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((a) => a.title && a.title.toLowerCase().includes(q));
    }

    if (selectedGenres.length > 0) {
      // include if anime has ANY of selected genres
      list = list.filter((a) => {
        if (!a.genres) return false;
        const gs = String(a.genres).toLowerCase();
        return selectedGenres.some((g) => gs.includes(g.toLowerCase()));
      });
    }

    if (sortBy === 'score') {
      list.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [allAnimes, debouncedSearch, selectedGenres, sortBy]);

  // pagination math
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  function openFilter() {
    setPendingSelected(selectedGenres.slice());
    setShowFilter(true);
  }

  function togglePendingGenre(g) {
    if (pendingSelected.includes(g)) setPendingSelected(pendingSelected.filter(x => x !== g));
    else setPendingSelected([...pendingSelected, g]);
  }

  function submitFilter() {
    setSelectedGenres(pendingSelected.slice());
    setShowFilter(false);
    setPage(1);
  }

  function clearFilters() {
    setSelectedGenres([]);
    setPendingSelected([]);
    setPage(1);
  }

  return (
    <div className="p-8 bg-blue-50 min-h-screen">
      <h1 className="text-center text-3xl font-bold text-blue-600 mb-8">Anime List</h1>

      {/* Search + Sort + Filter */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search anime..."
          className="border rounded px-4 py-2 w-full md:w-1/3 shadow-sm"
        />

        {/* Sort + Filter */}
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            <button onClick={() => setSortBy('title')} className={`px-4 py-2 rounded shadow ${sortBy==='title' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
              Sort Title
            </button>
            <button onClick={() => setSortBy('score')} className={`px-4 py-2 rounded shadow ${sortBy==='score' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
              Sort Score
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={openFilter} className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:scale-105 transition">Filter</button>
            <button onClick={clearFilters} className="px-3 py-2 border rounded">Clear</button>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="px-3 py-2 border rounded shadow-sm">
              <option value={4}>4 / page</option>
              <option value={8}>8 / page</option>
              <option value={12}>12 / page</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}

      {/* Anime Card List */}
      <div className="space-y-4">
        {paged.map((a) => (
          <div key={a.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center hover:shadow-lg hover:scale-[1.01] transition cursor-pointer">
            <div className="flex items-center space-x-6" onClick={() => navigate(`/animeList/${a.id}`)}>
              <img src={a.image_url || 'https://via.placeholder.com/150x220'} alt={a.title} className="w-40 h-56 object-cover rounded-lg shadow-md" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{a.title}</h2>
                <p className="text-gray-600 mb-1"><span className="font-semibold">Status:</span> {a.status || '-'}</p>
                <p className="text-gray-600 mb-1"><span className="font-semibold">Score:</span> ⭐ {a.score || '-'}</p>
                <p className="text-gray-600"><span className="font-semibold">Genres:</span> {a.genres || '-'}</p>
              </div>
            </div>

            {localStorage.getItem('access_token') ? (
              <button onClick={async (e) => {
                e.stopPropagation();
                const token = localStorage.getItem('access_token');
                if (!token) { alert('Please login'); return; }
                try {
                  const headers = { Authorization: `Bearer ${token}` };
                  const existing = await phase2Api.get('/mylist', { headers });
                  const exists = Array.isArray(existing.data) && existing.data.some((it) => {
                    return (it.anime_id && Number(it.anime_id) === Number(a.id)) || (it.Anime && Number(it.Anime.id) === Number(a.id));
                  });
                  if (exists) { alert('Already in your MyList'); return; }
                  await phase2Api.post('/mylist', { anime_id: a.id }, { headers });
                  // notify other components (recommendation popup) to refresh
                  try { window.dispatchEvent(new CustomEvent('mylist:changed')); } catch (_) {}
                  alert('Added to your list');
                } catch (err) {
                  alert('Failed to add');
                }
              }} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md shadow hover:scale-105 transition">+ Add</button>
            ) : null}
          </div>
        ))}
        {paged.length === 0 && !loading && <div className="text-center py-8">No anime found.</div>}
      </div>

      {/* Pagination (sliding window up to 5 page buttons) */}
      <div className="flex justify-center items-center mt-6 gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p-1))} className="px-3 py-1 border rounded">« Prev</button>
        {(() => {
          const maxButtons = 5;
          if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }).map((_, idx) => (
              <button key={idx} onClick={() => setPage(idx+1)} className={`px-3 py-1 border rounded ${page===idx+1 ? 'bg-blue-500 text-white' : ''}`}>{idx+1}</button>
            ));
          }

          // sliding window
          let start = Math.max(1, page - Math.floor(maxButtons / 2));
          let end = start + maxButtons - 1;
          if (end > totalPages) {
            end = totalPages;
            start = end - maxButtons + 1;
          }

          const buttons = [];
          for (let p = start; p <= end; p++) {
            buttons.push(
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 border rounded ${page===p ? 'bg-blue-500 text-white' : ''}`}>{p}</button>
            );
          }

          return buttons;
        })()}
        <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} className="px-3 py-1 border rounded">Next »</button>
      </div>

      {/* Filter Popup (bottom center) */}
      {showFilter && (
        <div className="fixed left-0 right-0 bottom-8 flex justify-center items-end z-50">
          <div className="relative w-full max-w-2xl bg-white rounded-t-xl shadow-xl p-6">
            {/* Close button top-right */}
            <button onClick={() => setShowFilter(false)} className="absolute right-3 top-3 text-gray-600 hover:text-gray-800">✕</button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Genres</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-2">
              {genres.map((g) => {
                const active = pendingSelected.includes(g);
                return (
                  <button key={g} onClick={() => togglePendingGenre(g)} className={`text-left px-3 py-2 rounded-md border ${active ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700'}`}>
                    <input type="checkbox" checked={active} readOnly className="mr-2" /> {g}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center">
              <button onClick={submitFilter} className="px-6 py-2 bg-blue-600 text-white rounded">Apply Filter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnimeList;
