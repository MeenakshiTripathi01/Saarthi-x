import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserProfile, saveUserProfile } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';

export default function ProfileBuilder() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    currentPosition: '',
    currentCompany: '',
    experience: '',
    skills: [],
    summary: '',
    currentLocation: '',
    preferredLocation: '',
    workPreference: 'Remote',
    willingToRelocate: false,
    linkedInUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    websiteUrl: '',
    availability: 'Immediately',
    expectedSalary: '',
    coverLetterTemplate: '',
    education: '',
    certifications: '',
  });

  const [resume, setResume] = useState(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

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
      const profile = await getUserProfile();
      if (profile) {
        console.log('Loading profile data from database:', profile);
        
        // Load all form data from saved profile
        setFormData({
          fullName: profile.fullName || user?.name || '',
          phoneNumber: profile.phoneNumber || '',
          email: profile.email || user?.email || '',
          currentPosition: profile.currentPosition || '',
          currentCompany: profile.currentCompany || '',
          experience: profile.experience || '',
          skills: profile.skills || [],
          summary: profile.summary || '',
          currentLocation: profile.currentLocation || '',
          preferredLocation: profile.preferredLocation || '',
          workPreference: profile.workPreference || 'Remote',
          willingToRelocate: profile.willingToRelocate || false,
          linkedInUrl: profile.linkedInUrl || '',
          portfolioUrl: profile.portfolioUrl || '',
          githubUrl: profile.githubUrl || '',
          websiteUrl: profile.websiteUrl || '',
          availability: profile.availability || 'Immediately',
          expectedSalary: profile.expectedSalary || '',
          coverLetterTemplate: profile.coverLetterTemplate || '',
          education: profile.education || '',
          certifications: profile.certifications || '',
        });
        
        // Load skills as comma-separated string
        setSkillsInput(profile.skills?.join(', ') || '');
        
        // Load resume if it exists in profile
        if (profile.resumeBase64 && profile.resumeFileName) {
          // Create a file-like object from saved resume data
          const resumeFile = {
            name: profile.resumeFileName,
            type: profile.resumeFileType || 'application/pdf',
            size: profile.resumeFileSize || 0,
            isFromProfile: true,
            base64: profile.resumeBase64,
          };
          setResume(resumeFile);
          console.log('Loaded resume from profile:', profile.resumeFileName);
        }
        
        setProfileLoaded(true);
        console.log('Profile data loaded successfully from MongoDB');
      } else {
        // No profile exists yet - set default values
        console.log('No existing profile found, using defaults');
        setFormData(prev => ({
          ...prev,
          fullName: user?.name || '',
          email: user?.email || '',
        }));
        setProfileLoaded(false);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      // Only show error if it's not a 404 (profile doesn't exist)
      if (err.response?.status !== 404) {
        setError('Failed to load profile from database');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setSkillsInput(value);
    const skillsArray = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setResume(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setSaving(true);

    try {
      const profileData = { ...formData };

      // Handle resume - if it's from profile, use existing base64, otherwise convert
      if (resume) {
        if (resume.isFromProfile && resume.base64) {
          // Resume is already from profile, use existing base64
          profileData.resumeFileName = resume.name;
          profileData.resumeFileType = resume.type;
          profileData.resumeBase64 = resume.base64;
          profileData.resumeFileSize = resume.size;
        } else {
          // New resume uploaded, convert to base64
          const resumeBase64 = await convertFileToBase64(resume);
          profileData.resumeFileName = resume.name;
          profileData.resumeFileType = resume.type;
          profileData.resumeBase64 = resumeBase64;
          profileData.resumeFileSize = resume.size;
        }
      }

      console.log('Saving profile data to database:', {
        ...profileData,
        resumeBase64: profileData.resumeBase64 ? '[Base64 data - ' + profileData.resumeBase64.length + ' chars]' : 'No resume'
      });

      await saveUserProfile(profileData);
      setSuccess(true);
      console.log('Profile saved successfully to MongoDB');
      
      // Show toast notification based on whether profile was created or updated
      if (profileLoaded) {
        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.success('Profile created successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      
      // Update profileLoaded state after successful save
      setProfileLoaded(true);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
          <p className="mt-4 text-gray-600 text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 animate-fadeIn">
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2 text-sm transition-colors duration-200 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span> Back to Dashboard
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Build Your Profile</h1>
              <p className="mt-2 text-gray-600 text-base font-light">
                Create your profile to quickly apply to jobs. Your information will be saved and can be used to auto-fill application forms.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 text-sm font-medium shadow-sm animate-fadeIn">
            {error}
          </div>
        )}

        {profileLoaded && !success && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-700 text-sm font-medium shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Your profile data has been loaded from the database. You can update any fields and save again.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-10 space-y-10 animate-fadeIn">
          {/* Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Personal Information
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Professional Information
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="currentPosition" className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Position
                </label>
                <input
                  type="text"
                  id="currentPosition"
                  name="currentPosition"
                  value={formData.currentPosition}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div>
                <label htmlFor="currentCompany" className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Company
                </label>
                <input
                  type="text"
                  id="currentCompany"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-semibold text-gray-900 mb-2">
                  Years of Experience
                </label>
                <input
                  type="text"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="e.g., 3-5 years"
                />
              </div>

              <div>
                <label htmlFor="skillsInput" className="block text-sm font-semibold text-gray-900 mb-2">
                  Skills <span className="text-gray-500 font-normal text-xs">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  id="skillsInput"
                  name="skillsInput"
                  value={skillsInput}
                  onChange={handleSkillsChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="e.g., Java, React, MongoDB, Spring Boot"
                />
              </div>
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-semibold text-gray-900 mb-2">
                Professional Summary
              </label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                rows={5}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none shadow-sm hover:shadow-md"
                placeholder="Brief summary of your professional background..."
              />
            </div>
          </div>

          {/* Location Preferences */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Location Preferences
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="currentLocation" className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Location
                </label>
                <input
                  type="text"
                  id="currentLocation"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                />
              </div>

              <div>
                <label htmlFor="preferredLocation" className="block text-sm font-semibold text-gray-900 mb-2">
                  Preferred Location
                </label>
                <input
                  type="text"
                  id="preferredLocation"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                />
              </div>

              <div>
                <label htmlFor="workPreference" className="block text-sm font-semibold text-gray-900 mb-2">
                  Work Preference
                </label>
                <select
                  id="workPreference"
                  name="workPreference"
                  value={formData.workPreference}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex items-center pt-8">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="willingToRelocate"
                    name="willingToRelocate"
                    checked={formData.willingToRelocate}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-gray-900 focus:ring-gray-500 border-gray-300 rounded cursor-pointer transition-all"
                  />
                  <label htmlFor="willingToRelocate" className="ml-3 block text-sm font-semibold text-gray-900 cursor-pointer">
                    Willing to relocate
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Contact & Links
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="linkedInUrl" className="block text-sm font-semibold text-gray-900 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  id="linkedInUrl"
                  name="linkedInUrl"
                  value={formData.linkedInUrl}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label htmlFor="portfolioUrl" className="block text-sm font-semibold text-gray-900 mb-2">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  id="portfolioUrl"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div>
                <label htmlFor="githubUrl" className="block text-sm font-semibold text-gray-900 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-semibold text-gray-900 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Resume
              </h3>
            </div>
            
            {!resume ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-gray-900 bg-gray-50 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <svg
                      className="h-8 w-8 text-gray-600"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-base text-gray-700 mb-2 font-semibold">
                    <span className="text-gray-900">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, or TXT (MAX. 5MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">
                        {resume.name}
                        {resume.isFromProfile && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg font-semibold border border-emerald-200">Loaded from Profile</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        {formatFileSize(resume.size || 0)}
                        {resume.isFromProfile && ' • Saved in your profile'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResume(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Additional Information
              </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="availability" className="block text-sm font-semibold text-gray-900 mb-2">
                  Availability
                </label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                >
                  <option value="Immediately">Immediately</option>
                  <option value="1 week notice">1 week notice</option>
                  <option value="2 weeks notice">2 weeks notice</option>
                  <option value="1 month notice">1 month notice</option>
                  <option value="2+ months notice">2+ months notice</option>
                </select>
              </div>

              <div>
                <label htmlFor="expectedSalary" className="block text-sm font-semibold text-gray-900 mb-2">
                  Expected Salary <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="expectedSalary"
                  name="expectedSalary"
                  value={formData.expectedSalary}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="e.g., $50,000 - $70,000"
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-semibold text-gray-900 mb-2">
                  Education
                </label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="e.g., Bachelor's in Computer Science"
                />
              </div>

              <div>
                <label htmlFor="certifications" className="block text-sm font-semibold text-gray-900 mb-2">
                  Certifications
                </label>
                <input
                  type="text"
                  id="certifications"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
                  placeholder="e.g., AWS Certified, PMP"
                />
              </div>
            </div>

            <div>
              <label htmlFor="coverLetterTemplate" className="block text-sm font-semibold text-gray-900 mb-2">
                Cover Letter Template <span className="text-gray-500 font-normal text-xs">(Optional)</span>
              </label>
              <textarea
                id="coverLetterTemplate"
                name="coverLetterTemplate"
                value={formData.coverLetterTemplate}
                onChange={handleInputChange}
                rows={6}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none shadow-sm hover:shadow-md"
                placeholder="Default cover letter template that can be used when applying to jobs..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={saving}
              className="flex-1 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:border-gray-200 text-gray-900 font-semibold py-3.5 px-6 transition-all duration-200 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3.5 px-6 transition-all duration-200 disabled:cursor-not-allowed text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:transform-none"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </span>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

