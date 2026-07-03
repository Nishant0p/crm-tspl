import React, { useMemo } from 'react';

export default function CandidateView({
  candidateSubView,
  setCandidateSubView,
  jobs,
  jobsLoading,
  jobsError,
  courses,
  currentUser,
  selectedJobCategory,
  setSelectedJobCategory,
  handleJobApply,
  triggerCertificateDownload,
  showApplyModal,
  setShowApplyModal,
  applyFormData,
  setApplyFormData,
  handleApplySubmit,
  handleApplyClick
}) {
  
  // Memoized Job Search Filtering
  const filteredJobs = useMemo(() => {
    const search = selectedJobCategory.toLowerCase().trim();
    if (!search) return jobs;
    return jobs.filter(job => {
      return (
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search) ||
        (job.tags && job.tags.some(t => t.toLowerCase().includes(search)))
      );
    });
  }, [jobs, selectedJobCategory]);

  // Caching analytics metrics counts
  const appliedCount = useMemo(() => jobs.filter(j => j.applied).length, [jobs]);
  const completedBadgesCount = useMemo(() => courses.filter(c => c.completed).length, [courses]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setApplyFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="candidate-layout" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* HOME VIEW */}
      {candidateSubView === 'home' && (
        <div className="candidate-subview" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '40px', background: 'linear-gradient(135deg, rgba(29,78,216,0.03) 0%, rgba(234,88,12,0.03) 100%)', border: '1px solid var(--glass-border)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>Empowering Ground Careers across India</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '700px' }}>
              Welcome to the TSPL Candidate Hub. Your gateway to direct industry linkages, verified on-field skill certifications, and placement tracking registers across Bihar, Jharkhand, and Odisha.
            </p>
            <div className="candidate-home-actions" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className="btn-primary" onClick={() => setCandidateSubView('jobs')}>Explore Active Job Postings</button>
              <button className="btn-secondary" onClick={() => setCandidateSubView('training')}>My Training Registers</button>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', marginTop: '12px', color: 'var(--text-main)' }}>Your Candidate Telemetry</h2>
          <div className="metrics-grid">
            <div className="metric-card glass-panel" style={{ '--accent-color': 'var(--primary-blue)' }}>
              <div className="metric-title">Active Applications</div>
              <div className="metric-value">{appliedCount} Submitted</div>
            </div>
            <div className="metric-card glass-panel" style={{ '--accent-color': 'var(--primary-orange)' }}>
              <div className="metric-title">Skill Badges Earned</div>
              <div className="metric-value">{completedBadgesCount} Verified</div>
            </div>
            <div className="metric-card glass-panel" style={{ '--accent-color': 'var(--success)' }}>
              <div className="metric-title">Linkage Registry</div>
              <div className="metric-value">Connected</div>
            </div>
          </div>
        </div>
      )}

      {/* JOBS VIEW */}
      {candidateSubView === 'jobs' && (
        <div className="candidate-subview">
          <div className="portal-controls" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '400px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search title, company, skills..." 
                style={{ width: '100%' }}
                value={selectedJobCategory}
                onChange={e => setSelectedJobCategory(e.target.value)}
              />
            </div>
          </div>

          {jobsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="glass-panel" style={{ padding: '30px' }}>Loading job openings...</div>
            </div>
          ) : jobsError ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-danger)' }}>
              <div className="glass-panel" style={{ padding: '30px' }}>
                <p>⚠️ {jobsError}</p>
                <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-muted)' }}>Showing locally available positions.</p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="glass-panel" style={{ padding: '30px' }}>
                <p>No job openings match your search.</p>
              </div>
            </div>
          ) : (
            <div className="jobs-grid">
              {filteredJobs.map(job => (
                <div key={job.id} className="job-card glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                  <div className="job-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>{job.title}</h3>
                      <div style={{ fontSize: '13px', color: 'var(--primary-blue)', marginTop: '2px' }}>{job.company}</div>
                    </div>
                    <span className="status-badge status-sourced" style={{ fontSize: '10px' }}>{job.type}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                    <span>📍 {job.location}</span>
                    <span style={{ color: 'var(--primary-orange)', fontWeight: 'bold' }}>💰 {job.salary}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(job.tags || []).map((t, idx) => <span key={idx} className="job-tag">{t}</span>)}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-dark)', lineHeight: '1.4' }}>{job.description}</p>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    {!job.applied ? (
                      <button className="btn-primary-arrow" onClick={() => handleApplyClick(job.id)}>
                        Apply Instantly
                        <span className="circle">
                          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none">
                            <defs><linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient"><stop stopColor="#FFFFFF" stopOpacity="1" offset="0%" /><stop stopColor="#AAAAAA" stopOpacity="1" offset="100%" /></linearGradient></defs>
                            <path fill="url(#iconGradient)" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <button className="btn-secondary" disabled>✓ Applied</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRAINING VIEW */}
      {candidateSubView === 'training' && (
        <div className="candidate-subview">
          <div className="courses-grid">
            {courses.map(c => (
              <div key={c.id} className="course-card glass-panel glass-panel-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="course-badge" style={{ background: c.completed ? 'var(--success-dim)' : 'var(--primary-blue-dim)', color: c.completed ? 'var(--success)' : 'var(--primary-blue)', border: '1px solid rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                    {c.completed ? 'Verified Badge' : 'Active Registration'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-dark)' }}>{c.duration}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>{c.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Instructor: {c.instructor}</p>
                </div>
                <div className="course-progress-wrap">
                  <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Module Completion</span>
                    <span>{c.progress}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ background: 'var(--bg-secondary)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-fill" style={{ background: 'linear-gradient(to right, var(--primary-blue), var(--primary-orange))', width: `${c.progress}%`, height: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>Syllabus Covered</div>
                  <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {c.syllabus.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
                {c.completed ? (
                  <button className="btn-primary-arrow" style={{ width: '100%', justifyContent: 'center' }} onClick={() => triggerCertificateDownload(c)}>
                    📥 Download Verified Placement Receipt
                    <span className="circle">
                      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none">
                        <defs><linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient"><stop stopColor="#FFFFFF" stopOpacity="1" offset="0%" /><stop stopColor="#AAAAAA" stopOpacity="1" offset="100%" /></linearGradient></defs>
                        <path fill="url(#iconGradient)" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <button className="btn-secondary" style={{ width: '100%', cursor: 'not-allowed', color: 'var(--text-dark)' }} disabled>
                    Course In Progress
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPLICATION FORM MODAL */}
      {showApplyModal && (
        <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '500px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)' }}>Apply for Job</h2>
              <button onClick={() => setShowApplyModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-dark)' }}>×</button>
            </div>

            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Please fill in your details to apply for this position.
              </p>
              <div className="config-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" className="form-input" placeholder="Your full name" value={applyFormData.name} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" className="form-input" placeholder="you@example.com" value={applyFormData.email} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" name="phone" className="form-input" placeholder="9876543210" value={applyFormData.phone} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Cover Letter (optional)</label>
                  <textarea name="coverLetter" className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Why are you a good fit for this role?" value={applyFormData.coverLetter} onChange={handleFormChange} />
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-arrow">
                  Submit Application
                  <span className="circle">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 24, height: 24 }}>
                      <path fill="#FFFFFF" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}