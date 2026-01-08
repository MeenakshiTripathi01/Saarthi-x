import React, { useState, useEffect } from 'react';
import { getShortlistedStudents, removeShortlist } from '../api/studentDatabaseApi';
import { useAuth } from '../context/AuthContext';
import StudentDetailModal from './StudentDetailModal';
import { useNavigate } from 'react-router-dom';

export default function ShortlistedCandidates() {
  const { user, isIndustry } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (isIndustry) {
      fetchShortlistedStudents();
    }
  }, [isIndustry]);

  const fetchShortlistedStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getShortlistedStudents();
      setStudents(response.students || []);
    } catch (err) {
      setError(err.message || 'Failed to load shortlisted students');
      console.error('Error fetching shortlisted students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleRemoveShortlist = async (studentId, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to remove this candidate from your shortlist?')) {
      try {
        await removeShortlist(studentId);
        fetchShortlistedStudents(); // Refresh the list
        alert('Student removed from shortlist');
      } catch (err) {
        alert(err.message || 'Failed to remove shortlist');
      }
    }
  };

  if (!isIndustry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only Industry users can access shortlisted candidates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Shortlisted Candidates
              </h1>
              <p className="text-gray-600 mt-1">Your saved candidate profiles</p>
            </div>
            <button
              onClick={() => navigate('/browse-students')}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Database
            </button>
          </div>
        </div>

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

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-4">
            <p className="text-gray-600">
              You have <span className="font-semibold text-gray-900">{students.length}</span> shortlisted candidate{students.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Student Cards Grid */}
        {!loading && !error && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <ShortlistedStudentCard
                key={student.studentId}
                student={student}
                onViewProfile={handleViewProfile}
                onRemoveShortlist={handleRemoveShortlist}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && students.length === 0 && (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Shortlisted Candidates Yet</h3>
            <p className="text-gray-600 mb-6">
              Browse the student database and shortlist candidates that match your requirements.
            </p>
            <button
              onClick={() => navigate('/browse-students')}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Student Database
            </button>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          subscriptionType="FREE" // All users can access shortlisted students now
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
            fetchShortlistedStudents(); // Refresh in case shortlist status changed
          }}
        />
      )}
    </div>
  );
}

// Shortlisted Student Card Component
function ShortlistedStudentCard({ student, onViewProfile, onRemoveShortlist }) {
  return (
    <div 
      onClick={() => onViewProfile(student)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-yellow-200 relative overflow-hidden"
    >
      {/* Shortlisted Badge */}
      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-bl-lg text-xs font-bold flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Shortlisted
      </div>

      {/* Header with photo and remove button */}
      <div className="flex items-start justify-between mb-4 mt-2">
        <div className="flex items-center gap-3">
          {student.profilePictureBase64 ? (
            <img
              src={`data:image/jpeg;base64,${student.profilePictureBase64}`}
              alt={student.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-yellow-300"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-yellow-300">
              <span className="text-2xl font-bold text-yellow-600">
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
        
        {/* Remove Button */}
        <button
          onClick={(e) => onRemoveShortlist(student.studentId, e)}
          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          title="Remove from shortlist"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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

      {/* Contact Info (visible for PAID users) */}
      {student.email && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-green-800 font-medium">{student.email}</p>
          </div>
          {student.phoneNumber && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p className="text-sm text-green-800 font-medium">{student.phoneNumber}</p>
            </div>
          )}
        </div>
      )}

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

      {/* View Full Profile Button */}
      <div className="pt-4 border-t border-gray-200">
        <button className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
          View Full Profile
        </button>
      </div>
    </div>
  );
}

