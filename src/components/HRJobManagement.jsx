// components/HRJobManagement.jsx
import React, { useState, useEffect } from 'react';

const ArrowSVG = () => (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 24, height: 24 }}>
        <defs>
            <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient">
                <stop style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} offset="0%" />
                <stop style={{ stopColor: '#AAAAAA', stopOpacity: 1 }} offset="100%" />
            </linearGradient>
        </defs>
        <path fill="url(#iconGradient)" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
    </svg>
);

export default function HRJobManagement({
    jobs,
    candidates,
    applications,
    updateApplicationStatus,
    generateOffer,
    showToast
}) {
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [jobApplications, setJobApplications] = useState([]);

    // Compute match score: number of matching skills between candidate and job tags
    const computeMatchScore = (candidate, job) => {
        if (!candidate?.skills || !job?.tags) return 0;
        const skills = Array.isArray(candidate.skills)
            ? candidate.skills.map(s => s.toLowerCase())
            : typeof candidate.skills === 'string'
                ? candidate.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
                : [];
        const tags = Array.isArray(job.tags)
            ? job.tags.map(t => t.toLowerCase())
            : typeof job.tags === 'string'
                ? job.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
                : [];
        const matches = skills.filter(s => tags.some(t => t.includes(s) || s.includes(t)));
        const score = Math.round((matches.length / Math.max(skills.length, 1)) * 100);
        return Math.min(score, 100);
    };

    useEffect(() => {
        if (selectedJobId !== null && selectedJobId !== undefined) {
            const apps = applications.filter(app => String(app.jobId) === String(selectedJobId));
            const enriched = apps.map(app => {
                const candidate = candidates.find(c => String(c.id) === String(app.candidateId));
                const job = jobs.find(j => String(j.id) === String(selectedJobId));
                return {
                    ...app,
                    candidate,
                    matchScore: candidate && job ? computeMatchScore(candidate, job) : 0,
                };
            });
            // Sort by match score descending
            enriched.sort((a, b) => b.matchScore - a.matchScore);
            setJobApplications(enriched);
        } else {
            setJobApplications([]);
        }
    }, [selectedJobId, applications, candidates, jobs]);

    const handleStatusChange = (appId, newStatus) => {
        updateApplicationStatus(appId, newStatus);
    };

    const selectedJob = jobs.find(j => String(j.id) === String(selectedJobId));

    return (
        <div className="hr-job-management" style={{ display: 'flex', gap: '24px', height: '100%', minHeight: '450px' }}>
            {/* Left: Job List */}
            <div className="glass-panel" style={{ flex: '0 0 280px', padding: '16px', overflowY: 'auto', maxHeight: '550px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>📋 Job Openings</h4>
                {jobs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No jobs available</p>
                ) : (
                    jobs.map(job => {
                        const isActive = selectedJobId !== null && selectedJobId !== undefined && String(selectedJobId) === String(job.id);
                        return (
                            <div
                                key={job.id}
                                onClick={() => setSelectedJobId(job.id)}
                                className={`job-list-item ${isActive ? 'active' : ''}`}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: isActive ? 'var(--primary-orange-dim)' : 'transparent',
                                    marginBottom: '6px',
                                    transition: 'background 0.2s',
                                    borderLeft: isActive ? '3px solid var(--primary-orange)' : '3px solid transparent',
                                }}
                            >
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{job.title}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.company} – {job.location}</div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Right: Applicants Table */}
            <div className="glass-panel" style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                {selectedJob ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{selectedJob.title}</h3>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{jobApplications.length} applicants</span>
                        </div>
                        {jobApplications.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No applications yet for this job.</p>
                        ) : (
                            <div className="high-density-table-wrap" style={{ overflowX: 'auto' }}>
                                <table className="hd-table">
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Match Score</th>
                                            <th>Current Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobApplications.map(app => (
                                            <tr key={app.id}>
                                                <td>
                                                    <div style={{ fontWeight: '600' }}>{app.candidate?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.candidate?.email || ''}</div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        background: app.matchScore >= 70 ? 'var(--success-dim)' : (app.matchScore >= 40 ? 'var(--warning-dim)' : '#f1f5f9'),
                                                        color: app.matchScore >= 70 ? 'var(--success)' : (app.matchScore >= 40 ? 'var(--warning)' : 'var(--text-muted)'),
                                                        padding: '2px 12px',
                                                        borderRadius: '12px',
                                                        fontWeight: 'bold',
                                                        fontSize: '13px',
                                                    }}>
                                                        {app.matchScore}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge status-${(app.status || 'Applied').toLowerCase()}`}>
                                                        {app.status || 'Applied'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <select
                                                            className="select-filter"
                                                            style={{ padding: '4px 8px', fontSize: '12px', width: '140px', minHeight: '32px' }}
                                                            value={app.status || 'Applied'}
                                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                        >
                                                            <option value="Applied">Applied</option>
                                                            <option value="Shortlisted">Shortlisted</option>
                                                            <option value="Interview Scheduled">Interview Scheduled</option>
                                                            <option value="Selected">Selected</option>
                                                            <option value="Offer">Offer</option>
                                                            <option value="Joined">Joined</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                        {app.status === 'Selected' && (
                                                            <button
                                                                className="btn-primary-arrow"
                                                                style={{ padding: '4px 12px', fontSize: '12px', minHeight: '32px' }}
                                                                onClick={() => generateOffer(app.id)}
                                                            >
                                                                📄 Offer PDF
                                                                <span className="circle" style={{ width: 24, height: 24 }}><ArrowSVG /></span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>👈</div>
                        <p style={{ fontSize: '16px' }}>Select a job from the left to view applicants.</p>
                    </div>
                )}
            </div>
        </div>
    );
}