import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { createHackathon, getHackathonById, updateHackathon, improveProblemStatement, improveEligibilityCriteria, improveSubmissionGuidelines } from '../api/jobApi';

// Tab-based sections for hackathon - matching the image exactly
const HACKATHON_TABS = [
    { id: 'basic', label: 'Basic Info', icon: '🎯', required: true },
    { id: 'problem', label: 'Problem & Skills', icon: '🧠', required: true },
    { id: 'phases', label: 'Phases', icon: '📅', required: true },
    { id: 'eligibility', label: 'Eligibility', icon: '👥', required: false },
    { id: 'dates', label: 'Dates', icon: '📆', required: true },
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
    const [improvingStatement, setImprovingStatement] = useState(false);
    const [improvingEligibility, setImprovingEligibility] = useState(false);
    const [improvingGuidelines, setImprovingGuidelines] = useState(false);

    const [activeTab, setActiveTab] = useState('basic');
    const [completedTabs, setCompletedTabs] = useState(new Set());

    // Helper to load saved draft
    const getSavedState = (key, fallback) => {
        if (editId) return fallback;
        try {
            const saved = localStorage.getItem('hackathonDraft');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed[key] !== undefined ? parsed[key] : fallback;
            }
        } catch (e) {
            console.error('Error parsing draft:', e);
        }
        return fallback;
    };

    // Phases state
    const [phases, setPhases] = useState(() => getSavedState('phases', [
        { id: 1, name: '', description: '', uploadFormat: 'document', deadline: '', phaseMode: 'Online', phaseVenueLocation: '', phaseReportingTime: '' }
    ]));

    // Skills state
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState(() => getSavedState('skills', []));

    const [formData, setFormData] = useState(() => getSavedState('formData', {
        // Basic Info
        title: '',
        company: '',
        description: '',
        industry: '',
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
        firstPrize: '',
        secondPrize: '',
        thirdPrize: '',
        allowIndividual: true,
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    // Get current datetime in YYYY-MM-DDTHH:mm format for datetime-local inputs
    const nowStr = new Date().toISOString().slice(0, 16);

    const getPhaseMinDate = (index) => {
        // earliest allowed is today
        let base = todayStr;
        // must be after registration end date if provided
        if (formData.endDate && formData.endDate > base) {
            base = formData.endDate;
        }
        // must be after previous phase
        if (index > 0 && phases[index - 1].deadline) {
            const prev = phases[index - 1].deadline;
            base = prev > base ? prev : base;
        }
        return base;
    };

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
                        industry: hackathon.industry || '',
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
                        firstPrize: hackathon.firstPrize || '',
                        secondPrize: hackathon.secondPrize || '',
                        thirdPrize: hackathon.thirdPrize || '',
                        // Default to false when not present so we don't accidentally re-enable individuals
                        allowIndividual: hackathon.allowIndividual ?? false,
                    });

                    // Set skills
                    if (hackathon.skills && Array.isArray(hackathon.skills)) {
                        setSkills(hackathon.skills);
                    }

                    // Set phases (ensure all phase fields are present)
                    if (hackathon.phases && Array.isArray(hackathon.phases) && hackathon.phases.length > 0) {
                        const phasesWithDefaults = hackathon.phases.map(phase => ({
                            ...phase,
                            phaseMode: phase.phaseMode || 'Online',
                            phaseVenueLocation: phase.phaseVenueLocation || '',
                            phaseReportingTime: phase.phaseReportingTime || ''
                        }));
                        setPhases(phasesWithDefaults);
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

    // Save draft to localStorage
    useEffect(() => {
        if (!editId && !loading) {
            const draft = {
                formData,
                skills,
                phases
            };
            localStorage.setItem('hackathonDraft', JSON.stringify(draft));
        }
    }, [formData, skills, phases, editId, loading]);

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
                return isFieldFilled('endDate');
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

    // AI improvement handler
    const handleImproveWithAI = async () => {
        if (!formData.problemStatement || formData.problemStatement.trim().length < 10) {
            toast.error('Please write at least a few words before improving with AI');
            return;
        }

        // Check authentication before making the request
        if (!isAuthenticated) {
            toast.error('Please log in to use the AI improvement feature', {
                position: "top-right",
                autoClose: 4000,
            });
            return;
        }

        if (!isIndustry) {
            toast.error('Only INDUSTRY users can use the AI improvement feature', {
                position: "top-right",
                autoClose: 4000,
            });
            return;
        }

        // Store original word count
        const originalWordCount = formData.problemStatement.trim().split(/\s+/).filter(w => w).length;

        setImprovingStatement(true);
        try {
            const response = await improveProblemStatement(formData.problemStatement);
            
            if (response && response.improvedStatement) {
                // Check word count of improved statement
                const improvedWordCount = response.improvedStatement.trim().split(/\s+/).filter(w => w).length;
                
                // If improved statement has less than 50 words, warn user but still apply it
                if (improvedWordCount < 50) {
                    toast.warning(`The improved statement has ${improvedWordCount} words (minimum 50 required). Please add more content to meet the requirement.`, {
                        position: "top-right",
                        autoClose: 6000,
                    });
                }
                
                // If improved statement has fewer words than original and both are below 50, warn
                if (improvedWordCount < originalWordCount && originalWordCount < 50) {
                    toast.warning(`The improved statement has ${improvedWordCount} words (original had ${originalWordCount}). Please add more content to meet the 50-word minimum.`, {
                        position: "top-right",
                        autoClose: 6000,
                    });
                }
                
                setFormData(prev => ({
                    ...prev,
                    problemStatement: response.improvedStatement
                }));
                
                if (improvedWordCount >= 50) {
                    toast.success('Problem statement improved! Review and edit if needed.', {
                        position: "top-right",
                        autoClose: 4000,
                    });
                }
            } else {
                toast.error('Could not improve problem statement. Please try again.');
            }
        } catch (error) {
            console.error('Error improving problem statement:', error);
            
            // Get error message from the error object
            const errorMessage = error.message || 'Failed to improve problem statement';
            
            // Show appropriate error message
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setImprovingStatement(false);
        }
    };

    // AI improvement handler for eligibility
    const handleImproveEligibility = async () => {
        if (!formData.eligibility || formData.eligibility.trim().length < 10) {
            toast.error('Please write at least a few words before improving with AI');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Please log in to use the AI improvement feature', {
                position: "top-right",
                autoClose: 4000,
            });
            return;
        }

        if (!isIndustry) {
            toast.error('Only INDUSTRY users can use the AI improvement feature', {
                position: "top-right",
                autoClose: 4000,
            });
            return;
        }

        setImprovingEligibility(true);
        try {
            const response = await improveEligibilityCriteria(formData.eligibility);
            
            if (response && response.improvedEligibility) {
                setFormData(prev => ({
                    ...prev,
                    eligibility: response.improvedEligibility
                }));
                toast.success('Eligibility criteria improved! Review and edit if needed.', {
                    position: "top-right",
                    autoClose: 4000,
                });
            } else {
                toast.error('Could not improve eligibility criteria. Please try again.');
            }
        } catch (error) {
            console.error('Error improving eligibility criteria:', error);
            const errorMessage = error.message || 'Failed to improve eligibility criteria';
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setImprovingEligibility(false);
        }
    };

    // AI improvement handler for submission guidelines
    const handleImproveGuidelines = async () => {
        if (!formData.submissionGuidelines || formData.submissionGuidelines.trim().length < 10) {
            toast.error('Please write at least a few words before improving with AI');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Please log in to use the AI improvement feature', {
                position: "top-right",
                autoClose: 4000,
            });
            return;
        }

        if (!isIndustry) {
            toast.error('Only INDUSTRY users can use the AI improvement feature', {
                position: "top-right",
                autoClose: 4000,
            });
            return;
        }

        setImprovingGuidelines(true);
        try {
            const response = await improveSubmissionGuidelines(formData.submissionGuidelines);
            
            if (response && response.improvedGuidelines) {
                setFormData(prev => ({
                    ...prev,
                    submissionGuidelines: response.improvedGuidelines
                }));
                toast.success('Submission guidelines improved! Review and edit if needed.', {
                    position: "top-right",
                    autoClose: 4000,
                });
            } else {
                toast.error('Could not improve submission guidelines. Please try again.');
            }
        } catch (error) {
            console.error('Error improving submission guidelines:', error);
            const errorMessage = error.message || 'Failed to improve submission guidelines';
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setImprovingGuidelines(false);
        }
    };

    // Phases handlers
    const handleAddPhase = () => {
        setPhases([...phases, { id: Date.now(), name: '', description: '', uploadFormat: 'document', deadline: '', phaseMode: 'Online', phaseVenueLocation: '', phaseReportingTime: '' }]);
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

        // Validate problem statement before allowing navigation away from problem tab
        if (activeTab === 'problem') {
            if (!formData.problemStatement || formData.problemStatement.trim().length < 50) {
                toast.error('Problem Statement must be at least 50 characters before proceeding to the next section');
                return;
            }
        }

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
        if (!formData.endDate) missingFields.push('End Date');
        // Note: Mode, location, and reporting date are now set per phase, not at hackathon level

        if (missingFields.length > 0) {
            toast.error('Please fill in all required details about the hackathon', {
                position: "top-right",
                autoClose: 5000,
            });
            return;
        }

        // Validate problem statement length
        const wordCount = formData.problemStatement.trim().split(/\s+/).length;
        if (wordCount < 50) {
            toast.error(`Problem statement must be at least 50 words. Current count: ${wordCount}`, {
                position: "top-right",
                autoClose: 5000,
            });
            return;
        }

        // Validate Registration End Date vs First Phase Deadline and today
        if (phases.length > 0) {
            const registrationEnd = new Date(formData.endDate);
            const today = new Date(todayStr);
            if (registrationEnd < today) {
                toast.error('Last Date of Registration cannot be in the past', { autoClose: 3000 });
                setSaving(false);
                return;
            }
            const firstPhaseDeadline = new Date(phases[0].deadline);

            if (registrationEnd >= firstPhaseDeadline) {
                toast.error('Last Date of Registration must be before the first phase deadline', {
                    position: "top-right",
                    autoClose: 5000,
                });
                return;
            }
        }

        // Note: Mode, location, and reporting date are now set per phase, not at hackathon level

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
                industry: formData.industry || null,
                prize: formData.prize || null,
                firstPrize: formData.firstPrize || null,
                secondPrize: formData.secondPrize || null,
                thirdPrize: formData.thirdPrize || null,
                minTeamSize: formData.minTeamSize ? parseInt(formData.minTeamSize) : 1,
                teamSize: formData.teamSize ? parseInt(formData.teamSize) : 0,
                submissionUrl: formData.submissionUrl || null,
                // Store additional data as JSON in description or separate fields
                problemStatement: formData.problemStatement,
                skills: skills,
                phases: phases,
                eligibility: formData.eligibility,
                startDate: formData.startDate || new Date().toISOString().split('T')[0],
                endDate: formData.endDate,
                mode: null, // Mode is now set per phase
                location: null, // Location is now set per phase
                reportingDate: null, // Reporting date is now set per phase
                submissionGuidelines: formData.submissionGuidelines,
                maxTeams: null,
                allowIndividual: formData.allowIndividual,
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
                localStorage.removeItem('hackathonDraft');
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
                                    onClick={() => {
                                        // Validate problem statement before allowing navigation away from problem tab
                                        if (activeTab === 'problem' && tab.id !== 'problem') {
                                            if (!formData.problemStatement || formData.problemStatement.trim().length < 50) {
                                                toast.error('Problem Statement must be at least 50 characters before proceeding to another section');
                                                return;
                                            }
                                        }
                                        setActiveTab(tab.id);
                                    }}
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
                                    Industry Type
                                </label>
                                <select
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Select Industry</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Education">Education</option>
                                    <option value="E-commerce">E-commerce</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Energy">Energy</option>
                                    <option value="Agriculture">Agriculture</option>
                                    <option value="Transportation">Transportation</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Food & Beverage">Food & Beverage</option>
                                    <option value="Other">Other</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Select the industry category for this hackathon</p>
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

                            {/* Helpful Guide Section */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Write a Good Problem Statement</h3>
                                        <p className="text-sm text-gray-700 mb-4">Answer these questions to help you write clearly:</p>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <div className="flex items-start gap-2">
                                                <span className="text-blue-600 font-bold mt-0.5">1.</span>
                                                <span><strong>What problem are you trying to solve?</strong> (e.g., "Many people struggle with...")</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-blue-600 font-bold mt-0.5">2.</span>
                                                <span><strong>Who faces this problem?</strong> (e.g., "Students, small businesses, healthcare workers...")</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-blue-600 font-bold mt-0.5">3.</span>
                                                <span><strong>Why is this problem important?</strong> (e.g., "This affects millions of people because...")</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-blue-600 font-bold mt-0.5">4.</span>
                                                <span><strong>What solution are you looking for?</strong> (e.g., "We need an app/website/system that...")</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Example Problem Statements */}
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        View Example Problem Statements
                                    </summary>
                                    <div className="mt-4 space-y-4 pl-6 border-l-2 border-blue-300">
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Example 1: Healthcare</p>
                                            <p className="text-sm text-gray-700 italic">
                                                "Many elderly people living alone struggle to remember when to take their medications. This leads to missed doses and health complications. 
                                                We need a simple mobile application that sends reminders, tracks medication schedules, and can alert family members if doses are missed. 
                                                The solution should be easy to use for people who are not tech-savvy."
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Example 2: Education</p>
                                            <p className="text-sm text-gray-700 italic">
                                                "Students in remote areas often lack access to quality educational resources and personalized learning support. 
                                                We need an online platform that provides free educational content, connects students with volunteer tutors, 
                                                and tracks learning progress. The platform should work on low-end smartphones with limited internet connectivity."
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Example 3: Environment</p>
                                            <p className="text-sm text-gray-700 italic">
                                                "Small businesses want to reduce their carbon footprint but don't know where to start or how to measure their impact. 
                                                We need a tool that helps businesses calculate their carbon emissions, suggests practical reduction strategies, 
                                                and provides a simple dashboard to track progress over time."
                                            </p>
                                        </div>
                                    </div>
                                </details>
                            </div>

                            {/* Problem Statement Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Problem Statement <span className="text-red-500">*</span>
                                    <span className="ml-2 text-xs font-normal text-gray-500">(Minimum 50 words required)</span>
                                </label>
                                
                                {/* Template Structure Helper */}
                                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-xs font-medium text-gray-700 mb-2">💡 Template Structure (Copy and fill this):</p>
                                    <div className="text-xs text-gray-600 space-y-1 font-mono bg-white p-2 rounded border border-gray-200">
                                        <p className="text-gray-500">[What problem?] Many people/companies struggle with...</p>
                                        <p className="text-gray-500">[Who faces it?] This affects...</p>
                                        <p className="text-gray-500">[Why important?] This is important because...</p>
                                        <p className="text-gray-500">[What solution?] We need a solution that...</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        name="problemStatement"
                                        value={formData.problemStatement}
                                        onChange={handleInputChange}
                                        placeholder="Start writing your problem statement here. For example: 'Many small business owners struggle to manage their inventory efficiently. This leads to overstocking or running out of products, which causes financial losses. We need a simple inventory management system that helps track products, sends alerts when stock is low, and provides easy-to-understand reports. The solution should be affordable and work on basic smartphones.'"
                                        rows="10"
                                        minLength={50}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                        style={{ 
                                            paddingRight: formData.problemStatement && formData.problemStatement.trim().length >= 10 ? '145px' : '16px'
                                        }}
                                    />
                                    
                                    {/* AI Improve Button - Positioned to not overlap content */}
                                    {formData.problemStatement && formData.problemStatement.trim().length >= 10 && (
                                        <button
                                            type="button"
                                            onClick={handleImproveWithAI}
                                            disabled={improvingStatement}
                                            className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-1.5 disabled:cursor-not-allowed z-10 pointer-events-auto"
                                            style={{ 
                                                maxWidth: '135px'
                                            }}
                                        >
                                            {improvingStatement ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                                    <span className="truncate">Improving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span className="truncate">Improve with AI</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                
                                {/* Word Count and Progress Indicator */}
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`text-xs font-medium ${formData.problemStatement.trim().split(/\s+/).filter(w => w).length < 50 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formData.problemStatement.trim().split(/\s+/).filter(w => w).length} / 50 words
                                        </div>
                                        {formData.problemStatement.trim().split(/\s+/).filter(w => w).length < 50 && (
                                            <span className="text-xs text-gray-500">
                                                ({50 - formData.problemStatement.trim().split(/\s+/).filter(w => w).length} more words needed)
                                            </span>
                                        )}
                                    </div>
                                    {formData.problemStatement.trim().split(/\s+/).filter(w => w).length >= 50 && (
                                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Good! Minimum requirement met
                                        </div>
                                    )}
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            formData.problemStatement.trim().split(/\s+/).filter(w => w).length >= 50 
                                                ? 'bg-green-500' 
                                                : 'bg-blue-500'
                                        }`}
                                        style={{ 
                                            width: `${Math.min(100, (formData.problemStatement.trim().split(/\s+/).filter(w => w).length / 50) * 100)}%` 
                                        }}
                                    ></div>
                                </div>

                                {/* Tips Section
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs font-semibold text-yellow-800 mb-1">✨ Tips for Better Problem Statements:</p>
                                    <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                                        <li>Write in simple, clear language - don't worry about perfect English</li>
                                        <li>Explain the problem as if you're telling a friend</li>
                                        <li>Include who has this problem and why it matters</li>
                                        <li>Describe what kind of solution you're looking for</li>
                                        <li>You can write in your own words - clarity is more important than perfect grammar</li>
                                        <li><strong>💡 Tip:</strong> Write your rough draft first, then click "Improve with AI" to make it clearer and more professional!</li>
                                    </ul>
                                </div> */}
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
                                                onChange={(e) => {
                                                    const newDeadline = e.target.value;
                                                    if (newDeadline < todayStr) {
                                                        toast.warning('Phase deadline cannot be in the past.', { autoClose: 3000 });
                                                        return;
                                                    }
                                                    // Check for Phase 1 vs Registration End Date
                                                    if (index === 0 && formData.endDate && newDeadline <= formData.endDate) {
                                                        toast.warning(`First Phase Deadline must be after Last Date of Registration (${formData.endDate})`, { autoClose: 3000 });
                                                        return;
                                                    }
                                                    // Check for subsequent phases vs previous phase
                                                    if (index > 0 && phases[index - 1].deadline && newDeadline <= phases[index - 1].deadline) {
                                                        toast.warning(`Phase ${index + 1} deadline must be after Phase ${index} deadline`, { autoClose: 3000 });
                                                        return;
                                                    }
                                                    handlePhaseChange(phase.id, 'deadline', newDeadline);
                                                }}
                                                min={getPhaseMinDate(index)}
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

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Phase Mode
                                            </label>
                                            <select
                                                value={phase.phaseMode || 'Online'}
                                                onChange={(e) => handlePhaseChange(phase.id, 'phaseMode', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="Online">Online</option>
                                                <option value="Offline">Offline</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500">Select how this phase will be conducted</p>
                                        </div>

                                        {/* Venue Location and Reporting Time - shown only if phase is Offline or Hybrid */}
                                        {(phase.phaseMode === 'Offline' || phase.phaseMode === 'Hybrid') && (
                                            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <h4 className="text-xs font-semibold text-blue-900">Physical Venue Details for This Phase</h4>
                                                
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Venue Location <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={phase.phaseVenueLocation || ''}
                                                        onChange={(e) => handlePhaseChange(phase.id, 'phaseVenueLocation', e.target.value)}
                                                        placeholder="e.g., Tech Hub, 123 Innovation Street, Bangalore"
                                                        required={phase.phaseMode === 'Offline' || phase.phaseMode === 'Hybrid'}
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">Complete address where participants need to report for this phase</p>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Reporting Date & Time <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={phase.phaseReportingTime || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Check if reporting time is in the past
                                                            if (val && val < nowStr) {
                                                                toast.error('Reporting time cannot be in the past. Please select a future date and time.', { autoClose: 4000 });
                                                                return;
                                                            }
                                                            // Check if reporting time is on or after the phase deadline
                                                            if (phase.deadline && val) {
                                                                const reportingDate = val.split('T')[0];
                                                                const deadlineDate = phase.deadline;
                                                                if (reportingDate >= deadlineDate) {
                                                                    const deadlineFormatted = new Date(deadlineDate).toLocaleDateString('en-US', { 
                                                                        year: 'numeric', 
                                                                        month: 'short', 
                                                                        day: 'numeric' 
                                                                    });
                                                                    toast.error(`Reporting time must be before the phase deadline (${deadlineFormatted}). Participants need to report before submitting their work.`, { autoClose: 5000 });
                                                                    return;
                                                                }
                                                            }
                                                            handlePhaseChange(phase.id, 'phaseReportingTime', val);
                                                        }}
                                                        min={nowStr}
                                                        max={phase.deadline ? `${phase.deadline}T23:59` : undefined}
                                                        required={phase.phaseMode === 'Offline' || phase.phaseMode === 'Hybrid'}
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        When should participants arrive at the venue for this phase? 
                                                        {phase.deadline && (
                                                            <span className="block mt-1 text-gray-600 font-medium">
                                                                ⚠️ Must be before the phase deadline: {new Date(phase.deadline).toLocaleDateString('en-US', { 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
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
                                <div className="relative">
                                    <textarea
                                        name="eligibility"
                                        value={formData.eligibility}
                                        onChange={handleInputChange}
                                        placeholder="Describe who can participate (e.g., students, professionals, age restrictions, etc.)..."
                                        rows="6"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                    />
                                    
                                    {/* AI Improve Button */}
                                    {formData.eligibility && formData.eligibility.trim().length >= 10 && (
                                        <button
                                            type="button"
                                            onClick={handleImproveEligibility}
                                            disabled={improvingEligibility}
                                            className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-1.5 disabled:cursor-not-allowed"
                                        >
                                            {improvingEligibility ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Improving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span>Improve with AI</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dates Tab */}
                    {activeTab === 'dates' && (
                        <div className="space-y-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Dates</h2>
                                <p className="text-sm text-gray-500 mt-1">Set the registration timeline</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Note: Mode (Online/Offline/Hybrid) is now set individually for each phase in the Phases section.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Date of Registration <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            if (newDate < todayStr) {
                                                toast.warning('Registration end date cannot be in the past.', { autoClose: 3000 });
                                                return;
                                            }
                                            if (phases.length > 0 && phases[0].deadline && newDate >= phases[0].deadline) {
                                                toast.warning(`Last Date of Registration must be before the first phase deadline (${phases[0].deadline})`, { autoClose: 3000 });
                                                return;
                                            }
                                            handleInputChange(e);
                                        }}
                                        min={todayStr}
                                        max={phases.length > 0 ? phases[0].deadline : undefined}
                                        required
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

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
                                <div className="relative">
                                    <textarea
                                        name="submissionGuidelines"
                                        value={formData.submissionGuidelines}
                                        onChange={handleInputChange}
                                        placeholder="Describe what participants need to submit and how..."
                                        rows="6"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                    />
                                    
                                    {/* AI Improve Button */}
                                    {formData.submissionGuidelines && formData.submissionGuidelines.trim().length >= 10 && (
                                        <button
                                            type="button"
                                            onClick={handleImproveGuidelines}
                                            disabled={improvingGuidelines}
                                            className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-1.5 disabled:cursor-not-allowed"
                                        >
                                            {improvingGuidelines ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Improving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span>Improve with AI</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
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

                            <div className="grid md:grid-cols-2 gap-6">
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
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prize Pool / Prize Details (Optional)
                                    </label>
                                    <textarea
                                        name="prize"
                                        value={formData.prize}
                                        onChange={handleInputChange}
                                        placeholder="General prize information or additional prizes..."
                                        rows="3"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Optional: General prize pool description or additional prizes</p>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner Prizes</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                🥇 1st Place Prize
                                            </label>
                                            <input
                                                type="text"
                                                name="firstPrize"
                                                value={formData.firstPrize}
                                                onChange={handleInputChange}
                                                placeholder="e.g., $10,000 or ₹75,000 or Laptop + Certificate"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-100"
                                            />
                                        </div>

                                        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                🥈 2nd Place Prize
                                            </label>
                                            <input
                                                type="text"
                                                name="secondPrize"
                                                value={formData.secondPrize}
                                                onChange={handleInputChange}
                                                placeholder="e.g., $5,000 or ₹50,000 or Tablet + Certificate"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
                                            />
                                        </div>

                                        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                🥉 3rd Place Prize
                                            </label>
                                            <input
                                                type="text"
                                                name="thirdPrize"
                                                value={formData.thirdPrize}
                                                onChange={handleInputChange}
                                                placeholder="e.g., $2,500 or ₹25,000 or Smartwatch + Certificate"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                            />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs text-gray-500">Specify the prizes for top 3 winners. You can include cash amounts, products, certificates, or any combination.</p>
                                </div>
                            </div>

                            <div>
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowIndividual}
                                        onChange={(e) => setFormData(prev => ({ ...prev, allowIndividual: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    Allow Individual Applications
                                </label>
                                <p className="text-xs text-gray-500 mt-1">If unchecked, only team applications will be allowed.</p>
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
