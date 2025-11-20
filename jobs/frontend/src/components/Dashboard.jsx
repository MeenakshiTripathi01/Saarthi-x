import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginWithGoogle } from "../api/authApi";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isIndustry, isApplicant, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to Saarthix Jobs
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Connect with opportunities that match your career goals. Browse jobs or post positions to find the right talent.
          </p>
        </div>

        {/* Edit Profile Button - Only show if authenticated */}
        {isAuthenticated && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => navigate("/edit-profile")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors duration-200 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>
        )}

        {/* Two Card Layout */}
        <div className={`grid gap-8 ${isAuthenticated && !isIndustry ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
          {/* Browse Jobs Card */}
          <div
            onClick={() => {
              if (!isAuthenticated) {
                // Not logged in - save intent and login
                sessionStorage.setItem('loginIntent', 'applicant');
                loginWithGoogle();
              } else {
                // Already logged in - go to jobs
                navigate("/apply-jobs");
              }
            }}
            className="group cursor-pointer"
          >
            <div className="h-full bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 p-10 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Browse Jobs
              </h2>
              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                Explore curated job opportunities from top companies. Find roles that align with your skills, experience, and career aspirations.
              </p>
              <button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-sm">
                Explore Opportunities
              </button>
            </div>
          </div>

          {/* Post a Job Card - Only show for Industry users or non-authenticated users */}
          {(isIndustry || !isAuthenticated) && (
            <div
              onClick={() => {
                if (!isAuthenticated) {
                  // Not logged in - save intent as INDUSTRY and login
                  sessionStorage.setItem('loginIntent', 'industry');
                  loginWithGoogle();
                } else if (isIndustry) {
                  // Already logged in as INDUSTRY - go to posting form
                  navigate("/post-jobs");
                }
              }}
              className="group cursor-pointer"
            >
              <div className="h-full bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 p-10 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Post a Job
                </h2>
                <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                  Reach qualified candidates. Create a job posting and connect with professionals who are actively seeking new opportunities.
                </p>
                <button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-sm">
                  Create a Posting
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 text-sm">
            A platform designed to bridge the gap between job seekers and employers. Start your journey today.
          </p>
        </div>
      </div>
    </div>
  );
}

