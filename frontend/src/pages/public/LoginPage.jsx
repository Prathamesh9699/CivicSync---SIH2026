import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Leaf, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  UserPlus, 
  Eye, 
  EyeOff,
  Briefcase,
  Layers,
  Sparkles,
  Truck,
  Wrench
} from 'lucide-react';
import { getStoredTeams } from '../../data/teams';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Portal selection: 'citizen' | 'municipal' | 'worker' | 'admin'
  const initialPortal = searchParams.get('portal') || (location.pathname.includes('municipal') ? 'municipal' : location.pathname.includes('worker') ? 'worker' : location.pathname.includes('admin') ? 'admin' : 'citizen');
  const [selectedPortal, setSelectedPortal] = useState(initialPortal);

  // Auth Mode: 'login' or 'register'
  const [isRegisterMode, setIsRegisterMode] = useState(location.pathname === '/register');

  // Common Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // Citizen Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWard, setRegWard] = useState('Ward 12 - Shivaji Nagar');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Municipal / Worker Specific Fields
  const [regDesignation, setRegDesignation] = useState('Zonal Sanitation Officer');
  const [regDepartment, setRegDepartment] = useState('Solid Waste Management Division');

  const [regErrors, setRegErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSquads, setRegisteredSquads] = useState([]);

  // Load registered squads from persistent fleet store
  useEffect(() => {
    try {
      const activeTeams = getStoredTeams();
      setRegisteredSquads(activeTeams || []);
    } catch (e) {
      setRegisteredSquads([]);
    }
  }, [selectedPortal]);

  // Sync portal from URL params if changed
  useEffect(() => {
    const portalParam = searchParams.get('portal');
    if (portalParam && ['citizen', 'municipal', 'worker', 'admin'].includes(portalParam)) {
      setSelectedPortal(portalParam);
      if (portalParam === 'admin' || portalParam === 'municipal' || portalParam === 'worker') {
        setIsRegisterMode(false);
      }
    }
  }, [searchParams]);

  const handlePortalSwitch = (portalKey) => {
    setSelectedPortal(portalKey);
    setSearchParams({ portal: portalKey });
    setGeneralError('');
    setLoginErrors({});
    setRegErrors({});
    if (portalKey === 'admin' || portalKey === 'municipal' || portalKey === 'worker') {
      setIsRegisterMode(false);
    }
  };

  const handleAutofillRole = (roleKey) => {
    setSelectedPortal(roleKey);
    setSearchParams({ portal: roleKey });
    setGeneralError('');
    setLoginErrors({});
    setIsRegisterMode(false);

    if (roleKey === 'citizen') {
      setLoginEmail('prathamesh@cleantrack.gov');
      setLoginPassword('Prathamesh@123');
    } else if (roleKey === 'municipal') {
      setLoginEmail('officer@cleantrack.gov');
      setLoginPassword('Municipal@123');
    } else if (roleKey === 'worker') {
      const activeSquads = getStoredTeams();
      if (activeSquads && activeSquads.length > 0) {
        const sq = activeSquads[0];
        setLoginEmail(sq.leaderUsername || 'worker');
        setLoginPassword(sq.leaderPassword || 'Worker@123');
      } else {
        setLoginEmail('');
        setLoginPassword('');
        showToast({
          title: "No Squads Registered",
          message: "No squad worker accounts found. Log in as Municipal Officer to register squads & worker logins.",
          type: "info"
        });
      }
    } else if (roleKey === 'admin') {
      setLoginEmail('admin@cleantrack.gov');
      setLoginPassword('Admin@123');
    }
  };

  const handleAutofillSquad = (username, password) => {
    setSelectedPortal('worker');
    setSearchParams({ portal: 'worker' });
    setGeneralError('');
    setLoginErrors({});
    setIsRegisterMode(false);
    setLoginEmail(username);
    setLoginPassword(password);
  };

  // Validation helpers
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = (phone) => {
    const clean = phone.replace(/[\s\-\(\)\+]/g, '');
    return /^(91)?[6-9]\d{9}$/.test(clean);
  };

  const validateLoginForm = () => {
    const errors = {};
    if (!loginEmail.trim()) {
      errors.email = selectedPortal === 'worker' ? 'Squad leader username or email is required.' : 'Username or Email is required.';
    }

    if (!loginPassword) {
      errors.password = 'Password is required.';
    } else if (loginPassword.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors = {};

    if (!regName.trim()) {
      errors.name = selectedPortal === 'municipal' ? 'Officer name is required.' : 'Full name is required.';
    } else if (regName.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long.';
    }

    if (!regEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(regEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!regPhone.trim()) {
      errors.phone = 'Mobile number is required.';
    } else if (!isValidPhone(regPhone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number (e.g. 9823011452).';
    }

    if (!regWard) {
      errors.ward = 'Please select an assigned municipal ward.';
    }

    if (selectedPortal === 'municipal' && !regDesignation.trim()) {
      errors.designation = 'Official designation is required.';
    }

    if (!regPassword) {
      errors.password = 'Password is required.';
    } else if (regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!regConfirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateLoginForm()) return;

    setLoading(true);

    try {
      const res = await login(loginEmail.trim(), loginPassword);
      setLoading(false);
      if (res.success) {
        if (res.user.role === 'citizen') navigate('/citizen/dashboard');
        else if (res.user.role === 'municipal_staff') navigate('/municipal/dashboard');
        else if (res.user.role === 'worker') navigate('/worker/dashboard');
        else if (res.user.role === 'administrator' || res.user.role === 'admin') navigate('/admin/dashboard');
      } else {
        setGeneralError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setLoading(false);
      setGeneralError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateRegisterForm()) return;

    setLoading(true);

    const userRole = selectedPortal === 'municipal' ? 'municipal_staff' : 'citizen';

    try {
      const res = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        ward: regWard,
        role: userRole,
        designation: selectedPortal === 'municipal' ? regDesignation.trim() : 'Citizen Contributor',
        department: selectedPortal === 'municipal' ? regDepartment.trim() : 'Civic Community',
        password: regPassword
      });

      setLoading(false);

      if (res.success) {
        showToast({
          title: "Account Created Successfully!",
          message: `Welcome, ${res.user.name}! Your Unique CleanTrack User ID is ${res.user.userId || 'CIT-2026'}.`,
          type: "success"
        });

        if (userRole === 'municipal_staff') {
          navigate('/municipal/dashboard');
        } else {
          navigate('/citizen/dashboard');
        }
      } else {
        setGeneralError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setLoading(false);
      setGeneralError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-900 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
        selectedPortal === 'municipal' ? 'bg-blue-500/15' : selectedPortal === 'worker' ? 'bg-amber-500/15' : selectedPortal === 'admin' ? 'bg-purple-500/15' : 'bg-emerald-500/15'
      }`}></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">
        
        {/* Left Visual Column */}
        <div className={`lg:col-span-5 p-8 text-white flex flex-col justify-between space-y-6 transition-all duration-500 ${
          selectedPortal === 'municipal' 
            ? 'bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950'
            : selectedPortal === 'worker'
            ? 'bg-gradient-to-br from-amber-900 via-orange-950 to-slate-950'
            : selectedPortal === 'admin'
            ? 'bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950'
            : 'bg-gradient-to-br from-emerald-900 via-forest-900 to-slate-900'
        }`}>
          <div>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-colors ${
                selectedPortal === 'municipal' ? 'bg-blue-600 shadow-blue-600/30' :
                selectedPortal === 'worker' ? 'bg-amber-600 shadow-amber-600/30' :
                selectedPortal === 'admin' ? 'bg-purple-600 shadow-purple-600/30' :
                'bg-emerald-500 shadow-emerald-500/30'
              }`}>
                {selectedPortal === 'municipal' ? <Building2 className="w-6 h-6" /> :
                 selectedPortal === 'worker' ? <Truck className="w-6 h-6" /> :
                 selectedPortal === 'admin' ? <Shield className="w-6 h-6" /> :
                 <Leaf className="w-6 h-6" />}
              </div>
              <span className="text-2xl font-extrabold tracking-tight">Clean<span className={
                selectedPortal === 'municipal' ? 'text-blue-400' :
                selectedPortal === 'worker' ? 'text-amber-400' :
                selectedPortal === 'admin' ? 'text-purple-400' :
                'text-emerald-400'
              }>Track</span></span>
            </Link>
            <p className="text-xs font-mono mt-2 uppercase tracking-wider text-slate-300">
              {selectedPortal === 'municipal' ? 'Municipal Operations & Field Triage' :
               selectedPortal === 'worker' ? 'Sanitation Worker Field Operations' :
               selectedPortal === 'admin' ? 'Central Smart City Governance' :
               'Smart City Citizen Portal'}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
              {selectedPortal === 'municipal' ? (
                <span>"Real-time municipal squad dispatch & verified cleanup operations."</span>
              ) : selectedPortal === 'worker' ? (
                <span>"Direct photo evidence clearance & on-ground sanitation execution."</span>
              ) : selectedPortal === 'admin' ? (
                <span>"Citywide analytics, SLA compliance & environmental intelligence."</span>
              ) : (
                <span>"Every verified report makes our city cleaner and greener."</span>
              )}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              {selectedPortal === 'municipal' ? (
                <span>Manage incoming citizen reports, inspect AI computer vision analysis, coordinate field sanitation trucks, and verify before/after photo clearance.</span>
              ) : selectedPortal === 'worker' ? (
                <span>View assigned field tasks, navigate to incident sites, initiate cleanup sweeps, and directly submit before/after evidence photos for verification.</span>
              ) : selectedPortal === 'admin' ? (
                <span>Manage user roles, monitor system SLA response times, inspect chronic GIS hotspots, and audit citywide environmental performance.</span>
              ) : (
                <span>Report neighborhood waste piles with automatic AI classification, verify municipal cleanups, and earn redeemable Civic Green Points.</span>
              )}
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-slate-200">
              {selectedPortal === 'municipal' ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Real-time Triage & Squad Dispatch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Before & After AI Photo Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Live Chronic GIS Hotspots Map</span>
                  </div>
                </>
              ) : selectedPortal === 'worker' ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Direct Photo Evidence Clearance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Assigned Squad Tasks & Navigation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Instant Verification Status Updates</span>
                  </div>
                </>
              ) : selectedPortal === 'admin' ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Role-Based Access Control (RBAC)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Automated SLA Escalation Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>City Environmental KPI Gauges</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>AI Automated Waste Detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Transparent Squad Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Civic Rewards & Green Points System</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            CleanTrack Platform Security • 4-Module RBAC
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-5 bg-white">
          
          {/* 1. TOP PORTAL MODULE SELECTOR (4 MODULES) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Choose Portal Module (4 System Roles)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePortalSwitch('citizen')}
                className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  selectedPortal === 'citizen'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                }`}
              >
                <Leaf className={`w-4 h-4 ${selectedPortal === 'citizen' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold block">Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('municipal')}
                className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  selectedPortal === 'municipal'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                }`}
              >
                <Building2 className={`w-4 h-4 ${selectedPortal === 'municipal' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold block">Municipal</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('worker')}
                className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  selectedPortal === 'worker'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                }`}
              >
                <Truck className={`w-4 h-4 ${selectedPortal === 'worker' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold block">Worker</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('admin')}
                className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  selectedPortal === 'admin'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm ring-1 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                }`}
              >
                <Shield className={`w-4 h-4 ${selectedPortal === 'admin' ? 'text-purple-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold block">Admin</span>
              </button>
            </div>
          </div>

          {/* Header Title */}
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {selectedPortal === 'admin'
                ? 'Administrator Sign In'
                : selectedPortal === 'municipal'
                ? 'Municipal Staff Sign In'
                : selectedPortal === 'worker'
                ? 'Sanitation Worker Sign In'
                : isRegisterMode
                ? 'Create Citizen Account'
                : 'Citizen Sign In'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedPortal === 'admin'
                ? 'Sign in with your central administrative credentials.'
                : selectedPortal === 'municipal'
                ? 'Sign in with credentials provisioned by your municipal department administrator.'
                : selectedPortal === 'worker'
                ? 'Sign in to access assigned tasks and upload post-cleanup photographic evidence directly.'
                : isRegisterMode
                ? 'Join CleanTrack to report neighborhood waste and earn Civic Green Points.'
                : 'Access your citizen dashboard to report waste and track neighborhood cleanups.'}
            </p>
          </div>

          {/* Toggle Tab between Sign In & Register (Rendered ONLY for Citizen) */}
          {selectedPortal === 'citizen' && (
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setGeneralError(''); setLoginErrors({}); setRegErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                  !isRegisterMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setGeneralError(''); setLoginErrors({}); setRegErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isRegisterMode 
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Citizen Registration</span>
              </button>
            </div>
          )}

          {/* General Alert Error Banner */}
          {generalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* FORM 1: LOGIN (Citizen, Municipal, or Admin) */}
          {!isRegisterMode ? (
            <form onSubmit={handleLogin} noValidate className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {selectedPortal === 'worker' ? 'Squad Leader Username or Email' : 'Username or Email Address'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginErrors.email) setLoginErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder={
                      selectedPortal === 'municipal' ? 'e.g. officer@cleantrack.gov or officer' :
                      selectedPortal === 'worker' ? 'e.g. worker, suresh, or squad leader username' :
                      selectedPortal === 'admin' ? 'admin@cleantrack.gov or admin' :
                      'e.g. prathamesh@cleantrack.gov or prathamesh'
                    }
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      loginErrors.email ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : 
                      selectedPortal === 'municipal' ? "border-slate-200 focus:ring-2 focus:ring-blue-500" :
                      selectedPortal === 'worker' ? "border-slate-200 focus:ring-2 focus:ring-amber-500" :
                      selectedPortal === 'admin' ? "border-slate-200 focus:ring-2 focus:ring-purple-500" :
                      "border-slate-200 focus:ring-2 focus:ring-emerald-500"
                    }`}
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{loginErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginErrors.password) setLoginErrors(prev => ({ ...prev, password: '' }));
                    }}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      loginErrors.password ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : 
                      selectedPortal === 'municipal' ? "border-slate-200 focus:ring-2 focus:ring-blue-500" :
                      selectedPortal === 'worker' ? "border-slate-200 focus:ring-2 focus:ring-amber-500" :
                      selectedPortal === 'admin' ? "border-slate-200 focus:ring-2 focus:ring-purple-500" :
                      "border-slate-200 focus:ring-2 focus:ring-emerald-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{loginErrors.password}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer mt-2 ${
                  selectedPortal === 'municipal' 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' 
                    : selectedPortal === 'worker'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30'
                    : selectedPortal === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                }`}
              >
                {loading ? "Authenticating..." : `Sign In to ${selectedPortal === 'municipal' ? 'Municipal Command' : selectedPortal === 'worker' ? 'Worker Field Operations' : selectedPortal === 'admin' ? 'Admin Console' : 'Citizen Portal'}`}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Informative notice for Municipal Staff */}
              {selectedPortal === 'municipal' && (
                <div className="pt-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">
                      🔒 Official Municipal Access Only
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Staff accounts are provisioned by the Central System Administrator. Public registration is restricted.
                    </p>
                  </div>
                </div>
              )}

              {/* Informative notice for Worker & Squad Leader Quick Logins */}
              {selectedPortal === 'worker' && (
                <div className="pt-2 space-y-2.5">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-0.5">
                    <p className="text-xs font-bold text-amber-900">
                      👷 Squad Leader Field Operations Portal
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Sign in using the username and password assigned by the Municipal Authority during squad registration.
                    </p>
                  </div>

                  {registeredSquads.length > 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center">
                        Registered Squad Leader Accounts ({registeredSquads.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {registeredSquads.map((sq) => (
                          <button
                            key={sq.id}
                            type="button"
                            onClick={() => handleAutofillSquad(sq.leaderUsername, sq.leaderPassword || 'Worker@123')}
                            className="px-2.5 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 text-[11px] font-medium rounded-xl text-left truncate transition-all cursor-pointer shadow-2xs flex items-center justify-between"
                          >
                            <span className="truncate">{sq.name}:</span>
                            <strong className="text-amber-700 font-mono ml-1">@{sq.leaderUsername}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-center space-y-1">
                      <p className="text-xs font-bold text-amber-900">
                        No Squad Leader Accounts Created Yet
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Sign in as a <strong>Municipal Officer</strong> first to create squads and assign their leader credentials.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Informative notice for Admin */}
              {selectedPortal === 'admin' && (
                <div className="pt-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">
                      🛡️ Central Governance Console
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Restricted to authorized system administrators only.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick 1-Click Role Login Shortcuts */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                  Quick 1-Click Demo Sign-In
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAutofillRole('citizen')}
                    className="px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-all text-center cursor-pointer"
                  >
                    🌿 Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofillRole('municipal')}
                    className="px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold transition-all text-center cursor-pointer"
                  >
                    🏢 Municipal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofillRole('worker')}
                    className="px-2 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-all text-center cursor-pointer"
                  >
                    👷 Worker
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofillRole('admin')}
                    className="px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold transition-all text-center cursor-pointer"
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* FORM 2: REGISTRATION (Citizen Only) */
            <form onSubmit={handleRegister} noValidate className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {selectedPortal === 'municipal' ? 'Officer Full Name' : 'Full Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (regErrors.name) setRegErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder={selectedPortal === 'municipal' ? 'e.g. Officer Vikram Deshmukh' : 'Enter your full name'}
                    className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      regErrors.name ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                    }`}
                  />
                </div>
                {regErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{regErrors.name}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {selectedPortal === 'municipal' ? 'Official Email' : 'Email Address'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regErrors.email) setRegErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="name@example.com"
                      className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        regErrors.email ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                      }`}
                    />
                  </div>
                  {regErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{regErrors.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (regErrors.phone) setRegErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="10-digit mobile number"
                      className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        regErrors.phone ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                      }`}
                    />
                  </div>
                  {regErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{regErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Municipal Specific Designation Field */}
              {selectedPortal === 'municipal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Official Designation <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <select
                        value={regDesignation}
                        onChange={(e) => setRegDesignation(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Zonal Sanitation Officer">Zonal Sanitation Officer</option>
                        <option value="Field Inspection Superintendent">Field Inspection Superintendent</option>
                        <option value="Sanitation Squad Dispatcher">Sanitation Squad Dispatcher</option>
                        <option value="Municipal Health Inspector">Municipal Health Inspector</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Assigned Ward / Zone <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <select
                        value={regWard}
                        onChange={(e) => setRegWard(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Ward 12 - Shivaji Nagar">Ward 12 - Shivaji Nagar</option>
                        <option value="Ward 05 - Baner">Ward 05 - Baner</option>
                        <option value="Ward 07 - Kothrud">Ward 07 - Kothrud</option>
                        <option value="Ward 14 - Deccan Gymkhana">Ward 14 - Deccan Gymkhana</option>
                        <option value="Ward 09 - Hadapsar">Ward 09 - Hadapsar</option>
                        <option value="Ward 11 - Viman Nagar">Ward 11 - Viman Nagar</option>
                        <option value="All PMC Zones">All PMC Zones</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Citizen Specific Ward Field */}
              {selectedPortal === 'citizen' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Residential Ward <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={regWard}
                      onChange={(e) => {
                        setRegWard(e.target.value);
                        if (regErrors.ward) setRegErrors(prev => ({ ...prev, ward: '' }));
                      }}
                      className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Ward 12 - Shivaji Nagar">Ward 12 - Shivaji Nagar</option>
                      <option value="Ward 05 - Baner">Ward 05 - Baner</option>
                      <option value="Ward 07 - Kothrud">Ward 07 - Kothrud</option>
                      <option value="Ward 14 - Deccan Gymkhana">Ward 14 - Deccan Gymkhana</option>
                      <option value="Ward 09 - Hadapsar">Ward 09 - Hadapsar</option>
                      <option value="Ward 11 - Viman Nagar">Ward 11 - Viman Nagar</option>
                    </select>
                  </div>
                  {regErrors.ward && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{regErrors.ward}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (regErrors.password) setRegErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Min 6 characters"
                      className={`w-full pl-10 pr-10 py-2 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        regErrors.password ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {regErrors.password && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{regErrors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        if (regErrors.confirmPassword) setRegErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter password"
                      className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        regErrors.confirmPassword ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                      }`}
                    />
                  </div>
                  {regErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{regErrors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer mt-2 ${
                  selectedPortal === 'municipal'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                }`}
              >
                {loading ? "Creating Account..." : `Register as ${selectedPortal === 'municipal' ? 'Municipal Officer' : 'Citizen Contributor'}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
