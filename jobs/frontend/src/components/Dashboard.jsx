import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 Welcome to Saarthix Jobs
          </h1>
          <p className="text-xl text-gray-600">
            Find your dream job or post a new opportunity
          </p>
        </div>

        {/* Two Button Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Apply for Jobs Button */}
          <div
            onClick={() => navigate("/apply-jobs")}
            className="group cursor-pointer"
          >
            <div className="h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8 flex flex-col items-center justify-center text-center"
            >
              <div className="text-6xl mb-4">💼</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Apply for Jobs
              </h2>
              <p className="text-gray-600 mb-6">
                Browse through hundreds of job opportunities and apply to positions that match your skills and interests.
              </p>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                Start Exploring
              </button>
            </div>
          </div>

          {/* Post Jobs Button */}
          <div
            onClick={() => navigate("/post-jobs")}
            className="group cursor-pointer"
          >
            <div className="h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8 flex flex-col items-center justify-center text-center"
            >
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Post a Job
              </h2>
              <p className="text-gray-600 mb-6">
                Create a job posting and reach thousands of talented professionals looking for their next opportunity.
              </p>
              <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                Post a Job
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Whether you're a job seeker or an employer, we're here to help you find the perfect match.
          </p>
        </div>
      </div>
    </div>
  );
}

