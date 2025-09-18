import React, { useEffect, useState, useRef } from 'react'
import { phase2Api } from '../helpers/http-client'
import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const [hidden, setHidden] = useState(false);
  const [topAnimes, setTopAnimes] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const navigate = useNavigate();
  const scrollerRef = useRef(null);

  useEffect(() => {
    const registered = localStorage.getItem('registered');
    const token = localStorage.getItem('access_token');
    setHidden(!!registered || !!token);
  }, []);

  // fetch top 5 anime (by score) once for hero backgrounds and scroller
  useEffect(() => {
    let mounted = true;
    async function loadTop() {
      try {
        // request a small page sorted by score (server supports sort param)
        const res = await phase2Api.get('/animes', { params: { page: 1, limit: 10, sort: 'score' } });
        if (!mounted) return;
        const data = res && res.data && Array.isArray(res.data.data) ? res.data.data : [];
        const top5 = data.slice(0, 5);
        setTopAnimes(top5);

        // Preload images
        top5.forEach(a => {
          if (a.image_url) {
            const img = new Image(); img.src = a.image_url;
          }
        });
      } catch (err) {
        console.error('Failed to load top animes for landing', err);
      }
    }
    loadTop();
    return () => { mounted = false };
  }, []);

  // background slideshow (fade)
  useEffect(() => {
    if (!topAnimes || topAnimes.length === 0) return;
    const t = setInterval(() => {
      setBgIndex(i => (i + 1) % topAnimes.length);
    }, 5000);
    return () => clearInterval(t);
  }, [topAnimes]);

  // improved infinite scroller: use CSS transform animation by duplicating items and using translateX animation
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // reset scroll to start for stable loop
    el.scrollLeft = 0;
  }, [topAnimes]);

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col">
      {/* Hero Section with fade background */}
      <div className="relative h-[60vh] flex flex-col items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0">
          {topAnimes.map((a, idx) => (
            <div key={a.id || idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === bgIndex ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${a.image_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          ))}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <h1 className="relative text-5xl font-bold z-10">AnimeList</h1>
        <div className="relative z-10 mt-4 flex gap-4">
          {!hidden ? (
            <>
              <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-md shadow-md" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-md shadow-md" onClick={() => navigate('/register')}>
                Register
              </button>
            </>
          ) : null}
          <button className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-md shadow-md text-white" onClick={() => navigate('/animeList')}>Go to List</button>
        </div>
      </div>

      {/* Discover Section */}
      <div className="py-12 px-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Discover Your Favorite Anime</h2>
        <p className="text-gray-600 mb-6">Track, explore, and enjoy thousands of anime with ease.</p>
      </div>

      {/* Scrolling top-5 images (smooth infinite marquee) */}
      <div className="bg-blue-100 py-8 px-6">
        <h3 className="text-xl font-semibold text-blue-700 mb-4 text-center">Top Picks</h3>
        <div className="relative overflow-hidden">
          <div className="w-full">
            <div
              className="marquee__inner flex items-center"
              style={{
                // duration scales with number of items (min 12s)
                animationDuration: `${Math.max(12, (topAnimes.length || 5) * 5)}s`,
                willChange: 'transform'
              }}
            >
              {topAnimes.concat(topAnimes).map((a, idx) => (
                <div key={`s-${idx}`} className="flex-shrink-0 w-56 h-80 bg-white rounded-lg overflow-hidden shadow-md mr-4">
                  <img src={a.image_url || 'https://via.placeholder.com/220x320'} alt={a.title} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* marquee css inserted here so it ships with component */}
        <style>{`
          .marquee__inner{ display:flex; gap:0.75rem; animation-name: marquee; animation-timing-function: linear; animation-iteration-count: infinite; }
          @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        `}</style>
      </div>
    </div>
  );
}

export default LandingPage;
