import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';
import { ArrowLeft, Save, Eye, EyeOff, Loader } from 'lucide-react';

const EditJob = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        location: '',
        type: 'Full-time',
        experience: '0-2',
        salary: ''
    });

    const [visibleJD, setVisibleJD] = useState({
        responsibilities: [''],
        qualifications: [''],
        skills: ['']
    });

    const [hiddenReqs, setHiddenReqs] = useState({
        min_experience_years: 0,
        must_have_skills: [''],
        preferred_companies: [''],
        education_degree: '',
        cultural_fit_keywords: ['']
    });

    useEffect(() => {
        fetchJob();
    }, [id]);

    const fetchJob = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const job = res.data;
            const jd = job.visible_jd;
            const hidden = job.hidden_requirements;

            setFormData({
                title: job.title,
                description: job.description,
                requirements: job.requirements || '',
                location: jd.location || '',
                type: jd.type || 'Full-time',
                experience: jd.experience_range || '0-2',
                salary: jd.salary || ''
            });

            setVisibleJD({
                responsibilities: jd.responsibilities || [''],
                qualifications: jd.qualifications || [''],
                skills: jd.skills || ['']
            });

            if (hidden) {
                setHiddenReqs({
                    min_experience_years: hidden.min_experience_years || 0,
                    must_have_skills: hidden.must_have_skills || [''],
                    preferred_companies: hidden.preferred_companies || [''],
                    education_degree: hidden.education_degree || '',
                    cultural_fit_keywords: hidden.cultural_fit_keywords || ['']
                });
            }
        } catch (error) {
            console.error('Error fetching job:', error);
            alert('Failed to load job details');
            navigate('/company/dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Helpers to handle dynamic lists
    const handleListChange = (setter, state, index, value) => {
        const newState = [...state];
        newState[index] = value;
        setter(newState);
    };

    const addListItem = (setter, state) => setter([...state, '']);
    const removeListItem = (setter, state, index) => setter(state.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            title: formData.title,
            description: formData.description,
            requirements: formData.requirements,
            visible_jd: {
                ...visibleJD,
                location: formData.location,
                type: formData.type,
                salary: formData.salary,
                experience_range: formData.experience
            },
            hidden_requirements: hiddenReqs
        };

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/jobs/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Job updated successfully');
            navigate('/company/dashboard');
        } catch (error) {
            console.error('Error updating job:', error);
            alert('Failed to update job');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="p-12 text-center">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/company/dashboard')} className="flex items-center text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Edit Job</h1>
                    <button onClick={handleSubmit} disabled={saving} className="btn btn-primary px-6 flex items-center gap-2">
                        {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Update Job'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Public Section */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Eye className="text-emerald-500" size={20} />
                                Public Job Posting
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label>Job Title <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Senior React Developer"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label>Job Type</label>
                                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option>Full-time</option>
                                            <option>Part-time</option>
                                            <option>Contract</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Location</label>
                                        <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Remote, NY" />
                                    </div>
                                </div>

                                <div>
                                    <label>Job Description & Overview</label>
                                    <textarea
                                        rows={6}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detailed overview of the role..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Lists for JD */}
                        <div className="card p-6">
                            <h3 className="font-semibold mb-3">Key Responsibilities</h3>
                            {visibleJD.responsibilities.map((item, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input
                                        value={item}
                                        onChange={e => handleListChange(val => setVisibleJD({ ...visibleJD, responsibilities: val }), visibleJD.responsibilities, i, e.target.value)}
                                        placeholder="Add responsibility..."
                                    />
                                    {i > 0 && <button type="button" onClick={() => removeListItem(val => setVisibleJD({ ...visibleJD, responsibilities: val }), visibleJD.responsibilities, i)} className="text-red-500 hover:text-red-700">×</button>}
                                </div>
                            ))}
                            <button type="button" onClick={() => addListItem(val => setVisibleJD({ ...visibleJD, responsibilities: val }), visibleJD.responsibilities)} className="text-xs text-primary font-semibold hover:underline">+ Add Another</button>
                        </div>

                        <div className="card p-6">
                            <h3 className="font-semibold mb-3">Required Skills</h3>
                            {visibleJD.skills.map((item, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input
                                        value={item}
                                        onChange={e => handleListChange(val => setVisibleJD({ ...visibleJD, skills: val }), visibleJD.skills, i, e.target.value)}
                                        placeholder="e.g. React, Node.js..."
                                    />
                                    {i > 0 && <button type="button" onClick={() => removeListItem(val => setVisibleJD({ ...visibleJD, skills: val }), visibleJD.skills, i)} className="text-red-500 hover:text-red-700">×</button>}
                                </div>
                            ))}
                            <button type="button" onClick={() => addListItem(val => setVisibleJD({ ...visibleJD, skills: val }), visibleJD.skills)} className="text-xs text-primary font-semibold hover:underline">+ Add Another</button>
                        </div>
                    </div>

                    {/* Hidden Section */}
                    <div className="space-y-6">
                        <div className="card p-6 bg-slate-50 border-slate-200">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
                                <EyeOff className="text-amber-500" size={20} />
                                Internal Criteria
                            </h2>
                            <p className="text-xs text-slate-500 mb-4">
                                These requirements are NOT visible to applicants but are used by the AI to score candidates.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label>Minimum Experience (Years)</label>
                                    <input
                                        type="number"
                                        value={hiddenReqs.min_experience_years}
                                        onChange={e => setHiddenReqs({ ...hiddenReqs, min_experience_years: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label>Must-Have Technical Skills</label>
                                    <textarea
                                        rows={3}
                                        value={hiddenReqs.must_have_skills.join(', ')}
                                        onChange={e => setHiddenReqs({ ...hiddenReqs, must_have_skills: e.target.value.split(',').map(s => s.trim()) })}
                                        placeholder="Comma separated (e.g. React, Node.js)"
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default EditJob;
