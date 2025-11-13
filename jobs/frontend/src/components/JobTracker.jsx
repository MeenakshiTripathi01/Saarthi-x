import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserJobApplications } from "../api/jobApi";
import { useAuth } from "../context/AuthContext";
import { loginWithGoogle } from "../api/authApi";

export default function JobTracker() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const statusColors = {
    pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
    accepted: "bg-green-50 border-green-200 text-green-700",
    rejected: "bg-red-50 border-red-200 text-red-700",
    interview: "bg-blue-50 border-blue-200 text-blue-700",
    offer: "bg-purple-50 border-purple-200 text-purple-700",
  };

  const statusIcons = {
    pending: "⏳",
    accepted: "✅",
    rejected: "❌",
    interview: "📞",
    offer: "🎉",
  };

  const loadApplications = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from backend
      try {
        const data = await getUserJobApplications();
        const backendApps = Array.isArray(data) ? data : [];
        
        // Also get local storage apps
        const localApps = JSON.parse(localStorage.getItem("localApplications") || "[]");
        
        // Merge both, backend takes priority
        const allApplications = [...localApps, ...backendApps];
        
        // Remove duplicates (keep backend version if exists)
        const uniqueApps = [];
        const seenJobIds = new Set();
        
        for (const app of allApplications) {
          if (!seenJobIds.has(app.jobId)) {
            uniqueApps.push(app);
            seenJobIds.add(app.jobId);
          }
        }
        
        setApplications(uniqueApps);
      } catch (apiError) {
        console.error("Error loading from backend:", apiError);
        
        // Fallback to local storage only
        const localApps = JSON.parse(localStorage.getItem("localApplications") || "[]");
        setApplications(localApps);
        
        if (localApps.length > 0) {
          console.log("Showing applications from local storage");
        } else {
          setError("Failed to load applications. Please try again later.");
        }
      }
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load your job applications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadApplications();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  // Show all applications without filtering
  const filteredApplications = applications;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/")}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign in Required</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Sign in to track
            </p>
            <button
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.951H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.049l3.007-2.342z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.951L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">📊 Job Application Tracker</h1>
          <p className="mt-2 text-gray-600">The Jobs You have applied to</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center text-yellow-700">
            <div className="text-4xl mb-2">📭</div>
            {applications.length === 0 ? (
              <>
                <p className="font-semibold text-lg">No applications yet</p>
                <p className="text-sm">Start applying to jobs to track them here!</p>
                <button
                  onClick={() => navigate("/apply-jobs")}
                  className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
                >
                  Browse Jobs
                </button>
              </>
            ) : (
              <>
                <p className="font-semibold">No applications with this status</p>
                <p className="text-sm">Try a different filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApplication(app)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-4 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{app.jobTitle || "Job Title"}</h3>
                    <p className="text-blue-600 font-medium text-sm">{app.company || "Company"}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold border ${statusColors[app.status] || "bg-gray-50 border-gray-200 text-gray-700"}`}>
                      {statusIcons[app.status]} {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setSelectedApplication(null)}
                className="absolute right-6 top-6 text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>

              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedApplication.jobTitle}</h2>
                    <p className="text-blue-600 font-semibold text-lg">{selectedApplication.company}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold border text-sm ${statusColors[selectedApplication.status] || "bg-gray-50 border-gray-200 text-gray-700"}`}>
                    {statusIcons[selectedApplication.status]} {selectedApplication.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-gray-600 flex items-center gap-2">
                  📍 {selectedApplication.location || "Location not specified"}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Application Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="font-semibold text-gray-900">
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </p>
                </div>
                {selectedApplication.salary && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Salary Range</p>
                    <p className="font-semibold text-gray-900">{selectedApplication.salary}</p>
                  </div>
                )}
                {selectedApplication.lastUpdated && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedApplication.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedApplication.notes && (
                <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 font-semibold mb-2">Notes:</p>
                  <p className="text-gray-700">{selectedApplication.notes}</p>
                </div>
              )}

              {selectedApplication.jobDescription && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-48 overflow-y-auto">
                    {selectedApplication.jobDescription}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate("/apply-jobs")}
                  className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 transition"
                >
                  Browse More Jobs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

