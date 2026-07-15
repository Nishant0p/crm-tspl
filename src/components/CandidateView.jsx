import React, { useMemo } from 'react';

export default function CandidateView({
  candidateSubView,
  setCandidateSubView,
  jobs,
  jobsLoading,
  jobsError,
  courses,
  selectedJobCategory,
  setSelectedJobCategory,
  handleJobApply,
  triggerCertificateDownload,
  showApplyModal,
  setShowApplyModal,
  applyFormData,
  setApplyFormData,
  handleApplySubmit,
  handleApplyClick,
  currentUser,
  API_BASE,
  showToast
}) {
  const [profileData, setProfileData] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [applicationsList, setApplicationsList] = React.useState([]);
  const [applicationsLoading, setApplicationsLoading] = React.useState(true);
  const [tickets, setTickets] = React.useState([]);
  const [ticketsLoading, setTicketsLoading] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [newTicketSubject, setNewTicketSubject] = React.useState('');
  const [newTicketMessage, setNewTicketMessage] = React.useState('');
  const [showCreateTicket, setShowCreateTicket] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');
  const [submittingTicket, setSubmittingTicket] = React.useState(false);
  const [claimCode, setClaimCode] = React.useState('');
  const [submittingClaim, setSubmittingClaim] = React.useState(false);
  const [claimError, setClaimError] = React.useState('');
  const [claimSuccess, setClaimSuccess] = React.useState('');
  const [activeVideoCourse, setActiveVideoCourse] = React.useState(null);

  const fetchProfileData = () => {
    if (currentUser) {
      fetch(`${API_BASE}/api/candidates/profile?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          setProfileData(data);
        })
        .catch(err => {
          console.error("Error fetching profile:", err);
        });
    }
  };

  const handleClaimReferral = async () => {
    if (!claimCode.trim()) return;
    setSubmittingClaim(true);
    setClaimError('');
    setClaimSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/candidates/claim-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          referralCode: claimCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim referral code');
      }
      setClaimSuccess(data.message || 'Referral code claimed successfully!');
      setClaimCode('');
      fetchProfileData();
      showToast('Referral code claimed successfully!', 'success');
    } catch (err) {
      setClaimError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleGenerateReferralCode = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/candidates/generate-referral-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate code');
      showToast(`Referral code generated: ${data.referralCode.code}`, 'success');
      fetchProfileData(); // reload profile
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  
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

  // Combined statistics count
  const appliedCount = useMemo(() => {
    if (applicationsList.length > 0) return applicationsList.length;
    return jobs.filter(j => j.applied).length;
  }, [jobs, applicationsList]);

  const completedBadgesCount = useMemo(() => courses.filter(c => c.completed).length, [courses]);

  // Fetch Profile Data
  React.useEffect(() => {
    if (currentUser) {
      setProfileLoading(true);
      fetch(`${API_BASE}/api/candidates/profile?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          setProfileData(data);
          setProfileLoading(false);
        })
        .catch(err => {
          console.error("Error fetching profile:", err);
          setProfileLoading(false);
        });
    }
  }, [currentUser, API_BASE]);

  // Fetch Applications Data (Real-time Polling)
  React.useEffect(() => {
    if (!currentUser || (candidateSubView !== 'applications' && candidateSubView !== 'home')) return;

    let isMounted = true;
    const fetchApps = () => {
      fetch(`${API_BASE}/api/candidates/applications?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (isMounted) {
            setApplicationsList(data || []);
            setApplicationsLoading(false);
          }
        })
        .catch(err => {
          console.error("Error fetching applications:", err);
          if (isMounted) {
            setApplicationsLoading(false);
          }
        });
    };

    fetchApps();
    const interval = setInterval(fetchApps, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser, candidateSubView, API_BASE]);

  // Fetch tickets on entering support subview
  React.useEffect(() => {
    if (currentUser && candidateSubView === 'support') {
      fetchTickets();
    }
  }, [currentUser, candidateSubView]);

  const fetchTickets = () => {
    if (!currentUser) return;
    setTicketsLoading(true);
    fetch(`${API_BASE}/api/candidates/tickets?email=${encodeURIComponent(currentUser.email)}`)
      .then(res => res.json())
      .then(data => {
        setTickets(data.tickets || []);
        setTicketsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching tickets:", err);
        setTicketsLoading(false);
      });
  };

  // Poll messages for selected ticket
  React.useEffect(() => {
    let interval;
    if (currentUser && candidateSubView === 'support' && selectedTicket) {
      const getMsgs = () => {
        fetch(`${API_BASE}/api/tickets/${selectedTicket.id}/messages?email=${encodeURIComponent(currentUser.email)}`)
          .then(res => res.json())
          .then(data => {
            setMessages(data.messages || []);
          })
          .catch(err => console.error("Error polling messages:", err));
      };
      getMsgs();
      interval = setInterval(getMsgs, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUser, candidateSubView, selectedTicket]);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || submittingTicket) return;
    setSubmittingTicket(true);
    fetch(`${API_BASE}/api/candidates/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        subject: newTicketSubject.trim(),
        message: newTicketMessage.trim()
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        showToast("Support ticket created!", "success");
        const subj = newTicketSubject.trim();
        setNewTicketSubject('');
        setNewTicketMessage('');
        setShowCreateTicket(false);
        fetchTickets();
        setSelectedTicket({ id: data.ticketId, subject: subj, status: 'open' });
      })
      .catch(err => {
        showToast(err.message, "error");
      })
      .finally(() => {
        setSubmittingTicket(false);
      });
  };

  const handleSendTicketReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    const text = replyText;
    setReplyText('');
    fetch(`${API_BASE}/api/tickets/${selectedTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        message: text,
        isAdmin: false
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setMessages(prev => [...prev, data.message]);
      })
      .catch(err => {
        showToast(err.message, "error");
      });
  };

  const handleDownloadOfferLetter = (appId) => {
    window.open(`${API_BASE}/api/candidates/offer-pdf?applicationId=${appId}`, '_blank');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setApplyFormData(prev => ({ ...prev, [name]: value }));
  };

  // Referral link building
  const referralLink = useMemo(() => {
    if (!profileData?.referral_code) return '';
    const loc = window.location;
    return `${loc.protocol}//${loc.host}/?ref=${profileData.referral_code}&source=link`;
  }, [profileData]);

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    showToast("Referral link copied to clipboard!", "success");
  };

  const stages = ['Sourced', 'Applied', 'Screening', 'Interview', 'Offered'];

  return (
    <div className="candidate-layout" style={{ animation: 'fadeIn 0.25s ease-out', padding: '20px' }}>
      
      {/* HOME VIEW */}
      {candidateSubView === 'home' && (
        <div className="candidate-subview" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '40px', background: 'linear-gradient(135deg, rgba(29,78,216,0.03) 0%, rgba(234,88,12,0.03) 100%)', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}></div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '800', marginBottom: '12px', color: '#1E3A8A' }}>Empowering Ground Careers across India</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '700px' }}>
              Welcome to the TSPL Candidate Hub. Your gateway to direct industry linkages, verified on-field skill certifications, and placement tracking registers across Bihar, Jharkhand, and Odisha.
            </p>
            <div className="candidate-home-actions" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className="btn-primary" onClick={() => setCandidateSubView('jobs')}>Explore Active Job Postings</button>
              <button className="btn-secondary" onClick={() => setCandidateSubView('profile')}>View Sourcing Referral Link</button>
            </div>
          </div>

          {/* Referral Code Quick View */}
          <div className="glass-panel" style={{ padding: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', background: '#EFF6FF', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' }}>
                🔗
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', margin: 0 }}>Candidate Sourcing Program</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Share your code to recruit candidates & track referral statistics</p>
              </div>
            </div>
            {profileData?.referral_code ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '8px', padding: '8px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#C2410C', fontWeight: 'bold', textTransform: 'uppercase' }}>Your Code</span>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#F97316' }}>{profileData.referral_code}</div>
                </div>
                <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '12px', height: 'fit-content' }} onClick={() => setCandidateSubView('profile')}>
                  Get Sourcing Link
                </button>
              </div>
            ) : (
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={handleGenerateReferralCode}>
                ✨ Generate My Code
              </button>
            )}
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', marginTop: '12px', color: '#1E293B' }}>Your Candidate Telemetry</h2>
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="metric-card glass-panel" style={{ padding: '20px', borderLeft: '4px solid #1E3A8A' }} onClick={() => setCandidateSubView('applications')}>
              <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Active Applications</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '8px' }}>{appliedCount} Submitted</div>
            </div>
            <div className="metric-card glass-panel" style={{ padding: '20px', borderLeft: '4px solid #F97316' }} onClick={() => setCandidateSubView('training')}>
              <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Skill Badges Earned</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', marginTop: '8px' }}>{completedBadgesCount} Verified</div>
            </div>
            <div className="metric-card glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10B981' }} onClick={() => setCandidateSubView('profile')}>
              <div style={{ color: '#64748B', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Linkage Registry</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981', marginTop: '8px' }}>Connected ✔</div>
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
            <div className="jobs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredJobs.map(job => (
                <div key={job.id} className="job-card glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                  <div className="job-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1E293B' }}>{job.title}</h3>
                      <div style={{ fontSize: '13px', color: '#1E3A8A', marginTop: '2px' }}>{job.company}</div>
                    </div>
                    <span className="status-badge status-sourced" style={{ fontSize: '10px', height: 'fit-content' }}>{job.type}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                    <span>📍 {job.location}</span>
                    <span style={{ color: '#F97316', fontWeight: 'bold' }}>💰 {job.salary}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(job.tags || []).map((t, idx) => <span key={idx} className="job-tag" style={{ background: '#F0F4F8', color: '#1E3A8A', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{t}</span>)}
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{job.description}</p>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                    {!job.applied ? (
                      <button className="btn-primary-arrow" onClick={() => handleApplyClick(job.id)}>
                        Apply Instantly
                        <span className="circle" style={{ marginLeft: '8px' }}>
                          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 14, height: 14 }}>
                            <path fill="#FFFFFF" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <button className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px' }} disabled>✓ Applied</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS VIEW */}
      {candidateSubView === 'applications' && (
        <div className="candidate-subview" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', color: '#1E293B' }}>My Active Applications</h2>
          
          {applicationsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="glass-panel" style={{ padding: '30px' }}>Loading submitted applications...</div>
            </div>
          ) : applicationsList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: '#FFFFFF' }}>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>You haven't submitted any job applications yet.</p>
              <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setCandidateSubView('jobs')}>Explore Job Openings</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {applicationsList.map(app => {
                const currentStageIdx = (() => {
                  const s = (app.status || 'Applied').toLowerCase();
                  if (s === 'sourced') return 0;
                  if (s === 'applied') return 1;
                  if (s === 'shortlisted' || s === 'screening') return 2;
                  if (s === 'interview scheduled' || s === 'interview') return 3;
                  if (s === 'selected' || s === 'offer' || s === 'offered' || s === 'joined' || s === 'rejected') return 4;
                  return 1; // Default fallback to Applied
                })();
                
                return (
                  <div key={app.id} className="glass-panel" style={{ padding: '24px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>{app.job_title}</h3>
                        <div style={{ fontSize: '14px', color: '#1E3A8A', marginTop: '2px' }}>TSPL Recruitment Hub</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied on {new Date(app.applied_date).toLocaleDateString()}</span>
                        <div style={{ marginTop: '4px' }}>
                          <span className={`status-badge status-${(app.status || 'sourced').toLowerCase()}`} style={{ fontSize: '11px' }}>
                            Stage: {app.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div style={{ margin: '30px 0 20px 0', padding: '0 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', width: '100%' }}>
                        <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '4px', background: '#E2E8F0', zIndex: 1 }}></div>
                        <div style={{ position: 'absolute', top: '15px', left: 0, width: `${(Math.max(0, currentStageIdx) / (stages.length - 1)) * 100}%`, height: '4px', background: 'linear-gradient(to right, #1E3A8A, #F97316)', zIndex: 2, transition: 'width 0.5s ease' }}></div>
                        
                        {stages.map((stageName, idx) => {
                          const isCompleted = idx < currentStageIdx;
                          const isActive = idx === currentStageIdx;
                          const isFuture = idx > currentStageIdx;
                          
                          let bg = '#FFFFFF';
                          let border = '2px solid #CBD5E1';
                          let iconColor = '#94A3B8';
                          if (isCompleted) {
                            bg = '#1E3A8A';
                            border = '2px solid #1E3A8A';
                            iconColor = '#FFFFFF';
                          } else if (isActive) {
                            bg = '#F97316';
                            border = '2px solid #F97316';
                            iconColor = '#FFFFFF';
                          }

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, position: 'relative', width: '60px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: bg, border: border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', color: iconColor, boxShadow: isActive ? '0 0 12px rgba(249,115,22,0.4)' : 'none' }}>
                                {isCompleted ? '✓' : idx + 1}
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: isActive || isCompleted ? 'bold' : 'normal', color: isActive ? '#F97316' : isCompleted ? '#1E3A8A' : '#64748B', marginTop: '8px', textAlign: 'center', display: 'block', width: '80px', position: 'absolute', top: '34px' }}>
                                {stageName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ height: '24px' }}></div> {/* spacer for absolute labels */}
                    </div>

                    {app.status === 'Offered' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginTop: '16px' }}>
                        <button className="btn-primary-arrow" style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)', border: 'none', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }} onClick={() => handleDownloadOfferLetter(app.id)}>
                          📥 Download Official Offer Letter (PDF)
                          <span className="circle" style={{ marginLeft: '8px' }}>
                            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 14, height: 14 }}>
                              <path fill="#FFFFFF" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TRAINING VIEW */}
      {candidateSubView === 'training' && (
        <div className="candidate-subview">
          <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {courses.map(c => (
              <div key={c.id} className="course-card glass-panel glass-panel-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="course-badge" style={{ background: c.completed ? 'rgba(16,185,129,0.1)' : 'rgba(30,58,138,0.05)', color: c.completed ? '#10B981' : '#1E3A8A', border: '1px solid rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                    {c.completed ? 'Verified Badge' : 'Active Registration'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.duration}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1E293B' }}>{c.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Instructor: {c.instructor}</p>
                </div>
                <div className="course-progress-wrap">
                  <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: '#475569' }}>Module Completion</span>
                    <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{c.progress}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div className="progress-bar-fill" style={{ background: 'linear-gradient(to right, #1E3A8A, #F97316)', width: `${c.progress}%`, height: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Syllabus Covered</div>
                  <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {c.syllabus.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {c.completed && (
                    <button className="btn-primary-arrow" style={{ width: '100%', justifyContent: 'center' }} onClick={() => triggerCertificateDownload(c)}>
                      📥 Download Verified Placement Receipt
                      <span className="circle" style={{ marginLeft: '8px' }}>
                        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 14, height: 14 }}>
                          <path fill="#FFFFFF" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                        </svg>
                      </span>
                    </button>
                  )}
                  <button 
                    className="btn-secondary" 
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: '#FFF7ED', 
                      border: '1px solid #FFEDD5', 
                      padding: '10px 16px', 
                      borderRadius: '8px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: '#C2410C', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }} 
                    onClick={() => setActiveVideoCourse(c)}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#FFEDD5'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#FFF7ED'; }}
                  >
                    ▶ Play Course Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY PROFILE VIEW */}
      {candidateSubView === 'profile' && (
        <div className="candidate-subview">
          {profileLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="glass-panel" style={{ padding: '30px' }}>Loading profile record...</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Profile card */}
              <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>Verified Registry Profile</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered on {new Date(profileData?.created_at).toLocaleDateString()}</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Candidate Name</label>
                    <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: '600', marginTop: '2px' }}>{profileData?.name}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Email Address</label>
                    <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: '600', marginTop: '2px' }}>{profileData?.email}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Registry Location</label>
                    <div style={{ fontSize: '14px', color: '#1E293B', marginTop: '2px' }}>
                      {profileData?.city_name}, {profileData?.district_name}, {profileData?.state_name}, {profileData?.country_name}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Academic Specialization</label>
                    <div style={{ fontSize: '14px', color: '#1E293B', marginTop: '2px', fontWeight: '600', color: '#1E3A8A' }}>
                      {profileData?.edu_level} — {profileData?.edu_branch} ({profileData?.edu_specialization})
                    </div>
                  </div>
                  {profileData?.referred_by ? (
                    <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '6px', color: '#15803D', fontSize: '12px', fontWeight: '500' }}>
                      Referred By Sponsor Code: {profileData?.referred_by}
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px', padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Were you referred by someone?</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="ENTER REFERRAL CODE" 
                          value={claimCode} 
                          onChange={e => setClaimCode(e.target.value.toUpperCase())}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                          }} 
                          disabled={submittingClaim}
                        />
                        <button 
                          onClick={handleClaimReferral}
                          disabled={submittingClaim || !claimCode.trim()}
                          style={{
                            background: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {submittingClaim ? 'Submitting...' : 'Claim'}
                        </button>
                      </div>
                      {claimError && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '6px', fontWeight: '500' }}>{claimError}</div>}
                      {claimSuccess && <div style={{ color: '#16A34A', fontSize: '11px', marginTop: '6px', fontWeight: '500' }}>{claimSuccess}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* Referral details and QR Code */}
              <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B' }}>Referral &amp; Sourcing Link</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Help others register at TSPL Group using your referral telemetry</p>
                </div>
                
                {!profileData?.referral_code ? (
                  <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔗</div>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>No Referral Code Yet</span>
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: '1.5', marginBottom: '14px' }}>
                      Generate your personal referral code to start sourcing candidates and tracking your referral network.
                    </p>
                    <button className="btn-primary" onClick={handleGenerateReferralCode} style={{ fontSize: '13px', padding: '10px 20px' }}>
                      ✨ Generate My Referral Code
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#C2410C', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Referral Code</span>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#F97316', marginTop: '4px', letterSpacing: '1px' }}>
                        {profileData?.referral_code}
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Copy Referral Link</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input type="text" className="form-input" style={{ flexGrow: 1, fontSize: '12px', background: '#F8FAFC' }} value={referralLink} readOnly />
                        <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={copyReferralLink}>Copy</button>
                      </div>
                    </div>

                    {/* Scanned QR Code SVG representation */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Scanned Telemetry QR Code</span>
                      <div style={{ background: '#FFFFFF', border: '2px solid #1E3A8A', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', display: 'inline-block' }}>
                        <svg width="120" height="120" viewBox="0 0 100 100" style={{ shapeRendering: 'crispEdges' }}>
                          {/* Outer boundary selectors */}
                          <path d="M 0,0 H 30 V 10 H 10 V 30 H 0 Z" fill="#1E3A8A" />
                          <path d="M 70,0 H 100 V 30 H 90 V 10 H 70 Z" fill="#1E3A8A" />
                          <path d="M 0,70 V 100 H 30 V 90 H 10 V 70 Z" fill="#1E3A8A" />
                          <path d="M 90,70 V 90 H 70 V 100 H 100 V 70 Z" fill="#1E3A8A" />
                          {/* Matrix simulation blocks */}
                          <rect x="20" y="20" width="20" height="20" fill="#F97316" />
                          <rect x="60" y="20" width="20" height="20" fill="#1E3A8A" />
                          <rect x="20" y="60" width="20" height="20" fill="#1E3A8A" />
                          <rect x="50" y="50" width="10" height="10" fill="#1E3A8A" />
                          <rect x="60" y="60" width="10" height="10" fill="#F97316" />
                          <rect x="70" y="50" width="10" height="10" fill="#1E3A8A" />
                          <rect x="40" y="70" width="10" height="20" fill="#F97316" />
                          <rect x="80" y="80" width="10" height="10" fill="#1E3A8A" />
                        </svg>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Scan with smartphone camera to load referral</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUPPORT HELPDESK CHAT / TICKETS */}
      {candidateSubView === 'support' && (
        <div className="candidate-subview" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: '#1E3A8A', margin: 0 }}>
                Support Helpdesk
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                View your active support tickets or open a new inquiry
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowCreateTicket(true)}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              ➕ Create New Ticket
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', minHeight: '500px', flexWrap: 'wrap' }}>
            {/* Tickets List */}
            <div className="glass-panel" style={{ flex: '1 1 300px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                Your Support Tickets
              </h3>
              {ticketsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                  <p style={{ fontSize: '13px', margin: 0 }}>You don't have any support tickets yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: selectedTicket?.id === ticket.id ? '#EFF6FF' : '#F8FAFC',
                        border: selectedTicket?.id === ticket.id ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                        borderLeft: `4px solid ${ticket.status === 'closed' ? '#94A3B8' : '#F97316'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{ticket.subject}</span>
                        <span style={{
                          fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px',
                          background: ticket.status === 'closed' ? '#E2E8F0' : '#FFF7ED',
                          color: ticket.status === 'closed' ? '#64748B' : '#64748B'
                        }}>
                          {ticket.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                        {ticket.admin_replies > 0 && (
                          <span style={{ color: '#1E3A8A', fontWeight: 'bold' }}>💬 {ticket.admin_replies} reply</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Messages Panel */}
            <div className="glass-panel" style={{ flex: '2 1 450px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '550px', overflow: 'hidden' }}>
              {selectedTicket ? (
                <>
                  <div style={{ background: '#F8FAFC', padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', margin: 0 }}>{selectedTicket.subject}</h4>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                        Ticket ID: #{selectedTicket.id} • Status: <span style={{ fontWeight: 'bold', color: selectedTicket.status === 'closed' ? '#64748B' : '#F97316' }}>{selectedTicket.status}</span>
                      </p>
                    </div>
                  </div>

                  {/* Messages box */}
                  <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#F8FAFC' }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                        Loading conversation...
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isFromAdmin = msg.sender_role && msg.sender_role !== 'candidate';
                        const bubbleBg = isFromAdmin ? '#1E3A8A' : '#FFFFFF';
                        const bubbleColor = isFromAdmin ? '#FFFFFF' : '#1E293B';
                        const align = isFromAdmin ? 'flex-start' : 'flex-end';
                        const borderRad = isFromAdmin ? '0px 12px 12px 12px' : '12px 12px 0px 12px';
                        const borderShadow = isFromAdmin ? 'none' : '0 2px 6px rgba(0,0,0,0.04)';
                        const borderLine = isFromAdmin ? 'none' : '1px solid #E2E8F0';

                        return (
                          <div key={idx} style={{ alignSelf: align, maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: align }}>
                            <div style={{ background: bubbleBg, color: bubbleColor, padding: '10px 14px', borderRadius: borderRad, fontSize: '13px', lineHeight: '1.4', border: borderLine, boxShadow: borderShadow }}>
                              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                                {msg.sender_name || (isFromAdmin ? 'Support Agent' : 'You')}
                              </div>
                              {msg.message}
                            </div>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Reply Input or Closed Message */}
                  {selectedTicket.status === 'open' ? (
                    <form onSubmit={handleSendTicketReply} style={{ display: 'flex', borderTop: '1px solid #E2E8F0', padding: '12px', gap: '10px', background: '#FFFFFF' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Type your reply message..." 
                        style={{ flexGrow: 1, borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px', flexShrink: 0, fontSize: '13px' }}>
                        Send
                      </button>
                    </form>
                  ) : (
                    <div style={{ padding: '14px', borderTop: '1px solid #E2E8F0', background: '#F1F5F9', textAlign: 'center', fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                      🔒 This ticket has been closed. If you still need help, please open a new support ticket.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', padding: '20px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                  <h4 style={{ color: '#475569', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>No Ticket Selected</h4>
                  <p style={{ fontSize: '12px', marginTop: '6px', maxWidth: '300px' }}>Select a ticket from the left panel to read and reply, or create a new support ticket.</p>
                </div>
              )}
            </div>
          </div>

          {/* CREATE TICKET MODAL */}
          {showCreateTicket && (
            <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-panel modal-content" style={{ maxWidth: '500px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'scaleUp 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>Create Support Ticket</h2>
                  <button onClick={() => setShowCreateTicket(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-dark)' }}>×</button>
                </div>

                <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Subject *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Issue with my Course Progress Certificate"
                      value={newTicketSubject}
                      onChange={e => setNewTicketSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Message *</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '120px', resize: 'vertical' }}
                      placeholder="Explain your problem or inquiry in detail..."
                      value={newTicketMessage}
                      onChange={e => setNewTicketMessage(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setShowCreateTicket(false)}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={submittingTicket}>
                      {submittingTicket ? 'Creating...' : 'Submit Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPLICATION FORM MODAL */}
      {showApplyModal && (
        <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '500px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1E293B' }}>Apply for Job</h2>
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
                  <span className="circle" style={{ marginLeft: '8px' }}>
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: 14, height: 14 }}>
                      <path fill="#FFFFFF" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM GLASSMORPHIC COURSE VIDEO MODAL */}
      {activeVideoCourse && (
        <div className="modal-overlay active" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel modal-content" style={{ 
            maxWidth: '800px', 
            width: '100%', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            animation: 'scaleUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#F26522', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Now Playing: Official Course Material
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#004B87', marginTop: '2px' }}>
                  {activeVideoCourse.title}
                </h2>
              </div>
              <button 
                onClick={() => setActiveVideoCourse(null)} 
                style={{ 
                  background: '#F1F5F9', 
                  border: 'none', 
                  fontSize: '20px', 
                  cursor: 'pointer', 
                  color: '#475569',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              position: 'relative', 
              width: '100%', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              background: '#0F172A',
              aspectRatio: '16/9',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
            }}>
              <video 
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
                controls 
                autoPlay 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px 0 4px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: '#10B981'
                }} />
                <span style={{ fontSize: '13px', color: '#475569' }}>
                  Instructor: <strong>{activeVideoCourse.instructor}</strong>
                </span>
              </div>
              <button 
                className="btn-primary" 
                style={{ background: '#004B87', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                onClick={() => setActiveVideoCourse(null)}
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}