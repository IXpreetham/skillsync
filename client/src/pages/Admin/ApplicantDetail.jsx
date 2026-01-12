import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';
import { ArrowLeft, User, Download, Check, X, AlertCircle } from 'lucide-react';

const ApplicantDetail = () => {
    const { appId } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchApp = async () => {
            try {
                // We need a route to get specific application by ID for Admin
                // Assuming GET /api/applications/job/:jobId returns list, but we need Single View
                // Let's assume we can fetch list and find it, or a new endpoint. 
                // Creating new endpoint is better but for speed let's use what we have? 
                // Actually I don't have a single application get endpoint for admin.
                // I will add it or just re-use /job/:jobId and filtering (Not efficient but fine for MVP)
                // Wait, I can't easily get jobId from appId without query.
                // I'll assume I have to add GET /api/applications/:id

                const token = localStorage.getItem('token');
                // Temporarily, let's try to fetch user's generic application detail if I implemented it?
                // I didn't. I implemented /my.
                // I will update the code to add GET /api/applications/:id later.
                // For now, I'll fetch it using a new endpoint I'll add.

                const res = await axios.get(`http://localhost:5000/api/applications/${appId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setApp(res.data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || err.message || "Failed to load application");
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [appId]);

    // ... (Wait I need to add that endpoint to backend first in this turn or previous)
    // I can add it to this file's thought process and do it in next tool calls

    if (loading) return <Layout><div className="p-12 text-center">Loading...</div></Layout>;
    if (error) return (
        <Layout>
            <div className="max-w-4xl mx-auto mt-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-center">
                        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                            <h3 className="text-red-800 font-bold">Error Loading Application</h3>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm font-medium text-red-700 hover:text-red-900 underline">
                        Go Back
                    </button>
                </div>
            </div>
        </Layout>
    );
    if (!app) return <Layout><div className="p-12 text-center">Application not found</div></Layout>;

    const analysis = JSON.parse(app.ai_analysis || '{}');
    const skills = JSON.parse(app.selected_skills || '[]');

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft size={18} className="mr-2" /> Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile */}
                    <div className="space-y-6">
                        <div className="card p-6 text-center">
                            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
                                <User size={40} className="text-slate-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{app.name}</h2>
                            <p className="text-slate-500 mb-4">Applied on {new Date(app.application_date).toLocaleDateString()}</p>

                            <div className="flex justify-center gap-2 mb-6">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${app.status === 'Shortlisted' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {app.status}
                                </span>
                            </div>

                            <a href={`http://localhost:5000/${app.resume_file_path}`} target="_blank" rel="noreferrer" className="btn btn-outline w-full flex justify-center items-center gap-2">
                                <Download size={16} /> Download Resume
                            </a>
                        </div>

                        <div className="card p-6">
                            <h3 className="font-bold mb-4">Contact Info</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-slate-500 block">Email</span> {app.email}</p>
                                <p><span className="text-slate-500 block">Phone</span> {app.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Analysis */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6 border-l-4 border-indigo-500">
                            <h2 className="text-xl font-bold mb-4">AI Evaluation Report</h2>

                            <div className="flex gap-4 mb-6">
                                <div className="text-center p-4 bg-slate-50 rounded-lg flex-1">
                                    <div className="text-3xl font-bold text-primary">{app.total_score}%</div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold">Overall Match</div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg flex-1">
                                    <div className="text-xl font-bold text-slate-700">{app.recommendation || analysis.recommendation}</div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold">Verdict</div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        JD Match Analysis (70%)
                                        <span className="text-sm font-normal text-slate-500">Score: {app.jd_score}</span>
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                                        {analysis.detailed_analysis?.jd_match?.reasoning || "Analysis not available"}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-amber-700">
                                        Hidden Criteria Check (20%)
                                        <span className="text-sm font-normal text-slate-500">Score: {app.hidden_score}</span>
                                    </h3>
                                    <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800 border border-amber-100">
                                        <p className="mb-2">{analysis.detailed_analysis?.hidden_criteria?.reasoning}</p>

                                        {analysis.detailed_analysis?.hidden_criteria?.criteria_met?.length > 0 && (
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                {analysis.detailed_analysis.hidden_criteria.criteria_met.map((c, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-amber-200">
                                                        <Check size={10} /> {c}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="font-bold mb-4">Skills Profile</h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-indigo-50 text-primary text-sm rounded-full font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ApplicantDetail;
