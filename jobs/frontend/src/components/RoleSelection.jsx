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
  const { updateAuth, user: currentUser } = useAuth();
  
  const email = searchParams.get('email') || currentUser?.email;
  const name = searchParams.get('name') || currentUser?.name;
  const pictureUrl = searchParams.get('picture') || currentUser?.picture;
  const intent = searchParams.get('intent'); // 'applicant' or 'industry'

  // Pre-select role based on current user role, intent, or localStorage
  const getInitialRole = () => {
    // First, check if user already has a role (for editing existing users)
    if (currentUser?.userType) {
      return currentUser.userType;
    }
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
    // If no email in query params and no current user from auth context, redirect to home
    if (!email && !currentUser?.email) {
      navigate('/');
      return;
    }
    
    // Prevent applicants from changing their role
    if (currentUser?.userType === 'APPLICANT') {
      console.log('[ROLE_SELECTION] Applicant attempted to change role - redirecting to apply-jobs');
      navigate('/apply-jobs');
      return;
    }
  }, [email, currentUser, navigate]);

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
      // Prevent applicants from changing their role
      if (currentUser?.userType === 'APPLICANT') {
        setError('Applicants cannot change their role. Please contact support if you need assistance.');
        setLoading(false);
        return;
      }
      
      const userEmail = email || currentUser?.email;
      const userName = name || currentUser?.name || userEmail?.split('@')[0];
      const userPicture = pictureUrl || currentUser?.picture;
      
      // Check if user already exists and has a role - use update-profile endpoint
      const isExistingUserWithRole = currentUser?.userType != null && currentUser.userType !== '';
      
      let response;
      
      if (isExistingUserWithRole) {
        // Existing user with role - use update-profile endpoint
        response = await fetch('http://localhost:8080/api/user/update-profile', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userType: roleToSubmit,
          }),
        });
      } else {
        // New user or user without role - try save-role first
        response = await fetch('http://localhost:8080/api/user/save-role', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            name: userName,
            pictureUrl: userPicture,
            userType: roleToSubmit,
          }),
        });
        
        // If save-role fails because user already has a role, try update-profile
        if (!response.ok) {
          const errorText = await response.text();
          if (errorText.includes("already has a role") || errorText.includes("User already registered")) {
            // User exists with a role, use update-profile instead
            response = await fetch('http://localhost:8080/api/user/update-profile', {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userType: roleToSubmit,
              }),
            });
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to save role';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Clear loginIntent from localStorage after role is saved
      localStorage.removeItem('loginIntent');
      console.log(`[ROLE_SELECTION] Cleared loginIntent after saving role: ${roleToSubmit}`);

      // Parse response - update-profile returns UserResponse, save-role returns string
      let updatedUserData;
      
      // Check if we used update-profile endpoint (returns JSON) or save-role (returns string)
      const contentType = response.headers.get("content-type");
      const isUpdateProfileResponse = contentType && contentType.includes("application/json");
      
      if (isUpdateProfileResponse) {
        // update-profile endpoint returns UserResponse object
        const userResponse = await response.json();
        updatedUserData = {
          authenticated: true,
          name: userResponse.name,
          email: userResponse.email,
          picture: userResponse.picture,
          userType: userResponse.userType,
        };
      } else {
        // save-role endpoint returns a string message, construct user data from request
        await response.text(); // Read the response to clear it
        updatedUserData = {
          authenticated: true,
          name: userName,
          email: userEmail,
          picture: userPicture,
          userType: roleToSubmit,
        };
      }

      // Update auth context with new user info
      updateAuth(updatedUserData);

      // Redirect based on redirectRoute if available, otherwise based on role
      const redirectRoute = localStorage.getItem('redirectRoute');
      if (redirectRoute === 'apply-jobs') {
        navigate('/apply-jobs');
      } else if (redirectRoute === 'post-jobs') {
        navigate('/post-jobs');
      } else if (redirectRoute === 'role-selection') {
        // Stay on role selection page (for editing)
        // Could refresh to show updated role
        window.location.reload();
      } else {
        // Default redirect based on role
        if (roleToSubmit === 'APPLICANT') {
          navigate('/apply-jobs');
        } else {
          navigate('/post-jobs');
        }
      }
      
      // Clear redirectRoute and loginIntent after using it
      localStorage.removeItem('redirectRoute');
      localStorage.removeItem('loginIntent');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentUser?.userType ? 'Update Your Role' : 'Welcome to Saarthix Jobs'}
        </h1>
        <p className="text-gray-600 mb-8">
          {currentUser?.userType 
            ? `Hi ${name || email?.split('@')[0]}, you can change your role here.`
            : `Hi ${name || email?.split('@')[0]}, please choose your role to get started.`}
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

