import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathonById, applyForHackathon, getMyHackathonApplications } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Users, Trophy, Clock, CheckCircle, ArrowRight, User, Mail, Phone } from 'lucide-react';

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
    const [individualQualifications, setIndividualQualifications] = useState('');

    // Update individual name when user loads
    useEffect(() => {
        if (user?.name && !individualName) {
            setIndividualName(user.name);
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

        // Validation for duplicates
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
                teamMembers: asTeam || hackathon.allowIndividual === false ? teamMembers : [],
                individualName: !asTeam && hackathon.allowIndividual !== false ? individualName.trim() : null,
                individualQualifications: !asTeam && hackathon.allowIndividual !== false ? individualQualifications.trim() : null
            };

            console.log('[Apply] Submitting application data:', applicationData);

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
                <button onClick={() => navigate('/applicant-hackathons')} className="mt-4 text-purple-600 hover:underline">
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
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span>{formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <MapPin className="w-4 h-4 text-purple-600" />
                                <span>{hackathon.mode} {hackathon.location ? `(${hackathon.location})` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <Users className="w-4 h-4 text-purple-600" />
                                <span>Team Size: {hackathon.minTeamSize} - {hackathon.teamSize} Members</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <Trophy className="w-4 h-4 text-purple-600" />
                                <span>Prize: {hackathon.prize}</span>
                            </div>
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
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Phases & Timeline</h3>
                                    <div className="space-y-4">
                                        {hackathon.phases && hackathon.phases.map((phase, index) => (
                                            <div key={index} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm border-2 border-purple-200">
                                                        {index + 1}
                                                    </div>
                                                    {index < hackathon.phases.length - 1 && (
                                                        <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                                    )}
                                                </div>
                                                <div className="pb-6">
                                                    <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                                                    <p className="text-sm text-gray-500 mb-1">Deadline: {formatDate(phase.deadline)}</p>
                                                    <p className="text-gray-600 text-sm">{phase.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar / Action Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-8 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Ready to Participate?</h3>

                                    {existingApplication ? (
                                        <div className="space-y-4">
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
                                                                                        const newMembers = [...teamMembers];
                                                                                        newMembers[index] = { ...newMembers[index], phone: e.target.value };
                                                                                        setTeamMembers(newMembers);
                                                                                    }}
                                                                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white ${isPhoneDuplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                                                                                        }`}
                                                                                    placeholder="Enter phone number"
                                                                                />
                                                                                {isPhoneDuplicate && (
                                                                                    <p className="text-xs text-red-500 mt-1">This phone number is already used by another member.</p>
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
                                                disabled={applying}
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
