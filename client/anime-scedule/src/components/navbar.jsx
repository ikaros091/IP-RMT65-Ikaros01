import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem('access_token');
    setIsLoggedIn(!!t);
    // listen storage changes from other tabs
    const onStorage = () => setIsLoggedIn(!!localStorage.getItem('access_token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function handleAuthClick() {
    if (isLoggedIn) {
      // logout
      localStorage.removeItem('access_token');
      try { delete window.phase2Api; } catch (e) {}
      setIsLoggedIn(false);
      window.location.href = '/';
    } else {
      window.location.href = '/login';
    }
  }

  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 shadow-md">
      {/* Logo kiri */}
      <div onClick={() => navigate('/')} className="flex items-center space-x-2 cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg">
          L
        </div>
        <span className="font-semibold text-blue-800">Logo</span>
      </div>

      {/* Nama Website tengah */}
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white via-blue-300 to-blue-600 bg-clip-text text-transparent animate-gradient">
        My Fantasy Website
      </h1>

      {/* Tombol Login/Logout kanan */}
      <button
        onClick={handleAuthClick}
        className="relative px-6 py-2 rounded-lg font-semibold text-white shadow-lg bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 border border-blue-300 
        transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.7)]"
      >
        <span className="relative z-10">{isLoggedIn ? 'Logout' : 'Login'}</span>
        {/* glow layer */}
        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 opacity-50 blur-md"></span>
      </button>
    </nav>
  );
}

export default Navbar;
