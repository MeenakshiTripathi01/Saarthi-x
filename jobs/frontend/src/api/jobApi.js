import axios from 'axios';

const API_KEY = 'f0235cd2b0mshac603cc0e4cabafp1ffb39jsnd44cae2de884';
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

// Get user's job applications with tracking
export const getUserJobApplications = async () => {
  try {
    const response = await axios.get(
      'http://localhost:8080/api/applications',
      {
        withCredentials: true,
      }
    );
    return response.data || [];
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return [];
  }
};

// Update job application status
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const response = await axios.put(
      `http://localhost:8080/api/applications/${applicationId}`,
      { status },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Record job application (add to tracker)
export const recordJobApplication = async (jobData) => {
  try {
    const response = await axios.post(
      'http://localhost:8080/api/applications',
      {
        jobId: jobData.id,
        jobTitle: jobData.title,
        company: jobData.company || "Company confidential",
        location: jobData.location || "Location not specified",
        jobDescription: jobData.description || "",
        status: 'pending',
        appliedAt: new Date().toISOString(),
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error recording job application:', error);
    throw error;
  }
};
