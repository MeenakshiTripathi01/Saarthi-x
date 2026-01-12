import axios from 'axios';
import axiosInstance from './axiosConfig';
import { BACKEND_URL } from '../config';

const API_KEY = 'af93a5aec5msh431daab4f70e59fp1726b9jsn6d555bb1cda3';
const HOST = 'jsearch.p.rapidapi.com';
const BASE_URL = `https://${HOST}`;

// Search for jobs
export const fetchJobs = async (query = 'developer jobs', location = 'us', page = 1) => {
  const options = {
    method: 'GET',
    url: `${BASE_URL}/search`,
    params: {
      query: query || 'developer jobs',
      page: page.toString(),
      num_pages: '1',
      country: location || 'us',
      date_posted: 'all'
    },
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': HOST
    }
  };

  try {
    const response = await axios.request(options);
    console.log(response.data);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Get job details by job_id
export const fetchJobDetails = async (jobId, country = 'us') => {
  const options = {
    method: 'GET',
    url: `${BASE_URL}/job-details`,
    params: {
      job_id: jobId,
      country: country
    },
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': HOST
    }
  };

  try {
    const response = await axios.request(options);
    return response.data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
};

// Get estimated salaries for jobs
export const fetchJobSalaries = async (jobTitle, location, radius = 200) => {
  const options = {
    method: 'GET',
    url: `${BASE_URL}/estimated-salary`,
    params: {
      job_title: jobTitle,
      location: location,
      radius: radius.toString()
    },
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': HOST
    }
  };

  try {
    const response = await axios.request(options);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching job salaries:', error);
    return [];
  }
};

// Get user's job applications with tracking (from database only)
export const getUserJobApplications = async () => {
  const response = await axiosInstance.get(
    `${BACKEND_URL}/api/applications`
  );
  return response.data || [];
};

// Update job application status
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const response = await axiosInstance.put(
      `${BACKEND_URL}/api/applications/${applicationId}`,
      { status }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Record job application (add to tracker with full form data)
export const recordJobApplication = async (applicationData) => {
  try {
    const response = await axiosInstance.post(
      `${BACKEND_URL}/api/applications`,
      applicationData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error recording job application:', error);
    throw error;
  }
};

// Profile API functions
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get(
      `${BACKEND_URL}/api/profile`
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Profile doesn't exist yet
    }
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const saveUserProfile = async (profileData) => {
  try {
    console.log('Sending profile data to backend:', {
      url: `${BACKEND_URL}/api/profile`,
      dataKeys: Object.keys(profileData),
      hasResume: !!profileData.resumeBase64
    });

    const response = await axiosInstance.post(
      `${BACKEND_URL}/api/profile`,
      profileData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Profile save response:', {
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error) {
    console.error('Error saving user profile:', error);
    console.error('Error response:', error.response);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put(
      `${BACKEND_URL}/api/profile`,
      profileData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Industry API functions
export const getMyPostedJobs = async () => {
  try {
    const response = await axiosInstance.get(
      `${BACKEND_URL}/api/applications/my-jobs`
    );
    console.log('getMyPostedJobs response:', response);
    console.log('Response data:', response.data);
    console.log('Response data type:', typeof response.data);

    // Handle both direct array and wrapped response
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (typeof response.data === 'string') {
      // If backend returns a string error message
      console.error('Backend returned string:', response.data);
      throw new Error(response.data);
    } else {
      console.warn('Unexpected response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching posted jobs:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);

    // Re-throw with more context
    if (error.response) {
      // Handle string error messages from backend
      let errorMsg = error.response.data;
      if (typeof errorMsg === 'string') {
        throw new Error(errorMsg);
      } else if (errorMsg?.message) {
        throw new Error(errorMsg.message);
      } else {
        throw new Error(error.response.statusText || `Server error: ${error.response.status}`);
      }
    }
    throw error;
  }
};

export const getApplicationsByJobId = async (jobId) => {
  try {
    const response = await axiosInstance.get(
      `/api/applications/job/${jobId}`
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching applications for job:', error);
    throw error;
  }
};

export const updateApplicationStatusByIndustry = async (applicationId, status) => {
  try {
    const response = await axiosInstance.put(
      `/api/applications/${applicationId}/status`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Update a job (INDUSTRY users only)
export const updateJob = async (jobId, jobData) => {
  try {
    const response = await axiosInstance.put(
      `/api/jobs/${jobId}`,
      jobData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

// Delete a job (INDUSTRY users only)
export const deleteJob = async (jobId) => {
  try {
    const response = await axiosInstance.delete(
      `/api/jobs/${jobId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

// Get applicant profiles for a job (INDUSTRY users only)
export const getApplicantProfilesByJobId = async (jobId) => {
  try {
    const response = await axiosInstance.get(
      `/api/applications/job/${jobId}/profiles`
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching applicant profiles:', error);
    throw error;
  }
};

// Get recommended jobs for authenticated applicant
export const getRecommendedJobs = async () => {
  try {
    const response = await axiosInstance.get(
      `/api/jobs/recommended/jobs`
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching recommended jobs:', error);
    throw error;
  }
};

// Hackathon API functions
export const getAllHackathons = async () => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathons`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching all hackathons:', error);
    throw error;
  }
};

export const getMyHackathons = async () => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathons/my-hackathons`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching my hackathons:', error);
    throw error;
  }
};

export const createHackathon = async (hackathonData) => {
  try {
    const response = await axiosInstance.post(
      `/api/hackathons`,
      hackathonData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating hackathon:', error);
    throw error;
  }
};

export const deleteHackathon = async (hackathonId) => {
  try {
    const response = await axiosInstance.delete(
      `/api/hackathons/${hackathonId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting hackathon:', error);
    throw error;
  }
};

export const updateHackathon = async (hackathonId, hackathonData) => {
  try {
    const response = await axiosInstance.put(
      `/api/hackathons/${hackathonId}`,
      hackathonData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating hackathon:', error);
    throw error;
  }
};

// Hackathon Application API functions (for Applicants)
export const applyForHackathon = async (hackathonId, applicationData) => {
  try {
    console.log('[API] applyForHackathon - Sending to backend:', applicationData);
    console.log('[API] individualName being sent:', applicationData.individualName);
    console.log('[API] individualQualifications being sent:', applicationData.individualQualifications);
    
    const response = await axiosInstance.post(
      `/api/hackathon-applications/${hackathonId}/apply`,
      applicationData
    );
    
    console.log('[API] Response from backend:', response.data);
    console.log('[API] Response individualName:', response.data.individualName);
    console.log('[API] Response individualQualifications:', response.data.individualQualifications);
    
    return response.data;
  } catch (error) {
    console.error('Error applying for hackathon:', error);
    throw error;
  }
};

export const getMyHackathonApplications = async () => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathon-applications/my-applications`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching my hackathon applications:', error);
    throw error;
  }
};
export const getHackathonById = async (hackathonId) => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathons/${hackathonId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching hackathon by ID:', error);
    throw error;
  }
};

export const incrementHackathonViews = async (hackathonId) => {
  try {
    const response = await axiosInstance.post(
      `/api/hackathons/${hackathonId}/increment-views`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error incrementing hackathon views:', error);
    // Don't throw error - views increment is not critical
    return null;
  }
};

export const submitHackathonPhase = async (applicationId, phaseId, submissionData) => {
  try {
    const response = await axiosInstance.post(
      `/api/hackathon-applications/${applicationId}/phases/${phaseId}/submit`,
      submissionData
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting hackathon phase:', error);
    throw error;
  }
};

export const reviewHackathonPhase = async (applicationId, phaseId, reviewData) => {
  try {
    const response = await axiosInstance.put(
      `/api/hackathon-applications/${applicationId}/phases/${phaseId}/review`,
      reviewData
    );
    return response.data;
  } catch (error) {
    console.error('Error reviewing hackathon phase:', error);
    throw error;
  }
};

export const getHackathonApplications = async (hackathonId) => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathon-applications/hackathon/${hackathonId}`
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching hackathon applications:', error);
    throw error;
  }
};

export const getHackathonApplicationDetails = async (applicationId) => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathon-applications/${applicationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching hackathon application details:', error);
    throw error;
  }
};

export const deleteHackathonApplication = async (applicationId) => {
  try {
    const response = await axiosInstance.delete(
      `/api/hackathon-applications/${applicationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting hackathon application:', error);
    throw error;
  }
};

export const rejectHackathonApplication = async (applicationId, rejectionMessage) => {
  try {
    const response = await axiosInstance.put(
      `/api/hackathon-applications/${applicationId}/reject`,
      { rejectionMessage }
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting hackathon application:', error);
    throw error;
  }
};

export const requestReupload = async (applicationId, phaseId, message) => {
  try {
    const response = await axiosInstance.put(
      `/api/hackathon-applications/${applicationId}/phases/${phaseId}/request-reupload`,
      { message }
    );
    return response.data;
  } catch (error) {
    console.error('Error requesting re-upload:', error);
    throw error;
  }
};

// Hackathon Results API functions
// payload should contain certificateTemplateId, logoUrl, platformLogoUrl, customMessage, signatureLeftUrl, signatureRightUrl, etc.
export const finalizeHackathonResults = async (hackathonId, payload) => {
  try {
    console.log('[API] finalizeHackathonResults', { hackathonId, payload });
    const response = await axiosInstance.post(
      `/api/hackathon-applications/hackathon/${hackathonId}/finalize-results`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error finalizing hackathon results:', error);
    throw error;
  }
};

export const publishShowcaseContent = async (applicationId, showcaseData) => {
  try {
    const response = await axiosInstance.put(
      `/api/hackathon-applications/${applicationId}/showcase`,
      showcaseData
    );
    return response.data;
  } catch (error) {
    console.error('Error publishing showcase content:', error);
    throw error;
  }
};

export const getApplicationResults = async (applicationId) => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathon-applications/${applicationId}/results`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching application results:', error);
    throw error;
  }
};

export const getHackathonResults = async (hackathonId) => {
  try {
    const response = await axiosInstance.get(
      `/api/hackathon-applications/hackathon/${hackathonId}/results`
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching hackathon results:', error);
    throw error;
  }
};

// Improve problem statement with AI
export const improveProblemStatement = async (problemStatement) => {
  try {
    const response = await axiosInstance.post(
      `/api/hackathons/improve-problem-statement`,
      { problemStatement }
    );
    return response.data;
  } catch (error) {
    // Handle authentication errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error('Please log in to use this feature');
      } else if (status === 403) {
        const message = typeof data === 'string' ? data : (data?.message || 'Access denied');
        throw new Error(message);
      } else if (status === 302 || status === 301) {
        // Redirect to OAuth login
        throw new Error('Session expired. Please log in again.');
      }
    }
    
    // Handle network errors or other issues
    if (error.message && error.message.includes('Network Error')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    console.error('Error improving problem statement:', error);
    throw error;
  }
};

// Improve eligibility criteria with AI
export const improveEligibilityCriteria = async (eligibility) => {
  try {
    const response = await axiosInstance.post(
      `/api/hackathons/improve-eligibility`,
      { eligibility }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error('Please log in to use this feature');
      } else if (status === 403) {
        const message = typeof data === 'string' ? data : (data?.message || 'Access denied');
        throw new Error(message);
      }
    }
    
    if (error.message && error.message.includes('Network Error')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    console.error('Error improving eligibility criteria:', error);
    throw error;
  }
};

// Improve submission guidelines with AI
export const improveSubmissionGuidelines = async (submissionGuidelines) => {
  try {
    const response = await axiosInstance.post(
      `/api/hackathons/improve-submission-guidelines`,
      { submissionGuidelines }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error('Please log in to use this feature');
      } else if (status === 403) {
        const message = typeof data === 'string' ? data : (data?.message || 'Access denied');
        throw new Error(message);
      }
    }
    
    if (error.message && error.message.includes('Network Error')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    console.error('Error improving submission guidelines:', error);
    throw error;
  }
};

