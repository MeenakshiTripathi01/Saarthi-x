import React, { useState, useEffect } from 'react';
import { getAllStudents, shortlistStudent, removeShortlist } from '../api/studentDatabaseApi';
import { useAuth } from '../context/AuthContext';
import StudentDetailModal from './StudentDetailModal';

export default function StudentDatabaseEnhanced() {
  const { user, isIndustry } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState('FREE');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Hierarchical filter states
  const [filters, setFilters] = useState({
    education: {
      degree: '',
      stream: '',
      year: ''
    },
    location: {
      state: '',
      city: ''
    },
    gender: '',
    college: '',
    skills: '',
    keyword: ''
  });

  // Accordion states for filter panels
  const [accordionOpen, setAccordionOpen] = useState({
    education: true,
    location: false,
    demographics: false,
    other: false
  });

  // Mock data for filter options (in production, fetch from backend)
  const filterOptions = {
    degrees: ['B.Tech', 'B.E', 'BCA', 'MCA', 'M.Tech', 'MBA', 'BBA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com'],
    streams: {
      'B.Tech': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'],
      'B.E': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'],
      'BCA': ['Computer Applications'],
      'MCA': ['Computer Applications'],
      'MBA': ['Finance', 'Marketing', 'HR', 'Operations', 'IT'],
      'BBA': ['Finance', 'Marketing', 'HR'],
      'B.Sc': ['Computer Science', 'IT', 'Physics', 'Chemistry', 'Mathematics'],
      'M.Sc': ['Computer Science', 'IT', 'Physics', 'Chemistry', 'Mathematics']
    },
    years: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027'],
    states: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Telangana', 'Kerala'],
    cities: {
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
      'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli'],
      'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'],
      'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Agra'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
      'West Bengal': ['Kolkata', 'Durgapur', 'Siliguri'],
      'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota'],
      'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
      'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode']
    },
    genders: ['Male', 'Female', 'Other', 'Prefer not to say']
  };

  useEffect(() => {
    if (isIndustry) {
      fetchStudents();
    }
  }, [isIndustry]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build flat filter object for API
      const apiFilters = {
        keyword: filters.keyword,
        degree: filters.education.degree,
        specialization: filters.education.stream,
        graduationYear: filters.education.year,
        location: filters.location.state || filters.location.city,
        college: filters.college,
        skills: filters.skills
      };
      
      // Remove empty filters
      Object.keys(apiFilters).forEach(key => {
        if (!apiFilters[key]) delete apiFilters[key];
      });
      
      const response = await getAllStudents(apiFilters);
      
      // Apply gender filter on frontend (if not supported by backend)
      let filteredStudents = response.students || [];
      if (filters.gender) {
        filteredStudents = filteredStudents.filter(s => 
          s.gender && s.gender.toLowerCase() === filters.gender.toLowerCase()
        );
      }
      
      setStudents(filteredStudents);
      setSubscriptionType(response.subscriptionType || 'FREE');
    } catch (err) {
      setError(err.message || 'Failed to load students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (category, field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (category === 'root') {
        newFilters[field] = value;
      } else {
        newFilters[category] = {
          ...newFilters[category],
          [field]: value
        };
        
        // Reset dependent filters
        if (category === 'education' && field === 'degree') {
          newFilters.education.stream = '';
        }
        if (category === 'location' && field === 'state') {
          newFilters.location.city = '';
        }
      }
      
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    fetchStudents();
  };

  const handleClearFilters = () => {
    setFilters({
      education: { degree: '', stream: '', year: '' },
      location: { state: '', city: '' },
      gender: '',
      college: '',
      skills: '',
      keyword: ''
    });
    setTimeout(() => fetchStudents(), 100);
  };

  const toggleAccordion = (section) => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleShortlist = async (studentId, e) => {
    e.stopPropagation();
    
    try {
      await shortlistStudent(studentId);
      fetchStudents();
      alert('Student shortlisted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to shortlist student');
    }
  };

  const handleRemoveShortlist = async (studentId, e) => {
    e.stopPropagation();
    
    try {
      await removeShortlist(studentId);
      fetchStudents();
      alert('Student removed from shortlist');
    } catch (err) {
      alert(err.message || 'Failed to remove shortlist');
    }
  };

  if (!isIndustry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only Industry users can access the student database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT SIDEBAR - FILTER RIBBON */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Filter Candidates</h2>
        </div>

        <div className="p-4 space-y-2">
          {/* Quick Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Search</label>
            <input
              type="text"
              placeholder="Name, skill, or college..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange('root', 'keyword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* EDUCATION FILTER ACCORDION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleAccordion('education')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span className="font-semibold text-gray-900">Education</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${accordionOpen.education ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {accordionOpen.education && (
              <div className="p-4 space-y-3 bg-white">
                {/* Degree */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
                  <select
                    value={filters.education.degree}
                    onChange={(e) => handleFilterChange('education', 'degree', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Degree</option>
                    {filterOptions.degrees.map(degree => (
                      <option key={degree} value={degree}>{degree}</option>
                    ))}
                  </select>
                </div>

                {/* Stream (conditional on degree) */}
                {filters.education.degree && filterOptions.streams[filters.education.degree] && (
                  <div className="pl-3 border-l-2 border-blue-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stream / Specialization</label>
                    <select
                      value={filters.education.stream}
                      onChange={(e) => handleFilterChange('education', 'stream', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Stream</option>
                      {filterOptions.streams[filters.education.degree].map(stream => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Year */}
                <div className={filters.education.stream ? 'pl-6 border-l-2 border-blue-200' : ''}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Graduation Year</label>
                  <select
                    value={filters.education.year}
                    onChange={(e) => handleFilterChange('education', 'year', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Year</option>
                    {filterOptions.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* LOCATION FILTER ACCORDION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleAccordion('location')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-semibold text-gray-900">Location</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${accordionOpen.location ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {accordionOpen.location && (
              <div className="p-4 space-y-3 bg-white">
                {/* State */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={filters.location.state}
                    onChange={(e) => handleFilterChange('location', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {filterOptions.states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* City (conditional on state) */}
                {filters.location.state && filterOptions.cities[filters.location.state] && (
                  <div className="pl-3 border-l-2 border-green-200">
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <select
                      value={filters.location.city}
                      onChange={(e) => handleFilterChange('location', 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select City</option>
                      {filterOptions.cities[filters.location.state].map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DEMOGRAPHICS ACCORDION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleAccordion('demographics')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold text-gray-900">Demographics</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${accordionOpen.demographics ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {accordionOpen.demographics && (
              <div className="p-4 space-y-3 bg-white">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('root', 'gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    {filterOptions.genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* OTHER FILTERS ACCORDION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleAccordion('other')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="font-semibold text-gray-900">Other Filters</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${accordionOpen.other ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {accordionOpen.other && (
              <div className="p-4 space-y-3 bg-white">
                {/* College */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">College / Institute</label>
                  <input
                    type="text"
                    placeholder="Enter college name..."
                    value={filters.college}
                    onChange={(e) => handleFilterChange('root', 'college', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Skills</label>
                  <input
                    type="text"
                    placeholder="e.g., Python, React, Java..."
                    value={filters.skills}
                    onChange={(e) => handleFilterChange('root', 'skills', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={handleApplyFilters}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>

          {/* Active Filters Summary */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-1">
              {filters.education.degree && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                  {filters.education.degree}
                </span>
              )}
              {filters.education.stream && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                  {filters.education.stream}
                </span>
              )}
              {filters.education.year && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                  {filters.education.year}
                </span>
              )}
              {filters.location.state && (
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                  {filters.location.state}
                </span>
              )}
              {filters.location.city && (
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                  {filters.location.city}
                </span>
              )}
              {filters.gender && (
                <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                  {filters.gender}
                </span>
              )}
              {!filters.education.degree && !filters.location.state && !filters.gender && (
                <span className="text-xs text-gray-500">No filters applied</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Database</h1>
            <p className="text-gray-600">
              Browse and filter registered student profiles
            </p>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-700">
                Found <span className="font-bold text-gray-900">{students.length}</span> student{students.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Sort by: Relevance
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading students...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Student Cards Grid */}
          {!loading && !error && students.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <StudentCard
                  key={student.studentId}
                  student={student}
                  subscriptionType={subscriptionType}
                  onViewProfile={handleViewProfile}
                  onShortlist={handleShortlist}
                  onRemoveShortlist={handleRemoveShortlist}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && students.length === 0 && (
            <div className="text-center py-20">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search criteria to find more candidates.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          subscriptionType={subscriptionType}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}

// Student Card Component (reused from previous implementation)
function StudentCard({ student, subscriptionType, onViewProfile, onShortlist, onRemoveShortlist }) {
  return (
    <div 
      onClick={() => onViewProfile(student)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-gray-200 hover:border-blue-300"
    >
      {/* Header with photo and shortlist button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {student.profilePictureBase64 ? (
            <img
              src={`data:image/jpeg;base64,${student.profilePictureBase64}`}
              alt={student.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {student.fullName?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg text-gray-900">{student.fullName}</h3>
            {student.profileCompletenessScore && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${student.profileCompletenessScore}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{student.profileCompletenessScore}%</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Shortlist Button */}
        {student.isShortlisted ? (
          <button
            onClick={(e) => onRemoveShortlist(student.studentId, e)}
            className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
            title="Remove from shortlist"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={(e) => onShortlist(student.studentId, e)}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Add to shortlist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        )}
      </div>

      {/* Education Info */}
      <div className="mb-4">
        {student.degree && (
          <p className="font-semibold text-gray-900">{student.degree}</p>
        )}
        {student.specialization && (
          <p className="text-sm text-gray-600">{student.specialization}</p>
        )}
        {student.institution && (
          <p className="text-sm text-gray-600">{student.institution}</p>
        )}
        {student.graduationYear && (
          <p className="text-sm text-gray-500">Class of {student.graduationYear}</p>
        )}
      </div>

      {/* Skills */}
      {student.skills && student.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {student.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
              >
                {skill}
              </span>
            ))}
            {student.skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                +{student.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        {student.hackathonsParticipated !== undefined && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{student.hackathonsParticipated} Hackathons</span>
          </div>
        )}
        {student.jobsApplied !== undefined && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{student.jobsApplied} Applications</span>
          </div>
        )}
      </div>

      {/* Resume Status */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {student.resumeAvailable ? (
            <>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-green-600 font-medium">Resume Available</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-400">No Resume</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

