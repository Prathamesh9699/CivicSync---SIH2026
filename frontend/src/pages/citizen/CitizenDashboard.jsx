import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { CleanCityPulseGauge } from '../../components/ai/CleanCityPulseGauge';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { LeafletHotspotMap } from '../../components/maps/LeafletHotspotMap';
import { 
  PlusCircle, 
  Award, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  Flame, 
  MapPin, 
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { GIS_HOTSPOTS } from '../../data/hotspots';

export const CitizenDashboard = () => {
  const { currentUser } = useAuth();
  const { complaints = [] } = useComplaints() || {};
  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  // Filter complaints for logged-in citizen
  const myComplaints = safeComplaints.filter(c => {
    if (!c) return false;
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'administrator') {
      return true;
    }
    const cleanUserPhone = String(currentUser.phone || '').replace(/\D/g, '');
    const cleanComplaintPhone = String(c.citizenPhone || '').replace(/\D/g, '');
    const phoneMatch = cleanUserPhone && cleanComplaintPhone && (
      cleanComplaintPhone.endsWith(cleanUserPhone.slice(-10)) || cleanUserPhone.endsWith(cleanComplaintPhone.slice(-10))
    );

    const matchCitizenId = (
      (currentUser.id && (c.citizenId === currentUser.id || String(c.citizenId) === String(currentUser.id))) ||
      (currentUser._id && (c.citizenId === currentUser._id || String(c.citizenId) === String(currentUser._id))) ||
      (currentUser.userId && (c.citizenId === currentUser.userId || c.userId === currentUser.userId))
    );

    const userName = String(currentUser.name || '').toLowerCase().trim();
    const complaintName = String(c.citizenName || '').toLowerCase().trim();
    const nameParts = userName.split(' ').filter(p => p.length > 2);
    const matchName = complaintName && (
      complaintName === userName ||
      nameParts.some(part => complaintName.includes(part))
    );

    return matchCitizenId || matchName || phoneMatch;
  });

  const recentComplaints = myComplaints.slice(0, 4);
  const userPoints = typeof currentUser?.greenPoints === 'number' ? currentUser.greenPoints : 0;
  const reportsCount = myComplaints.length > 0 ? myComplaints.length : (currentUser?.stats?.reportsSubmitted || 0);
  const verifiedCount = myComplaints.filter(c => c && (c.status === "Resolved" || c.status === "Citizen Verified")).length;

  return (
    <div className="space-y-8">
      {/* Top Greeting & Quick Action */}
      <div className="bg-gradient-to-r from-emerald-900 to-forest-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{currentUser?.ward || "Ward 12 - Shivaji Nagar"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 font-mono text-xs font-bold border border-white/15">
                <span>ID: {currentUser?.userId || 'CIT-2026'}</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good morning, {currentUser?.name || "Citizen"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-light">
              Your civic reports have cleaned {verifiedCount} public spaces this year. Spot an overflowing bin or roadside dump?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/citizen/report"
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Report Waste (AI Scan)</span>
            </Link>

            <Link
              to="/citizen/green-points"
              className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{userPoints} Points</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Clean City Pulse & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Clean City Pulse Circular Card */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">Your Ward Cleanliness</h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Active Zone
            </span>
          </div>

          <div className="py-4 flex justify-center">
            <CleanCityPulseGauge score={100} size="md" trend="0%" subtitle={`${currentUser?.ward || "Ward"} Cleanliness Index`} />
          </div>

          <div className="text-xs text-slate-500 text-center bg-slate-50 p-2.5 rounded-xl">
            Cleanliness pulse is at <strong>optimal clean baseline</strong> with zero pending complaints.
          </div>
        </div>

        {/* 3 Quick Metric Cards */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="My Reports"
            value={reportsCount.toString()}
            change={reportsCount > 0 ? "+1 this week" : "Start reporting"}
            icon={Inbox}
            color="blue"
            subtitle="Total issues reported"
          />
          <StatCard
            title="Cleaned & Verified"
            value={verifiedCount.toString()}
            change={verifiedCount > 0 ? "100% verified" : "0 verifications"}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Confirmed clear by citizen"
          />
          <StatCard
            title="Green Points"
            value={`${userPoints} pts`}
            change={`Level ${currentUser?.level || 1} ${currentUser?.levelTitle || 'Green Starter'}`}
            icon={Award}
            color="amber"
            subtitle="Redeemable civic benefits"
          />
        </div>
      </div>

      {/* Active Complaints & Nearby Mini Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Complaints */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Civic Reports</h3>
            <Link to="/citizen/complaints" className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              <span>View All ({myComplaints.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentComplaints.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentComplaints.map(complaint => (
                <ComplaintCard key={complaint.id} complaint={complaint} basePath="/citizen/complaints" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Reports Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You haven't submitted any waste reports yet. Spot litter in your area to earn your first +50 Green Points!
              </p>
              <Link
                to="/citizen/report"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Waste Now</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right: Nearby Hotspots Mini Map */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-600" />
              <h3 className="text-lg font-bold text-slate-900">Nearby Hotspots</h3>
            </div>
            <Link to="/citizen/hotspots" className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              <span>Explore Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-4">
            <LeafletHotspotMap
              hotspots={GIS_HOTSPOTS.slice(0, 3)}
              height="280px"
              zoom={13}
            />
            {GIS_HOTSPOTS.length > 0 ? (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">Hotspot Alert:</span> Active roadside accumulation detected.
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold">Zone Status:</span> No chronic waste hotspots currently detected. Keep reporting to keep our streets clean!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
