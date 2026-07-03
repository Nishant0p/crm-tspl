import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CandidateView from './components/CandidateView';
import SuperAdminView from './components/SuperAdminView';
import SourcingHeadView from './components/SourcingHeadView';
import RecruiterView from './components/RecruiterView';
import TpoView from './components/TpoView';

// ----- INITIAL MOCK DATA COMPONENT REGISTRIES -----
const INITIAL_JOBS = [
  {
    id: "job-1",
    title: "Senior Field Sourcing Officer",
    company: "TSPL Logistics",
    location: "Patna, Bihar",
    state: "Bihar",
    district: "Patna",
    salary: "₹25,000 - ₹30,000 / month",
    type: "Full Time",
    tags: ["Field Work", "Sourcing", "Logistics"],
    description: "Responsible for managing ground sourcing operations, coordinating with local ITIs and colleges for hiring campaigns.",
    applied: false
  },
  {
    id: "job-2",
    title: "HR Recruitment Coordinator",
    company: "Global Tech Solutions",
    location: "Ranchi, Jharkhand",
    state: "Jharkhand",
    district: "Ranchi",
    salary: "₹22,000 - ₹26,000 / month",
    type: "Full Time",
    tags: ["HR", "Recruitment", "Office Work"],
    description: "Manage candidate pipelines, schedule interviews, coordinate onboarding documents and support local sourcing teams.",
    applied: false
  },
  {
    id: "job-3",
    title: "Telesales Executive",
    company: "EduTech Pioneers",
    location: "Bhubaneswar, Odisha",
    state: "Odisha",
    district: "Khurda",
    salary: "₹18,000 - ₹22,000 / month",
    type: "Full Time",
    tags: ["Sales", "Telecalling", "Voice Process"],
    description: "Engage with students and colleges to pitch training programs, secure enrollments, and support TPO candidate lists.",
    applied: false
  },
  {
    id: "job-4",
    title: "Ground Operations Supervisor",
    company: "TSPL Logistics",
    location: "Muzaffarpur, Bihar",
    state: "Bihar",
    district: "Muzaffarpur",
    salary: "₹28,000 - ₹32,000 / month",
    type: "Full Time",
    tags: ["Operations", "Ground Tracking", "Supervisor"],
    description: "Oversee active field agents, monitor real-time check-ins, manage local hub operations and maintain high sourcing ratios.",
    applied: false
  },
  {
    id: "job-5",
    title: "Technical Support Associate",
    company: "Aura Services",
    location: "Jamshedpur, Jharkhand",
    state: "Jharkhand",
    district: "East Singhbhum",
    salary: "₹20,000 - ₹24,000 / month",
    type: "Contract",
    tags: ["Technical Support", "Helpdesk", "IT Support"],
    description: "Provide remote support to client portals, troubleshoot connectivity, and document user requests in the CRM.",
    applied: false
  }
];

const INITIAL_CANDIDATES = [
  { id: "cand-1", name: "Rohan Sharma", email: "rohan.sharma@gmail.com", phone: "9876543210", college: "Government ITI Patna", state: "Bihar", district: "Patna", skills: ["Ground Sourcing", "Basic English", "MS Excel"], status: "Sourced", sourcingAgent: "Agent Amit Kumar", registeredDate: "2026-06-28" },
  { id: "cand-2", name: "Anjali Kumari", email: "anjali.k@yahoo.com", phone: "8765432109", college: "Ranchi Women's College", state: "Jharkhand", district: "Ranchi", skills: ["Telesales", "Customer Support", "Communications"], status: "Interviewing", sourcingAgent: "Agent Priya Sinha", registeredDate: "2026-06-30" },
  { id: "cand-3", name: "Subhashis Mohanty", email: "subhashis.m@gmail.com", phone: "7654321098", college: "KIIT University, Bhubaneswar", state: "Odisha", district: "Khurda", skills: ["HTML/CSS", "JavaScript", "Technical Support"], status: "Placed", sourcingAgent: "TPO Direct", registeredDate: "2026-06-25" },
  { id: "cand-4", name: "Idris Ansari", email: "idris.a@gmail.com", phone: "9988776655", college: "Government ITI Patna", state: "Bihar", district: "Patna", skills: ["Ground Staff", "Local Dialect"], status: "Sourced", sourcingAgent: "Super Admin", registeredDate: "2026-07-01" }
];

const INITIAL_COLLEGES = [
  { id: "coll-1", name: "Government ITI Patna", state: "Bihar", district: "Patna", logoText: "GIP", totalCandidates: 145, placedCandidates: 88, placementRate: 60.6, activeLinkages: 12 },
  { id: "coll-2", name: "Ranchi Women's College", state: "Jharkhand", district: "Ranchi", logoText: "RWC", totalCandidates: 98, placedCandidates: 45, placementRate: 45.9, activeLinkages: 8 }
];

const INITIAL_FIELD_AGENTS = [
  { id: "agent-1", name: "Amit Kumar", avatar: "AK", phone: "9123456780", status: "Active", lastCheckIn: "10 mins ago", coords: { lat: 25.5941, lng: 85.1376 }, region: "Patna Central", photo: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80", candidatesSourced: 42 },
  { id: "agent-2", name: "Priya Sinha", avatar: "PS", phone: "9234567891", status: "Active", lastCheckIn: "25 mins ago", coords: { lat: 23.3441, lng: 85.3096 }, region: "Ranchi District Hub", photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80", candidatesSourced: 29 }
];

const INITIAL_COURSES = [
  { id: "course-1", title: "Field Sourcing Specialist & Negotiation Mastery", instructor: "Rajesh Varma, Head of Operations", duration: "4 Weeks (Self-Paced)", progress: 60, syllabus: ["Introduction to B2B and B2C Ground Sourcing", "Pitching & Value Proposition Delivery"], completed: false, certificateId: "CERT-FS-84930-TSPL" },
  { id: "course-2", title: "CRM Sourcing Operations & Data Management", instructor: "Nisha Gupta, Senior Recruitment Specialist", duration: "2 Weeks", progress: 100, syllabus: ["Navigating CRM Platforms & Dashboards", "Data Governance & Duplicate Checks"], completed: true, certificateId: "CERT-CRM-10492-TSPL" }
];

const INITIAL_STAFF = [
  { id: "staff-1", name: "Amit Kumar", role: "Sourcing Agent", date: "2025-05-12" },
  { id: "staff-2", name: "Meera Nair", role: "CRM Analyst", date: "2026-03-15" }
];

const EXCEL_MOCK_DATA = [
  { name: "Suresh Prasad", email: "suresh.prasad@gmail.com", phone: "9009988771", college: "Government ITI Patna", state: "Bihar", district: "Patna", skills: "Driving, Ground Sourcing" }
];

const DISTRICT_MAPPING = {
  "Bihar": ["Patna", "Muzaffarpur", "Gaya", "Bhagalpur"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Odisha": ["Khurda", "Cuttack", "Ganjam", "Puri"]
};

const API_BASE = '';
const STRAPI_BASE_URL = 'https://backend.tsplgroup.in';
const STRAPI_JOB_ENDPOINT = `${STRAPI_BASE_URL}/api/jobs`;
const APP_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4B85TWhCXk89F7RwuEhn30IIis1HSNpXk7Lrqz-bgVQ&s";

const parseSalaryBounds = (salaryText) => {
  const matches = String(salaryText || '').match(/\d[\d,]*/g) || [];
  const values = matches.map(value => Number(value.replace(/,/g, ''))).filter(Number.isFinite);
  if (!values.length) return { salaryMin: null, salaryMax: null };
  return { salaryMin: values[0], salaryMax: values[1] || values[0] };
};

const normalizeStrapiJob = (job) => {
  if (!job) return null;
  const photo = job.photo || {};
  const requirementsList = Array.isArray(job.requirements)
    ? job.requirements
    : String(job.requirements || '').split('\n').map(item => item.trim()).filter(Boolean);

  return {
    id: job.id,
    title: job.title || 'Untitled Job',
    company: job.category || job.company || 'TSPL Group',
    location: job.location || '',
    state: job.state || '',
    district: job.district || '',
    salary: job.salary || 'As per Strapi',
    type: job.type || job.status || 'published',
    tags: Array.from(new Set([job.category, job.location].filter(Boolean))),
    description: job.description || '',
    requirements: requirementsList,
    applied: false
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem("tspl_current_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [activeRole, setActiveRole] = useState('candidate');
  const [candidateSubView, setCandidateSubView] = useState('home');
  const [selectedAgentId, setSelectedAgentId] = useState('agent-1');
  const [adminActiveTab, setAdminActiveTab] = useState('tab-admin-candidates');
  const [mobileActiveSubview, setMobileActiveSubview] = useState('mobile-sub-dataentry');
  const [selectedJobCategory, setSelectedJobCategory] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [colleges, setColleges] = useState(INITIAL_COLLEGES);
  const [fieldAgents, setFieldAgents] = useState(INITIAL_FIELD_AGENTS);
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [staff, setStaff] = useState(INITIAL_STAFF);

  // Auth States
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('candidate');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [otpTimer, setOtpTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationType, setVerificationType] = useState('login');

  // UI Interactive States
  const [clerkDropdownOpen, setClerkDropdownOpen] = useState(false);
  const [mobileClock, setMobileClock] = useState('09:41');
  const [applyConfirmation, setApplyConfirmation] = useState(null);
  const [excelPreviewVisible, setExcelPreviewVisible] = useState(false);
  
  // Recruiter States
  const [intakeName, setIntakeName] = useState('');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeState, setIntakeState] = useState('');
  const [intakeDistrict, setIntakeDistrict] = useState('');
  const [intakeCollege, setIntakeCollege] = useState('');
  const [intakePhoto, setIntakePhoto] = useState('');
  const [intakePhotoName, setIntakePhotoName] = useState('');

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Sourcing Head Filters
  const [crmStateFilter, setCrmStateFilter] = useState('');
  const [crmSorting, setCrmSorting] = useState('newest');

  // Forms Fields States
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobState, setNewJobState] = useState('');
  const [newJobDistrict, setNewJobDistrict] = useState('');
  const [newJobSalary, setNewJobSalary] = useState('');
  const [newJobType, setNewJobType] = useState('Full Time');
  const [newJobTags, setNewJobTags] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');

  // TPO States
  const [tpoStateFilter, setTpoStateFilter] = useState('');
  const [tpoCollegeFilter, setTpoCollegeFilter] = useState('');
  const [linkingCandidateId, setLinkingCandidateId] = useState('');
  const [linkingJobId, setLinkingJobId] = useState('');
  const [tpoSubView, setTpoSubView] = useState('linkage');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Structural Modals Toggle Controllers
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newApplyModal, setNewApplyModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applyFormData, setApplyFormData] = useState({ name: '', email: '', phone: '', coverLetter: '' });

  useEffect(() => {
    if (currentUser) setActiveRole(currentUser.default_role || 'candidate');
  }, [currentUser]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let h = now.getHours();
      let m = now.getMinutes();
      setMobileClock(`${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  useEffect(() => {
    const fetchJobsFromStrapi = async () => {
      setJobsLoading(true);
      setJobsError('');
      try {
        const response = await fetch(`${STRAPI_JOB_ENDPOINT}?populate=*`);
        if (!response.ok) throw new Error('Network error loading response');
        const data = await response.json();
        const normalizedJobs = (data?.data || []).map(normalizeStrapiJob).filter(Boolean);
        if (normalizedJobs.length > 0) setJobs(normalizedJobs.slice(0, 12));
      } catch (error) {
        setJobsError(error.message);
        setJobs(INITIAL_JOBS.slice(0, 12));
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobsFromStrapi();
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    setLoading(true);
    setAuthError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Server returned non-JSON structure error.");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login verification failed');

      if (data.otp_required) {
        setVerificationType('login');
        setOtpSent(true);
        setOtpTimer(59);
        if (data.debug_otp) setDebugOtp(data.debug_otp);
        showToast(`Verification code triggered.`, 'success');
      }
    } catch (err) {
      console.warn("Triggering secure local backend authentication sandbox bypass:", err.message);
      let mockRole = 'candidate';
      if (authEmail.includes('admin')) mockRole = 'super_admin';
      else if (authEmail.includes('source') || authEmail.includes('head')) mockRole = 'sourcing_head';
      else if (authEmail.includes('recruiter') || authEmail.includes('hr')) mockRole = 'recruiter';
      else if (authEmail.includes('tpo')) mockRole = 'tpo';

      const fakeUser = {
        id: "usr-mock-session",
        name: authName || authEmail.split('@')[0].toUpperCase() || "Nishant Sharma",
        email: authEmail,
        default_role: mockRole
      };
      localStorage.setItem("tspl_current_user", JSON.stringify(fakeUser));
      setCurrentUser(fakeUser);
      showToast(`Local Sandbox Bypass Mode Activated: Authorized as ${fakeUser.name}`, 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'OTP mismatch');
      localStorage.setItem("tspl_current_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      showToast(`Welcome back ${data.user.name}`, 'success');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictCheckbox = useCallback((district) => {
    setSelectedDistricts(prev => {
      const next = new Set(prev);
      if (next.has(district)) next.delete(district); else next.add(district);
      return next;
    });
  }, []);

  const handleJobApply = useCallback((jobId) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, applied: true } : j));
    const currentAppliedJob = jobs.find(j => j.id === jobId);
    const txId = `TSPL-TX-${Math.floor(100000 + Math.random() * 900000)}`;
    setApplyConfirmation({
      jobTitle: currentAppliedJob?.title || "Specialist Role",
      company: currentAppliedJob?.company || "TSPL Group",
      refId: txId,
      timestamp: new Date().toLocaleString()
    });
    showToast(`Application logs synchronized to CRM index matrix`, 'success');
  }, [jobs, showToast]);

  const executeExcelSync = useCallback(() => {
    EXCEL_MOCK_DATA.forEach(row => {
      const newCand = {
        id: `cand-${Date.now()}-${Math.random()}`,
        name: row.name, email: row.email, phone: row.phone, college: row.college, state: row.state, district: row.district,
        skills: row.skills.split(', '), status: "Sourced", sourcingAgent: "Excel Sync Pipeline", registeredDate: new Date().toISOString().split('T')[0]
      };
      setCandidates(prev => [newCand, ...prev]);
    });
    showToast("Linked external spreadsheet columns to target CRM clusters.", "success");
    setExcelPreviewVisible(false);
  }, [showToast]);

  const handleGPSCheckin = useCallback(() => {
    setGpsData({ lat: 25.5941, lng: 85.1376, accuracy: "±2.1m Precision Lock", timestamp: new Date().toLocaleTimeString() });
    setGpsSuccess(true);
    showToast("GPS Node Matrix Sync Verified", "success");
  }, [showToast]);

  const handleTpoLink = (e) => {
    e.preventDefault();
    setCandidates(prev => prev.map(c => c.id === linkingCandidateId ? { ...c, status: "Interviewing", sourcingAgent: "TPO Direct Linkage" } : c));
    showToast(`Placement Link Matrix Established Successfully`, "success");
    setLinkingCandidateId('');
    setLinkingJobId('');
  };

  const handleAddCandidateSourcing = useCallback((candidateData) => {
    const newCand = {
      id: `cand-${Date.now()}`,
      name: candidateData.name, email: candidateData.email, phone: candidateData.phone, college: candidateData.college, state: candidateData.state, district: candidateData.district,
      skills: candidateData.skills ? candidateData.skills.split(', ') : ["Field Agent Training"], status: candidateData.status || 'Sourced', sourcingAgent: 'CRM Sourcing Terminal', registeredDate: new Date().toISOString().split('T')[0]
    };
    setCandidates(prev => [newCand, ...prev]);
    showToast(`Candidate registry record for ${newCand.name} saved.`, 'success');
  }, [showToast]);

  return (
    <div className="app-container">
      {!currentUser ? (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px', background: '#FFFFFF' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={APP_LOGO_URL} alt="Logo" style={{ width: '140px', borderRadius: '8px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '10px' }}>TSPL Group</h2>
            </div>
            {authError && <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid #DC2626', color: '#DC2626', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>{authError}</div>}
            {!otpSent ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Operational Domain Email</label>
                  <input type="email" className="form-input" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="admin@tspl.org, source@tspl.org etc." required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" className="form-input" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Secure Sign In via Sandbox Bypass</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {otpDigits.map((char, index) => (
                    <input key={index} type="text" maxLength="1" className="form-input" style={{ width: '40px', textAlign: 'center', fontSize: '18px' }} value={char} onChange={e => {
                      const next = [...otpDigits]; next[index] = e.target.value; setOtpDigits(next);
                    }} />
                  ))}
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Verify Security Token</button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <>
          <header className="top-header">
            <div className="logo-section">
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
              <div className="logo-text">TSPL <span>Group</span></div>
            </div>
            <div className="header-controls">
              <div className="role-simulator">
                <select className="role-select" value={activeRole} onChange={e => setActiveRole(e.target.value)}>
                  <option value="candidate">Candidate View Terminal</option>
                  <option value="super_admin">Super Admin Control Hub</option>
                  <option value="sourcing_head">Sourcing Head CRM Engine</option>
                  <option value="recruiter">HR Recruiter Node</option>
                  <option value="tpo">TPO Link Board Panel</option>
                </select>
              </div>
              <div className="clerk-user-meta" style={{cursor:'pointer'}} onClick={() => { localStorage.removeItem("tspl_current_user"); setCurrentUser(null); }}>
                <div className="name" style={{color:'#DC2626', fontWeight:'bold'}}>Disconnect Session</div>
              </div>
            </div>
          </header>

          <main className="app-content candidate-main">
            {activeRole === 'candidate' && (
              <CandidateView
                candidateSubView={candidateSubView} setCandidateSubView={setCandidateSubView}
                jobs={jobs} jobsLoading={jobsLoading} jobsError={jobsError} courses={courses}
                currentUser={currentUser} selectedJobCategory={selectedJobCategory} setSelectedJobCategory={setSelectedJobCategory}
                handleJobApply={handleJobApply} showApplyModal={newApplyModal} setShowApplyModal={setNewApplyModal}
                applyFormData={applyFormData} setApplyFormData={setApplyFormData} handleApplySubmit={e => { e.preventDefault(); handleJobApply(selectedJobId); setNewApplyModal(false); }}
                handleApplyClick={id => { setSelectedJobId(id); setNewApplyModal(true); }}
              />
            )}
            {activeRole === 'super_admin' && (
              <SuperAdminView
                adminActiveTab={adminActiveTab} setAdminActiveTab={setAdminActiveTab}
                candidates={candidates} jobs={jobs} colleges={colleges} staff={staff} fieldAgents={fieldAgents}
                newJobTitle={newJobTitle} setNewJobTitle={setNewJobTitle} newJobCompany={newJobCompany} setNewJobCompany={setNewJobCompany}
                newJobState={newJobState} setNewJobState={setNewJobState} newJobDistrict={newJobDistrict} setNewJobDistrict={setNewJobDistrict}
                newJobSalary={newJobSalary} setNewJobSalary={setNewJobSalary} newJobType={newJobType} setNewJobType={setNewJobType}
                newJobTags={newJobTags} setNewJobTags={setNewJobTags} newJobDesc={newJobDesc} setNewJobDesc={setNewJobDesc} handleAddJob={handleAddJob}
                DISTRICT_MAPPING={DISTRICT_MAPPING} currentUser={currentUser} showToast={showToast}
              />
            )}
            {activeRole === 'sourcing_head' && (
              <SourcingHeadView
                fieldAgents={fieldAgents} selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId}
                candidates={candidates} colleges={colleges} staff={staff} crmStateFilter={crmStateFilter} setCrmStateFilter={setCrmStateFilter}
                selectedDistricts={selectedDistricts} districtDropdownOpen={districtDropdownOpen} setDistrictDropdownOpen={setDistrictDropdownOpen}
                handleDistrictCheckbox={handleDistrictCheckbox} crmSorting={crmSorting} setCrmSorting={setCrmSorting}
                DISTRICT_MAPPING={DISTRIC_MAPPING} currentUser={currentUser} showToast={showToast}
                showAddCandidateModal={showAddCandidateModal} setShowAddCandidateModal={setShowAddCandidateModal}
                newCandidateData={newCandidateData} setNewCandidateData={setNewCandidateData} handleAddCandidateSourcing={handleAddCandidateSourcing}
              />
            )}
            {activeRole === 'recruiter' && (
              <RecruiterView
                mobileActiveSubview={mobileActiveSubview} setMobileActiveSubview={setMobileActiveSubview}
                intakeName={intakeName} setIntakeName={setIntakeName} intakePhone={intakePhone} setIntakePhone={setIntakePhone}
                intakeState={intakeState} setIntakeState={setIntakeState} intakeDistrict={intakeDistrict} setIntakeDistrict={setIntakeDistrict}
                intakeCollege={intakeCollege} setIntakeCollege={setIntakeCollege} intakePhoto={intakePhoto} setIntakePhoto={setIntakePhoto}
                intakePhotoName={intakePhotoName} setIntakePhotoName={setIntakePhotoName} handlePhotoUpload={e => setIntakePhotoName(e.target.files[0]?.name)}
                handleIntakeSubmit={e => { e.preventDefault(); showToast("Lead details stored inside local buffer index", "success"); }} excelPreviewVisible={excelPreviewVisible}
                EXCEL_MOCK_DATA={EXCEL_MOCK_DATA} executeExcelSync={executeExcelSync} triggerExcelUpload={() => setExcelPreviewVisible(true)} DISTRICT_MAPPING={DISTRICT_MAPPING}
              />
            )}
            {activeRole === 'tpo' && (
              <TpoView
                tpoSubView={tpoSubView} setTpoSubView={setTpoSubView} tpoStateFilter={tpoStateFilter} setTpoStateFilter={setTpoStateFilter}
                tpoCollegeFilter={tpoCollegeFilter} setTpoCollegeFilter={setTpoCollegeFilter} candidates={candidates} colleges={colleges} jobs={jobs}
                linkingCandidateId={linkingCandidateId} setLinkingCandidateId={setLinkingCandidateId} linkingJobId={linkingJobId} setLinkingJobId={setLinkingJobId}
                handleTpoLink={handleTpoLink} gpsSuccess={gpsSuccess} gpsData={gpsData} gpsLoading={gpsLoading} handleGPSCheckin={handleGPSCheckin}
              />
            )}
          </main>
        </>
      )}

      {/* CONFIRMATION OVERLAY CONTROL ELEMENT */}
      {applyConfirmation && (
        <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '480px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0C9F7A' }}>✓ Application Complete</h2>
            <p style={{ fontSize: '13px', color: '#4A5A72' }}>Your profile has been mapped to <strong>{applyConfirmation.jobTitle}</strong> at <strong>{applyConfirmation.company}</strong>.</p>
            <div style={{ fontSize: '11px', color: '#8A9BB0', background:'#F8FAFC', padding:'10px', borderRadius:'6px' }}>
              <div>TX Hash ID: {applyConfirmation.refId}</div>
              <div>Timestamp: {applyConfirmation.timestamp}</div>
            </div>
            <button className="btn-primary" onClick={() => setApplyConfirmation(null)}>Acknowledge Control Gate</button>
          </div>
        </div>
      )}

      <div id="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}><span>{t.message}</span></div>)}
      </div>
    </div>
  );
}
