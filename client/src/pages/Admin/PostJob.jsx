import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, EyeOff, Eye } from 'lucide-react';

const PostJob = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '', // In a real app, use a Rich Text Editor
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
        setLoading(true);

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
            await axios.post('http://localhost:5000/api/jobs', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/company/dashboard');
        } catch (error) {
            console.error('Error posting job:', error);
            alert('Failed to post job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-900 mb-6">
                    <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Post a New Job</h1>
                    <button onClick={handleSubmit} disabled={loading} className="btn btn-primary px-6">
                        <Save size={18} /> {loading ? 'Publishing...' : 'Publish Job'}
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

                                <div>
                                    <label>Preferred Education</label>
                                    <input
                                        value={hiddenReqs.education_degree}
                                        onChange={e => setHiddenReqs({ ...hiddenReqs, education_degree: e.target.value })}
                                        placeholder="e.g. Masters in CS"
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

export default PostJob;
