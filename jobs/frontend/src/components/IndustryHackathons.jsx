import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getMyHackathons, getAllHackathons, createHackathon, deleteHackathon, updateHackathon } from '../api/jobApi';

export default function IndustryHackathons() {
  const navigate = useNavigate();
  const { isAuthenticated, isIndustry, loading: authLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-hackathons'); // 'my-hackathons' or 'all-hackathons'
  const [myHackathons, setMyHackathons] = useState([]);
  const [allHackathons, setAllHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hackathonToDelete, setHackathonToDelete] = useState(null);
  const [selectedHackathon, setSelectedHackathon] = useState(null); // For viewing details
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    prize: '',
    teamSize: '',
    submissionUrl: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isIndustry) {
        navigate('/');
        return;
      }
      if (isAuthenticated && isIndustry) {
        loadHackathons();
      }
    }
  }, [isAuthenticated, isIndustry, authLoading, navigate]);

  const loadHackathons = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading hackathons for industry user...');

      // Load both my hackathons and all hackathons in parallel
      const [myHackathonsData, allHackathonsData] = await Promise.all([
        getMyHackathons(),
        getAllHackathons()
      ]);

      console.log('My Hackathons fetched:', myHackathonsData);
      console.log('All Hackathons fetched:', allHackathonsData);

      if (!Array.isArray(myHackathonsData)) {
        console.error('Invalid my hackathons response format');
        setMyHackathons([]);
      } else {
        setMyHackathons(myHackathonsData);
      }

      if (!Array.isArray(allHackathonsData)) {
        console.error('Invalid all hackathons response format');
        setAllHackathons([]);
      } else {
        setAllHackathons(allHackathonsData);
      }

      console.log('Hackathons set to state - My: ', myHackathonsData?.length || 0, ' All: ', allHackathonsData?.length || 0);
    } catch (err) {
      console.error('Error loading hackathons:', err);
      console.error('Error details:', err.response?.data, err.message);
      let errorMessage = 'Failed to load hackathons';

      if (err.response) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. Only INDUSTRY users can view their hackathons.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (hackathon) => {
    setHackathonToDelete(hackathon);
  };

  const handleConfirmDelete = async () => {
    if (!hackathonToDelete) return;

    setIsDeleting(true);
    try {
      await deleteHackathon(hackathonToDelete.id);
      toast.success('Hackathon deleted successfully', {
        position: "top-right",
        autoClose: 3000,
      });

      await loadHackathons();
      setHackathonToDelete(null);
    } catch (err) {
      console.error('Error deleting hackathon:', err);
      let errorMessage = 'Failed to delete hackathon';
      if (err.response) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      company: '',
      prize: '',
      teamSize: '',
      submissionUrl: '',
    });
    setEditingHackathon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.company) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const hackathonData = {
        title: formData.title,
        description: formData.description,
        company: formData.company,
        prize: formData.prize,
        teamSize: formData.teamSize ? parseInt(formData.teamSize) : 0,
        submissionUrl: formData.submissionUrl,
      };

      console.log('Submitting hackathon data:', hackathonData);

      if (editingHackathon) {
        console.log('Updating hackathon:', editingHackathon.id);
        await updateHackathon(editingHackathon.id, hackathonData);
        toast.success('Hackathon updated successfully', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        console.log('Creating new hackathon');
        await createHackathon(hackathonData);
        toast.success('Hackathon created successfully', {
          position: "top-right",
          autoClose: 3000,
        });
      }

      resetForm();
      setShowForm(false);
      console.log('Reloading hackathons...');
      await loadHackathons();
    } catch (err) {
      console.error('Error saving hackathon:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      let errorMessage = 'Failed to save hackathon';
      if (err.response) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (hackathon) => {
    // Navigate to PostHackathon page with the hackathon ID
    navigate(`/post-hackathons?edit=${hackathon.id}`);
  };

  // Get hackathons based on active tab
  const displayHackathons = activeTab === 'my-hackathons' ? myHackathons : allHackathons;

  // Filter hackathons based on search
  const filteredHackathons = displayHackathons.filter(hackathon => {
    const query = searchQuery.toLowerCase();
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
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
          <p className="mt-4 text-gray-600 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isIndustry) {
    return null;
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

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-200">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">Hackathons</h1>
                <p className="text-gray-600 text-base">Manage and post hackathons for your organization</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/post-hackathons')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post New Hackathon
            </button>
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

        {/* Form Section - Show only when posting */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingHackathon ? 'Edit Hackathon' : 'Post a New Hackathon'}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {editingHackathon ? 'Update your hackathon details' : 'Fill out the form to post a new hackathon'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hackathon Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., AI Innovation Hackathon 2024"
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="e.g., Tech Company Inc."
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Prize */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prize Pool / Prize Details
                </label>
                <input
                  type="text"
                  name="prize"
                  value={formData.prize}
                  onChange={handleInputChange}
                  placeholder="e.g., $10,000 total prize pool"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Team Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size (max members per team)
                </label>
                <input
                  type="number"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  min="1"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Submission URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission/Registration URL
                </label>
                <input
                  type="url"
                  name="submissionUrl"
                  value={formData.submissionUrl}
                  onChange={handleInputChange}
                  placeholder="e.g., https://hackathon.example.com"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hackathon Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the hackathon, themes, goals, timeline, etc..."
                  rows="8"
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2.5 px-6 transition-colors duration-200 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {editingHackathon ? 'Updating...' : 'Posting...'}
                    </span>
                  ) : (
                    editingHackathon ? 'Update Hackathon' : 'Post Hackathon'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-900 font-semibold py-2.5 px-6 transition-colors duration-200 disabled:cursor-not-allowed text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs and Hackathons - Only show when form is NOT open */}
        {!showForm && (
          <>
            {/* Tabs Section */}
            <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex">
                <button
                  onClick={() => {
                    setActiveTab('my-hackathons');
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-200 border-b-2 ${activeTab === 'my-hackathons'
                    ? 'text-purple-600 border-b-purple-600'
                    : 'text-gray-600 border-b-transparent hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    My Hackathons ({myHackathons.length})
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('all-hackathons');
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-200 border-b-2 ${activeTab === 'all-hackathons'
                    ? 'text-purple-600 border-b-purple-600'
                    : 'text-gray-600 border-b-transparent hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 015.646 5.646 9 9 0 1020.354 15.354z" />
                    </svg>
                    All Hackathons ({allHackathons.length})
                  </div>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            {displayHackathons.length > 0 && (
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
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-400 focus:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-100"
                  />
                </div>
              </div>
            )}

            {/* Hackathons Grid */}
            {displayHackathons.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  {activeTab === 'my-hackathons' ? 'No Hackathons Posted Yet' : 'No Hackathons Available'}
                </h3>
                <p className="text-gray-600 text-base mb-6">
                  {activeTab === 'my-hackathons'
                    ? 'Get started by posting your first hackathon'
                    : 'No hackathons have been posted yet'}
                </p>
                {activeTab === 'my-hackathons' && (
                  <button
                    onClick={() => navigate('/post-hackathons')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg"
                  >
                    Post Your First Hackathon
                  </button>
                )}
              </div>
            ) : filteredHackathons.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <p className="text-gray-600 text-base">No hackathons match your search criteria</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {hackathon.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">{hackathon.company}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {hackathon.description}
                    </p>

                    {/* Prize Display */}
                    {hackathon.prize && (
                      <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-600">Prize Pool</p>
                        <p className="text-sm font-semibold text-purple-700">{hackathon.prize}</p>
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

                    {/* Actions - Only show for owned hackathons */}
                    {activeTab === 'my-hackathons' && (
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleEditClick(hackathon)}
                          className="flex-1 p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(hackathon)}
                          className="flex-1 p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}

                    {/* View Full Details Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedHackathon(hackathon)}
                        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Full Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {hackathonToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-slideIn">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delete Hackathon</h2>
                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{hackathonToDelete.title}</p>
                  <p className="text-xs text-gray-600">{hackathonToDelete.company}</p>
                </div>

                <p className="text-sm text-gray-700 mb-6">
                  Are you sure you want to delete this hackathon? This will remove it from public view and cannot be restored.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2.5 px-6 transition-colors duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Deleting...
                      </span>
                    ) : (
                      "Delete Hackathon"
                    )}
                  </button>
                  <button
                    onClick={() => setHackathonToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-900 font-semibold py-2.5 px-6 transition-colors duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hackathon Details Modal */}
        {selectedHackathon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 animate-slideIn my-8">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedHackathon.title}</h2>
                    <p className="text-purple-100 text-sm">{selectedHackathon.company}</p>
                  </div>
                  <button
                    onClick={() => setSelectedHackathon(null)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">📝 Description</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedHackathon.description}</p>
                </div>

                {/* Problem Statement */}
                {selectedHackathon.problemStatement && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-purple-900 mb-2">🎯 Problem Statement</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedHackathon.problemStatement}</p>
                  </div>
                )}

                {/* Skills */}
                {selectedHackathon.skills && selectedHackathon.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedHackathon.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phases */}
                {selectedHackathon.phases && selectedHackathon.phases.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">📅 Hackathon Phases</h3>
                    <div className="space-y-3">
                      {selectedHackathon.phases.map((phase, index) => (
                        <div key={phase.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Phase {index + 1}: {phase.name}</h4>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {phase.uploadFormat}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{phase.description}</p>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Deadline:</span> {new Date(phase.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates & Mode */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-blue-900 mb-2">📆 Start Date</h3>
                    <p className="text-gray-700 text-sm">
                      {selectedHackathon.startDate ? new Date(selectedHackathon.startDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-blue-900 mb-2">📆 End Date</h3>
                    <p className="text-gray-700 text-sm">
                      {selectedHackathon.endDate ? new Date(selectedHackathon.endDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Mode & Location */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">🌐 Mode & Venue</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="text-sm font-semibold text-green-900">Mode:</span>
                      <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {selectedHackathon.mode || 'Online'}
                      </span>
                    </div>
                    {(selectedHackathon.mode === 'Hybrid' || selectedHackathon.mode === 'Offline') && selectedHackathon.location && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-semibold text-green-900">Location:</span>
                          <p className="text-gray-700 text-sm mt-1">{selectedHackathon.location}</p>
                        </div>
                        {selectedHackathon.reportingDate && (
                          <div>
                            <span className="text-sm font-semibold text-green-900">Reporting Date & Time:</span>
                            <p className="text-gray-700 text-sm mt-1">
                              {new Date(selectedHackathon.reportingDate).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Eligibility */}
                {selectedHackathon.eligibility && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">👥 Eligibility</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedHackathon.eligibility}</p>
                  </div>
                )}

                {/* Team & Prizes */}
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedHackathon.teamSize > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-orange-900 mb-2">👥 Team Size</h3>
                      <p className="text-gray-700 text-sm">Max {selectedHackathon.teamSize} members</p>
                    </div>
                  )}
                  {selectedHackathon.prize && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-yellow-900 mb-2">🏆 Prize Pool</h3>
                      <p className="text-gray-700 text-sm font-semibold">{selectedHackathon.prize}</p>
                    </div>
                  )}
                </div>

                {/* Submission */}
                {(selectedHackathon.submissionUrl || selectedHackathon.submissionGuidelines) && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">📤 Submission Details</h3>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                      {selectedHackathon.submissionUrl && (
                        <div>
                          <span className="text-sm font-semibold text-indigo-900">Submission URL:</span>
                          <a
                            href={selectedHackathon.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-indigo-600 hover:text-indigo-800 text-sm mt-1 break-all"
                          >
                            {selectedHackathon.submissionUrl}
                          </a>
                        </div>
                      )}
                      {selectedHackathon.submissionGuidelines && (
                        <div>
                          <span className="text-sm font-semibold text-indigo-900">Guidelines:</span>
                          <p className="text-gray-700 text-sm mt-1">{selectedHackathon.submissionGuidelines}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                <button
                  onClick={() => setSelectedHackathon(null)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

