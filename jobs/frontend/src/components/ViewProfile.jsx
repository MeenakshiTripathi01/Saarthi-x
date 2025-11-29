import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';

export default function ViewProfile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/');
        return;
      }
      loadProfile();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await getUserProfile();
      if (profileData) {
        setProfile(profileData);
      } else {
        setError('No profile found. Please build your profile first.');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      if (err.response?.status === 404) {
        setError('No profile found. Please build your profile first.');
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const hasValue = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-full border-4 border-gray-200 border-t-gray-400"></div>
          <p className="mt-4 text-gray-500 text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Profile Not Found</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => navigate('/build-profile')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-400 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              Build Your Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
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
              <div className="w-20 h-20 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-semibold text-gray-800 tracking-tight">
                  {profile.fullName || user?.name || 'My Profile'}
                </h1>
                <p className="mt-1 text-gray-500">View your complete profile information</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/build-profile')}
              className="px-6 py-3 bg-purple-400 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Personal Information */}
          {(hasValue(profile.fullName) || hasValue(profile.email) || hasValue(profile.phoneNumber)) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {hasValue(profile.fullName) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                    <p className="text-sm font-medium text-gray-800">{profile.fullName}</p>
                  </div>
                )}
                {hasValue(profile.email) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-800">{profile.email}</p>
                  </div>
                )}
                {hasValue(profile.phoneNumber) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-gray-800">{profile.phoneNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Information */}
          {(hasValue(profile.professionalExperiences) || hasValue(profile.currentPosition) || hasValue(profile.currentCompany) || hasValue(profile.experience) || hasValue(profile.skills) || hasValue(profile.summary)) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Professional Information</h2>
              </div>
              <div className="space-y-6">
                {/* Professional Experiences */}
                {hasValue(profile.professionalExperiences) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Professional Experiences</p>
                    <div className="space-y-4">
                      {profile.professionalExperiences.map((exp, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-base font-semibold text-gray-800">{exp.jobTitle || 'N/A'}</h3>
                              <p className="text-sm text-gray-600 mt-0.5">{exp.company || 'N/A'}</p>
                            </div>
                            {exp.isCurrentJob && (
                              <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-medium border border-emerald-200">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Start Date</p>
                              <p className="text-gray-700">{exp.startDate || 'N/A'}</p>
                            </div>
                            {!exp.isCurrentJob && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">End Date</p>
                                <p className="text-gray-700">{exp.endDate || 'N/A'}</p>
                              </div>
                            )}
                          </div>
                          {exp.description && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Description</p>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy fields for backward compatibility */}
                {(hasValue(profile.currentPosition) || hasValue(profile.currentCompany) || hasValue(profile.experience)) && !hasValue(profile.professionalExperiences) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {hasValue(profile.currentPosition) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Position</p>
                        <p className="text-sm font-medium text-gray-800">{profile.currentPosition}</p>
                      </div>
                    )}
                    {hasValue(profile.currentCompany) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Company</p>
                        <p className="text-sm font-medium text-gray-800">{profile.currentCompany}</p>
                      </div>
                    )}
                    {hasValue(profile.experience) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Years of Experience</p>
                        <p className="text-sm font-medium text-gray-800">{profile.experience}</p>
                      </div>
                    )}
                  </div>
                )}

                {hasValue(profile.skills) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hasValue(profile.summary) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Professional Summary</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{profile.summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education & Certifications */}
          {(hasValue(profile.educationEntries) || hasValue(profile.certificationFiles) || hasValue(profile.education) || hasValue(profile.certifications)) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Education & Certifications</h2>
              </div>
              <div className="space-y-6">
                {/* Education Entries */}
                {hasValue(profile.educationEntries) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Education</p>
                    <div className="space-y-4">
                      {profile.educationEntries.map((edu, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Level</p>
                              <p className="text-sm font-medium text-gray-800">{edu.level || 'N/A'}</p>
                            </div>
                            {edu.degree && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Degree/Course</p>
                                <p className="text-sm font-medium text-gray-800">{edu.degree}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Institution/University</p>
                              <p className="text-sm font-medium text-gray-800">{edu.institution || 'N/A'}</p>
                            </div>
                            {edu.level === 'Class 12th' && edu.board && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Board</p>
                                <p className="text-sm font-medium text-gray-800">{edu.board}</p>
                              </div>
                            )}
                            {edu.level === 'Class 12th' && edu.stream && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Stream</p>
                                <p className="text-sm font-medium text-gray-800">{edu.stream}</p>
                              </div>
                            )}
                            {edu.passingYear && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Passing Year</p>
                                <p className="text-sm font-medium text-gray-800">{edu.passingYear}</p>
                              </div>
                            )}
                            {edu.percentage && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Percentage/CGPA</p>
                                <p className="text-sm font-medium text-gray-800">{edu.percentage}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy education field for backward compatibility */}
                {hasValue(profile.education) && !hasValue(profile.educationEntries) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Education</p>
                    <p className="text-sm font-medium text-gray-800">{profile.education}</p>
                  </div>
                )}

                {/* Certification Files */}
                {hasValue(profile.certificationFiles) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Certifications</p>
                    <div className="space-y-4">
                      {profile.certificationFiles.map((cert, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-800 mb-1">{cert.name || 'Unnamed Certification'}</h3>
                              {cert.issuingOrganization && (
                                <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                              )}
                            </div>
                            {cert.fileName && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatFileSize(cert.fileSize || 0)}
                              </div>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            {cert.issueDate && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Issue Date</p>
                                <p className="text-gray-700">{cert.issueDate}</p>
                              </div>
                            )}
                            {cert.expiryDate && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Expiry Date</p>
                                <p className="text-gray-700">{cert.expiryDate}</p>
                              </div>
                            )}
                          </div>
                          {cert.fileName && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">File</p>
                              <p className="text-sm text-gray-700">{cert.fileName}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy certifications field for backward compatibility */}
                {hasValue(profile.certifications) && !hasValue(profile.certificationFiles) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Certifications</p>
                    <p className="text-sm font-medium text-gray-800">{profile.certifications}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Preferences */}
          {(hasValue(profile.currentLocation) || hasValue(profile.preferredLocations) || hasValue(profile.preferredLocation) || hasValue(profile.workPreference) || profile.willingToRelocate !== undefined) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Location Preferences</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {hasValue(profile.currentLocation) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Location</p>
                    <p className="text-sm font-medium text-gray-800">{profile.currentLocation}</p>
                  </div>
                )}
                {(hasValue(profile.preferredLocations) || hasValue(profile.preferredLocation)) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preferred Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.preferredLocations || (profile.preferredLocation ? [profile.preferredLocation] : [])).map((location, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                        >
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {hasValue(profile.workPreference) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Work Preference</p>
                    <p className="text-sm font-medium text-gray-800">{profile.workPreference}</p>
                  </div>
                )}
                {profile.willingToRelocate !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Willing to Relocate</p>
                    <p className="text-sm font-medium text-gray-800">
                      {profile.willingToRelocate ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-600">No</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hobbies & Interests */}
          {hasValue(profile.hobbies) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Hobbies & Interests</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map((hobby, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Links */}
          {(hasValue(profile.linkedInUrl) || hasValue(profile.portfolioUrl) || hasValue(profile.githubUrl) || hasValue(profile.websiteUrl)) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Contact & Links</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {hasValue(profile.linkedInUrl) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">LinkedIn</p>
                    <a
                      href={profile.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-purple-500 hover:text-purple-600 hover:underline inline-flex items-center gap-1"
                    >
                      {profile.linkedInUrl}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                {hasValue(profile.portfolioUrl) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Portfolio</p>
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-purple-500 hover:text-purple-600 hover:underline inline-flex items-center gap-1"
                    >
                      {profile.portfolioUrl}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                {hasValue(profile.githubUrl) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">GitHub</p>
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-purple-500 hover:text-purple-600 hover:underline inline-flex items-center gap-1"
                    >
                      {profile.githubUrl}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                {hasValue(profile.websiteUrl) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Website</p>
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-purple-500 hover:text-purple-600 hover:underline inline-flex items-center gap-1"
                    >
                      {profile.websiteUrl}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(hasValue(profile.availability) || hasValue(profile.expectedSalary) || hasValue(profile.coverLetterTemplate)) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Additional Information</h2>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {hasValue(profile.availability) && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Availability</p>
                      <p className="text-sm font-medium text-gray-800">{profile.availability}</p>
                    </div>
                  )}
                  {hasValue(profile.expectedSalary) && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Salary</p>
                      <p className="text-sm font-medium text-gray-800">{profile.expectedSalary}</p>
                    </div>
                  )}
                </div>
                {hasValue(profile.coverLetterTemplate) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cover Letter Template</p>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {profile.coverLetterTemplate}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resume */}
          {profile.resumeFileName && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Resume</h2>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center border border-emerald-200">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{profile.resumeFileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatFileSize(profile.resumeFileSize || 0)} • {profile.resumeFileType || 'Document'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Uploaded
                </div>
              </div>
            </div>
          )}

          {/* Profile Completion Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-1">Profile Last Updated</p>
                <p className="text-xs text-gray-500">
                  {profile.lastUpdated ? new Date(profile.lastUpdated).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not available'}
                </p>
              </div>
              <button
                onClick={() => navigate('/build-profile')}
                className="px-4 py-2 bg-purple-400 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

