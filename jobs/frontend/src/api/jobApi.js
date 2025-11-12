import axios from 'axios';

const API_KEY = 'efa1b0fc04mshe3bf27ddf6d5c80p1cac9bjsn574050d4c9d0';
const HOST = 'jsearch.p.rapidapi.com';

export const fetchJobs = async (query = 'developer jobs in chicago') => {
  const options = {
    method: 'GET',
    url: `https://${HOST}/search`,
    params: {
      query,
      page: '1',
      num_pages: '1',
      country: 'us',
      date_posted: 'all'
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
    console.error('Error fetching jobs:', error);
    return [];
  }
};

export const fetchJobDetails = async (jobId) => {
  const options = {
    method: 'GET',
    url: `https://${HOST}/job-details`,
    params: { job_id: jobId, country: 'us' },
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': HOST
    }
  };

  try {
    const response = await axios.request(options);
    return response.data.data[0] || {};
  } catch (error) {
    console.error('Error fetching job details:', error);
    return {};
  }
};
