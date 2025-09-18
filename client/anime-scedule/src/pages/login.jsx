import React, { useState } from "react";
import { phase2Api } from "../helpers/http-client";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await phase2Api.post("/login", { email, password });
      const token = res?.data?.access_token;
      if (token) {
        // persist token and set header for future requests
        localStorage.setItem("access_token", token);
        phase2Api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        // clear any registered flag (now user logged in)
        try { localStorage.removeItem('registered'); } catch (e) {}
        // redirect to anime list page (client route)
        window.location.href = "/animeList";
      } else {
        setError("Login succeeded but no token returned");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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
          {error && <div className="mb-4 text-red-600">{String(error)}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
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
