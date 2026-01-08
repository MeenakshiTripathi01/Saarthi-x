import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathonById, applyForHackathon, getMyHackathonApplications, incrementHackathonViews } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Users, Trophy, Clock, CheckCircle, ArrowRight, User, Mail, Phone, XCircle } from 'lucide-react';

export default function HackathonDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [existingApplication, setExistingApplication] = useState(null);

    // Team Application State
    const [asTeam, setAsTeam] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teamSize, setTeamSize] = useState(2);
    const [teamMembers, setTeamMembers] = useState([]);
    
    // Individual Application State (pre-fill name from logged-in user)
    const [individualName, setIndividualName] = useState(user?.name || '');
    const [individualEmail, setIndividualEmail] = useState(user?.email || '');
    const [individualPhone, setIndividualPhone] = useState('');
    const [individualQualifications, setIndividualQualifications] = useState('');

    // Update individual fields when user loads
    useEffect(() => {
        if (user?.name && !individualName) {
            setIndividualName(user.name);
        }
        if (user?.email && !individualEmail) {
            setIndividualEmail(user.email);
        }
    }, [user]);

    // Initialize team members when team size changes or user loads
    useEffect(() => {
        if (asTeam && user) {
            const initialMembers = Array(teamSize).fill(null).map((_, index) => {
                // Preserve existing data if resizing
                if (teamMembers[index]) return teamMembers[index];

                // Initialize Team Lead (index 0)
                if (index === 0) {
                    return {
                        name: user.name || '',
                        email: user.email || '',
                        phone: '',
                        role: 'Team Lead'
                    };
                }

                // Initialize other members
                return {
                    name: '',
                    email: '',
                    phone: '',
                    role: 'Member'
                };
            });
            setTeamMembers(initialMembers);
        }
    }, [teamSize, asTeam, user]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();

        // Suffix logic
        const getSuffix = (d) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        return `${day.toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${year} (${day}${getSuffix(day)} ${month} ${year})`;
    };

    // Check if Phase 1 deadline has passed
    const isPhase1DeadlinePassed = () => {
        if (!hackathon || !hackathon.phases || hackathon.phases.length === 0) {
            return false;
        }
        const phase1 = hackathon.phases[0];
        if (!phase1.deadline) {
            return false;
        }
        try {
            const deadline = new Date(phase1.deadline);
            const now = new Date();
            return now > deadline;
        } catch (e) {
            console.error('Error parsing Phase 1 deadline:', e);
            return false;
        }
    };

    // Check if results are published
    const areResultsPublished = () => {
        return hackathon && (hackathon.resultsPublished === true || hackathon.resultsPublished === 'true');
    };

    // Check if application is allowed
    const canApply = () => {
        if (existingApplication) return false;
        if (areResultsPublished()) return false;
        if (isPhase1DeadlinePassed()) return false;
        return true;
    };

    useEffect(() => {
        loadData();
    }, [id, isAuthenticated]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [hackathonData, myApps] = await Promise.all([
                getHackathonById(id),
                isAuthenticated ? getMyHackathonApplications() : Promise.resolve([])
            ]);

            setHackathon(hackathonData);
            if (hackathonData.minTeamSize) {
                setTeamSize(hackathonData.minTeamSize);
            }
            if (hackathonData.allowIndividual === false) {
                setAsTeam(true);
            }

            // Check if already applied
            if (myApps && myApps.length > 0) {
                const existing = myApps.find(app => app.hackathonId === id);
                setExistingApplication(existing);
            }
        } catch (error) {
            console.error('Error loading hackathon details:', error);
            toast.error('Failed to load hackathon details');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.info('Please log in to apply');
            navigate('/login', { state: { from: `/hackathon/${id}` } });
            return;
        }

        // Validation for duplicates and phone number length
        if (asTeam) {
            const emails = new Set();
            const phones = new Set();

            for (let i = 0; i < teamMembers.length; i++) {
                const member = teamMembers[i];
                if (!member) continue;

                if (member.email && emails.has(member.email.toLowerCase())) {
                    toast.error(`Duplicate email found: ${member.email}. Each member must have a unique email.`);
                    return;
                }
                if (member.email) emails.add(member.email.toLowerCase());

                // Validate phone number is exactly 10 digits
                if (member.phone) {
                    const phoneDigits = member.phone.replace(/\D/g, '');
                    if (phoneDigits.length !== 10) {
                        toast.error(`Team member ${i + 1} phone number must be exactly 10 digits. Current: ${phoneDigits.length} digits`);
                        return;
                    }
                }

                if (member.phone && phones.has(member.phone)) {
                    toast.error(`Duplicate phone number found: ${member.phone}. Each member must have a unique phone number.`);
                    return;
                }
                if (member.phone) phones.add(member.phone);
            }
        }

        try {
            setApplying(true);
            if (hackathon.allowIndividual === false && !asTeam) {
                toast.error('This hackathon only accepts team applications.');
                setApplying(false);
                return;
            }

            // Validation for individual application
            if (!asTeam && hackathon.allowIndividual !== false) {
                if (!individualName.trim()) {
                    toast.error('Please enter your name');
                    setApplying(false);
                    return;
                }
                if (!individualEmail.trim()) {
                    toast.error('Please enter your email');
                    setApplying(false);
                    return;
                }
                if (!individualPhone.trim()) {
                    toast.error('Please enter your phone number');
                    setApplying(false);
                    return;
                }
                // Validate phone number is exactly 10 digits
                const phoneDigits = individualPhone.replace(/\D/g, '');
                if (phoneDigits.length !== 10) {
                    toast.error('Phone number must be exactly 10 digits');
                    setApplying(false);
                    return;
                }
                if (!individualQualifications.trim()) {
                    toast.error('Please enter your qualifications');
                    setApplying(false);
                    return;
                }
            }

            const applicationData = {
                asTeam: hackathon.allowIndividual === false ? true : asTeam,
                teamName: asTeam || hackathon.allowIndividual === false ? teamName : null,
                teamSize: asTeam || hackathon.allowIndividual === false ? teamSize : 1,
                teamMembers: asTeam || hackathon.allowIndividual === false ? teamMembers.map(member => ({
                    ...member,
                    phone: member.phone ? member.phone.replace(/\D/g, '') : '' // Ensure only digits
                })) : [],
                individualName: !asTeam && hackathon.allowIndividual !== false ? individualName.trim() : null,
                individualEmail: !asTeam && hackathon.allowIndividual !== false ? individualEmail.trim() : null,
                individualPhone: !asTeam && hackathon.allowIndividual !== false ? individualPhone.replace(/\D/g, '') : null, // Ensure only digits
                individualQualifications: !asTeam && hackathon.allowIndividual !== false ? individualQualifications.trim() : null
            };

            console.log('[Apply] Submitting application data:', applicationData);

            // Increment views when applying
            try {
              await incrementHackathonViews(id);
              // Update local state to reflect the new view count
              setHackathon(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
            } catch (error) {
              // Silently fail - views increment is not critical
              console.error('Failed to increment views:', error);
            }

            const response = await applyForHackathon(id, applicationData);
            
            console.log('[Apply] Response received:', response);
            console.log('[Apply] Response individualName:', response.individualName);
            console.log('[Apply] Response individualQualifications:', response.individualQualifications);
            
            toast.success('Successfully applied! Redirecting to dashboard...');

            // Redirect to application dashboard
            setTimeout(() => {
                navigate(`/hackathon-application/${response.id}`);
            }, 1500);

        } catch (error) {
            console.error('Error applying:', error);
            toast.error(error.response?.data || 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!hackathon) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-800">Hackathon not found</h2>
                <button onClick={() => navigate('/browse-hackathons')} className="mt-4 text-purple-600 hover:underline">
                    Back to Hackathons
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-32 sm:h-48 relative">
                        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent">
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{hackathon.title}</h1>
                            <p className="text-white/90 text-lg">{hackathon.company}</p>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-600">
                            {/* <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span>{formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}</span>
                            </div> */}
                            {/* Mode is now set per phase, so we don't show it at hackathon level */}
                            {(hackathon.minTeamSize || hackathon.teamSize) && (
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <Users className="w-4 h-4 text-purple-600" />
                                    <span>Team Size: {hackathon.minTeamSize || 1} - {hackathon.teamSize || 'N/A'} Members</span>
                                </div>
                            )}
                            {/* Reporting date is now set per phase, not at hackathon level */}
                            {hackathon.industry && (
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <span className="text-purple-600">🏢</span>
                                    <span>Industry: {hackathon.industry}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-8">
                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">About the Hackathon</h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{hackathon.description}</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Problem Statement</h3>
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">{hackathon.problemStatement}</p>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Phases & Timeline</h3>
                                    {hackathon.phases && hackathon.phases.length > 0 ? (
                                        <div className="space-y-6">
                                            {hackathon.phases.map((phase, index) => (
                                                <div key={phase.id || index} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base border-2 border-purple-300 shadow-md">
                                                                {index + 1}
                                                            </div>
                                                            {index < hackathon.phases.length - 1 && (
                                                                <div className="w-1 h-full bg-gradient-to-b from-purple-300 to-indigo-300 my-2 rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{phase.name || `Phase ${index + 1}`}</h4>
                                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                                        (phase.phaseMode === 'Online' || !phase.phaseMode) ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                                        phase.phaseMode === 'Offline' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                                                        'bg-purple-100 text-purple-800 border border-purple-200'
                                                                    }`}>
                                                                        {(phase.phaseMode === 'Online' || !phase.phaseMode) && '🌐'}
                                                                        {phase.phaseMode === 'Offline' && '📍'}
                                                                        {phase.phaseMode === 'Hybrid' && '🔀'}
                                                                        <span className="ml-1">{phase.phaseMode || 'Online'}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Phase Description - Always show */}
                                                            <div className="mb-4">
                                                                <p className="text-sm font-semibold text-gray-700 mb-1">Description:</p>
                                                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                                                    {phase.description || <span className="text-gray-400 italic">No description provided</span>}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Deadline - Always show */}
                                                            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                                <p className="text-xs font-semibold text-red-900 mb-1 flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    Submission Deadline
                                                                </p>
                                                                <p className="text-sm font-bold text-red-700">
                                                                    {phase.deadline ? formatDate(phase.deadline) : <span className="text-gray-400 italic">Not specified</span>}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Upload Format - Always show */}
                                                            <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                                <p className="text-xs font-semibold text-gray-700 mb-1">📎 Upload Format:</p>
                                                                <p className="text-sm text-gray-800 font-medium">
                                                                    {phase.uploadFormat || <span className="text-gray-400 italic">Not specified</span>}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Venue and Reporting Time for Offline/Hybrid Phases */}
                                                            {(phase.phaseMode === 'Offline' || phase.phaseMode === 'Hybrid') && (phase.phaseVenueLocation || phase.phaseReportingTime) && (
                                                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                                                                    <p className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wide">📍 Venue & Reporting Details</p>
                                                                    {phase.phaseVenueLocation && (
                                                                        <div className="mb-3">
                                                                            <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                                                                                <MapPin className="w-3.5 h-3.5" />
                                                                                Venue Location
                                                                            </p>
                                                                            <p className="text-sm text-gray-800 font-medium pl-5">{phase.phaseVenueLocation}</p>
                                                                        </div>
                                                                    )}
                                                                    {phase.phaseReportingTime && (
                                                                        <div>
                                                                            <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                                                                                <Clock className="w-3.5 h-3.5" />
                                                                                Reporting Date & Time
                                                                            </p>
                                                                            <p className="text-sm text-gray-800 font-medium pl-5">
                                                                                {new Date(phase.phaseReportingTime).toLocaleString('en-US', {
                                                                                    weekday: 'long',
                                                                                    year: 'numeric',
                                                                                    month: 'long',
                                                                                    day: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                            <p className="text-gray-500 text-sm">No phases have been defined for this hackathon yet.</p>
                                        </div>
                                    )}
                                </section>

                                {/* Eligibility Section */}
                                {hackathon.eligibility && (
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">Eligibility Criteria</h3>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{hackathon.eligibility}</p>
                                        </div>
                                    </section>
                                )}

                                {/* Submission Guidelines */}
                                {(hackathon.submissionGuidelines || hackathon.submissionUrl) && (
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">Submission Details</h3>
                                        <div className="space-y-4">
                                            {hackathon.submissionUrl && (
                                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                                                    <p className="text-sm font-semibold text-indigo-900 mb-2">📤 Submission URL</p>
                                                    <a 
                                                        href={hackathon.submissionUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium break-all underline"
                                                    >
                                                        {hackathon.submissionUrl}
                                                    </a>
                                                </div>
                                            )}
                                            {hackathon.submissionGuidelines && (
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                    <p className="text-sm font-semibold text-gray-900 mb-2">📋 Submission Guidelines</p>
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{hackathon.submissionGuidelines}</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* Skills Required */}
                                {hackathon.skills && hackathon.skills.length > 0 && (
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">Required Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {hackathon.skills.map((skill, index) => (
                                                <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Prize Details */}
                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Prize Pool</h3>
                                    <div className="space-y-3">
                                        {hackathon.firstPrize && (
                                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                                                <span className="text-2xl">🥇</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-yellow-900">1st Place</p>
                                                    <p className="text-sm font-bold text-gray-900">{hackathon.firstPrize}</p>
                                                </div>
                                            </div>
                                        )}
                                        {hackathon.secondPrize && (
                                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
                                                <span className="text-2xl">🥈</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700">2nd Place</p>
                                                    <p className="text-sm font-bold text-gray-900">{hackathon.secondPrize}</p>
                                                </div>
                                            </div>
                                        )}
                                        {hackathon.thirdPrize && (
                                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                                                <span className="text-2xl">🥉</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-orange-900">3rd Place</p>
                                                    <p className="text-sm font-bold text-gray-900">{hackathon.thirdPrize}</p>
                                                </div>
                                            </div>
                                        )}
                                        {hackathon.prize && (
                                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-600 mb-1">Additional Prize Information</p>
                                                <p className="text-sm text-gray-700">{hackathon.prize}</p>
                                            </div>
                                        )}
                                        {!hackathon.firstPrize && !hackathon.secondPrize && !hackathon.thirdPrize && !hackathon.prize && (
                                            <p className="text-sm text-gray-500 italic">Prize details not specified</p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar / Action Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-8 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Register for the Hackathon</h3>

                                    {existingApplication ? (
                                        <div className="space-y-4">
                                            {existingApplication.status === 'REJECTED' ? (
                                                <>
                                                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                            <div className="flex-1">
                                                                <h4 className="font-bold mb-2">Application Rejected</h4>
                                                                {existingApplication.rejectionMessage && (
                                                                    <p className="text-sm whitespace-pre-line">{existingApplication.rejectionMessage}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 text-center">
                                                        You cannot re-apply to this hackathon.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                                                        <CheckCircle className="w-5 h-5" />
                                                        You have already applied!
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/hackathon-application/${existingApplication.id}`)}
                                                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        Go to Dashboard <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : areResultsPublished() ? (
                                        <div className="space-y-4">
                                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold mb-2">Applications Closed</h4>
                                                        <p className="text-sm">Results for this hackathon have been declared. New applications are no longer accepted.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : isPhase1DeadlinePassed() ? (
                                        <div className="space-y-4">
                                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold mb-2">Applications Closed</h4>
                                                        <p className="text-sm">
                                                            Phase 1 submission deadline has passed. New applications are no longer accepted.
                                                            {hackathon.phases && hackathon.phases[0] && hackathon.phases[0].deadline && (
                                                                <span className="block mt-1 text-xs">
                                                                    Deadline was: {formatDate(hackathon.phases[0].deadline)}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleApply} className="space-y-4">
                                            <div>
                                                {hackathon.teamSize > 1 && (
                                                    hackathon.allowIndividual === false ? (
                                                        <div className="flex items-center gap-2 mb-4 text-gray-600">
                                                            <CheckCircle className="w-4 h-4 text-purple-600" />
                                                            <span className="font-medium">Team applications only</span>
                                                        </div>
                                                    ) : (
                                                        <label className="flex items-center gap-2 cursor-pointer mb-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={asTeam}
                                                                onChange={(e) => setAsTeam(e.target.checked)}
                                                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                            />
                                                            <span className="text-gray-700 font-medium">Apply as a Team</span>
                                                        </label>
                                                    )
                                                )}
                                            </div>

                                            {!asTeam && hackathon.allowIndividual !== false && (
                                                <div className="space-y-4 animate-fadeIn">
                                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                                                        <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                                            <User className="w-4 h-4" />
                                                            Individual Application
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Your Full Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={individualName}
                                                            onChange={(e) => setIndividualName(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="Enter your full name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Email <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="email"
                                                            required
                                                            value={individualEmail}
                                                            onChange={(e) => setIndividualEmail(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="Enter your email address"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Phone Number <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            required
                                                            value={individualPhone}
                                                            onChange={(e) => {
                                                                // Only allow digits, maximum 10 digits
                                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                setIndividualPhone(value);
                                                            }}
                                                            maxLength={10}
                                                            pattern="[0-9]{10}"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="Enter 10-digit phone number"
                                                        />
                                                        {individualPhone && individualPhone.length !== 10 && (
                                                            <p className="text-xs text-red-500 mt-1">
                                                                Phone number must be exactly 10 digits. Current: {individualPhone.length} digits
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Qualifications <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                            required
                                                            rows={4}
                                                            value={individualQualifications}
                                                            onChange={(e) => setIndividualQualifications(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                                            placeholder="E.g., Bachelor's in Computer Science, 2 years web development experience, proficient in React, Node.js..."
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Share your education, skills, and relevant experience
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {asTeam && (
                                                <div className="space-y-4 animate-fadeIn">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={teamName}
                                                            onChange={(e) => setTeamName(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="Enter team name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            min={hackathon.minTeamSize}
                                                            max={hackathon.teamSize}
                                                            value={teamSize}
                                                            onWheel={(e) => e.target.blur()}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    if (val > hackathon.teamSize) {
                                                                        toast.warning(`Maximum team size allowed is ${hackathon.teamSize}`);
                                                                        setTeamSize(hackathon.teamSize);
                                                                    } else {
                                                                        setTeamSize(val);
                                                                    }
                                                                } else {
                                                                    setTeamSize(0);
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Allowed size: {hackathon.minTeamSize} - {hackathon.teamSize} members
                                                        </p>
                                                    </div>

                                                    {/* Team Members Section */}
                                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-sm font-semibold text-gray-900">Team Members</h4>
                                                            <span className="text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full font-medium">
                                                                {teamMembers.length} / {teamSize}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                                            {teamMembers.map((member, index) => {
                                                                const isEmailDuplicate = member.email && teamMembers.some((m, i) => i !== index && m.email && m.email.toLowerCase() === member.email.toLowerCase());
                                                                const isPhoneDuplicate = member.phone && teamMembers.some((m, i) => i !== index && m.phone && m.phone === member.phone);

                                                                return (
                                                                    <div
                                                                        key={index}
                                                                        className={`rounded-lg border p-4 transition-all ${index === 0
                                                                            ? 'border-purple-300 bg-purple-50/50'
                                                                            : 'border-gray-200 bg-white'
                                                                            }`}
                                                                    >
                                                                        {/* Member Header */}
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                                }`}>
                                                                                {index === 0 ? '★' : index + 1}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <h5 className={`text-sm font-bold ${index === 0 ? 'text-purple-900' : 'text-gray-800'}`}>
                                                                                    {index === 0 ? 'Team Lead (You)' : `Team Member ${index + 1}`}
                                                                                </h5>
                                                                                {index === 0 && <p className="text-xs text-purple-600">Primary Contact</p>}
                                                                            </div>
                                                                        </div>

                                                                        {/* Input Fields */}
                                                                        <div className="space-y-3">
                                                                            {/* Name */}
                                                                            <div>
                                                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                    <User className="inline w-3 h-3 mr-1" />
                                                                                    Full Name
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    required
                                                                                    value={member.name}
                                                                                    onChange={(e) => {
                                                                                        const newMembers = [...teamMembers];
                                                                                        newMembers[index] = { ...newMembers[index], name: e.target.value };
                                                                                        setTeamMembers(newMembers);
                                                                                    }}
                                                                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${index === 0 ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-300'
                                                                                        }`}
                                                                                    placeholder="Enter full name"
                                                                                    readOnly={index === 0}
                                                                                />
                                                                            </div>

                                                                            {/* Email */}
                                                                            <div>
                                                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                    <Mail className="inline w-3 h-3 mr-1" />
                                                                                    Email Address
                                                                                </label>
                                                                                <input
                                                                                    type="email"
                                                                                    required
                                                                                    value={member.email}
                                                                                    onChange={(e) => {
                                                                                        const newMembers = [...teamMembers];
                                                                                        newMembers[index] = { ...newMembers[index], email: e.target.value };
                                                                                        setTeamMembers(newMembers);
                                                                                    }}
                                                                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isEmailDuplicate ? 'border-red-500 focus:ring-red-500' :
                                                                                        index === 0 ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-300'
                                                                                        }`}
                                                                                    placeholder="Enter email address"
                                                                                    readOnly={index === 0}
                                                                                />
                                                                                {isEmailDuplicate && (
                                                                                    <p className="text-xs text-red-500 mt-1">This email is already used by another member.</p>
                                                                                )}
                                                                            </div>

                                                                            {/* Phone */}
                                                                            <div>
                                                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                    <Phone className="inline w-3 h-3 mr-1" />
                                                                                    Phone Number
                                                                                </label>
                                                                                <input
                                                                                    type="tel"
                                                                                    required
                                                                                    value={member.phone}
                                                                                    onChange={(e) => {
                                                                                        // Only allow digits, maximum 10 digits
                                                                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                                        const newMembers = [...teamMembers];
                                                                                        newMembers[index] = { ...newMembers[index], phone: value };
                                                                                        setTeamMembers(newMembers);
                                                                                    }}
                                                                                    maxLength={10}
                                                                                    pattern="[0-9]{10}"
                                                                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white ${isPhoneDuplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                                                                        }`}
                                                                                    placeholder="Enter 10-digit phone number"
                                                                                />
                                                                                {isPhoneDuplicate && (
                                                                                    <p className="text-xs text-red-500 mt-1">This phone number is already used by another member.</p>
                                                                                )}
                                                                                {member.phone && member.phone.length !== 10 && (
                                                                                    <p className="text-xs text-red-500 mt-1">
                                                                                        Phone number must be exactly 10 digits. Current: {member.phone.length} digits
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={applying || !canApply()}
                                                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {applying ? 'Submitting...' : 'Apply Now'}
                                                {!applying && <ArrowRight className="w-4 h-4" />}
                                            </button>

                                            <p className="text-xs text-center text-gray-500 mt-2">
                                                By applying, you agree to the hackathon rules and guidelines.
                                            </p>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
