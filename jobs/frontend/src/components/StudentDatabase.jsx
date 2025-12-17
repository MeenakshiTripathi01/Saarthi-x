import React, { useState, useEffect } from 'react';
import { getAllStudents, shortlistStudent, removeShortlist } from '../api/studentDatabaseApi';
import { useAuth } from '../context/AuthContext';
import StudentDetailModal from './StudentDetailModal';

export default function StudentDatabase() {
  const { user, isIndustry } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState('FREE');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    keyword: '',
    degree: '',
    skills: '',
    location: '',
    graduationYear: '',
    availability: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch students on mount and when filters change
  useEffect(() => {
    if (isIndustry) {
      fetchStudents();
    }
  }, [isIndustry]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove empty filters
      const activeFilters = Object.keys(filters).reduce((acc, key) => {
        if (filters[key]) {
          acc[key] = filters[key];
        }
        return acc;
      }, {});
      
      const response = await getAllStudents(activeFilters);
      setStudents(response.students || []);
      setSubscriptionType(response.subscriptionType || 'FREE');
    } catch (err) {
      setError(err.message || 'Failed to load students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchStudents();
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      degree: '',
      skills: '',
      location: '',
      graduationYear: '',
      availability: '',
    });
    setTimeout(() => fetchStudents(), 100);
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleShortlist = async (studentId, e) => {
    e.stopPropagation();
    
    try {
      await shortlistStudent(studentId);
      // Refresh the list
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
      // Refresh the list
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Database</h1>
              <p className="text-gray-600 mt-1">Browse and filter registered student profiles</p>
            </div>
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search by name, skill, or college"
                  value={filters.keyword}
                  onChange={(e) => handleFilterChange('keyword', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Degree (e.g., B.Tech, MBA)"
                  value={filters.degree}
                  onChange={(e) => handleFilterChange('degree', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Skills (e.g., Python, React)"
                  value={filters.skills}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Graduation Year (e.g., 2024)"
                  value={filters.graduationYear}
                  onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Availability"
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4">
            <p className="text-gray-600">
              Found <span className="font-semibold text-gray-900">{students.length}</span> student{students.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Student Cards Grid */}
        {!loading && !error && (
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
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          subscriptionType={subscriptionType}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
            fetchStudents(); // Refresh in case shortlist status changed
          }}
        />
      )}
    </div>
  );
}

// Student Card Component
function StudentCard({ student, subscriptionType, onViewProfile, onShortlist, onRemoveShortlist }) {
  return (
    <div 
      onClick={() => onViewProfile(student)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200"
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
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-500">
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
                    className="bg-green-500 h-2 rounded-full"
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
            {student.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
            {student.skills.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{student.skills.length - 5} more
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

