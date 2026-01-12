import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Building, CheckCircle } from 'lucide-react';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/jobs/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setJob(res.data);
            } catch (error) {
                console.error('Error fetching job:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    if (loading) return <Layout><div className="flex justify-center p-12">Loading...</div></Layout>;
    if (!job) return <Layout><div className="text-center p-12">Job not found</div></Layout>;

    const { visible_jd } = job;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft size={18} className="mr-2" /> Back to Jobs
                </button>

                <div className="card overflow-hidden mb-6">
                    <div className="p-8 border-b border-slate-100 bg-white">
                        <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
                                <div className="text-lg text-slate-600 font-medium flex items-center gap-2">
                                    <Building size={20} className="text-slate-400" />
                                    {job.company_name}
                                </div>
                            </div>
                            <Link to={`/jobs/${id}/apply`} className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-indigo-200">
                                Apply Now
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
                            <div>
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <MapPin size={12} /> Location
                                </div>
                                <div className="font-semibold text-slate-900">{visible_jd.location || 'Remote'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <Briefcase size={12} /> Job Type
                                </div>
                                <div className="font-semibold text-slate-900">{visible_jd.type || 'Full-time'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <DollarSign size={12} /> Salary
                                </div>
                                <div className="font-semibold text-slate-900">{visible_jd.salary || 'Not disclosed'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <Calendar size={12} /> Posted
                                </div>
                                <div className="font-semibold text-slate-900">{new Date(job.posted_date).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">About the Role</h2>
                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                        </div>

                        <div className="card p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Requirements</h2>
                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed mb-6">{job.requirements}</p>

                            {visible_jd.responsibilities && visible_jd.responsibilities.length > 0 && visible_jd.responsibilities[0] !== '' && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-slate-900 mb-3">Key Responsibilities</h3>
                                    <ul className="space-y-2">
                                        {visible_jd.responsibilities.map((r, i) => (
                                            <li key={i} className="flex items-start gap-2 text-slate-600">
                                                <CheckCircle size={18} className="text-primary mt-0.5 shrink-0" />
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-6 sticky top-24">
                            <h3 className="font-bold text-slate-900 mb-4">Job Overview</h3>
                            {/* Summary info again, maybe more details */}
                            <div className="text-sm text-slate-500">
                                This job opening is managed by {job.company_name}.
                                Click Apply Now to start the AI-powered application process.
                            </div>
                            <Link to={`/jobs/${id}/apply`} className="btn btn-primary w-full mt-6">
                                Apply Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default JobDetails;
