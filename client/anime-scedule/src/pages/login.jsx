import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";
import { useNavigate } from "react-router";
import { loginWithGoogle } from "../features/auth/authSlice";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return; // simple validation
    try {
      const res = await dispatch(loginUser({ email, password }));
      if (res.error) {
        // error handled via selector
        return;
      }
      // success, navigate to animeList
      window.location.href = "/animeList";
    } catch (err) {
      // handled by slice
    }
  }

  async function handleCredentialResponse(response) {
    const id_token = response && response.credential;
    if (!id_token) return;
    try {
        console.log(id_token);
        
      const res = await dispatch(loginWithGoogle({ id_token }));
      if (res && res.error) return;
      navigate('/animeList');
    } catch (err) {
      // handled in slice
    }
  }
  const btnRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.CLIENT_ID;
    if (!clientId) return;

    const loadGsi = () => new Promise((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.id) return resolve();
      if (document.getElementById('google-identity')) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.id = 'google-identity';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('GSI load error'));
      document.head.appendChild(s);
    });

    let mounted = true;
    loadGsi().then(() => {
      if (!mounted) return;
      try {
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse });
        const target = btnRef.current || document.getElementById('buttonDiv');
        if (target) window.google.accounts.id.renderButton(target, { theme: 'outline', size: 'large' });
      } catch (e) {
        // ignore
      }
    }).catch(() => {
      // script failed to load
    });

    return () => { mounted = false };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative overflow-hidden">
      {/* Card */}
      <div className="bg-white shadow-xl rounded-xl p-8 w-96 z-10 mb-5">
        {/* Teks Bergelombang */}
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600 wave-text">
          {"Welcome!".split("").map((char, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              {char}
            </span>
          ))}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="mb-4">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {error && (
            <div className="mb-4 text-red-600">
              {String(error && error.message ? error.message : error)}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <div ref={btnRef} id="buttonDiv" className="mt-3 flex justify-center"></div>
          <p className="mt-4 text-center text-sm">
            Belum punya akun?{" "}
            <a href="/register" className="text-blue-500 hover:underline">
              Register
            </a>
          </p>
        </form>
      </div>

      {/* Gelombang Laut */}
      <div className="wave wave1"></div>
      <div className="wave wave2"></div>
      <div className="wave wave3"></div>
      <div className="wave wave4"></div>
    </div>
  );
}

export default Login;
