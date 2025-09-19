import { useEffect, useState } from "react";
import { FaHome, FaList, FaHeart, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations, addToMyList, fetchMyList, fetchAnimes } from '../features/anime/animeSlice';

function SideBar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = !!localStorage.getItem("access_token");

  // recommendation popup state
  const [recOpen, setRecOpen] = useState(false);
  const { recommendations: recs, loading: loadingRecs } = useSelector(s => s.anime);

  useEffect(() => {
    const onStorage = () => {};
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!isLoggedIn) return null; // sidebar hidden when not logged in

  async function openRecommendations() {
    setRecOpen(true);
    try {
      await dispatch(fetchRecommendations()).unwrap();
    } catch (err) {
      if (recOpen) window.alert("Gagal memuat rekomendasi. Coba lagi nanti.");
    }
  }

  async function handleAddRecommendation(rec) {
    try {
      if (!isLoggedIn) return window.alert("Harap login untuk menambahkan ke My List.");

      // search by title to find ID via redux thunk
      let candidates = [];
      try {
        const r = await dispatch(fetchAnimes({ search: rec.title, limit: 5 }));
        candidates = (r && r.payload && Array.isArray(r.payload.data)) ? r.payload.data : [];
      } catch (_) {
        candidates = [];
      }

      if (candidates.length === 0) return window.alert("Tidak menemukan anime yang sesuai di database untuk ditambahkan.");
      const matched = candidates.find(a => a.title && a.title.toLowerCase() === rec.title.toLowerCase()) || candidates[0];

      // check duplicates in store
      const mylists = (await dispatch(fetchMyList()).unwrap()) || [];
      const exists = mylists.some(m => (m.anime_id && matched.id && Number(m.anime_id) === Number(matched.id)) || (m.Anime && m.Anime.title && matched.title && m.Anime.title === matched.title));
      if (exists) return window.alert("Anime sudah ada di My List Anda.");

      const res = await dispatch(addToMyList(matched.id));
      if (res.error) throw res.error;
      try { window.dispatchEvent(new CustomEvent('mylist:changed')); } catch (_) {}
      window.alert("Berhasil ditambahkan ke My List");
    } catch (err) {
      console.error("Failed to add recommendation to mylist", err);
      const message = err && err.message ? err.message : "Gagal menambahkan. Coba lagi.";
      window.alert(message);
    }
  }

  // refresh recommendations when mylist changes (so genres-based recommendations update)
  useEffect(() => {
    const onMyListChanged = () => {
      dispatch(fetchRecommendations()).catch(() => {});
    };
    window.addEventListener('mylist:changed', onMyListChanged);
    return () => window.removeEventListener('mylist:changed', onMyListChanged);
  }, [dispatch]);

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 shadow-lg flex flex-col p-6">
      {/* Title */}
      <h2 className="text-2xl font-extrabold text-center mb-8 bg-gradient-to-r from-white to-blue-500 bg-clip-text text-transparent animate-gradient">
        Menu
      </h2>

      {/* Nav buttons */}
      <nav className="flex flex-col space-y-3">
        <button onClick={() => navigate('/')} className="flex items-center px-4 py-2 rounded-md text-blue-700 font-medium bg-white shadow-sm hover:bg-blue-100 hover:text-blue-900 transition">
          <FaHome className="mr-2 text-blue-500" /> Home
        </button>

        <button onClick={() => navigate('/animeList')} className="flex items-center px-4 py-2 rounded-md text-blue-700 font-medium bg-white shadow-sm hover:bg-blue-100 hover:text-blue-900 transition">
          <FaList className="mr-2 text-blue-500" /> List Anime
        </button>

        <button onClick={() => navigate('/myList')} className="flex items-center px-4 py-2 rounded-md text-blue-700 font-medium bg-white shadow-sm hover:bg-blue-100 hover:text-blue-900 transition">
          <FaHeart className="mr-2 text-blue-500" /> My List
        </button>

        <button onClick={openRecommendations} className="flex items-center px-4 py-2 rounded-md text-blue-700 font-medium bg-white shadow-sm hover:bg-blue-100 hover:text-blue-900 transition">
          <FaStar className="mr-2 text-blue-500" /> Recommendation
        </button>
      </nav>

      {/* Recommendation popup */}
      {recOpen && (
        <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50 w-[90%] md:w-2/3 lg:w-1/2">
          <div className="relative bg-white rounded-xl shadow-xl p-4">
            <button onClick={() => setRecOpen(false)} className="absolute right-3 top-3 text-gray-500 hover:text-gray-800">✕</button>
            <h3 className="text-lg font-semibold text-center mb-3">Recommendations</h3>
            {loadingRecs ? (
              <div className="text-center py-10">Loading...</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto px-2 py-2">
                {(!recs || recs.length === 0) && (
                  // show 4 placeholders when no recommendations
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                      <div className="w-full h-48 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                        <div className="text-sm text-gray-500">No image</div>
                      </div>
                      <div className="mt-3 font-semibold text-center">No recommendation</div>
                      <div className="mt-auto w-full flex justify-center">
                        <button disabled className="mt-4 px-4 py-2 rounded bg-gray-300 text-white">Add</button>
                      </div>
                    </div>
                  ))
                )}

                {recs && recs.length > 0 && (
                  Array.from({ length: Math.max(recs.length, 4) }).map((_, idx) => {
                    const r = recs[idx];
                    if (!r) {
                      return (
                        <div key={`ph-${idx}`} className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                          <div className="w-full h-48 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                            <div className="text-sm text-gray-500">No image</div>
                          </div>
                          <div className="mt-3 font-semibold text-center">No recommendation</div>
                          <div className="mt-auto w-full flex justify-center">
                            <button disabled className="mt-4 px-4 py-2 rounded bg-gray-300 text-white">Add</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                        <div className="w-full h-48 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                          {r.image_url ? (
                            <img src={r.image_url} alt={r.title} className="object-contain w-full h-full" />
                          ) : (
                            <div className="text-sm text-gray-500">No image</div>
                          )}
                        </div>
                        <div className="mt-3 font-semibold text-center">{r.title}</div>
                        <div className="mt-auto w-full flex justify-center">
                          <button onClick={() => handleAddRecommendation(r)} className="mt-4 px-4 py-2 rounded bg-blue-600 text-white">Add</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SideBar;
