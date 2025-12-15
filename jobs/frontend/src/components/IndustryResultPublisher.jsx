import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getHackathonById, getHackathonResults, finalizeHackathonResults } from '../api/jobApi';
import CertificateTemplate, { downloadCertificate } from './CertificateGenerator';
import { Palette, Upload, Download, CheckCircle2, ArrowLeft, Sparkles, Image as ImageIcon, LayoutGrid, Clock, Award } from 'lucide-react';

const templateOptions = [
    { id: 'template1', name: 'Recognition Blue', description: 'Ribbon badge with deep blue curves' },
    { id: 'template2', name: 'Minimal Achievement', description: 'Clean blue gradient header' },
    { id: 'template3', name: 'Playful Participation', description: 'Teal playful shapes' },
    { id: 'template4', name: 'Bold Modern', description: 'Geometric blocks and accents' }
];

const defaultDesign = {
    templateStyle: 'template1',
    customMessage: '',
    logoUrl: '',
    platformLogoUrl: '',
    signerLeft: { name: 'Platform Director', title: 'Saarthix' },
    signerRight: { name: 'Event Organizer', title: 'Organizer' },
    signatureLeftUrl: '',
    signatureRightUrl: ''
};

const normalizeDesign = (incoming = {}) => {
    const merged = {
        ...defaultDesign,
        ...incoming,
        signerLeft: {
            ...defaultDesign.signerLeft,
            ...(incoming?.signerLeft || {})
        },
        signerRight: {
            ...defaultDesign.signerRight,
            ...(incoming?.signerRight || {})
        }
    };

    // Guard against empty templateStyle
    if (!merged.templateStyle) merged.templateStyle = defaultDesign.templateStyle;
    return merged;
};

export default function IndustryResultPublisher() {
    const { hackathonId } = useParams();
    const navigate = useNavigate();

    const [hackathon, setHackathon] = useState(null);
    const [results, setResults] = useState([]);
    const [design, setDesign] = useState(defaultDesign);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [savingPreview, setSavingPreview] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        loadData();
    }, [hackathonId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [hack, res] = await Promise.all([
                getHackathonById(hackathonId),
                getHackathonResults(hackathonId)
            ]);
            setHackathon(hack);
            if (Array.isArray(res)) {
                setResults(res);

                // If backend already has a template saved, prefer that as source of truth
                const firstWithTemplate = res.find(r => r.certificateTemplateId);
                if (firstWithTemplate && firstWithTemplate.certificateTemplateId) {
                    console.log('[Publisher] Loaded template from backend:', firstWithTemplate.certificateTemplateId);
                    setDesign(prev => ({
                        ...prev,
                        templateStyle: firstWithTemplate.certificateTemplateId
                    }));
                }
            } else {
                console.warn('Unexpected results payload', res);
                setResults([]);
                setLoadError('Could not load results. Please try again.');
            }

            const saved = localStorage.getItem(`certificate_design_${hackathonId}`);
            if (saved) {
                setDesign(prev => normalizeDesign({
                    ...prev,
                    ...JSON.parse(saved)
                }));
            }
        } catch (error) {
            console.error('Error loading publish screen:', error);
            toast.error('Failed to load publish screen');
            setLoadError('Failed to load publish screen');
        } finally {
            setLoading(false);
        }
    };

    const sampleApplication = useMemo(() => {
        if (results && results.length > 0) {
            const first = results[0];
            const participantName = first.asTeam ? first.teamName : (first.teamMembers?.[0]?.name || 'Participant');
            return {
                participantName,
                rank: first.finalRank,
                isTeam: first.asTeam,
                teamName: first.teamName,
            };
        }
        return {
            participantName: 'Sample Participant',
            rank: null,
            isTeam: false,
            teamName: ''
        };
    }, [results]);

    const certificatePreviewData = {
        participantName: sampleApplication.participantName,
        hackathonTitle: hackathon?.title || 'Hackathon',
        company: hackathon?.company || 'Organizer',
        rank: sampleApplication.rank,
        isTeam: sampleApplication.isTeam,
        teamName: sampleApplication.teamName,
        templateStyle: design.templateStyle || defaultDesign.templateStyle,
        logoUrl: design.logoUrl,
        platformLogoUrl: design.platformLogoUrl,
        customMessage: design.customMessage,
        signerLeft: design.signerLeft || defaultDesign.signerLeft,
        signerRight: {
            ...(design.signerRight || defaultDesign.signerRight),
            title: (design.signerRight?.title || hackathon?.company || defaultDesign.signerRight.title)
        },
        signatureLeftUrl: design.signatureLeftUrl,
        signatureRightUrl: design.signatureRightUrl
    };

    const readImage = (file, setter) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Images must be under 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            // We currently keep images as data URLs; they are later persisted via finalizeHackathonResults
            console.log('[Publisher] Loaded image as data URL');
            setter(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePublish = async () => {
        if (!window.confirm('Publish results and unlock certificates for applicants?')) return;
        try {
            setPublishing(true);
            localStorage.setItem(`certificate_design_${hackathonId}`, JSON.stringify(design));
            // Send selected template + visual customization to backend so applicants see the same design
            const payload = {
                certificateTemplateId: design.templateStyle,
                logoUrl: design.logoUrl || '',
                platformLogoUrl: design.platformLogoUrl || '',
                customMessage: design.customMessage || '',
                signatureLeftUrl: design.signatureLeftUrl || '',
                signatureRightUrl: design.signatureRightUrl || ''
            };
            console.log('[Publisher] Publishing with payload:', payload);
            await finalizeHackathonResults(hackathonId, payload);
            toast.success('Results published and certificates unlocked');
            navigate(`/industry/hackathon/${hackathonId}/results`);
        } catch (error) {
            console.error('Error publishing results:', error);
            toast.error('Failed to publish results');
        } finally {
            setPublishing(false);
        }
    };

    const handleDownloadSample = async () => {
        try {
            setSavingPreview(true);
            await downloadCertificate(certificatePreviewData);
            toast.success('Sample certificate downloaded');
        } catch (error) {
            console.error('Error downloading sample certificate:', error);
            toast.error('Could not download sample');
        } finally {
            setSavingPreview(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-md w-full text-center">
                    <p className="text-lg font-semibold text-gray-900 mb-2">Unable to load publish page</p>
                    <p className="text-sm text-gray-600 mb-4">{loadError}</p>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        Templates & publishing are only available to industry owners.
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">Result Publishing</p>
                            <h1 className="text-3xl font-bold text-gray-900">{hackathon?.title}</h1>
                            <p className="text-gray-600">Choose a certificate template and publish results.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => localStorage.setItem(`certificate_design_${hackathonId}`, JSON.stringify(design))}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Save Design
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2 disabled:opacity-60"
                            >
                                {publishing ? 'Publishing...' : 'Publish Results'}
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Live Preview - full width */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-gray-900">Live preview</h3>
                            </div>
                            <button
                                onClick={handleDownloadSample}
                                disabled={savingPreview}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
                            >
                                <Download className="w-4 h-4" />
                                {savingPreview ? 'Generating...' : 'Download sample'}
                            </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 overflow-hidden">
                            <div className="w-full" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                                <CertificateTemplate {...certificatePreviewData} />
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            Certificates will be available to applicants once you publish. Your template choice and placeholders are saved locally for reuse.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {/* Templates */}
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Palette className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">Select a template</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {templateOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setDesign(prev => ({ ...prev, templateStyle: opt.id }))}
                                            className={`border rounded-lg p-4 text-left transition-all ${design.templateStyle === opt.id ? 'border-purple-500 ring-2 ring-purple-200 bg-white' : 'border-gray-200 bg-white hover:border-purple-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{opt.name}</p>
                                                    <p className="text-sm text-gray-600">{opt.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Placeholders */}
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">Customize placeholders</h3>
                                </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Custom message (optional)</label>
                                        <textarea
                                            rows={3}
                                            value={design.customMessage}
                                            onChange={(e) => setDesign(prev => ({ ...prev, customMessage: e.target.value }))}
                                            placeholder="e.g. for outstanding performance and innovation..."
                                            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Company logo</label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400">
                                                <Upload className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">Upload</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], (img) => setDesign(prev => ({ ...prev, logoUrl: img })))} />
                                            </label>
                                            {design.logoUrl ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={design.logoUrl} alt="logo preview" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400">
                                                    <ImageIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Platform logo (default SX)</label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400">
                                                <Upload className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">Upload</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], (img) => setDesign(prev => ({ ...prev, platformLogoUrl: img })))} />
                                            </label>
                                            {design.platformLogoUrl ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={design.platformLogoUrl} alt="platform logo" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400">
                                                    SX
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Left signer</label>
                                        <input
                                            type="text"
                                            value={design.signerLeft.name}
                                            onChange={(e) => setDesign(prev => ({ ...prev, signerLeft: { ...prev.signerLeft, name: e.target.value } }))}
                                            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Name"
                                        />
                                        <input
                                            type="text"
                                            value={design.signerLeft.title}
                                            onChange={(e) => setDesign(prev => ({ ...prev, signerLeft: { ...prev.signerLeft, title: e.target.value } }))}
                                            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Right signer</label>
                                        <input
                                            type="text"
                                            value={design.signerRight.name}
                                            onChange={(e) => setDesign(prev => ({ ...prev, signerRight: { ...prev.signerRight, name: e.target.value } }))}
                                            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Name"
                                        />
                                        <input
                                            type="text"
                                            value={design.signerRight.title}
                                            onChange={(e) => setDesign(prev => ({ ...prev, signerRight: { ...prev.signerRight, title: e.target.value } }))}
                                            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Title"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Left signature image</label>
                                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400">
                                        <Upload className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm text-gray-700">Upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], (img) => setDesign(prev => ({ ...prev, signatureLeftUrl: img })))} />
                                    </label>
                                    {design.signatureLeftUrl && (
                                        <div className="w-32 h-16 border border-gray-200 rounded-lg overflow-hidden">
                                            <img src={design.signatureLeftUrl} alt="left signature" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Right signature image</label>
                                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400">
                                        <Upload className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm text-gray-700">Upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], (img) => setDesign(prev => ({ ...prev, signatureRightUrl: img })))} />
                                    </label>
                                    {design.signatureRightUrl && (
                                        <div className="w-32 h-16 border border-gray-200 rounded-lg overflow-hidden">
                                            <img src={design.signatureRightUrl} alt="right signature" className="w-full h-full object-contain" />
                                        </div>
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

