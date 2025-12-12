import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathonById, getHackathonApplications, reviewHackathonPhase } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, Search, Filter, ChevronRight, CheckCircle, XCircle, Clock, FileText, Download } from 'lucide-react';

export default function IndustryHackathonDashboard() {
    const { hackathonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [hackathon, setHackathon] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null); // For modal/detail view

    // Review State
    const [reviewScore, setReviewScore] = useState('');
    const [reviewRemarks, setReviewRemarks] = useState('');
    const [reviewAction, setReviewAction] = useState('ACCEPTED'); // ACCEPTED or REJECTED
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        loadData();
    }, [hackathonId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [hackData, appsData] = await Promise.all([
                getHackathonById(hackathonId),
                getHackathonApplications(hackathonId)
            ]);
            setHackathon(hackData);
            setApplications(appsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (phaseId) => {
        if (!selectedApp) return;

        try {
            setSubmittingReview(true);
            const reviewData = {
                status: reviewAction,
                score: reviewScore ? parseInt(reviewScore) : 0,
                remarks: reviewRemarks
            };

            await reviewHackathonPhase(selectedApp.id, phaseId, reviewData);

            toast.success(`Submission ${reviewAction.toLowerCase()} successfully`);

            // Update local state
            const updatedApps = applications.map(app => {
                if (app.id === selectedApp.id) {
                    const updatedSubmissions = { ...app.phaseSubmissions };
                    updatedSubmissions[phaseId] = {
                        ...updatedSubmissions[phaseId],
                        ...reviewData
                    };
                    // Also update overall status if rejected
                    const newStatus = reviewAction === 'REJECTED' ? 'REJECTED' : app.status;

                    const updatedApp = { ...app, phaseSubmissions: updatedSubmissions, status: newStatus };
                    setSelectedApp(updatedApp); // Update selected view
                    return updatedApp;
                }
                return app;
            });

            setApplications(updatedApps);
            setReviewScore('');
            setReviewRemarks('');

        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const downloadFile = (base64, fileName) => {
        const link = document.createElement("a");
        link.href = `data:application/octet-stream;base64,${base64}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!hackathon) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{hackathon.title} - Dashboard</h1>
                        <p className="text-gray-500">Manage applications and reviews</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/industry/hackathon/${hackathonId}/results`)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            View Results
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate('/manage-hackathons')} className="text-purple-600 hover:underline">
                            Back to Hackathons
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Applications List (Left Col) */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-200px)] flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="font-bold text-gray-700 flex items-center gap-2">
                                <Users className="w-5 h-5" /> Applicants ({applications.length})
                            </h2>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {applications.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No applications yet.</p>
                            ) : (
                                applications.map(app => (
                                    <div
                                        key={app.id}
                                        onClick={() => setSelectedApp(app)}
                                        className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedApp?.id === app.id
                                            ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-200'
                                            : 'bg-white border-gray-200 hover:border-purple-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {app.asTeam ? app.teamName : 'Individual Applicant'}
                                                </h3>
                                                <p className="text-xs text-gray-500">ID: {app.id.substring(0, 8)}...</p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${app.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                            <span>Phase: {app.currentPhaseId ? hackathon.phases.find(p => p.id === app.currentPhaseId)?.name || 'Started' : 'Started'}</span>
                                            <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detail View (Right Col) */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-200px)] overflow-y-auto">
                        {selectedApp ? (
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {selectedApp.asTeam ? selectedApp.teamName : 'Individual Applicant'}
                                        </h2>
                                        <p className="text-sm text-gray-500">Applicant ID: {selectedApp.applicantId}</p>
                                        {selectedApp.asTeam && (
                                            <p className="text-sm text-gray-500">Team Size: {selectedApp.teamSize}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedApp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                            selectedApp.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {selectedApp.status}
                                        </span>
                                    </div>
                                </div>

                                {selectedApp.asTeam && selectedApp.teamMembers && selectedApp.teamMembers.length > 0 && (
                                    <div className="mb-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Team Members
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedApp.teamMembers.map((member, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-semibold text-gray-900">{member.name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === 'Team Lead' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {member.role}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 space-y-0.5">
                                                        <p>{member.email}</p>
                                                        <p>{member.phone}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {hackathon.phases.map((phase, index) => {
                                        const submission = selectedApp.phaseSubmissions?.[phase.id];
                                        const isPending = submission?.status === 'PENDING';

                                        return (
                                            <div key={phase.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                                    <h3 className="font-bold text-gray-800">Phase {index + 1}: {phase.name}</h3>
                                                    {submission && (
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${submission.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                                            submission.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {submission.status}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    {!submission ? (
                                                        <p className="text-gray-400 italic text-sm">No submission yet.</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {/* Submission Content */}
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                {submission.solutionStatement && (
                                                                    <div className="mb-3">
                                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Solution Statement</p>
                                                                        <p className="text-gray-800 text-sm">{submission.solutionStatement}</p>
                                                                    </div>
                                                                )}
                                                                {submission.fileName && (
                                                                    <div>
                                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Attached File</p>
                                                                        <button
                                                                            onClick={() => downloadFile(submission.fileUrl, submission.fileName)}
                                                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                        >
                                                                            <FileText className="w-4 h-4" /> {submission.fileName} <Download className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <p className="text-xs text-gray-400 mt-2 text-right">
                                                                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                                                </p>
                                                            </div>

                                                            {/* Review Section */}
                                                            {isPending ? (
                                                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 animate-fadeIn">
                                                                    <h4 className="font-bold text-purple-900 mb-3">Review Submission</h4>

                                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                                        <div>
                                                                            <label className="block text-xs font-bold text-gray-600 mb-1">Score (0-100)</label>
                                                                            <input
                                                                                type="number"
                                                                                min="0" max="100"
                                                                                value={reviewScore}
                                                                                onChange={(e) => setReviewScore(e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-purple-500"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-bold text-gray-600 mb-1">Decision</label>
                                                                            <select
                                                                                value={reviewAction}
                                                                                onChange={(e) => setReviewAction(e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-purple-500"
                                                                            >
                                                                                <option value="ACCEPTED">Accept</option>
                                                                                <option value="REJECTED">Reject</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mb-3">
                                                                        <label className="block text-xs font-bold text-gray-600 mb-1">Remarks</label>
                                                                        <textarea
                                                                            rows="2"
                                                                            value={reviewRemarks}
                                                                            onChange={(e) => setReviewRemarks(e.target.value)}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-purple-500"
                                                                            placeholder="Optional remarks..."
                                                                        ></textarea>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => handleReviewSubmit(phase.id)}
                                                                        disabled={submittingReview}
                                                                        className={`w-full py-2 rounded font-bold text-white transition-colors ${reviewAction === 'ACCEPTED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                                                            }`}
                                                                    >
                                                                        {submittingReview ? 'Submitting...' : `Submit ${reviewAction === 'ACCEPTED' ? 'Acceptance' : 'Rejection'}`}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="border-t border-gray-200 pt-3">
                                                                    <h4 className="text-sm font-bold text-gray-700 mb-2">Review Details</h4>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <span className="text-gray-500">Score:</span>
                                                                            <span className="ml-2 font-bold">{submission.score || 'N/A'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-500">Decision:</span>
                                                                            <span className={`ml-2 font-bold ${submission.status === 'ACCEPTED' ? 'text-green-600' : 'text-red-600'
                                                                                }`}>{submission.status}</span>
                                                                        </div>
                                                                    </div>
                                                                    {submission.remarks && (
                                                                        <div className="mt-2 text-sm">
                                                                            <span className="text-gray-500">Remarks:</span>
                                                                            <p className="text-gray-800 italic">"{submission.remarks}"</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Users className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select an applicant to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
