import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathonResults, finalizeHackathonResults, publishShowcaseContent } from '../api/jobApi';
import { toast } from 'react-toastify';
import { Trophy, Medal, Award, Users, Star, CheckCircle, Upload, X, FileText, Mail } from 'lucide-react';

export default function IndustryHackathonResults() {
    const { hackathonId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [finalizing, setFinalizing] = useState(false);
    const [showcaseModal, setShowcaseModal] = useState(null);
    const [showcaseData, setShowcaseData] = useState({
        title: '',
        description: '',
        innovationHighlights: ''
    });
    const [selectedRanks, setSelectedRanks] = useState({
        1: null,  // 1st place application ID
        2: null,  // 2nd place application ID
        3: null   // 3rd place application ID
    });

    useEffect(() => {
        loadResults();
    }, [hackathonId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            const data = await getHackathonResults(hackathonId);
            setResults(data);
        } catch (error) {
            console.error('Error loading results:', error);
            toast.error('Failed to load results');
        } finally {
            setLoading(false);
        }
    };

    const handleRankSelection = (rank, applicationId) => {
        setSelectedRanks(prev => ({
            ...prev,
            [rank]: applicationId || null
        }));
    };

    const handleFinalizeWithManualRanks = async () => {
        // Check if at least one winner is selected
        const hasAnySelection = selectedRanks[1] || selectedRanks[2] || selectedRanks[3];

        if (!hasAnySelection) {
            toast.error('Please select at least one winner');
            return;
        }

        const selectedCount = [selectedRanks[1], selectedRanks[2], selectedRanks[3]].filter(Boolean).length;
        const confirmMessage = selectedCount === 3
            ? 'Are you sure you want to finalize results with all 3 winners selected?'
            : `Are you sure you want to finalize with only ${selectedCount} winner(s) selected?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setFinalizing(true);

            // Update each selected application with its rank
            for (const [rank, appId] of Object.entries(selectedRanks)) {
                if (!appId) continue; // Skip if no selection for this rank

                const app = results.find(r => r.id === appId);
                if (app) {
                    const totalScore = getTotalScore(app);

                    console.log(`Updating ${appId}: rank=${rank}, score=${totalScore}`);

                    const response = await fetch(`http://localhost:8080/api/hackathon-applications/${appId}`, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            finalRank: parseInt(rank),
                            totalScore: totalScore
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Failed to update ${appId}:`, errorText);
                        throw new Error(`Failed to update: ${errorText}`);
                    }

                    const updated = await response.json();
                    console.log(`Updated successfully:`, updated);
                }
            }

            toast.success('Results finalized successfully!');
            await loadResults();
        } catch (error) {
            console.error('Error finalizing results:', error);
            toast.error(error.message || 'Failed to finalize results');
        } finally {
            setFinalizing(false);
        }
    };

    const handleFinalizeResults = async () => {
        if (!window.confirm('Are you sure you want to finalize results? This will calculate rankings based on total scores.')) {
            return;
        }

        try {
            setFinalizing(true);
            await finalizeHackathonResults(hackathonId);
            toast.success('Results finalized successfully!');
            await loadResults();
        } catch (error) {
            console.error('Error finalizing results:', error);
            toast.error('Failed to finalize results');
        } finally {
            setFinalizing(false);
        }
    };

    const handlePublishShowcase = async (applicationId) => {
        try {
            await publishShowcaseContent(applicationId, showcaseData);
            toast.success('Showcase content published successfully!');
            setShowcaseModal(null);
            setShowcaseData({ title: '', description: '', innovationHighlights: '' });
            await loadResults();
        } catch (error) {
            console.error('Error publishing showcase:', error);
            toast.error(error.response?.data || 'Failed to publish showcase');
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) {
            return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', label: '🥇 1st Place' };
        } else if (rank === 2) {
            return { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50', label: '🥈 2nd Place' };
        } else if (rank === 3) {
            return { icon: Award, color: 'text-orange-600', bg: 'bg-orange-50', label: '🥉 3rd Place' };
        }
        return null;
    };

    // Helper to calculate total score from phase submissions
    const getTotalScore = (result) => {
        if (result.totalScore !== null && result.totalScore !== undefined) {
            return result.totalScore;
        }

        // Calculate from phase submissions
        let total = 0;
        Object.values(result.phaseSubmissions || {}).forEach(submission => {
            if (submission.score !== null && submission.score !== undefined) {
                total += submission.score;
            }
        });
        return total;
    };

    const hasRankings = results.some(r => r.finalRank);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Hackathon Results</h1>
                            <p className="text-gray-600 mt-1">Total Participants: {results.length}</p>
                        </div>
                        {!hasRankings && results.length > 0 && (
                            <div className="text-sm text-gray-500">
                                Select winners below to finalize results
                            </div>
                        )}
                    </div>
                </div>

                {/* Manual Rank Selection (if not finalized) */}
                {!hasRankings && results.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Winners</h2>
                        <p className="text-gray-600 mb-6">Choose the top 3 performers from the participants below</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* 1st Place */}
                            <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    <h3 className="font-bold text-yellow-900">1st Place</h3>
                                </div>
                                <select
                                    value={selectedRanks[1] || ''}
                                    onChange={(e) => handleRankSelection(1, e.target.value)}
                                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                                >
                                    <option value="">Select Winner</option>
                                    {results.map(app => (
                                        <option
                                            key={app.id}
                                            value={app.id}
                                            disabled={Object.values(selectedRanks).includes(app.id) && selectedRanks[1] !== app.id}
                                        >
                                            {app.asTeam ? app.teamName : 'Individual'} - Score: {getTotalScore(app).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2nd Place */}
                            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Medal className="w-6 h-6 text-gray-400" />
                                    <h3 className="font-bold text-gray-700">2nd Place</h3>
                                </div>
                                <select
                                    value={selectedRanks[2] || ''}
                                    onChange={(e) => handleRankSelection(2, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                                >
                                    <option value="">Select Runner Up</option>
                                    {results.map(app => (
                                        <option
                                            key={app.id}
                                            value={app.id}
                                            disabled={Object.values(selectedRanks).includes(app.id) && selectedRanks[2] !== app.id}
                                        >
                                            {app.asTeam ? app.teamName : 'Individual'} - Score: {getTotalScore(app).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3rd Place */}
                            <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Award className="w-6 h-6 text-orange-600" />
                                    <h3 className="font-bold text-orange-900">3rd Place</h3>
                                </div>
                                <select
                                    value={selectedRanks[3] || ''}
                                    onChange={(e) => handleRankSelection(3, e.target.value)}
                                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                >
                                    <option value="">Select 3rd Place</option>
                                    {results.map(app => (
                                        <option
                                            key={app.id}
                                            value={app.id}
                                            disabled={Object.values(selectedRanks).includes(app.id) && selectedRanks[3] !== app.id}
                                        >
                                            {app.asTeam ? app.teamName : 'Individual'} - Score: {getTotalScore(app).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleFinalizeWithManualRanks}
                            disabled={!selectedRanks[1] && !selectedRanks[2] && !selectedRanks[3] || finalizing}
                            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {finalizing ? 'Finalizing...' : 'Finalize Results with Selected Winners'}
                            <CheckCircle className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Winners Section (Top 3) */}
                {hasRankings && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Top Performers
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {results.filter(r => r.finalRank && r.finalRank <= 3).map((result) => {
                                const badge = getRankBadge(result.finalRank);
                                const RankIcon = badge.icon;
                                return (
                                    <div key={result.id} className={`${badge.bg} border-2 border-${badge.color.split('-')[1]}-300 rounded-xl p-6 hover:shadow-lg transition-shadow`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <RankIcon className={`w-12 h-12 ${badge.color}`} />
                                            <span className="text-2xl font-bold">{badge.label}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                                            {result.asTeam ? result.teamName : 'Individual'}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star className="w-5 h-5 text-purple-600" />
                                            <span className="text-xl font-semibold text-purple-600">
                                                {getTotalScore(result)?.toFixed(2) || 0}
                                            </span>
                                        </div>
                                        {result.asTeam && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                                <Users className="w-4 h-4" />
                                                {result.teamSize} members
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setShowcaseModal(result)}
                                            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {result.showcaseContent ? 'Update Showcase' : 'Publish Showcase'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Participants */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">All Participants</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team/Individual</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.map((result, index) => {
                                    const badge = result.finalRank ? getRankBadge(result.finalRank) : null;
                                    return (
                                        <tr key={result.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {badge ? (
                                                    <span className={`${badge.bg} ${badge.color} px-3 py-1 rounded-full text-sm font-semibold`}>
                                                        {badge.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {result.asTeam ? result.teamName : 'Individual'}
                                                    </div>
                                                    {result.asTeam && (
                                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {result.teamSize} members
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-lg font-semibold text-purple-600">
                                                    {getTotalScore(result)?.toFixed(2) || '0.00'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${result.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    result.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {result.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => navigate(`/industry-hackathon-dashboard/${result.id}`)}
                                                    className="text-purple-600 hover:text-purple-700 font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/industry-hackathons')}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                        ← Back to Hackathons
                    </button>
                </div>
            </div>

            {/* Showcase Modal */}
            {showcaseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-2xl font-bold text-gray-900">Publish Showcase Content</h3>
                            <button
                                onClick={() => setShowcaseModal(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={showcaseData.title}
                                    onChange={(e) => setShowcaseData({ ...showcaseData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter showcase title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={showcaseData.description}
                                    onChange={(e) => setShowcaseData({ ...showcaseData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Describe the winning solution"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Innovation Highlights</label>
                                <textarea
                                    value={showcaseData.innovationHighlights}
                                    onChange={(e) => setShowcaseData({ ...showcaseData, innovationHighlights: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="What made this solution innovative?"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowcaseModal(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handlePublishShowcase(showcaseModal.id)}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                                >
                                    Publish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
