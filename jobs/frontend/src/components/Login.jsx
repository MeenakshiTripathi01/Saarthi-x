import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1 = role selection, 2 = sign in

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // If user already has a role, redirect based on that
      if (user.userType === 'APPLICANT') {
        navigate('/apply-jobs');
      } else if (user.userType === 'INDUSTRY') {
        navigate('/post-jobs');
      } else {
        // User authenticated but no role - go to role selection
        navigate('/choose-role');
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleRoleSelection = () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }
    setStep(2); // Move to sign-in step
    setError(null);
  };

  const handleLogin = () => {
    if (!selectedRole) {
      setError('Please select a role before signing in');
      return;
    }

    // Clear any previous login intent
    localStorage.removeItem('loginIntent');
    localStorage.removeItem('redirectRoute');

    // Store the selected role
    const roleIntent = selectedRole === 'APPLICANT' ? 'applicant' : 'industry';
    localStorage.setItem('loginIntent', roleIntent);

    // Set redirect route based on role
    if (selectedRole === 'APPLICANT') {
      localStorage.setItem('redirectRoute', 'apply-jobs');
    } else {
      localStorage.setItem('redirectRoute', 'post-jobs');
    }

    // Initiate Google login
    loginWithGoogle();
  };

  const handleBackToRoleSelection = () => {
    setStep(1);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 mb-6 shadow-lg">
              <span className="text-3xl">💼</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              {step === 1 ? 'Welcome to Saarthix Jobs' : 'Sign in with Google'}
            </h1>
            <p className="text-gray-600 text-lg">
              {step === 1 
                ? 'Choose your role to get started' 
                : `You selected: ${selectedRole === 'APPLICANT' ? 'Job Seeker' : 'Industry'}. Sign in to continue.`}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <>
              {/* Role Selection Cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* APPLICANT Option */}
            <div
              onClick={() => {
                setSelectedRole('APPLICANT');
                setError(null);
              }}
              className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                selectedRole === 'APPLICANT'
                  ? 'border-gray-900 bg-gray-50 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg'
              }`}
            >
              <div className="text-5xl mb-4 text-center">👤</div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">
                I'm a Job Seeker
              </h2>
              <p className="text-gray-600 text-sm mb-4 text-center">
                Browse and apply to job opportunities posted by companies.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Browse job listings
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apply to jobs
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track applications
                </li>
              </ul>
              {selectedRole === 'APPLICANT' && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-2 text-gray-800 font-semibold text-sm">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selected
                  </span>
                </div>
              )}
            </div>

            {/* INDUSTRY Option */}
            <div
              onClick={() => {
                setSelectedRole('INDUSTRY');
                setError(null);
              }}
              className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                selectedRole === 'INDUSTRY'
                  ? 'border-gray-900 bg-gray-50 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg'
              }`}
            >
              <div className="text-5xl mb-4 text-center">🏢</div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">
                I'm Hiring (Industry)
              </h2>
              <p className="text-gray-600 text-sm mb-4 text-center">
                Post job openings and find talented candidates for your company.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Post job listings
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Manage openings
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Review applicants
                </li>
              </ul>
              {selectedRole === 'INDUSTRY' && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-2 text-gray-800 font-semibold text-sm">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selected
                  </span>
                </div>
              )}
            </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleRoleSelection}
                disabled={!selectedRole}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Step 2: Sign In */}
          {step === 2 && (
            <>
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className={`text-6xl mb-2 ${selectedRole === 'APPLICANT' ? '' : ''}`}>
                    {selectedRole === 'APPLICANT' ? '👤' : '🏢'}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {selectedRole === 'APPLICANT' ? 'Job Seeker' : 'Industry'}
                </h3>
                <p className="text-gray-600 text-center text-sm">
                  {selectedRole === 'APPLICANT' 
                    ? 'You\'ll be able to browse and apply to job opportunities'
                    : 'You\'ll be able to post jobs and manage applications'}
                </p>
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleLogin}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 mb-4"
              >
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="white"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="white"/>
                  <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.951H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.049l3.007-2.342z" fill="white"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.951L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="white"/>
                </svg>
                Sign in with Google
              </button>

              {/* Back Button */}
              <button
                onClick={handleBackToRoleSelection}
                className="w-full text-gray-600 hover:text-gray-900 font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Role Selection
              </button>
            </>
          )}

          {/* Back to Home Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

