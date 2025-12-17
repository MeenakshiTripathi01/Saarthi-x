// API functions for Student Database Access feature

const API_BASE_URL = 'http://localhost:8080/api/students';

/**
 * Get all students with optional filters
 * @param {Object} filters - Filter criteria (degree, skills, location, etc.)
 * @returns {Promise} - Response with students array and subscription info
 */
export const getAllStudents = async (filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const url = queryParams.toString() 
      ? `${API_BASE_URL}?${queryParams.toString()}`
      : API_BASE_URL;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch students');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Get a single student by ID
 * @param {string} studentId - Student's profile ID
 * @returns {Promise} - Response with student data and subscription info
 */
export const getStudentById = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${studentId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch student');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
};

/**
 * Shortlist a student (PAID users only)
 * @param {string} studentId - Student's profile ID
 * @returns {Promise} - Response with success message
 */
export const shortlistStudent = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${studentId}/shortlist`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to shortlist student');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error shortlisting student:', error);
    throw error;
  }
};

/**
 * Remove a student from shortlist
 * @param {string} studentId - Student's profile ID
 * @returns {Promise} - Response with success message
 */
export const removeShortlist = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${studentId}/shortlist`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to remove shortlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing shortlist:', error);
    throw error;
  }
};

/**
 * Get all shortlisted students (PAID users only)
 * @returns {Promise} - Response with shortlisted students array
 */
export const getShortlistedStudents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/shortlisted`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch shortlisted students');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching shortlisted students:', error);
    throw error;
  }
};

/**
 * Download resume (PAID users only)
 * @param {string} studentId - Student's profile ID
 * @returns {Promise} - Response with resume data (base64)
 */
export const downloadResume = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${studentId}/resume/download`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to download resume');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error downloading resume:', error);
    throw error;
  }
};

/**
 * Get current user's subscription info
 * @returns {Promise} - Response with subscription type and features
 */
export const getSubscriptionInfo = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscription/info`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch subscription info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    throw error;
  }
};

/**
 * Update subscription type (for testing)
 * @param {string} subscriptionType - "FREE" or "PAID"
 * @returns {Promise} - Response with updated subscription info
 */
export const updateSubscription = async (subscriptionType) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscription/update`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionType }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update subscription');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

