import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getMyPostedJobs, getApplicationsByJobId, updateApplicationStatusByIndustry, updateJob, deleteJob } from '../api/jobApi';

export default function IndustryApplications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isIndustry, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status options with descriptions
  const statusOptions = [
    { value: 'pending', label: 'Pending', description: 'Application received, awaiting review', color: 'amber' },
    { value: 'resume_viewed', label: 'Resume Viewed', description: 'Your resume has been reviewed', color: 'blue' },
    { value: 'call_scheduled', label: 'Call Scheduled', description: 'Recruiter will contact you soon', color: 'purple' },
    { value: 'interview_scheduled', label: 'Interview Scheduled', description: 'Interview has been scheduled', color: 'indigo' },
    { value: 'offer_sent', label: 'Offer Sent', description: 'Job offer has been sent', color: 'green' },
    { value: 'accepted', label: 'Accepted', description: 'Application accepted', color: 'emerald' },
    { value: 'rejected', label: 'Rejected', description: 'Application not selected', color: 'red' },
  ];

  const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    resume_viewed: 'bg-blue-50 text-blue-700 border-blue-200',
    call_scheduled: 'bg-purple-50 text-purple-700 border-purple-200',
    interview_scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    offer_sent: 'bg-green-50 text-green-700 border-green-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  useEffect(() => {
    console.log('IndustryApplications useEffect:', { isAuthenticated, isIndustry, authLoading });
    if (!authLoading) {
      if (!isAuthenticated || !isIndustry) {
        console.log('Not authenticated or not industry, redirecting...');
        navigate('/');
        return;
      }
      // Only load jobs if authenticated and is industry
      if (isAuthenticated && isIndustry) {
        console.log('Loading jobs...');
        loadJobs();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isIndustry, authLoading, navigate]);

  // Handle location state to auto-select job when navigating from notification
  useEffect(() => {
    if (location.state?.selectedJobId && jobs.length > 0) {
      const jobToSelect = jobs.find(job => job.id === location.state.selectedJobId);
      if (jobToSelect && (!selectedJob || selectedJob.id !== jobToSelect.id)) {
        handleJobSelect(jobToSelect);
        // Clear location state to prevent re-selecting on re-render
        window.history.replaceState({}, document.title);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const allJobs = await getMyPostedJobs();
      console.log('Loaded all jobs:', allJobs);
      
      if (!Array.isArray(allJobs)) {
        console.error('Invalid data format:', allJobs);
        setError('Invalid response format from server');
        return;
      }

      // Show all posted jobs, regardless of whether they have applications
      console.log(`Found ${allJobs.length} total posted jobs`);
      setJobs(allJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      let errorMessage = 'Failed to load your posted jobs';
      
      if (err.response) {
        // Handle different error response formats
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. Only INDUSTRY users can view their posted jobs.';
        } else if (err.response.status === 404) {
          errorMessage = 'Endpoint not found. Please check if the backend server is running.';
        } else {
          errorMessage = `Server error (${err.response.status}): ${err.response.statusText || 'Unknown error'}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (jobId) => {
    try {
      setApplicationsLoading(true);
      setError(null);
      const data = await getApplicationsByJobId(jobId);
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications for this job');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setSelectedApplication(null);
    loadApplications(job.id);
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      setUpdatingStatus(true);
      console.log('Updating status:', { applicationId, newStatus });
      
      const updated = await updateApplicationStatusByIndustry(applicationId, newStatus);
      console.log('Status update response:', updated);
      
      // Update local state with the response from server
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, ...updated, status: newStatus } : app
      ));
      
      // Update selected application if it's the one being updated
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => ({ ...prev, ...updated, status: newStatus }));
      }

      // Reload applications to ensure we have the latest data
      if (selectedJob) {
        await loadApplications(selectedJob.id);
      }

      const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
      toast.success(`Status updated to: ${statusLabel}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error updating status:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      let errorMessage = 'Failed to update status';
      if (err.response) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const downloadResume = (application) => {
    if (!application.resumeBase64) {
      toast.error('Resume not available', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      // Convert base64 to blob
      const byteCharacters = atob(application.resumeBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: application.resumeFileType || 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = application.resumeFileName || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Resume downloaded successfully', {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error('Error downloading resume:', err);
      toast.error('Failed to download resume', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title || '',
      description: job.description || '',
      company: job.company || '',
      location: job.location || '',
      active: job.active !== undefined ? job.active : true,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJob) return;

    setIsSubmitting(true);
    try {
      await updateJob(editingJob.id, editFormData);
      toast.success('Job updated successfully', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Reload jobs list
      await loadJobs();
      
      // If the updated job was selected, reload its applications
      if (selectedJob?.id === editingJob.id) {
        await loadApplications(editingJob.id);
      }
      
      setEditingJob(null);
      setEditFormData({});
    } catch (err) {
      console.error('Error updating job:', err);
      let errorMessage = 'Failed to update job';
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

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      await deleteJob(jobToDelete.id);
      toast.success('Job deleted successfully', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // If the deleted job was selected, clear selection
      if (selectedJob?.id === jobToDelete.id) {
        setSelectedJob(null);
        setApplications([]);
      }
      
      // Reload jobs list
      await loadJobs();
      setJobToDelete(null);
    } catch (err) {
      console.error('Error deleting job:', err);
      let errorMessage = 'Failed to delete job';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 animate-fadeIn">
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2 text-sm transition-colors duration-200 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span> Back to Dashboard
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">Manage Applications</h1>
              <p className="text-gray-600 text-base font-light">Review and manage applications for your posted jobs</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-5 text-red-700 text-sm font-medium shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Error Loading Jobs</p>
                <p>{error}</p>
                <button
                  onClick={loadJobs}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors duration-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Jobs List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Posted Jobs</h2>
                <button
                  onClick={loadJobs}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Refresh jobs list"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mb-4"></div>
                  <p className="text-gray-600 text-sm">Loading your posted jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm mb-4">You haven't posted any jobs yet.</p>
                  <button
                    onClick={() => navigate('/post-jobs')}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Post a Job
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const appCount = selectedJob?.id === job.id ? applications.length : 0;
                    return (
                      <div
                        key={job.id}
                        className={`w-full rounded-xl border-2 transition-all duration-200 ${
                          selectedJob?.id === job.id
                            ? 'border-gray-900 bg-gray-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <button
                          onClick={() => handleJobSelect(job)}
                          className="w-full text-left p-4"
                        >
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                          {selectedJob?.id === job.id ? (
                            <p className="text-xs font-semibold text-gray-700">
                              {applications.length} application{applications.length !== 1 ? 's' : ''}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">Click to view applications</p>
                          )}
                        </button>
                        <div className="px-4 pb-4 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditJob(job);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200 flex items-center justify-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(job);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 border border-red-200 flex items-center justify-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Applications List */}
          <div className="lg:col-span-2">
            {!selectedJob ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center animate-fadeIn">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">Select a Job</h3>
                <p className="text-gray-600 text-base font-light">Choose a job from the list to view applications</p>
              </div>
            ) : applicationsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
                <p className="mt-4 text-gray-600 text-sm font-medium">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center animate-fadeIn">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-600 text-base font-light">No one has applied to this job yet.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedJob.title}</h2>
                  <p className="text-sm text-gray-600 mb-4">{selectedJob.company} • {selectedJob.location}</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {applications.length} Application{applications.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer animate-fadeIn"
                    onClick={() => setSelectedApplication(app)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{app.fullName || 'Applicant'}</h3>
                        <p className="text-sm text-gray-600 mb-2">{app.applicantEmail}</p>
                        {app.phoneNumber && (
                          <p className="text-sm text-gray-600">📞 {app.phoneNumber}</p>
                        )}
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${statusColors[app.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {statusOptions.find(s => s.value === app.status)?.label || app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      {app.lastUpdated && (
                        <span>Updated: {new Date(app.lastUpdated).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Job Modal */}
        {editingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 animate-slideIn">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Job</h2>
                  <button
                    onClick={() => {
                      setEditingJob(null);
                      setEditFormData({});
                    }}
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 flex items-center justify-center text-xl font-light shadow-sm hover:shadow-md"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateJob} className="p-6 space-y-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditFormChange}
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
                    value={editFormData.company}
                    onChange={handleEditFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={editFormData.location}
                    onChange={handleEditFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    rows="6"
                    required
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="active"
                    id="active"
                    checked={editFormData.active}
                    onChange={handleEditFormChange}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-400"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Job is active (visible to applicants)
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-md bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold py-2.5 px-6 transition-colors duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Updating...
                      </span>
                    ) : (
                      "Update Job"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingJob(null);
                      setEditFormData({});
                    }}
                    disabled={isSubmitting}
                    className="flex-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-900 font-semibold py-2.5 px-6 transition-colors duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {jobToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-slideIn">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delete Job</h2>
                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{jobToDelete.title}</p>
                  <p className="text-xs text-gray-600">{jobToDelete.company} • {jobToDelete.location}</p>
                </div>

                <p className="text-sm text-gray-700 mb-6">
                  Are you sure you want to delete this job posting? All applications associated with this job will remain in the system, but the job will no longer be visible to applicants.
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
                      "Delete Job"
                    )}
                  </button>
                  <button
                    onClick={() => setJobToDelete(null)}
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

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 animate-slideIn">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedApplication.jobTitle}</p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 flex items-center justify-center text-xl font-light shadow-sm hover:shadow-md"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Applicant Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Applicant Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Full Name</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedApplication.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedApplication.applicantEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Phone</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedApplication.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Experience</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedApplication.experience || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">Cover Letter</h3>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resume */}
                {selectedApplication.resumeFileName && (
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">Resume</h3>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{selectedApplication.resumeFileName}</p>
                          <p className="text-xs text-gray-600">
                            {selectedApplication.resumeFileSize ? `${(selectedApplication.resumeFileSize / 1024).toFixed(2)} KB` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadResume(selectedApplication)}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Download Resume
                      </button>
                    </div>
                  </div>
                )}

                {/* Links */}
                {(selectedApplication.linkedInUrl || selectedApplication.portfolioUrl) && (
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">Links</h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedApplication.linkedInUrl && (
                        <a
                          href={selectedApplication.linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm transition-all duration-200 border border-blue-200"
                        >
                          LinkedIn
                        </a>
                      )}
                      {selectedApplication.portfolioUrl && (
                        <a
                          href={selectedApplication.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-semibold text-sm transition-all duration-200 border border-purple-200"
                        >
                          Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Update Application Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusUpdate(selectedApplication.id, status.value)}
                        disabled={updatingStatus || selectedApplication.status === status.value}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-semibold ${
                          selectedApplication.status === status.value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <div className="text-xs mb-1">{status.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Current status: <span className="font-semibold">{statusOptions.find(s => s.value === selectedApplication.status)?.label || selectedApplication.status}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

