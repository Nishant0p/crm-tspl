import React, { useState, useEffect } from 'react';
import AdminChatView from './AdminChatView';
import { generateCertificateImage } from '../utils/certificateGenerator';

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

export default function SuperAdminView({
  adminActiveTab,
  setAdminActiveTab,
  candidates,
  jobs,
  colleges,
  staff,
  fieldAgents,
  // Candidate Form
  newCandName, setNewCandName,
  newCandEmail, setNewCandEmail,
  newCandPhone, setNewCandPhone,
  newCandCollege, setNewCandCollege,
  newCandState, setNewCandState,
  newCandDistrict, setNewCandDistrict,
  newCandSkills, setNewCandSkills,
  handleAddCandidateCRM,
  // Staff Form
  newStaffName, setNewStaffName,
  newStaffRole, setNewStaffRole,
  handleAddStaff,
  // Job Form
  newJobTitle, setNewJobTitle,
  newJobCompany, setNewJobCompany,
  newJobState, setNewJobState,
  newJobDistrict, setNewJobDistrict,
  newJobSalary, setNewJobSalary,
  newJobType, setNewJobType,
  newJobTags, setNewJobTags,
  newJobDesc, setNewJobDesc,
  handleAddJob,
  // Course Form
  newCourseTitle, setNewCourseTitle,
  newCourseInstructor, setNewCourseInstructor,
  newCourseDuration, setNewCourseDuration,
  newCourseSyllabus, setNewCourseSyllabus,
  handleAddCourse,
  DISTRICT_MAPPING,
  currentUser,
  showToast
}) {
  // DB User list states
  const [dbUsers, setDbUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [selectedUserRoles, setSelectedUserRoles] = useState({});

  // DB Candidate list states
  const [dbCandidates, setDbCandidates] = useState([]);
  const [fetchingCandidates, setFetchingCandidates] = useState(false);
  const [customReferralCodes, setCustomReferralCodes] = useState({});

  // Admin referral codes
  const [adminReferralCodes, setAdminReferralCodes] = useState([]);
  const [fetchingAdminCodes, setFetchingAdminCodes] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);

  // NEW: Referral progress data
  const [referralProgress, setReferralProgress] = useState([]);
  const [fetchingProgress, setFetchingProgress] = useState(false);
  const [generatingCert, setGeneratingCert] = useState({});

  const API_BASE = '';

  // Existing fetch functions
  const fetchDbUsers = async () => {
    if (!currentUser) return;
    setFetchingUsers(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'GET',
        headers: {
          'x-admin-email': currentUser.email
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve users registry');
      }
      setDbUsers(data.users || []);

      // Initialize selector values
      const initialRoles = {};
      data.users.forEach(u => {
        initialRoles[u.id] = u.default_role;
      });
      setSelectedUserRoles(initialRoles);
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setFetchingUsers(false);
    }
  };

  const fetchDbCandidates = async () => {
    if (!currentUser) return;
    setFetchingCandidates(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/candidates`, {
        method: 'GET',
        headers: {
          'x-admin-email': currentUser.email
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve candidates registry');
      }
      setDbCandidates(data.candidates || []);
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setFetchingCandidates(false);
    }
  };

  const fetchAdminReferralCodes = async () => {
    if (!currentUser) return;
    setFetchingAdminCodes(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/referral-codes`, {
        method: 'GET',
        headers: { 'x-admin-email': currentUser.email }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch referral codes');
      setAdminReferralCodes(data.referralCodes || []);
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setFetchingAdminCodes(false);
    }
  };

  // NEW: fetch referral progress
  const fetchReferralProgress = async () => {
    if (!currentUser) return;
    setFetchingProgress(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/referrals-progress`, {
        headers: { 'x-admin-email': currentUser.email }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch progress');
      setReferralProgress(data.candidates || []);
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setFetchingProgress(false);
    }
  };

  // NEW: generate certificate
  const handleGenerateCertificate = async (candidateId, courseId) => {
    const key = `${candidateId}-${courseId}`;
    setGeneratingCert(prev => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/admin/generate-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser.email
        },
        body: JSON.stringify({ candidateId, courseId })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate certificate');
      }
      const data = await response.json();
      if (!data.studentName || !data.courseTitle) {
        throw new Error('Incomplete certificate metadata received.');
      }
      generateCertificateImage(data.studentName, data.courseTitle, data.issueDate, data.certificateId);
      showToast('Certificate downloaded!', 'success');
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setGeneratingCert(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    if (adminActiveTab === 'tab-admin-roles') {
      fetchDbUsers();
    } else if (adminActiveTab === 'tab-admin-candidates') {
      fetchDbCandidates();
    } else if (adminActiveTab === 'tab-admin-refcodes') {
      fetchAdminReferralCodes();
    } else if (adminActiveTab === 'tab-admin-referral-progress') {
      fetchReferralProgress();
    }
  }, [adminActiveTab]);

  const handleCreateAdminCode = async (e) => {
    e.preventDefault();
    setCreatingCode(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/referral-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': currentUser.email },
        body: JSON.stringify({ code: newAdminCode.trim() || undefined })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create referral code');
      showToast(`Referral code '${data.referralCode.code}' created successfully!`, 'success');
      setNewAdminCode('');
      fetchAdminReferralCodes();
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setCreatingCode(false);
    }
  };

  const handleAssignReferralCode = async (candidateId) => {
    const code = customReferralCodes[candidateId] || '';
    try {
      const response = await fetch(`${API_BASE}/api/admin/candidates/assign-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser.email
        },
        body: JSON.stringify({ candidateId, referralCode: code })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign referral code');
      }
      showToast(`Referral code '${data.referralCode}' assigned successfully!`, 'success');
      fetchDbCandidates();
    } catch (err) {
      showToast(err.message, 'warning');
    }
  };

  const handleSaveUserRole = async (userId) => {
    const nextRole = selectedUserRoles[userId];
    try {
      const response = await fetch(`${API_BASE}/api/admin/update-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser.email
        },
        body: JSON.stringify({ userId, newRole: nextRole })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }
      showToast('Database role updated successfully!', 'success');
      fetchDbUsers();
    } catch (err) {
      showToast(err.message, 'warning');
    }
  };

  return (
    <div className="view-section active" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <div className="view-header">
        <div className="view-title-wrap">
          <h1 style={{ color: 'var(--text-main)' }}>Super Admin Dashboard</h1>
          <p>Master configurations, staff rights, course syllabi, and job postings.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-panel" style={{ '--accent-color': 'var(--neon-blue)' }}>
          <div className="metric-title">Candidates Registered</div>
          <div className="metric-value">{candidates.length}</div>
        </div>
        <div className="metric-card glass-panel" style={{ '--accent-color': 'var(--neon-green)' }}>
          <div className="metric-title">Active Job Placements</div>
          <div className="metric-value">{jobs.length}</div>
        </div>
        <div className="metric-card glass-panel" style={{ '--accent-color': 'var(--neon-amber)' }}>
          <div className="metric-title">Connected ITI Colleges</div>
          <div className="metric-value">{colleges.length}</div>
        </div>
        <div className="metric-card glass-panel" style={{ '--accent-color': 'var(--neon-purple)' }}>
          <div className="metric-title">Sourcing Staff</div>
          <div className="metric-value">{staff.length + fieldAgents.length}</div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-nav">
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-candidates' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-candidates')}>Candidate Registration</button>
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-staff' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-staff')}>Staff Onboarding</button>
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-jobs' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-jobs')}>Job Creator</button>
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-courses' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-courses')}>Configure Courses</button>
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-refcodes' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-refcodes')}>🔑 Referral Codes</button>
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-roles' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-roles')}>DB Roles Config</button>
          {/* NEW TAB */}
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-referral-progress' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-referral-progress')}>📊 Referral Progress</button>
          <button className={`tab-btn ${adminActiveTab === 'tab-admin-support' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tab-admin-support')}>💬 Support Tickets</button>
        </div>

        {/* Existing tabs content (keep as before) */}
        {adminActiveTab === 'tab-admin-candidates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="tab-content active glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Master Candidate Intake Form</h3>
              <form onSubmit={handleAddCandidateCRM} className="config-form-grid">
                <div className="form-group">
                  <label>Candidate Name</label>
                  <input type="text" className="form-input" placeholder="Rohan Sharma" value={newCandName} onChange={e => setNewCandName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" className="form-input" placeholder="rohan@gmail.com" value={newCandEmail} onChange={e => setNewCandEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="text" className="form-input" placeholder="9876543210" value={newCandPhone} onChange={e => setNewCandPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Institution Name</label>
                  <input type="text" className="form-input" placeholder="Government ITI Patna" value={newCandCollege} onChange={e => setNewCandCollege(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>State Region</label>
                  <select className="select-filter" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px' }} value={newCandState} onChange={e => {
                    setNewCandState(e.target.value);
                    setNewCandDistrict('');
                  }} required>
                    <option value="">-- Choose State --</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Odisha">Odisha</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>District Hub</label>
                  <select className="select-filter" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px' }} value={newCandDistrict} onChange={e => setNewCandDistrict(e.target.value)} required>
                    <option value="">-- Choose District --</option>
                    {newCandState && DISTRICT_MAPPING[newCandState]?.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Skills (Comma-separated)</label>
                  <input type="text" className="form-input" placeholder="Ground Sourcing, MS Excel, Telesales" value={newCandSkills} onChange={e => setNewCandSkills(e.target.value)} />
                </div>
                <div className="form-actions full-width" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" className="btn-primary-arrow">
                    Add Candidate to CRM
                    <span className="circle"><ArrowSVG /></span>
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-main)' }}>Registered Candidates Registry &amp; Telemetry</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generate or assign unique sourcing referral codes for candidates.</p>
                </div>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={fetchDbCandidates}>
                  🔄 Reload Registry
                </button>
              </div>

              {fetchingCandidates ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Retrieving live candidates from database...</div>
              ) : dbCandidates.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No candidates registered in the database. Use the form above to register one.</div>
              ) : (
                <div className="high-density-table-wrap" style={{ overflowX: 'auto' }}>
                  <table className="hd-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-main)' }}>
                        <th style={{ padding: '12px 8px' }}>Name</th>
                        <th style={{ padding: '12px 8px' }}>Email</th>
                        <th style={{ padding: '12px 8px' }}>Location / College</th>
                        <th style={{ padding: '12px 8px' }}>Registration Source</th>
                        <th style={{ padding: '12px 8px' }}>Referral Code</th>
                        <th style={{ padding: '12px 8px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbCandidates.map(cand => (
                        <tr key={cand.candidate_id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--text-main)' }}>{cand.name}</td>
                          <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{cand.email}</td>
                          <td style={{ padding: '12px 8px', fontSize: '12px' }}>
                            <div>📍 {cand.city_name || 'Not provided'}, {cand.state_name || ''}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>🎓 {cand.college_name || 'No institution'}</div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span className="status-badge status-sourced" style={{ textTransform: 'capitalize', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                              {cand.registration_source}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {cand.referral_code ? (
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#C2410C', background: '#FFF7ED', padding: '4px 8px', borderRadius: '4px', border: '1px solid #FFEDD5' }}>
                                {cand.referral_code}
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                                None Assigned
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Auto-gen if blank"
                                style={{ padding: '4px 8px', fontSize: '11px', width: '110px', height: '28px' }}
                                value={customReferralCodes[cand.candidate_id] || ''}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  setCustomReferralCodes(prev => ({ ...prev, [cand.candidate_id]: nextVal }));
                                }}
                              />
                              <button
                                className="btn-primary"
                                style={{ padding: '4px 8px', fontSize: '11px', height: '28px', minWidth: '80px', borderRadius: '4px' }}
                                onClick={() => handleAssignReferralCode(cand.candidate_id)}
                              >
                                Assign
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {adminActiveTab === 'tab-admin-staff' && (
          <div className="tab-content active style-flex" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Onboard Staff Member</h3>
              <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flexGrow: 1 }}>
                  <label>Staff Member Name</label>
                  <input type="text" className="form-input" placeholder="Meera Nair" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Operational Role</label>
                  <select className="select-filter" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px', height: '40px' }} value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)}>
                    <option value="Sourcing Agent">Sourcing Agent</option>
                    <option value="HR Recruiter">HR Recruiter</option>
                    <option value="CRM Analyst">CRM Analyst</option>
                    <option value="TPO Panelist">TPO Panelist</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary-arrow" style={{ height: '40px' }}>
                  Create Member Account
                  <span className="circle"><ArrowSVG /></span>
                </button>
              </form>
            </div>

            <div className="high-density-table-wrap">
              <table className="hd-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Date Linked</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-dark)' }}>{s.id.substring(0, 8)}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{s.name}</td>
                      <td><span className="status-badge status-sourced">{s.role}</span></td>
                      <td>{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminActiveTab === 'tab-admin-jobs' && (
          <div className="tab-content active glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Configure Corporate Job Openings</h3>
            <form onSubmit={handleAddJob} className="config-form-grid">
              <div className="form-group">
                <label>Job Title Name</label>
                <input type="text" className="form-input" placeholder="Senior Sourcing Officer" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Job Category / Industry</label>
                <input type="text" className="form-input" placeholder="Manufacturing, Logistics, IT Support" value={newJobCompany} onChange={e => setNewJobCompany(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>State Region</label>
                <select className="select-filter" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px' }} value={newJobState} onChange={e => setNewJobState(e.target.value)} required>
                  <option value="">-- Choose State --</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Odisha">Odisha</option>
                </select>
              </div>
              <div className="form-group">
                <label>District Hub</label>
                <select className="select-filter" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px' }} value={newJobDistrict} onChange={e => setNewJobDistrict(e.target.value)} required>
                  <option value="">-- Choose District --</option>
                  {newJobState && DISTRICT_MAPPING[newJobState]?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Compensation Package</label>
                <input type="text" className="form-input" placeholder="₹25,000 - ₹30,000 / month" value={newJobSalary} onChange={e => setNewJobSalary(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Employment Nature</label>
                <select className="select-filter" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px' }} value={newJobType} onChange={e => setNewJobType(e.target.value)}>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Sourcing Skills (Comma-separated)</label>
                <input type="text" className="form-input" placeholder="Field Work, Driving, Local Dialect" value={newJobTags} onChange={e => setNewJobTags(e.target.value)} />
              </div>
              <div className="form-group full-width">
                <label>Detailed Job Outline</label>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Provide summary..." value={newJobDesc} onChange={e => setNewJobDesc(e.target.value)}></textarea>
              </div>
              <div className="form-actions full-width" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" className="btn-primary-arrow">
                  Publish Job Opening
                  <span className="circle"><ArrowSVG /></span>
                </button>
              </div>
            </form>
          </div>
        )}

        {adminActiveTab === 'tab-admin-courses' && (
          <div className="tab-content active glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Configure Course Curriculum Registers</h3>
            <form onSubmit={handleAddCourse} className="config-form-grid">
              <div className="form-group">
                <label>Syllabus Title Name</label>
                <input type="text" className="form-input" placeholder="Negotiation Mastery & Field Sourcing" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Assigned Lead Instructor</label>
                <input type="text" className="form-input" placeholder="Rajesh Varma, Head of Operations" value={newCourseInstructor} onChange={e => setNewCourseInstructor(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Duration of Course</label>
                <input type="text" className="form-input" placeholder="4 Weeks (Self-Paced)" value={newCourseDuration} onChange={e => setNewCourseDuration(e.target.value)} required />
              </div>
              <div className="form-group full-width">
                <label>Syllabus Modules (Separate by semicolon ';')</label>
                <input type="text" className="form-input" placeholder="Intro to Ground Sourcing; Pitching Objections; Active GPS syncs" value={newCourseSyllabus} onChange={e => setNewCourseSyllabus(e.target.value)} />
              </div>
              <div className="form-actions full-width" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" className="btn-primary-arrow">
                  Add Skills Course
                  <span className="circle"><ArrowSVG /></span>
                </button>
              </div>
            </form>
          </div>
        )}

        {adminActiveTab === 'tab-admin-refcodes' && (
          <div className="tab-content active style-flex" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>🔑 Create Admin Referral Code</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>These codes can be used by candidates during signup to get registered under your admin account. Leave code blank to auto-generate.</p>
              <form onSubmit={handleCreateAdminCode} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flexGrow: 1 }}>
                  <label>Custom Code (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TSPL2026 (leave blank to auto-generate)"
                    value={newAdminCode}
                    onChange={e => setNewAdminCode(e.target.value.toUpperCase())}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <button type="submit" className="btn-primary-arrow" style={{ height: '40px', whiteSpace: 'nowrap' }} disabled={creatingCode}>
                  {creatingCode ? 'Creating...' : 'Generate Referral Code'}
                  <span className="circle"><ArrowSVG /></span>
                </button>
              </form>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-main)' }}>All Admin Referral Codes</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Share these codes with candidates to link them to your admin account on signup.</p>
                </div>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={fetchAdminReferralCodes}>
                  🔄 Reload
                </button>
              </div>

              {fetchingAdminCodes ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading referral codes...</div>
              ) : adminReferralCodes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No admin referral codes created yet. Use the form above to create one.</div>
              ) : (
                <div className="high-density-table-wrap" style={{ overflowX: 'auto' }}>
                  <table className="hd-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-main)' }}>
                        <th style={{ padding: '12px 8px' }}>Referral Code</th>
                        <th style={{ padding: '12px 8px' }}>Created By</th>
                        <th style={{ padding: '12px 8px' }}>Created At</th>
                        <th style={{ padding: '12px 8px' }}>Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminReferralCodes.map(rc => (
                        <tr key={rc.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#C2410C', background: '#FFF7ED', padding: '6px 12px', borderRadius: '6px', border: '1px solid #FFEDD5', fontSize: '15px', letterSpacing: '1px' }}>
                              {rc.code}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>
                            <div style={{ fontWeight: 'bold' }}>{rc.admin_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rc.admin_email}</div>
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(rc.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => {
                                navigator.clipboard.writeText(rc.code);
                                showToast(`Code '${rc.code}' copied to clipboard!`, 'success');
                              }}
                            >
                              📋 Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {adminActiveTab === 'tab-admin-roles' && (
          <div className="tab-content active style-flex" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-main)' }}>Neon DB User Role Configurations</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorize, promote, or restrict individual system user access levels.</p>
                </div>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={fetchDbUsers}>
                  🔄 Reload Users Registry
                </button>
              </div>

              {fetchingUsers ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Retrieving live user rows from database...</div>
              ) : (
                <div className="high-density-table-wrap">
                  <table className="hd-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email Address</th>
                        <th>Access Permission Level</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbUsers.map(user => (
                        <tr key={user.id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-dark)', fontSize: '11px' }}>{user.id}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{user.name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{user.email}</td>
                          <td>
                            <span className={`status-badge ${user.default_role === 'super_admin' ? 'status-placed' :
                              user.default_role === 'sourcing_head' ? 'status-sourced' :
                                user.default_role === 'recruiter' ? 'status-interviewing' : 'status-sourced'
                              }`}>
                              {user.default_role === 'super_admin' ? 'Super Admin' :
                                user.default_role === 'sourcing_head' ? 'Sourcing Head' :
                                  user.default_role === 'recruiter' ? 'HR Recruiter' :
                                    user.default_role === 'tpo' ? 'TPO College' : 'Candidate'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select
                                className="select-filter"
                                style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                value={selectedUserRoles[user.id] || user.default_role}
                                onChange={(e) => {
                                  const nextVal = e.target.value;
                                  setSelectedUserRoles(prev => ({ ...prev, [user.id]: nextVal }));
                                }}
                              >
                                <option value="candidate">Candidate</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="sourcing_head">Sourcing Head</option>
                                <option value="recruiter">HR Recruiter</option>
                                <option value="tpo">TPO Panelist</option>
                              </select>
                              <button
                                className="btn-primary-arrow"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                                onClick={() => handleSaveUserRole(user.id)}
                              >
                                Save Role
                                <span className="circle"><ArrowSVG /></span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEW TAB: Referral Progress */}
        {adminActiveTab === 'tab-admin-referral-progress' && (
          <div className="tab-content active style-flex" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: 'var(--text-main)' }}>Candidate Referral & Course Progress</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>View all candidates, who referred them, and their course completion status.</p>
                </div>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={fetchReferralProgress}>
                  🔄 Refresh
                </button>
              </div>

              {fetchingProgress ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading candidate data...</div>
              ) : referralProgress.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No candidates found.</div>
              ) : (
                <div className="high-density-table-wrap" style={{ overflowX: 'auto' }}>
                  <table className="hd-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Referred By</th>
                        <th>Courses & Progress</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralProgress.map(cand => (
                        <tr key={cand.candidate_id}>
                          <td>
                            <div style={{ fontWeight: 'bold' }}>{cand.candidate_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cand.candidate_email}</div>
                          </td>
                          <td>
                            {cand.referred_by_name ? (
                              <span style={{ fontWeight: '500', color: 'var(--primary-blue)' }}>{cand.referred_by_name}</span>
                            ) : (
                              <span style={{ color: 'var(--text-dark)', fontStyle: 'italic' }}>Self-registered</span>
                            )}
                          </td>
                          <td>
                            {cand.courses && cand.courses.length > 0 && cand.courses[0] !== null ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {cand.courses.map(c => (
                                  <div key={c.course_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                    <span>{c.course_title}</span>
                                    <span style={{
                                      background: c.completed ? 'var(--success-dim)' : 'var(--warning-dim)',
                                      color: c.completed ? 'var(--success)' : 'var(--warning)',
                                      padding: '1px 8px',
                                      borderRadius: '12px',
                                      fontSize: '10px',
                                      fontWeight: 'bold'
                                    }}>
                                      {c.completed ? '✅ Completed' : `⏳ ${c.progress}%`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-dark)', fontStyle: 'italic' }}>No courses enrolled</span>
                            )}
                          </td>
                          <td>
                            {cand.courses && cand.courses.filter(c => c && c.completed).length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {cand.courses.filter(c => c && c.completed).map(c => {
                                  const key = `${cand.candidate_id}-${c.course_id}`;
                                  const loading = generatingCert[key];
                                  return (
                                    <button
                                      key={key}
                                      className="btn-primary-arrow"
                                      style={{ padding: '4px 10px', fontSize: '11px', minHeight: '28px' }}
                                      onClick={() => handleGenerateCertificate(cand.candidate_id, c.course_id)}
                                      disabled={loading}
                                    >
                                      {loading ? 'Generating...' : '📄 Cert for ' + c.course_title}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-dark)', fontStyle: 'italic' }}>No completed courses</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {adminActiveTab === 'tab-admin-support' && (
          <div className="tab-content active glass-panel" style={{ padding: '24px' }}>
            <AdminChatView currentUser={currentUser} showToast={showToast} API_BASE={API_BASE} />
          </div>
        )}
      </div>
    </div>
  );
}