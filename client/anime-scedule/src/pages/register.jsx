import React, { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../features/auth/authSlice';

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { loading, error, registered } = useSelector(s => s.auth);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !email || !password) return;
    try {
      const res = await dispatch(registerUser({ username, email, password }));
      if (!res.error) {
        setSuccess('Registration successful. You can now login.');
        setTimeout(() => { window.location.href = '/login'; }, 900);
      }
    } catch (err) {
      // handled by slice
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 relative overflow-hidden">
      <div className="bg-white shadow-xl rounded-xl p-8 w-96 z-10">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600 wave-text">
          {"Welcome!".split("").map((char, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              {char}
            </span>
          ))}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
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
          {success && <div className="mb-4 text-green-600">{String(success)}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>
          <p className="mt-4 text-center text-sm">
            Sudah punya akun?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Login
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

export default Register;
