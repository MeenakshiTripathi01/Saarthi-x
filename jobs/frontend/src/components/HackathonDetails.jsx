import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathonById, applyForHackathon, getMyHackathonApplications } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Users, Trophy, Clock, CheckCircle, ArrowRight } from 'lucide-react';

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
    const [teamMembers, setTeamMembers] = useState(['']); // Start with one empty member for size 2

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

        try {
            setApplying(true);
            const applicationData = {
                asTeam,
                teamName: asTeam ? teamName : null,
                teamSize: asTeam ? teamSize : 1,
                teamMembers: asTeam ? teamMembers : []
            };

            const response = await applyForHackathon(id, applicationData);
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
                                <span>Team Size: {hackathon.teamSize} - {hackathon.maxTeams} Members</span>
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
                                                <label className="flex items-center gap-2 cursor-pointer mb-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={asTeam}
                                                        onChange={(e) => setAsTeam(e.target.checked)}
                                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                    />
                                                    <span className="text-gray-700 font-medium">Apply as a Team</span>
                                                </label>
                                            </div>

                                            {asTeam && (
                                                <div className="space-y-3 animate-fadeIn">
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
                                                            min="2"
                                                            max={hackathon.teamSize}
                                                            value={teamSize}
                                                            onChange={(e) => setTeamSize(parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">Max size: {hackathon.teamSize}</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">Team Members</label>
                                                        {Array.from({ length: teamSize - 1 }).map((_, index) => (
                                                            <input
                                                                key={index}
                                                                type="text"
                                                                required
                                                                value={teamMembers[index] || ''}
                                                                onChange={(e) => {
                                                                    const newMembers = [...teamMembers];
                                                                    newMembers[index] = e.target.value;
                                                                    setTeamMembers(newMembers);
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                                placeholder={`Member ${index + 2} Name`}
                                                            />
                                                        ))}
                                                        <p className="text-xs text-gray-500">Enter names of other team members</p>
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
