import React from 'react';
import { Link } from 'react-router-dom';
import { loginWithGoogle, logout } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, loading, clearAuth } = useAuth();

  const handleLogin = () => {
    loginWithGoogle();
  };

  const handleLogout = () => {
    logout(clearAuth);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
            🧑‍💻 Saarthix Jobs
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/apply-jobs" className="text-gray-600 hover:text-blue-600 font-medium transition">
              Browse Jobs
            </Link>
            <Link to="/job-tracker" className="text-gray-600 hover:text-blue-600 font-medium transition">
              📊 My Applications
            </Link>
            <Link to="/post-jobs" className="text-gray-600 hover:text-blue-600 font-medium transition">
              Post a Job
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                />
                <span className="text-gray-700 font-medium">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.951H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.049l3.007-2.342z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.951L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

