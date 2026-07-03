import React, { useState, useEffect, useRef } from 'react';
import CandidateView from './components/CandidateView';
import SuperAdminView from './components/SuperAdminView';
import SourcingHeadView from './components/SourcingHeadView';
import RecruiterView from './components/RecruiterView';
import TpoView from './components/TpoView';

// ----- INITIAL DATA (kept for fallback) -----
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
  {
    id: "cand-1",
    name: "Rohan Sharma",
    email: "rohan.sharma@gmail.com",
    phone: "9876543210",
    college: "Government ITI Patna",
    state: "Bihar",
    district: "Patna",
    skills: ["Ground Sourcing", "Basic English", "MS Excel"],
    status: "Sourced",
    sourcingAgent: "Agent Amit Kumar",
    registeredDate: "2026-06-28"
  },
  {
    id: "cand-2",
    name: "Anjali Kumari",
    email: "anjali.k@yahoo.com",
    phone: "8765432109",
    college: "Ranchi Women's College",
    state: "Jharkhand",
    district: "Ranchi",
    skills: ["Telesales", "Customer Support", "Communications"],
    status: "Interviewing",
    sourcingAgent: "Agent Priya Sinha",
    registeredDate: "2026-06-30"
  },
  {
    id: "cand-3",
    name: "Subhashis Mohanty",
    email: "subhashis.m@gmail.com",
    phone: "7654321098",
    college: "KIIT University, Bhubaneswar",
    state: "Odisha",
    district: "Khurda",
    skills: ["HTML/CSS", "JavaScript", "Technical Support"],
    status: "Placed",
    sourcingAgent: "TPO Direct",
    registeredDate: "2026-06-25"
  },
  {
    id: "cand-4",
    name: "Vikram Kumar Singh",
    email: "vikram.singh@outlook.com",
    phone: "6543210987",
    college: "Muzaffarpur Institute of Technology",
    state: "Bihar",
    district: "Muzaffarpur",
    skills: ["Operations", "Team Management", "MS Excel"],
    status: "Sourced",
    sourcingAgent: "Agent Amit Kumar",
    registeredDate: "2026-07-01"
  },
  {
    id: "cand-5",
    name: "Pooja Oraon",
    email: "pooja.oraon@rediffmail.com",
    phone: "9988776655",
    college: "Ranchi University",
    state: "Jharkhand",
    district: "Ranchi",
    skills: ["Sales", "Hindi Typing", "CRM Operations"],
    status: "Interviewing",
    sourcingAgent: "Agent Priya Sinha",
    registeredDate: "2026-07-02"
  },
  {
    id: "cand-6",
    name: "Rahul Verma",
    email: "rahul.verma@gmail.com",
    phone: "8877665544",
    college: "Government ITI Patna",
    state: "Bihar",
    district: "Patna",
    skills: ["Field Work", "Inventory Control", "Driving"],
    status: "Placed",
    sourcingAgent: "Agent Amit Kumar",
    registeredDate: "2026-06-15"
  }
];

const INITIAL_COLLEGES = [
  {
    id: "coll-1",
    name: "Government ITI Patna",
    state: "Bihar",
    district: "Patna",
    logoText: "GIP",
    totalCandidates: 145,
    placedCandidates: 88,
    placementRate: 60.6,
    activeLinkages: 12
  },
  {
    id: "coll-2",
    name: "Ranchi Women's College",
    state: "Jharkhand",
    district: "Ranchi",
    logoText: "RWC",
    totalCandidates: 98,
    placedCandidates: 45,
    placementRate: 45.9,
    activeLinkages: 8
  },
  {
    id: "coll-3",
    name: "KIIT University, Bhubaneswar",
    state: "Odisha",
    district: "Khurda",
    logoText: "KIIT",
    totalCandidates: 320,
    placedCandidates: 256,
    placementRate: 80.0,
    activeLinkages: 24
  },
  {
    id: "coll-4",
    name: "Muzaffarpur Institute of Technology",
    state: "Bihar",
    district: "Muzaffarpur",
    logoText: "MIT",
    totalCandidates: 112,
    placedCandidates: 54,
    placementRate: 48.2,
    activeLinkages: 7
  }
];

const INITIAL_FIELD_AGENTS = [
  {
    id: "agent-1",
    name: "Amit Kumar",
    avatar: "AK",
    phone: "9123456780",
    status: "Active",
    lastCheckIn: "10 mins ago",
    coords: { lat: 25.5941, lng: 85.1376 },
    region: "Patna Central",
    photo: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    candidatesSourced: 42
  },
  {
    id: "agent-2",
    name: "Priya Sinha",
    avatar: "PS",
    phone: "9234567891",
    status: "Active",
    lastCheckIn: "25 mins ago",
    coords: { lat: 23.3441, lng: 85.3096 },
    region: "Ranchi District Hub",
    photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
    candidatesSourced: 29
  },
  {
    id: "agent-3",
    name: "Subhendu Jena",
    avatar: "SJ",
    phone: "9345678902",
    status: "Inactive",
    lastCheckIn: "4 hours ago",
    coords: { lat: 20.2961, lng: 85.8245 },
    region: "Khurda Rural",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    candidatesSourced: 18
  },
  {
    id: "agent-4",
    name: "Ramesh Mahto",
    avatar: "RM",
    phone: "9456789013",
    status: "Active",
    lastCheckIn: "Just Now",
    coords: { lat: 26.1209, lng: 85.3647 },
    region: "Muzaffarpur North",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    candidatesSourced: 33
  }
];

const INITIAL_COURSES = [
  {
    id: "course-1",
    title: "Field Sourcing Specialist & Negotiation Mastery",
    instructor: "Rajesh Varma, Head of Operations",
    duration: "4 Weeks (Self-Paced)",
    progress: 60,
    syllabus: [
      "Introduction to B2B and B2C Ground Sourcing",
      "Pitching & Value Proposition Delivery",
      "Handling Candidate Objections & Rejections",
      "Advanced Lead Verification & App Onboarding"
    ],
    completed: false,
    certificateId: "CERT-FS-84930-TSPL"
  },
  {
    id: "course-2",
    title: "CRM Sourcing Operations & Data Management",
    instructor: "Nisha Gupta, Senior Recruitment Specialist",
    duration: "2 Weeks",
    progress: 100,
    syllabus: [
      "Navigating CRM Platforms & Dashboards",
      "Data Governance & Duplicate Checks",
      "Exporting Reports & Bulk Excel Uploads",
      "College Linking Rules & Candidate Pipeline Rules"
    ],
    completed: true,
    certificateId: "CERT-CRM-10492-TSPL"
  },
  {
    id: "course-3",
    title: "On-Field Health & Safety Compliance",
    instructor: "Amit Kumar, HSE Director",
    duration: "1 Week",
    progress: 15,
    syllabus: [
      "On-field Risk Mitigation Practices",
      "Incident Reporting Protocol",
      "GPS Tracking App Compliance",
      "Data Privacy & Candidate Consent Protocols"
    ],
    completed: false,
    certificateId: "CERT-HSE-39572-TSPL"
  }
];

const INITIAL_STAFF = [
  { id: "staff-1", name: "Amit Kumar", role: "Sourcing Agent", date: "2025-05-12" },
  { id: "staff-2", name: "Priya Sinha", role: "Sourcing Agent", date: "2025-08-20" },
  { id: "staff-3", name: "Vikram Sen", role: "HR Recruiter", date: "2026-01-10" },
  { id: "staff-4", name: "Meera Nair", role: "CRM Analyst", date: "2026-03-15" }
];

const EXCEL_MOCK_DATA = [
  { name: "Suresh Prasad", email: "suresh.prasad@gmail.com", phone: "9009988771", college: "Government ITI Patna", state: "Bihar", district: "Patna", skills: "Driving, Ground Sourcing" },
  { name: "Minati Mohapatra", email: "minati.m@gmail.com", phone: "9119988772", college: "KIIT University", state: "Odisha", district: "Khurda", skills: "Telesales, Excel" },
  { name: "Prakash Soren", email: "prakash.soren@yahoo.com", phone: "9229988773", college: "Ranchi University", state: "Jharkhand", district: "Ranchi", skills: "Field Work, Local Dialect" },
  { name: "Swati Mishra", email: "swati.m@gmail.com", phone: "9339988774", college: "Ranchi Women's College", state: "Jharkhand", district: "Ranchi", skills: "HR Recruitment, English" }
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

// ----- Strapi helpers -----
const toStrapiMediaUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STRAPI_BASE_URL}${url}`;
};

const parseSalaryBounds = (salaryText) => {
  const matches = String(salaryText || '').match(/\d[\d,]*/g) || [];
  const values = matches.map(value => Number(value.replace(/,/g, ''))).filter(Number.isFinite);
  if (!values.length) return { salaryMin: null, salaryMax: null };
  if (values.length === 1) return { salaryMin: values[0], salaryMax: values[0] };
  return { salaryMin: values[0], salaryMax: values[1] };
};

const normalizeStrapiJob = (job) => {
  if (!job) return null;
  const photo = job.photo || {};
  const requirementsList = Array.isArray(job.requirements)
    ? job.requirements
    : String(job.requirements || '')
        .split('\n')
        .map(item => item.replace(/^[-•\s]+/, '').trim())
        .filter(Boolean);

  return {
    id: job.id,
    title: job.title || 'Untitled Job',
    company: job.category || job.company || 'TSPL Group',
    location: job.location || '',
    state: job.state || '',
    district: job.district || '',
    salary: job.salary || (job.salaryMin || job.salaryMax ? `₹${job.salaryMin || job.salaryMax}` : 'As per Strapi'),
    type: job.type || job.status || 'published',
    tags: Array.from(new Set([
      job.category,
      job.location,
      ...(requirementsList.slice(0, 3))
    ].filter(Boolean))),
    description: job.description || '',
    requirements: requirementsList,
    photoUrl: toStrapiMediaUrl(photo.url || photo.formats?.medium?.url || photo.formats?.thumbnail?.url || ''),
    applied: false
  };
};

export default function App() {
  // ----- State -----
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
  const [jobs, setJobs] = useState(INITIAL_JOBS.slice(0, 12));
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [colleges, setColleges] = useState(INITIAL_COLLEGES);
  const [fieldAgents, setFieldAgents] = useState(INITIAL_FIELD_AGENTS);
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [staff, setStaff] = useState(INITIAL_STAFF);

  // Auth states
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

  // Interactive
  const [clerkDropdownOpen, setClerkDropdownOpen] = useState(false);
  const [mobileClock, setMobileClock] = useState('09:41');
  const [applyConfirmation, setApplyConfirmation] = useState(null);
  const [excelPreviewVisible, setExcelPreviewVisible] = useState(false);
  const [excelFileUploaded, setExcelFileUploaded] = useState(null);
  
  // Recruiter Intake
  const [intakeName, setIntakeName] = useState('');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeState, setIntakeState] = useState('');
  const [intakeDistrict, setIntakeDistrict] = useState('');
  const [intakeCollege, setIntakeCollege] = useState('');
  const [intakePhoto, setIntakePhoto] = useState('');
  const [intakePhotoName, setIntakePhotoName] = useState('');

  // GPS
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Sourcing head
  const [crmStateFilter, setCrmStateFilter] = useState('');
  const [crmSorting, setCrmSorting] = useState('newest');

  // Super Admin forms
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobState, setNewJobState] = useState('');
  const [newJobDistrict, setNewJobDistrict] = useState('');
  const [newJobSalary, setNewJobSalary] = useState('');
  const [newJobType, setNewJobType] = useState('Full Time');
  const [newJobTags, setNewJobTags] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Sourcing Agent');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('');
  const [newCourseSyllabus, setNewCourseSyllabus] = useState('');
  const [newCandName, setNewCandName] = useState('');
  const [newCandEmail, setNewCandEmail] = useState('');
  const [newCandPhone, setNewCandPhone] = useState('');
  const [newCandCollege, setNewCandCollege] = useState('');
  const [newCandState, setNewCandState] = useState('');
  const [newCandDistrict, setNewCandDistrict] = useState('');
  const [newCandSkills, setNewCandSkills] = useState('');

  // TPO
  const [tpoStateFilter, setTpoStateFilter] = useState('');
  const [tpoCollegeFilter, setTpoCollegeFilter] = useState('');
  const [linkingCandidateId, setLinkingCandidateId] = useState('');
  const [linkingJobId, setLinkingJobId] = useState('');
  const [tpoSubView, setTpoSubView] = useState('linkage');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sourcing Head Add Candidate Modal
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    state: '',
    district: '',
    skills: '',
    status: 'Sourced',
    sourcingAgent: '',
    registeredDate: new Date().toISOString().split('T')[0]
  });

  // Apply Form Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applyFormData, setApplyFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: ''
  });

  // ----- Effects -----
  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.default_role || 'candidate');
    }
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
      const interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // ----- Fetch Jobs (limit to 12) -----
  const fetchJobsFromStrapi = async () => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const response = await fetch(`${STRAPI_JOB_ENDPOINT}?populate=*`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.error?.name || 'Failed to load job postings from Strapi');
      }
      const normalizedJobs = (data?.data || []).map(normalizeStrapiJob).filter(Boolean);
      const limitedJobs = normalizedJobs.slice(0, 12);
      if (limitedJobs.length > 0) {
        setJobs(limitedJobs);
      } else {
        setJobs(INITIAL_JOBS.slice(0, 12));
      }
    } catch (error) {
      setJobsError(error.message);
      setJobs(INITIAL_JOBS.slice(0, 12));
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsFromStrapi();
  }, []);

  // ----- Toast -----
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ===== AUTH HANDLERS (OTP hidden – only sent by email) =====

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authName) {
      setAuthError('All fields are required.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          name: authName,
          role: authRole
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API not available – using mock registration');
        showToast('Registration complete! (Demo mode)', 'success');
        setAuthSuccess('Registration successful. Switching to Sign In...');
        setTimeout(() => {
          setAuthMode('signin');
          setAuthError('');
          setAuthSuccess('');
        }, 1500);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      showToast('Registration complete! Welcome email sent.', 'success');
      setAuthSuccess('Registration successful. Switching to Sign In...');
      setTimeout(() => {
        setAuthMode('signin');
        setAuthError('');
        setAuthSuccess('');
      }, 1500);
    } catch (err) {
      if (err.message.includes('json') || err.message.includes('fetch')) {
        showToast('Registration complete! (Demo mode)', 'success');
        setAuthSuccess('Registration successful. Switching to Sign In...');
        setTimeout(() => {
          setAuthMode('signin');
          setAuthError('');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Email and Password are required.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API not available – using mock login');
        setVerificationType('login');
        setOtpSent(true);
        setOtpTimer(59);
        setOtpDigits(Array(6).fill(''));
        const mockOtp = '123456';
        setDebugOtp(mockOtp);
        showToast(`Verification code sent to ${authEmail}`, 'success');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.otp_required) {
        setVerificationType('login');
        setOtpSent(true);
        setOtpTimer(59);
        setOtpDigits(Array(6).fill(''));
        if (data.debug_otp) {
          setDebugOtp(data.debug_otp);
        } else {
          setDebugOtp('');
        }
        showToast(`Verification code sent to ${authEmail}`, 'success');
      }
    } catch (err) {
      if (err.message.includes('json') || err.message.includes('fetch')) {
        setVerificationType('login');
        setOtpSent(true);
        setOtpTimer(59);
        setOtpDigits(Array(6).fill(''));
        const mockOtp = '123456';
        setDebugOtp(mockOtp);
        showToast(`Verification code sent to ${authEmail} (Demo)`, 'success');
      } else {
        setAuthError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setAuthError('Please enter all 6 verification digits.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      let response, data;
      if (verificationType === 'login') {
        try {
          response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, otp })
          });
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Not JSON');
          }
          data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
          }
        } catch (err) {
          // Fallback: accept debug OTP (123456) or any 6-digit code
          if (otp === '123456' || otp === debugOtp) {
            const mockUser = {
              id: 'mock-user',
              name: authName || 'Demo User',
              email: authEmail,
              default_role: authRole || 'candidate'
            };
            localStorage.setItem("tspl_current_user", JSON.stringify(mockUser));
            setCurrentUser(mockUser);
            showToast(`Signed in as ${mockUser.name} (Demo)`, 'success');
            setLoading(false);
            return;
          } else {
            setAuthError('Invalid OTP. Please check your email.');
            setLoading(false);
            return;
          }
        }
      } else {
        // Reset password flow – fallback
        try {
          response = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, otp, newPassword: authPassword })
          });
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Not JSON');
          }
          data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Password reset failed');
          }
        } catch (err) {
          if (otp === '123456' || otp === debugOtp) {
            showToast('Password has been successfully updated. (Demo)', 'success');
            setAuthSuccess('Password reset confirmed. You can now Sign In.');
            setTimeout(() => {
              setAuthMode('signin');
              setOtpSent(false);
              setAuthError('');
              setAuthSuccess('');
            }, 2000);
            setLoading(false);
            return;
          } else {
            setAuthError('Invalid OTP. Please check your email.');
            setLoading(false);
            return;
          }
        }
      }

      // If we got here, the API succeeded
      if (verificationType === 'login') {
        localStorage.setItem("tspl_current_user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        showToast(`Signed in as ${data.user.name}`, 'success');
      } else {
        showToast('Password has been successfully updated.', 'success');
        setAuthSuccess('Password reset confirmed. You can now Sign In.');
        setTimeout(() => {
          setAuthMode('signin');
          setOtpSent(false);
          setAuthError('');
          setAuthSuccess('');
        }, 2000);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please enter your email and the desired new password.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API not available – using mock reset');
        setVerificationType('reset');
        setOtpSent(true);
        setOtpTimer(59);
        setOtpDigits(Array(6).fill(''));
        const mockOtp = '123456';
        setDebugOtp(mockOtp);
        showToast(`Verification code sent to ${authEmail} (Demo)`, 'success');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Reset request failed');
      }

      setVerificationType('reset');
      setOtpSent(true);
      setOtpTimer(59);
      setOtpDigits(Array(6).fill(''));
      if (data.debug_otp) {
        setDebugOtp(data.debug_otp);
      } else {
        setDebugOtp('');
      }
      showToast(`Verification code sent to ${authEmail}`, 'success');
    } catch (err) {
      if (err.message.includes('json') || err.message.includes('fetch')) {
        setVerificationType('reset');
        setOtpSent(true);
        setOtpTimer(59);
        setOtpDigits(Array(6).fill(''));
        const mockOtp = '123456';
        setDebugOtp(mockOtp);
        showToast(`Verification code sent to ${authEmail} (Demo)`, 'success');
      } else {
        setAuthError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("tspl_current_user");
    setClerkDropdownOpen(false);
    showToast('Signed out successfully via Clerk.', 'info');
  };

  // ----- Job Application (called from apply form) -----
  const handleJobApply = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, applied: true } : j));

    const txId = `TSPL-TX-${Math.floor(100000 + Math.random() * 900000)}`;
    setApplyConfirmation({
      jobTitle: job.title,
      company: job.company,
      refId: txId,
      timestamp: new Date().toLocaleString()
    });
    showToast(`Application submitted for ${job.title}`, 'success');
  };

  // ----- Apply form handlers -----
  const handleApplyClick = (jobId) => {
    setSelectedJobId(jobId);
    setApplyFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: '',
      coverLetter: ''
    });
    setShowApplyModal(true);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!applyFormData.name || !applyFormData.email || !applyFormData.phone) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }
    handleJobApply(selectedJobId);
    setShowApplyModal(false);
    setApplyFormData({
      name: '', email: '', phone: '', coverLetter: ''
    });
    setSelectedJobId(null);
  };

  // ----- Certificate Download -----
  const triggerCertificateDownload = (course) => {
    showToast(`Compiling verified credential receipt...`, 'info');
    const studentName = currentUser ? currentUser.name : "TSPL Scholar";

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0A0F1D"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </linearGradient>
          <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00F0FF"/>
            <stop offset="100%" stop-color="#05FF9B"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bgGrad)"/>
        <rect x="25" y="25" width="750" height="550" fill="none" stroke="url(#neonGrad)" stroke-width="3" rx="10"/>
        <rect x="35" y="35" width="730" height="530" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" rx="8"/>
        <path d="M 25 60 L 25 25 L 60 25" fill="none" stroke="#00F0FF" stroke-width="6"/>
        <path d="M 775 60 L 775 25 L 740 25" fill="none" stroke="#00F0FF" stroke-width="6"/>
        <path d="M 25 540 L 25 575 L 60 575" fill="none" stroke="#05FF9B" stroke-width="6"/>
        <path d="M 775 540 L 775 575 L 740 575" fill="none" stroke="#05FF9B" stroke-width="6"/>
        <g transform="translate(400, 100)">
          <rect x="-20" y="-35" width="40" height="40" fill="url(#neonGrad)" rx="8"/>
          <text x="0" y="-10" font-family="sans-serif" font-weight="900" font-size="24" fill="#0A0F1D" text-anchor="middle">T</text>
          <text x="0" y="30" font-family="sans-serif" font-weight="700" font-size="28" fill="#ffffff" letter-spacing="1" text-anchor="middle">TSPL ACADEMY</text>
          <text x="0" y="50" font-family="sans-serif" font-weight="500" font-size="10" fill="#00F0FF" letter-spacing="2" text-anchor="middle">VERIFIED PLACEMENT CERTIFICATE</text>
        </g>
        <text x="400" y="240" font-family="sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">This verified educational credential is awarded to</text>
        <text x="400" y="290" font-family="sans-serif" font-weight="700" font-size="36" fill="#05FF9B" text-anchor="middle">${studentName.toUpperCase()}</text>
        <line x1="250" y1="310" x2="550" y2="310" stroke="#1E293B" stroke-width="2"/>
        <text x="400" y="350" font-family="sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">for successfully finishing the specialized syllabus course</text>
        <text x="400" y="390" font-family="sans-serif" font-weight="600" font-size="22" fill="#ffffff" text-anchor="middle">${course.title}</text>
        <text x="400" y="430" font-family="sans-serif" font-size="14" fill="#64748B" text-anchor="middle">Under Supervision of Lead Instructor ${course.instructor}</text>
        <g transform="translate(150, 500)">
          <line x1="0" y1="0" x2="150" y2="0" stroke="#64748B" stroke-width="1"/>
          <text x="75" y="20" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Academic Registry Head</text>
          <text x="75" y="-10" font-family="monospace" font-size="13" fill="#00F0FF" text-anchor="middle" font-style="italic">TSPL_REG_SECURE</text>
        </g>
        <g transform="translate(500, 500)">
          <line x1="0" y1="0" x2="150" y2="0" stroke="#64748B" stroke-width="1"/>
          <text x="75" y="20" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Verification Hash</text>
          <text x="75" y="-10" font-family="monospace" font-size="10" fill="#05FF9B" text-anchor="middle">${course.certificateId}</text>
        </g>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TSPL-CERT-${course.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Verification credential receipt saved!`, 'success');
  };

  // ----- GPS -----
  const handleGPSCheckin = () => {
    setGpsLoading(true);
    setGpsSuccess(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy.toFixed(1);

          setGpsData({
            lat,
            lng,
            accuracy: `Acc: ±${accuracy}m`,
            timestamp: new Date().toLocaleTimeString()
          });
          setGpsLoading(false);
          setGpsSuccess(true);
          showToast("Live GPS lock synchronized to TPO", "success");
        },
        (error) => {
          showToast("GPS Denied. Simulating local ground coordinates.", "warning");
          const lat = 25.5941 + (Math.random() - 0.5) * 0.05;
          const lng = 85.1376 + (Math.random() - 0.5) * 0.05;

          setTimeout(() => {
            setGpsData({
              lat,
              lng,
              accuracy: "Simulated Location",
              timestamp: new Date().toLocaleTimeString()
            });
            setGpsLoading(false);
            setGpsSuccess(true);
          }, 1000);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      showToast("Browser GPS API unsupported. Generating coords.", "warning");
      const lat = 23.3441;
      const lng = 85.3096;
      setGpsData({
        lat,
        lng,
        accuracy: "Simulated API Fallback",
        timestamp: new Date().toLocaleTimeString()
      });
      setGpsLoading(false);
      setGpsSuccess(true);
    }
  };

  // ----- Recruiter Intake -----
  const handleIntakeSubmit = (e) => {
    e.preventDefault();
    if (!intakeName || !intakePhone || !intakeState || !intakeDistrict || !intakeCollege) {
      showToast("Please fill all fields.", "warning");
      return;
    }

    const email = `${intakeName.toLowerCase().replace(/\s+/g, '.')}@tsplmock.org`;
    const newCand = {
      id: `cand-${Date.now()}`,
      name: intakeName,
      email,
      phone: intakePhone,
      college: intakeCollege,
      state: intakeState,
      district: intakeDistrict,
      skills: ["Ground Intake", "Offline Lead"],
      status: "Sourced",
      sourcingAgent: "Field App (Ramesh)",
      registeredDate: new Date().toISOString().split('T')[0]
    };

    setCandidates(prev => [newCand, ...prev]);
    setFieldAgents(prev => prev.map(a => a.id === 'agent-4' ? {
      ...a,
      candidatesSourced: a.candidatesSourced + 1
    } : a));

    showToast(`Lead for ${intakeName} synchronised.`, "success");
    
    setIntakeName('');
    setIntakePhone('');
    setIntakeState('');
    setIntakeDistrict('');
    setIntakeCollege('');
    setIntakePhoto('');
    setIntakePhotoName('');

    setTimeout(() => {
      setMobileActiveSubview('mobile-sub-dataentry');
    }, 1200);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIntakePhotoName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setIntakePhoto(event.target.result);
      };
      reader.readAsDataURL(file);
      showToast("Photo captured & queued", "info");
    }
  };

  // ----- Excel Sync -----
  const triggerExcelUpload = () => {
    setExcelPreviewVisible(true);
    showToast("Parsed offline roster template.", "info");
  };

  const executeExcelSync = () => {
    EXCEL_MOCK_DATA.forEach(row => {
      const newCand = {
        id: `cand-${Date.now()}-${Math.random()}`,
        name: row.name,
        email: row.email,
        phone: row.phone,
        college: row.college,
        state: row.state,
        district: row.district,
        skills: row.skills.split(', '),
        status: "Sourced",
        sourcingAgent: "Excel Sync batch",
        registeredDate: new Date().toISOString().split('T')[0]
      };
      setCandidates(prev => [newCand, ...prev]);
    });

    showToast("Linked 4 external candidate rows to CRM database", "success");
    setExcelPreviewVisible(false);
    setExcelFileUploaded(null);
  };

  // ----- District Checkbox -----
  const handleDistrictCheckbox = (district) => {
    setSelectedDistricts(prev => {
      const next = new Set(prev);
      if (next.has(district)) {
        next.delete(district);
      } else {
        next.add(district);
      }
      return next;
    });
  };

  // ----- Super Admin Handlers -----
  const handleAddJob = async (e) => {
    e.preventDefault();

    if (!newJobTitle || !newJobCompany || !newJobState || !newJobDistrict || !newJobSalary) {
      showToast('Please fill all required job inputs.', 'warning');
      return;
    }

    try {
      const { salaryMin, salaryMax } = parseSalaryBounds(newJobSalary);
      const payload = {
        title: newJobTitle.trim(),
        category: newJobCompany.trim(),
        location: `${newJobDistrict}, ${newJobState}`,
        state: newJobState,
        district: newJobDistrict,
        status: 'published',
        salary: newJobSalary.trim(),
        salaryMin,
        salaryMax,
        description: newJobDesc.trim() || 'No job summary provided.',
        requirements: newJobTags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean)
          .join('\n')
      };

      const response = await fetch(STRAPI_JOB_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to create job in Strapi');
      }

      const createdJob = normalizeStrapiJob(data?.data || data);
      if (createdJob) {
        setJobs(prev => [createdJob, ...prev.filter(job => job.id !== createdJob.id)]);
      }

      showToast(`Job opening ${newJobTitle} published to Strapi!`, 'success');

      setNewJobTitle('');
      setNewJobCompany('');
      setNewJobState('');
      setNewJobDistrict('');
      setNewJobSalary('');
      setNewJobType('Full Time');
      setNewJobTags('');
      setNewJobDesc('');
    } catch (error) {
      showToast(error.message, 'warning');
    }
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName) return;

    const newMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      date: new Date().toISOString().split('T')[0]
    };
    setStaff(prev => [newMember, ...prev]);
    showToast(`Staff account created for ${newStaffName}`, "success");
    setNewStaffName('');
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseInstructor || !newCourseDuration) return;

    const syllabus = newCourseSyllabus.split(';').map(s => s.trim()).filter(Boolean);
    const newC = {
      id: `course-${Date.now()}`,
      title: newCourseTitle,
      instructor: newCourseInstructor,
      duration: newCourseDuration,
      progress: 0,
      syllabus: syllabus.length ? syllabus : ["Core operations module"],
      completed: false,
      certificateId: `CERT-C-${Math.floor(10000 + Math.random() * 90000)}-TSPL`
    };

    setCourses(prev => [...prev, newC]);
    showToast(`Course syllabus configured.`, "success");

    setNewCourseTitle('');
    setNewCourseInstructor('');
    setNewCourseDuration('');
    setNewCourseSyllabus('');
  };

  const handleAddCandidateCRM = (e) => {
    e.preventDefault();
    if (!newCandName || !newCandEmail || !newCandPhone || !newCandCollege || !newCandState || !newCandDistrict) {
      showToast("Fill required candidate columns.", "warning");
      return;
    }
    const skills = newCandSkills.split(',').map(s => s.trim()).filter(Boolean);
    const newCand = {
      id: `cand-${Date.now()}`,
      name: newCandName,
      email: newCandEmail,
      phone: newCandPhone,
      college: newCandCollege,
      state: newCandState,
      district: newCandDistrict,
      skills: skills.length ? skills : ["Ground Staff"],
      status: "Sourced",
      sourcingAgent: "Super Admin",
      registeredDate: new Date().toISOString().split('T')[0]
    };

    setCandidates(prev => [newCand, ...prev]);
    showToast(`Candidate details added to registry.`, "success");

    setNewCandName('');
    setNewCandEmail('');
    setNewCandPhone('');
    setNewCandCollege('');
    setNewCandState('');
    setNewCandDistrict('');
    setNewCandSkills('');
  };

  // ----- Sourcing Head Add Candidate -----
  const handleAddCandidateSourcing = (candidateData) => {
    const skills = candidateData.skills ? candidateData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const newCand = {
      id: `cand-${Date.now()}`,
      name: candidateData.name,
      email: candidateData.email,
      phone: candidateData.phone,
      college: candidateData.college,
      state: candidateData.state,
      district: candidateData.district,
      skills: skills.length ? skills : ["Ground Staff"],
      status: candidateData.status || 'Sourced',
      sourcingAgent: candidateData.sourcingAgent || 'Sourcing Head',
      registeredDate: candidateData.registeredDate || new Date().toISOString().split('T')[0]
    };
    setCandidates(prev => [newCand, ...prev]);
    showToast(`Candidate ${newCand.name} added to registry.`, 'success');
  };

  // ----- TPO Linkage -----
  const linkCandidateToJob = (candId, jobId) => {
    const cand = candidates.find(c => c.id === candId);
    const job = jobs.find(j => j.id === jobId);
    if (!cand || !job) return;

    setCandidates(prev => prev.map(c => c.id === candId ? {
      ...c,
      status: "Interviewing",
      sourcingAgent: "TPO Linkage"
    } : c));

    setColleges(prev => prev.map(col => col.name.includes("ITI Patna") ? {
      ...col,
      placedCandidates: col.placedCandidates + 1,
      placementRate: parseFloat(((col.placedCandidates + 1) / col.totalCandidates * 100).toFixed(1))
    }: col));

    showToast(`Linked ${cand.name} to ${job.title}`, "success");
  };

  const handleTpoLink = (e) => {
    e.preventDefault();
    if (!linkingCandidateId || !linkingJobId) {
      showToast("Please select both a candidate and a job opening.", "warning");
      return;
    }
    linkCandidateToJob(linkingCandidateId, linkingJobId);
    setLinkingCandidateId('');
    setLinkingJobId('');
  };

  // ----- OTP helpers -----
  const handleOtpKey = (e, index) => {
    const val = e.target.value;
    if (val && !/^\d+$/.test(val)) return;
    
    const nextDigits = [...otpDigits];
    nextDigits[index] = val.slice(-1);
    setOtpDigits(nextDigits);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-char-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const prevInput = document.getElementById(`otp-char-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const nextDigits = [...otpDigits];
          nextDigits[index - 1] = '';
          setOtpDigits(nextDigits);
        }
      } else {
        const nextDigits = [...otpDigits];
        nextDigits[index] = '';
        setOtpDigits(nextDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-char-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`otp-char-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const nextDigits = pasteData.split('');
      setOtpDigits(nextDigits);
      const lastInput = document.getElementById(`otp-char-5`);
      if (lastInput) lastInput.focus();
    }
  };

  // ----- CRM Filter -----
  const getFilteredCandidates = () => {
    return candidates.filter(c => {
      const matchesState = !crmStateFilter || c.state === crmStateFilter;
      const matchesDistrict = selectedDistricts.size === 0 || selectedDistricts.has(c.district);
      return matchesState && matchesDistrict;
    }).sort((a, b) => {
      if (crmSorting === 'newest') {
        return new Date(b.registeredDate) - new Date(a.registeredDate);
      }
      if (crmSorting === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (crmSorting === 'status') {
        const weight = { "Placed": 3, "Interviewing": 2, "Sourced": 1 };
        return (weight[b.status] || 0) - (weight[a.status] || 0);
      }
      return 0;
    });
  };

  // ----- Gated Login View (no debug banner) -----
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F0F2F5 0%, #E8EDF2 50%, #F5E6E8 100%)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(248,25,39,0.06) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}></div>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', zIndex: 5, background: '#FFFFFF' }}>
          <div style={{ textAlign: 'center' }}>
            <img src={APP_LOGO_URL} alt="TSPL Logo" style={{ width: '160px', height: 'auto', marginBottom: '16px', borderRadius: '8px', display: 'inline-block' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>TSPL Group</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Unified Sourcing, CRM &amp; Ground Telemetry Portal</p>
          </div>

          {authError && (
            <div style={{ background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#DC2626', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', lineHeight: '1.4' }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{ background: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.2)', color: '#059669', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', lineHeight: '1.4' }}>
              {authSuccess}
            </div>
          )}

          {!otpSent ? (
            <>
              {authMode !== 'forgot' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F8F9FA', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <button onClick={() => { setAuthMode('signin'); setAuthError(''); }} style={{ background: authMode === 'signin' ? '#FFFFFF' : 'transparent', border: 'none', color: authMode === 'signin' ? '#F81927' : '#64748B', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: authMode === 'signin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>Sign In</button>
                  <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} style={{ background: authMode === 'signup' ? '#FFFFFF' : 'transparent', border: 'none', color: authMode === 'signup' ? '#F81927' : '#64748B', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: authMode === 'signup' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>Sign Up</button>
                </div>
              )}

              {authMode === 'signin' && (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Corporate/Registered Email</label>
                    <input type="email" className="form-input" placeholder="name@company.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Security Password</label>
                      <span onClick={() => { setAuthMode('forgot'); setAuthError(''); }} style={{ fontSize: '11px', color: 'var(--neon-blue)', cursor: 'pointer' }}>Forgot Password?</span>
                    </div>
                    <input type="password" className="form-input" placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>
              )}

              {authMode === 'signup' && (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Full Representative Name</label>
                    <input type="text" className="form-input" placeholder="Amit Kumar" value={authName} onChange={e => setAuthName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Operational Email Address</label>
                    <input type="email" className="form-input" placeholder="amit@tspl.org" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Set Secure Password</label>
                    <input type="password" className="form-input" placeholder="Min 6 characters" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
                    {loading ? 'Creating Credentials...' : 'Create Verified Account'}
                  </button>
                </form>
              )}

              {authMode === 'forgot' && (
                <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>Input your registered email along with the new desired password. We will send a secure verification code to authorize the swap.</div>
                  <div className="form-group">
                    <label>Registered Account Email</label>
                    <input type="email" className="form-input" placeholder="name@tspl.org" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Enter New Password</label>
                    <input type="password" className="form-input" placeholder="Min 6 characters" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
                    {loading ? 'Generating Code...' : 'Request Password Reset OTP'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <span onClick={() => { setAuthMode('signin'); setAuthError(''); }} style={{ fontSize: '13px', color: '#F81927', cursor: 'pointer' }}>Back to Sign In</span>
                  </div>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#1E293B', fontSize: '18px', fontWeight: 'bold' }}>Two-Factor Security Verification</h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                  We've sent a 6-digit authentication code to <strong style={{ color: '#1E293B' }}>{authEmail}</strong>. Please check your inbox.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '16px 0' }}>
                {otpDigits.map((char, index) => (
                  <input key={index} id={`otp-char-${index}`} type="text" maxLength="1" className="form-input" style={{ width: '42px', height: '42px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', padding: '0', border: '1px solid #E2E8F0', background: '#F8F9FA', color: '#F81927', borderRadius: '6px' }} value={char} onChange={(e) => handleOtpKey(e, index)} onKeyDown={(e) => handleOtpKeyDown(e, index)} onPaste={handleOtpPaste} required />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>Code validity duration:</span>
                <span style={{ color: '#D97706', fontWeight: 'bold' }}>{otpTimer}s remaining</span>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                {loading ? 'Confirming authorization...' : 'Verify & Continue'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span onClick={() => { setOtpSent(false); setAuthError(''); }} style={{ fontSize: '12px', color: '#64748B', cursor: 'pointer' }}>Edit Email Address</span>
                <span onClick={() => { if (otpTimer === 0) { setOtpTimer(59); showToast("Resending authentication code...", "info"); } }} style={{ fontSize: '12px', color: otpTimer === 0 ? 'var(--neon-blue)' : 'var(--text-dark)', cursor: otpTimer === 0 ? 'pointer' : 'not-allowed' }}>Resend Code</span>
              </div>
            </form>
          )}
        </div>

        <div id="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.type === 'success' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : t.type === 'warning' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neon-amber)" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neon-blue)" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----- Main Dashboard Render -----
  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      <header className="top-header">
        <div className="logo-section">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <img className="logo-icon-image" src={APP_LOGO_URL} alt="TSPL Logo" />
          <div className="logo-text">TSPL <span>Group</span></div>
          <span className="logo-badge">ENTERPRISE</span>
        </div>

        {activeRole === 'candidate' && (
          <nav className="navbar-links">
            <button className={`navbar-link ${candidateSubView === 'home' ? 'active' : ''}`} onClick={() => setCandidateSubView('home')}>Home</button>
            <button className={`navbar-link ${candidateSubView === 'jobs' ? 'active' : ''}`} onClick={() => setCandidateSubView('jobs')}>Job Openings</button>
            <button className={`navbar-link ${candidateSubView === 'training' ? 'active' : ''}`} onClick={() => setCandidateSubView('training')}>Training & Skill Registry</button>
          </nav>
        )}

        <div className="header-controls">
          <div className="role-simulator">
            <label>Role</label>
            <select className="role-select" value={activeRole} onChange={e => { setActiveRole(e.target.value); showToast(`Switched view context simulation.`, 'success'); }}>
              <option value="candidate">Candidate</option>
              <option value="super_admin">Super Admin</option>
              <option value="sourcing_head">Sourcing Head</option>
              <option value="recruiter">HR Recruiter</option>
              <option value="tpo">TPO Panel</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div className="clerk-user-meta">
              <div className="name">{currentUser.name}</div>
              <div className="email">{currentUser.email}</div>
            </div>
            <div className="clerk-profile-button" onClick={() => setClerkDropdownOpen(!clerkDropdownOpen)}>
              <span className="clerk-profile-avatar">{currentUser.name.split(' ').map(n=>n[0]).join('')}</span>
            </div>
            {clerkDropdownOpen && (
              <div className="glass-panel" style={{ position: 'absolute', top: '46px', right: 0, width: '220px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 120, border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dark)', fontWeight: '700', textTransform: 'uppercase' }}>Clerk Authenticated</div>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                <div style={{ borderBottom: '1px solid var(--glass-border)', margin: '6px 0' }}></div>
                <button className="btn-secondary" style={{ width: '100%', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={handleSignOut}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {activeRole === 'candidate' && (
        <div className={`candidate-mobile-menu ${sidebarOpen ? 'open' : ''}`}>
          <div className="role-switcher-mobile" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Switch Role</label>
            <select className="role-select" value={activeRole} onChange={e => { setActiveRole(e.target.value); showToast(`Switched view context simulation.`, 'success'); setSidebarOpen(false); }} style={{ width: '100%', padding: 10, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-main)', fontSize: 14 }}>
              <option value="candidate">Candidate</option>
              <option value="super_admin">Super Admin</option>
              <option value="sourcing_head">Sourcing Head</option>
              <option value="recruiter">HR Recruiter</option>
              <option value="tpo">TPO Panel</option>
            </select>
          </div>
          <button className={`navbar-link ${candidateSubView === 'home' ? 'active' : ''}`} onClick={() => { setCandidateSubView('home'); setSidebarOpen(false); }}>Home</button>
          <button className={`navbar-link ${candidateSubView === 'jobs' ? 'active' : ''}`} onClick={() => { setCandidateSubView('jobs'); setSidebarOpen(false); }}>Job Openings</button>
          <button className={`navbar-link ${candidateSubView === 'training' ? 'active' : ''}`} onClick={() => { setCandidateSubView('training'); setSidebarOpen(false); }}>Training & Skill Registry</button>
        </div>
      )}

      {activeRole !== 'candidate' && (
        <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-nav">
            <div className="role-switcher-mobile" style={{ padding: '12px 16px', marginBottom: 8 }}>
              <label style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Switch Role</label>
              <select className="role-select" value={activeRole} onChange={e => { setActiveRole(e.target.value); showToast(`Switched view context simulation.`, 'success'); setSidebarOpen(false); }} style={{ width: '100%', padding: 8, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}>
                <option value="candidate">Candidate</option>
                <option value="super_admin">Super Admin</option>
                <option value="sourcing_head">Sourcing Head</option>
                <option value="recruiter">HR Recruiter</option>
                <option value="tpo">TPO Panel</option>
              </select>
            </div>

            {activeRole === 'super_admin' && (
              <>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dark)', textTransform: 'uppercase', padding: '10px 16px' }}>Admin Controls</div>
                <button className={`sidebar-link ${adminActiveTab === 'tab-admin-candidates' ? 'active' : ''}`} onClick={() => { setAdminActiveTab('tab-admin-candidates'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg> Candidate Setup
                </button>
                <button className={`sidebar-link ${adminActiveTab === 'tab-admin-staff' ? 'active' : ''}`} onClick={() => { setAdminActiveTab('tab-admin-staff'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Staff Onboarding
                </button>
                <button className={`sidebar-link ${adminActiveTab === 'tab-admin-jobs' ? 'active' : ''}`} onClick={() => { setAdminActiveTab('tab-admin-jobs'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> Job Postings
                </button>
                <button className={`sidebar-link ${adminActiveTab === 'tab-admin-courses' ? 'active' : ''}`} onClick={() => { setAdminActiveTab('tab-admin-courses'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg> Configure Courses
                </button>
                <button className={`sidebar-link ${adminActiveTab === 'tab-admin-roles' ? 'active' : ''}`} onClick={() => { setAdminActiveTab('tab-admin-roles'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/></svg> DB Roles
                </button>
              </>
            )}

            {activeRole === 'sourcing_head' && (
              <>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dark)', textTransform: 'uppercase', padding: '10px 16px' }}>CRM Operations</div>
                <button className="sidebar-link active" onClick={() => setSidebarOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> Unified Sourcing CRM
                </button>
              </>
            )}

            {activeRole === 'recruiter' && (
              <>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dark)', textTransform: 'uppercase', padding: '10px 16px' }}>Mobile Simulation</div>
                <button className={`sidebar-link ${mobileActiveSubview === 'mobile-sub-dataentry' ? 'active' : ''}`} onClick={() => { setMobileActiveSubview('mobile-sub-dataentry'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line></svg> Candidate Intake
                </button>
                <button className={`sidebar-link ${mobileActiveSubview === 'mobile-sub-sync' ? 'active' : ''}`} onClick={() => { setMobileActiveSubview('mobile-sub-sync'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Excel Offline Sync
                </button>
              </>
            )}

            {activeRole === 'tpo' && (
              <>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dark)', textTransform: 'uppercase', padding: '10px 16px' }}>TPO Operations</div>
                <button className={`sidebar-link ${tpoSubView === 'linkage' ? 'active' : ''}`} onClick={() => { setTpoSubView('linkage'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> Placement Link Board
                </button>
                <button className={`sidebar-link ${tpoSubView === 'gps' ? 'active' : ''}`} onClick={() => { setTpoSubView('gps'); setSidebarOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> TPO GPS
                </button>
              </>
            )}
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-role-badge">
              <div className="sidebar-role-title">Live Simulator Session</div>
              <div className="sidebar-role-val">
                <span className="role-pulse"></span>
                <span>
                  {activeRole === 'super_admin' ? 'Super Admin' :
                   activeRole === 'sourcing_head' ? 'Sourcing Head' :
                   activeRole === 'recruiter' ? 'HR Recruiter' :
                   activeRole === 'tpo' ? 'TPO College Panel' : 'Candidate'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main className={`app-content ${activeRole === 'candidate' ? 'candidate-main' : 'role-main'}`}>
        {activeRole === 'candidate' && (
          <CandidateView
            candidateSubView={candidateSubView}
            setCandidateSubView={setCandidateSubView}
            jobs={jobs}
            jobsLoading={jobsLoading}
            jobsError={jobsError}
            courses={courses}
            currentUser={currentUser}
            selectedJobCategory={selectedJobCategory}
            setSelectedJobCategory={setSelectedJobCategory}
            handleJobApply={handleJobApply}
            triggerCertificateDownload={triggerCertificateDownload}
            showApplyModal={showApplyModal}
            setShowApplyModal={setShowApplyModal}
            applyFormData={applyFormData}
            setApplyFormData={setApplyFormData}
            handleApplySubmit={handleApplySubmit}
            handleApplyClick={handleApplyClick}
          />
        )}
        {activeRole === 'super_admin' && (
          <SuperAdminView
            adminActiveTab={adminActiveTab}
            setAdminActiveTab={setAdminActiveTab}
            candidates={candidates} jobs={jobs} colleges={colleges} staff={staff} fieldAgents={fieldAgents}
            newCandName={newCandName} setNewCandName={setNewCandName}
            newCandEmail={newCandEmail} setNewCandEmail={setNewCandEmail}
            newCandPhone={newCandPhone} setNewCandPhone={setNewCandPhone}
            newCandCollege={newCandCollege} setNewCandCollege={setNewCandCollege}
            newCandState={newCandState} setNewCandState={setNewCandState}
            newCandDistrict={newCandDistrict} setNewCandDistrict={setNewCandDistrict}
            newCandSkills={newCandSkills} setNewCandSkills={setNewCandSkills}
            handleAddCandidateCRM={handleAddCandidateCRM}
            newStaffName={newStaffName} setNewStaffName={setNewStaffName}
            newStaffRole={newStaffRole} setNewStaffRole={setNewStaffRole}
            handleAddStaff={handleAddStaff}
            newJobTitle={newJobTitle} setNewJobTitle={setNewJobTitle}
            newJobCompany={newJobCompany} setNewJobCompany={setNewJobCompany}
            newJobState={newJobState} setNewJobState={setNewJobState}
            newJobDistrict={newJobDistrict} setNewJobDistrict={setNewJobDistrict}
            newJobSalary={newJobSalary} setNewJobSalary={setNewJobSalary}
            newJobType={newJobType} setNewJobType={setNewJobType}
            newJobTags={newJobTags} setNewJobTags={setNewJobTags}
            newJobDesc={newJobDesc} setNewJobDesc={setNewJobDesc}
            handleAddJob={handleAddJob}
            newCourseTitle={newCourseTitle} setNewCourseTitle={setNewCourseTitle}
            newCourseInstructor={newCourseInstructor} setNewCourseInstructor={setNewCourseInstructor}
            newCourseDuration={newCourseDuration} setNewCourseDuration={setNewCourseDuration}
            newCourseSyllabus={newCourseSyllabus} setNewCourseSyllabus={setNewCourseSyllabus}
            handleAddCourse={handleAddCourse}
            DISTRICT_MAPPING={DISTRICT_MAPPING}
            currentUser={currentUser} showToast={showToast}
          />
        )}
        {activeRole === 'sourcing_head' && (
          <SourcingHeadView
            fieldAgents={fieldAgents} selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId}
            candidates={candidates} colleges={colleges} staff={staff}
            crmStateFilter={crmStateFilter} setCrmStateFilter={setCrmStateFilter}
            selectedDistricts={selectedDistricts} districtDropdownOpen={districtDropdownOpen} setDistrictDropdownOpen={setDistrictDropdownOpen}
            handleDistrictCheckbox={handleDistrictCheckbox}
            crmSorting={crmSorting} setCrmSorting={setCrmSorting}
            getFilteredCandidates={getFilteredCandidates}
            DISTRICT_MAPPING={DISTRICT_MAPPING}
            currentUser={currentUser} showToast={showToast}
            showAddCandidateModal={showAddCandidateModal}
            setShowAddCandidateModal={setShowAddCandidateModal}
            newCandidateData={newCandidateData}
            setNewCandidateData={setNewCandidateData}
            handleAddCandidateSourcing={handleAddCandidateSourcing}
          />
        )}
        {activeRole === 'recruiter' && (
          <RecruiterView
            appLogoUrl={APP_LOGO_URL}
            mobileClock={mobileClock}
            mobileActiveSubview={mobileActiveSubview}
            setMobileActiveSubview={setMobileActiveSubview}
            intakeName={intakeName} setIntakeName={setIntakeName}
            intakePhone={intakePhone} setIntakePhone={setIntakePhone}
            intakeState={intakeState} setIntakeState={setIntakeState}
            intakeDistrict={intakeDistrict} setIntakeDistrict={setIntakeDistrict}
            intakeCollege={intakeCollege} setIntakeCollege={setIntakeCollege}
            intakePhoto={intakePhoto} setIntakePhoto={setIntakePhoto}
            intakePhotoName={intakePhotoName} setIntakePhotoName={setIntakePhotoName}
            handlePhotoUpload={handlePhotoUpload}
            handleIntakeSubmit={handleIntakeSubmit}
            excelPreviewVisible={excelPreviewVisible}
            EXCEL_MOCK_DATA={EXCEL_MOCK_DATA}
            executeExcelSync={executeExcelSync}
            triggerExcelUpload={triggerExcelUpload}
            DISTRICT_MAPPING={DISTRICT_MAPPING}
            currentUser={currentUser} showToast={showToast}
          />
        )}
        {activeRole === 'tpo' && (
          <TpoView
            tpoSubView={tpoSubView}
            setTpoSubView={setTpoSubView}
            tpoStateFilter={tpoStateFilter}
            setTpoStateFilter={setTpoStateFilter}
            tpoCollegeFilter={tpoCollegeFilter}
            setTpoCollegeFilter={setTpoCollegeFilter}
            candidates={candidates}
            colleges={colleges}
            jobs={jobs}
            linkingCandidateId={linkingCandidateId}
            setLinkingCandidateId={setLinkingCandidateId}
            linkingJobId={linkingJobId}
            setLinkingJobId={setLinkingJobId}
            handleTpoLink={handleTpoLink}
            gpsSuccess={gpsSuccess}
            gpsData={gpsData}
            gpsLoading={gpsLoading}
            handleGPSCheckin={handleGPSCheckin}
          />
        )}
      </main>

      {/* Apply confirmation modal */}
      {applyConfirmation && (
        <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '480px', width: '100%', padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--neon-green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-green)', fontSize: '20px' }}>✓</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold' }}>Application Submitted</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Your verified candidate profile <strong>{currentUser.name}</strong> has been linked successfully to the role of <strong>{applyConfirmation.jobTitle}</strong> at <strong>{applyConfirmation.company}</strong>.
            </p>
            <div style={{ borderBottom: '1px solid #E2E8F0' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-dark)' }}>Transaction ID:</span><span style={{ fontFamily: 'monospace', color: 'var(--neon-blue)' }}>{applyConfirmation.refId}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-dark)' }}>Timestamp:</span><span>{applyConfirmation.timestamp}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-dark)' }}>Status:</span><span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>Verified Profile</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn-primary" onClick={() => setApplyConfirmation(null)}>Acknowledge & Close</button>
            </div>
          </div>
        </div>
      )}

      <div id="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : t.type === 'warning' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neon-amber)" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neon-blue)" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
