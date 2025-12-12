import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { createHackathon, getHackathonById, updateHackathon } from '../api/jobApi';

// Tab-based sections for hackathon - matching the image exactly
const HACKATHON_TABS = [
    { id: 'basic', label: 'Basic Info', icon: '🎯', required: true },
    { id: 'problem', label: 'Problem & Skills', icon: '🧠', required: true },
    { id: 'phases', label: 'Phases', icon: '📅', required: true },
    { id: 'eligibility', label: 'Eligibility', icon: '👥', required: false },
    { id: 'dates', label: 'Dates & Mode', icon: '📆', required: true },
    { id: 'submission', label: 'Submission', icon: '🏆', required: false },
    { id: 'capacity', label: 'Capacity & Prizes', icon: '⚙️', required: false },
];

export default function PostHackathon() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const { user, isAuthenticated, loading: authLoading, isIndustry } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [activeTab, setActiveTab] = useState('basic');
    const [completedTabs, setCompletedTabs] = useState(new Set());

    // Skills state
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState([]);

    // Phases state - array of phase objects
    const [phases, setPhases] = useState([
        { id: 1, name: '', description: '', uploadFormat: 'document', deadline: '' }
    ]);

    const [formData, setFormData] = useState({
        // Basic Info
        title: '',
        company: '',
        description: '',
        // Problem & Skills
        problemStatement: '',
        // Eligibility
        eligibility: '',
        // Dates & Mode
        startDate: '',
        endDate: '',
        mode: '',
        location: '',
        reportingDate: '',
        // Submission
        submissionUrl: '',
        submissionGuidelines: '',
        // Capacity & Prizes
        minTeamSize: '',
        teamSize: '',
        maxTeams: '',
        prize: '',
    });

    // Load hackathon data if editing
    useEffect(() => {
        const loadHackathonData = async () => {
            if (editId && isAuthenticated && isIndustry) {
                try {
                    setLoading(true);
                    const hackathon = await getHackathonById(editId);

                    // Set form data
                    setFormData({
                        title: hackathon.title || '',
                        company: hackathon.company || '',
                        description: hackathon.description || '',
                        problemStatement: hackathon.problemStatement || '',
                        eligibility: hackathon.eligibility || '',
                        startDate: hackathon.startDate || '',
                        endDate: hackathon.endDate || '',
                        mode: hackathon.mode || '',
                        location: hackathon.location || '',
                        reportingDate: hackathon.reportingDate || '',
                        submissionUrl: hackathon.submissionUrl || '',
                        submissionGuidelines: hackathon.submissionGuidelines || '',
                        minTeamSize: hackathon.minTeamSize || '',
                        teamSize: hackathon.teamSize || '',
                        maxTeams: hackathon.maxTeams || '',
                        prize: hackathon.prize || '',
                    });

                    // Set skills
                    if (hackathon.skills && Array.isArray(hackathon.skills)) {
                        setSkills(hackathon.skills);
                    }

                    // Set phases
                    if (hackathon.phases && Array.isArray(hackathon.phases) && hackathon.phases.length > 0) {
                        setPhases(hackathon.phases);
                    }

                    setLoading(false);
                } catch (err) {
                    console.error('Error loading hackathon:', err);
                    toast.error('Failed to load hackathon data');
                    navigate('/manage-hackathons');
                }
            }
        };

        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/');
                return;
            }
            if (!isIndustry) {
                toast.error('Only INDUSTRY users can post hackathons');
                navigate('/');
                return;
            }

            if (editId) {
                loadHackathonData();
            } else {
                setLoading(false);
            }
        }
    }, [isAuthenticated, authLoading, isIndustry, navigate, editId]);

    useEffect(() => {
        updateCompletedTabs();
    }, [formData, skills, phases]);

    const isFieldFilled = (fieldName) => {
        const value = formData[fieldName];
        return value !== null && value !== undefined && value !== '';
    };

    const isTabComplete = (tabId) => {
        switch (tabId) {
            case 'basic':
                return isFieldFilled('title') && isFieldFilled('company') && isFieldFilled('description');
            case 'problem':
                return isFieldFilled('problemStatement');
            case 'phases':
                return phases.length > 0 && phases.every(p => p.name.trim() !== '' && p.description.trim() !== '' && p.deadline !== '');
            case 'eligibility':
                return isFieldFilled('eligibility');
            case 'dates':
                const basicDatesValid = isFieldFilled('startDate') && isFieldFilled('endDate') && isFieldFilled('mode');
                if (formData.mode === 'Hybrid' || formData.mode === 'Offline') {
                    return basicDatesValid && isFieldFilled('location') && isFieldFilled('reportingDate');
                }
                return basicDatesValid;
            case 'submission':
                return isFieldFilled('submissionUrl') || isFieldFilled('submissionGuidelines');
            case 'capacity':
                return isFieldFilled('teamSize') || isFieldFilled('prize');
            default:
                return false;
        }
    };

    const updateCompletedTabs = () => {
        const completed = new Set();
        HACKATHON_TABS.forEach(tab => {
            if (isTabComplete(tab.id)) {
                completed.add(tab.id);
            }
        });
        setCompletedTabs(completed);
    };

    const calculateProgress = () => {
        const requiredTabs = HACKATHON_TABS.filter(tab => tab.required);
        const completedRequiredTabs = requiredTabs.filter(tab => completedTabs.has(tab.id));
        return Math.round((completedRequiredTabs.length / requiredTabs.length) * 100);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Skills handlers
    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!skills.includes(skillInput.trim())) {
                setSkills([...skills, skillInput.trim()]);
            }
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    // Phases handlers
    const handleAddPhase = () => {
        setPhases([...phases, { id: Date.now(), name: '', description: '', uploadFormat: 'document', deadline: '' }]);
    };

    const handleRemovePhase = (phaseId) => {
        if (phases.length > 1) {
            setPhases(phases.filter(phase => phase.id !== phaseId));
        }
    };

    const handlePhaseChange = (phaseId, field, value) => {
        if (field === 'deadline') {
            const index = phases.findIndex(p => p.id === phaseId);

            // Check against previous phase
            if (index > 0) {
                const prevDeadline = phases[index - 1].deadline;
                if (prevDeadline && value < prevDeadline) {
                    toast.error('Deadline cannot be earlier than the previous phase deadline');
                    return;
                }
            }

            // Check against next phase
            if (index < phases.length - 1) {
                const nextDeadline = phases[index + 1].deadline;
                if (nextDeadline && value > nextDeadline) {
                    toast.error('Deadline cannot be later than the next phase deadline');
                    return;
                }
            }
        }

        setPhases(phases.map(phase =>
            phase.id === phaseId ? { ...phase, [field]: value } : phase
        ));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (saving) return;

        // Auto-save and move to next section
        const currentTabIndex = HACKATHON_TABS.findIndex(tab => tab.id === activeTab);
        if (currentTabIndex < HACKATHON_TABS.length - 1) {
            setActiveTab(HACKATHON_TABS[currentTabIndex + 1].id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (saving) return;

        // Check for missing required fields
        const missingFields = [];
        if (!formData.title) missingFields.push('Hackathon Title');
        if (!formData.company) missingFields.push('Company Name');
        if (!formData.description) missingFields.push('Hackathon Description');
        if (!formData.problemStatement) missingFields.push('Problem Statement');
        if (phases.length === 0 || !phases.every(p => p.name.trim() && p.description.trim() && p.deadline)) missingFields.push('Phases (all fields required)');
        if (!formData.startDate) missingFields.push('Start Date');
        if (!formData.endDate) missingFields.push('End Date');
        if (!formData.mode) missingFields.push('Mode');
        if ((formData.mode === 'Hybrid' || formData.mode === 'Offline') && !formData.location) missingFields.push('Venue Location');
        if ((formData.mode === 'Hybrid' || formData.mode === 'Offline') && !formData.reportingDate) missingFields.push('Reporting Date & Time');

        if (missingFields.length > 0) {
            toast.error('Please fill in all required details about the hackathon', {
                position: "top-right",
                autoClose: 5000,
            });
            return;
        }

        // Validate phase deadlines order
        for (let i = 1; i < phases.length; i++) {
            if (phases[i].deadline < phases[i - 1].deadline) {
                toast.error(`Phase ${i + 1} deadline cannot be earlier than Phase ${i} deadline`);
                return;
            }
        }

        // Validate team size
        if (formData.minTeamSize && formData.teamSize && parseInt(formData.minTeamSize) > parseInt(formData.teamSize)) {
            toast.error('Minimum team size cannot be greater than maximum team size');
            setSaving(false);
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const hackathonData = {
                title: formData.title,
                description: formData.description,
                company: formData.company,
                prize: formData.prize || null,
                minTeamSize: formData.minTeamSize ? parseInt(formData.minTeamSize) : 1,
                teamSize: formData.teamSize ? parseInt(formData.teamSize) : 0,
                submissionUrl: formData.submissionUrl || null,
                // Store additional data as JSON in description or separate fields
                problemStatement: formData.problemStatement,
                skills: skills,
                phases: phases,
                eligibility: formData.eligibility,
                startDate: formData.startDate,
                endDate: formData.endDate,
                mode: formData.mode,
                location: formData.location || null,
                reportingDate: formData.reportingDate || null,
                submissionGuidelines: formData.submissionGuidelines,
                maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null,
            };

            let response;
            if (editId) {
                // Update existing hackathon
                response = await updateHackathon(editId, hackathonData);
                console.log('Hackathon updated successfully:', response);
                toast.success('Hackathon updated successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else {
                // Create new hackathon
                response = await createHackathon(hackathonData);
                console.log('Hackathon posted successfully:', response);
                toast.success('Hackathon posted successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }

            setTimeout(() => {
                navigate('/manage-hackathons');
            }, 2000);
        } catch (err) {
            console.error(editId ? 'Error updating hackathon:' : 'Error posting hackathon:', err);
            const errorMessage = err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                `Failed to ${editId ? 'update' : 'post'} hackathon. Please check your connection and try again.`;
            setError(errorMessage);
            toast.error('Please fill in all required details about the hackathon', {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setSaving(false);
        }
    };

    const progressPercentage = calculateProgress();

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 rounded-full border-4 border-gray-200 border-t-gray-400"></div>
                    <p className="mt-4 text-gray-500 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !isIndustry) {
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

                    <div className="mb-6">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-2">
                            {editId ? 'Edit Hackathon' : 'Create Hackathon'}
                        </h1>
                        <p className="text-gray-600 text-base">
                            {editId ? 'Update the hackathon details' : 'Fill out the form to post a new hackathon'}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-medium text-blue-600">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 text-sm font-medium">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-700 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Hackathon posted successfully! Redirecting...</span>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                    <div className="flex overflow-x-auto">
                        {HACKATHON_TABS.map((tab) => {
                            const isComplete = completedTabs.has(tab.id);
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 min-w-[140px] px-4 py-4 text-xs font-medium transition-all duration-200 relative border-b-2 ${isActive
                                        ? 'text-blue-700 border-blue-600 bg-blue-50'
                                        : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <span className="text-2xl">{tab.icon}</span>
                                        <span className="text-center leading-tight">{tab.label}</span>
                                        {tab.required && (
                                            <span className="text-red-400">*</span>
                                        )}
                                        {isComplete && !isActive && (
                                            <svg className="w-4 h-4 text-green-600 absolute top-2 right-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={(e) => {
                        // Only submit if on last section
                        if (activeTab === 'capacity') {
                            handleSubmit(e);
                        } else {
                            e.preventDefault();
                            handleSave(e);
                        }
                    }}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-8"
                >
                    {/* Basic Information Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                                <p className="text-sm text-gray-500 mt-1">Provide the essential details about the hackathon</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hackathon Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., AI Innovation Hackathon 2024"
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company/Organization Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Tech Company Inc."
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hackathon Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the hackathon, its themes, goals, and what participants will be doing..."
                                    rows="6"
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Problem & Skills Tab */}
                    {activeTab === 'problem' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Problem & Skills</h2>
                                <p className="text-sm text-gray-500 mt-1">Define the problem statement and required skills</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Problem Statement <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="problemStatement"
                                    value={formData.problemStatement}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 500) {
                                            handleInputChange(e);
                                        }
                                    }}
                                    placeholder="Describe the problem participants will solve..."
                                    rows="6"
                                    maxLength={500}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                />
                                <div className="mt-1 text-xs text-right text-gray-500">
                                    {formData.problemStatement.length}/500 characters
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Required Skills
                                </label>
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={handleAddSkill}
                                    placeholder="Type a skill and press Enter (e.g., Python, Machine Learning)"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <p className="mt-1 text-xs text-gray-500">Press Enter to add each skill</p>

                                {/* Skills Tags */}
                                {skills.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Phases Tab */}
                    {activeTab === 'phases' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Phases</h2>
                                <p className="text-sm text-gray-500 mt-1">Define the different phases of the hackathon and upload requirements</p>
                            </div>

                            <div className="space-y-4">
                                {phases.map((phase, index) => (
                                    <div key={phase.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-gray-700">Phase {index + 1}</h3>
                                            {phases.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhase(phase.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Phase Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={phase.name}
                                                    onChange={(e) => handlePhaseChange(phase.id, 'name', e.target.value)}
                                                    placeholder="e.g., Ideation, Development, Submission"
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Submission Deadline <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={phase.deadline}
                                                    onChange={(e) => handlePhaseChange(phase.id, 'deadline', e.target.value)}
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Phase Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={phase.description}
                                                onChange={(e) => handlePhaseChange(phase.id, 'description', e.target.value)}
                                                placeholder="Describe what participants need to do in this phase..."
                                                rows="3"
                                                required
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Upload Format <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={phase.uploadFormat}
                                                onChange={(e) => handlePhaseChange(phase.id, 'uploadFormat', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="document">Document (PDF, DOC)</option>
                                                <option value="video">Video (MP4, AVI)</option>
                                                <option value="image">Image (JPG, PNG)</option>
                                                <option value="code">Code (ZIP, GitHub Link)</option>
                                                <option value="presentation">Presentation (PPT, PDF)</option>
                                                <option value="link">Link (URL)</option>
                                                <option value="any">Any Format</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddPhase}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Another Phase
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Eligibility Tab */}
                    {activeTab === 'eligibility' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Eligibility</h2>
                                <p className="text-sm text-gray-500 mt-1">Specify who can participate</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Eligibility Criteria
                                </label>
                                <textarea
                                    name="eligibility"
                                    value={formData.eligibility}
                                    onChange={handleInputChange}
                                    placeholder="Describe who can participate (e.g., students, professionals, age restrictions, etc.)..."
                                    rows="6"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Dates & Mode Tab */}
                    {activeTab === 'dates' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Dates & Mode</h2>
                                <p className="text-sm text-gray-500 mt-1">Set the timeline and participation mode</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mode <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="mode"
                                    value={formData.mode}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Select Mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            {/* Conditional fields for Hybrid/Offline mode */}
                            {(formData.mode === 'Hybrid' || formData.mode === 'Offline') && (
                                <div className="space-y-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h3 className="text-sm font-semibold text-blue-900">Physical Venue Details</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Venue Location <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Tech Hub, 123 Innovation Street, Bangalore"
                                            required={formData.mode === 'Hybrid' || formData.mode === 'Offline'}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Provide the complete address where participants need to report
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Reporting Date & Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="reportingDate"
                                            value={formData.reportingDate}
                                            onChange={handleInputChange}
                                            required={formData.mode === 'Hybrid' || formData.mode === 'Offline'}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            When should participants arrive at the venue?
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submission Tab */}
                    {activeTab === 'submission' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Submission</h2>
                                <p className="text-sm text-gray-500 mt-1">Provide submission details and guidelines</p>
                            </div>

                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Submission URL
                                </label>
                                <input
                                    type="url"
                                    name="submissionUrl"
                                    value={formData.submissionUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://hackathon.example.com/submit"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div> */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Submission Guidelines
                                </label>
                                <textarea
                                    name="submissionGuidelines"
                                    value={formData.submissionGuidelines}
                                    onChange={handleInputChange}
                                    placeholder="Describe what participants need to submit and how..."
                                    rows="6"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Capacity & Prizes Tab */}
                    {activeTab === 'capacity' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Capacity & Prizes</h2>
                                <p className="text-sm text-gray-500 mt-1">Set team limits and prize details</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Team Size
                                    </label>
                                    <input
                                        type="number"
                                        name="minTeamSize"
                                        value={formData.minTeamSize}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2"
                                        min="1"
                                        max={formData.teamSize || 20}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Team Size
                                    </label>
                                    <input
                                        type="number"
                                        name="teamSize"
                                        value={formData.teamSize}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 5"
                                        min={formData.minTeamSize || 1}
                                        max="20"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Teams
                                    </label>
                                    <input
                                        type="number"
                                        name="maxTeams"
                                        value={formData.maxTeams}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 100"
                                        min="1"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prize Pool / Prize Details
                                </label>
                                <textarea
                                    name="prize"
                                    value={formData.prize}
                                    onChange={handleInputChange}
                                    placeholder="Describe the prizes (e.g., 1st Prize: $10,000, 2nd Prize: $5,000, etc.)..."
                                    rows="4"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 pt-8 mt-8 border-t border-gray-200">
                        {activeTab !== 'basic' && (
                            <button
                                type="button"
                                onClick={() => {
                                    const currentIndex = HACKATHON_TABS.findIndex(tab => tab.id === activeTab);
                                    if (currentIndex > 0) {
                                        setActiveTab(HACKATHON_TABS[currentIndex - 1].id);
                                    }
                                }}
                                className="px-6 py-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
                            >
                                ← Previous
                            </button>
                        )}

                        {activeTab !== 'capacity' ? (
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        {editId ? 'Updating...' : 'Posting...'}
                                    </span>
                                ) : (
                                    editId ? "Update Hackathon" : "Post Hackathon"
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            disabled={saving}
                            className="px-6 py-3 border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
