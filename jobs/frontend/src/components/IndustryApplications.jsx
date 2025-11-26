import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getMyPostedJobs, getApplicationsByJobId, updateApplicationStatusByIndustry } from '../api/jobApi';

export default function IndustryApplications() {
  const navigate = useNavigate();
  const { isAuthenticated, isIndustry, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
                      <button
                        key={job.id}
                        onClick={() => handleJobSelect(job)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedJob?.id === job.id
                            ? 'border-gray-900 bg-gray-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
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

