import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RoleSelection Component
 * Allows new OAuth users to choose their role: APPLICANT (job seeker) or INDUSTRY (job poster)
 */
export default function RoleSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateAuth } = useAuth();
  
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const pictureUrl = searchParams.get('picture');
  const intent = searchParams.get('intent'); // 'applicant' or 'industry'

  // Pre-select role based on intent or localStorage
  const getInitialRole = () => {
    // Check URL intent parameter
    if (intent === 'industry') return 'INDUSTRY';
    if (intent === 'applicant') return 'APPLICANT';
    // Check localStorage from previous intent
    const storedIntent = localStorage.getItem('loginIntent');
    if (storedIntent === 'industry') return 'INDUSTRY';
    if (storedIntent === 'applicant') return 'APPLICANT';
    return null;
  };

  const [selectedRole, setSelectedRole] = useState(getInitialRole());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no email in query params, redirect to home
    if (!email) {
      navigate('/');
      return;
    }
  }, [email, navigate]);

  // Auto-submit if role was pre-selected by intent
  useEffect(() => {
    if (selectedRole && (intent || localStorage.getItem('loginIntent'))) {
      // Role was pre-selected by intent - auto submit after short delay
      const timer = setTimeout(() => {
        handleConfirmRoleInternal(selectedRole);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedRole, intent]);

  const handleConfirmRoleInternal = async (roleToSubmit) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/user/save-role', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0],
          pictureUrl,
          userType: roleToSubmit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save role');
      }

      // Update auth context with new user info
      updateAuth({
        authenticated: true,
        name: name || email.split('@')[0],
        email,
        picture: pictureUrl,
        userType: roleToSubmit,
      });

      // Redirect based on role
      if (roleToSubmit === 'APPLICANT') {
        navigate('/apply-jobs');
      } else {
        navigate('/post-jobs');
      }
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    await handleConfirmRoleInternal(selectedRole);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Saarthix Jobs</h1>
        <p className="text-gray-600 mb-8">
          Hi {name || email.split('@')[0]}, please choose your role to get started.
        </p>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* APPLICANT Option */}
          <div
            onClick={() => setSelectedRole('APPLICANT')}
            className={`cursor-pointer rounded-lg border-2 p-6 transition-all ${
              selectedRole === 'APPLICANT'
                ? 'border-gray-800 bg-gray-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">I'm a Job Seeker</h2>
            <p className="text-gray-600 text-sm mb-4">
              Browse and apply to job opportunities posted by companies.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Browse job listings</li>
              <li>✓ Apply to jobs</li>
              <li>✓ Track applications</li>
            </ul>
            {selectedRole === 'APPLICANT' && (
              <div className="mt-4 text-gray-800 font-semibold">✓ Selected</div>
            )}
          </div>

          {/* INDUSTRY Option */}
          <div
            onClick={() => setSelectedRole('INDUSTRY')}
            className={`cursor-pointer rounded-lg border-2 p-6 transition-all ${
              selectedRole === 'INDUSTRY'
                ? 'border-gray-800 bg-gray-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">I'm Hiring (Industry)</h2>
            <p className="text-gray-600 text-sm mb-4">
              Post job openings and find talented candidates for your company.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Post job listings</li>
              <li>✓ Manage openings</li>
              <li>✓ Review applicants</li>
            </ul>
            {selectedRole === 'INDUSTRY' && (
              <div className="mt-4 text-gray-800 font-semibold">✓ Selected</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 transition"
          >
            Back
          </button>
          <button
            onClick={handleConfirmRole}
            disabled={!selectedRole || loading}
            className="flex-1 rounded-md bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold py-3 px-6 transition disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

