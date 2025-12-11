import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getAllHackathons, getMyHackathonApplications, applyForHackathon } from '../api/jobApi';

export default function ApplicantHackathons() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, isApplicant, user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'my-applications'
  const [allHackathons, setAllHackathons] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    asTeam: false,
    teamName: '',
    teamSize: 1,
    teamMembers: [],
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isApplicant) {
        // navigate('/'); // Commented out for debugging
        // return;
      }
      if (isAuthenticated && isApplicant) {
        loadHackathons();
      }
    }
  }, [isAuthenticated, isApplicant, authLoading, navigate]);

  const loadHackathons = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading hackathons for applicant...');

      // Load all hackathons first (this should work regardless)
      const hackathonsData = await getAllHackathons();
      console.log('All Hackathons fetched:', hackathonsData);

      if (!Array.isArray(hackathonsData)) {
        console.error('Invalid hackathons response format from server');
        setError('Invalid response format from server');
        setAllHackathons([]);
        setMyApplications([]);
        return;
      }

      setAllHackathons(hackathonsData);

      // Try to load applications, but don't fail if it errors
      try {
        const applicationsData = await getMyHackathonApplications();
        console.log('My Applications fetched:', applicationsData);

        if (Array.isArray(applicationsData)) {
          setMyApplications(applicationsData);
        } else {
          console.warn('Applications response is not an array:', applicationsData);
          setMyApplications([]);
        }
      } catch (appErr) {
        console.error('Error loading applications (non-fatal):', appErr);
        console.error('Applications error details:', appErr.response?.data);
        // Don't set error for applications - hackathons still loaded
        setMyApplications([]);
      }
    } catch (err) {
      console.error('Error loading hackathons:', err);
      console.error('Error response:', err.response?.data);
      let errorMessage = 'Failed to load hackathons';

      if (err.response) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      asTeam: false,
      teamName: '',
      teamSize: 1,
      teamMembers: [],
    });
    setShowApplicationForm(false);
  };

  const handleApply = (hackathon) => {
    navigate(`/hackathon/${hackathon.id}`);
  };

  const handleViewDashboard = (applicationId) => {
    navigate(`/hackathon-application/${applicationId}`);
  };

  // Filter hackathons based on search
  const filteredHackathons = allHackathons.filter(hackathon => {
    const query = searchQuery.toLowerCase();
    const hasApplied = myApplications.some(app => app.hackathonId === hackathon.id);

    // In browse tab, hide applied hackathons
    if (activeTab === 'browse' && hasApplied) return false;

    return (
      hackathon.title?.toLowerCase().includes(query) ||
      hackathon.company?.toLowerCase().includes(query) ||
      hackathon.description?.toLowerCase().includes(query)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 text-sm font-medium">Loading Hackathons...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isApplicant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-700">Access Denied</h2>
          <p className="text-gray-500">
            You must be an applicant to view this page. <br />
            Authenticated: {isAuthenticated ? 'Yes' : 'No'} <br />
            Is Applicant: {isApplicant ? 'Yes' : 'No'} <br />
            User Role: {user?.userType || 'None'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 text-sm transition-colors"
          >
            ← Back to Dashboard
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-200">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">Hackathons</h1>
              <p className="text-gray-600 text-base">Browse and apply for exciting hackathons</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-5 text-red-700 text-sm font-medium">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Error Loading Hackathons</p>
                <p>{error}</p>
                <button
                  onClick={loadHackathons}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('browse');
                setSearchQuery('');
              }}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-200 border-b-2 ${activeTab === 'browse'
                ? 'text-blue-600 border-b-blue-600'
                : 'text-gray-600 border-b-transparent hover:text-gray-900'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Hackathons ({filteredHackathons.length})
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('my-applications');
                setSearchQuery('');
              }}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-200 border-b-2 ${activeTab === 'my-applications'
                ? 'text-blue-600 border-b-blue-600'
                : 'text-gray-600 border-b-transparent hover:text-gray-900'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                My Applications ({myApplications.length})
              </div>
            </button>
          </div>
        </div>

        {/* Search Bar - Show for Browse tab */}
        {activeTab === 'browse' && filteredHackathons.length > 0 && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search hackathons by title, company, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        {/* Browse Hackathons Tab */}
        {activeTab === 'browse' && (
          <>
            {filteredHackathons.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  {allHackathons.length === 0 ? 'No Hackathons Available' : 'No New Hackathons'}
                </h3>
                <p className="text-gray-600 text-base">
                  {allHackathons.length === 0
                    ? 'Check back soon for hackathons to apply to'
                    : 'You have already applied to all available hackathons'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-all duration-200 group flex flex-col"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {hackathon.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{hackathon.company}</p>

                      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                        {hackathon.description}
                      </p>

                      {/* Prize Display */}
                      {hackathon.prize && (
                        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-gray-600">Prize Pool</p>
                          <p className="text-sm font-semibold text-blue-700">{hackathon.prize}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        {hackathon.teamSize > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                            </svg>
                            Max team: {hackathon.teamSize}
                          </span>
                        )}
                        {hackathon.views !== undefined && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {hackathon.views} views
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={() => handleApply(hackathon)}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      View Details & Apply
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* My Applications Tab */}
        {activeTab === 'my-applications' && (
          <>
            {myApplications.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-600 text-base mb-6">Start by applying to hackathons</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg"
                >
                  Browse Hackathons
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myApplications.map((application) => {
                  const hackathon = allHackathons.find(h => h.id === application.hackathonId);
                  return (
                    <div
                      key={application.id}
                      onClick={() => handleViewDashboard(application.id)}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    >
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {hackathon?.title || 'Unknown Hackathon'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{hackathon?.company || 'N/A'}</p>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-200">
                            ✓ Applied
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${application.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            application.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                            {application.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Application Type</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {application.asTeam ? `Team: ${application.teamName}` : 'Individual'}
                        </p>
                        {application.asTeam && (
                          <p className="text-xs text-gray-600 mt-1">Team Size: {application.teamSize}</p>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex justify-between items-center">
                        <span>Applied on {new Date(application.appliedAt).toLocaleDateString()}</span>
                        <span className="text-blue-600 font-medium flex items-center gap-1">
                          Go to Dashboard <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
