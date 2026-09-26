import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { PageHeader } from '../../components/common/PageHeader';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import { Search, Filter, PlusCircle, Inbox, Layers } from 'lucide-react';

export const MyComplaintsPage = () => {
  const { currentUser } = useAuth();
  const { complaints } = useComplaints();
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const statuses = [
    'All',
    'AI Analyzed',
    'Under Review',
    'Assigned',
    'In Progress',
    'Awaiting Verification',
    'Citizen Verified',
    'Resolved',
    'Rejected'
  ];

  const [viewScope, setViewScope] = useState('mine'); // 'mine' | 'all'
  const [trackIdInput, setTrackIdInput] = useState('');
  const [trackError, setTrackError] = useState('');

  // Filter complaints for logged in citizen (or show all for admin / staff inspecting)
  const userComplaints = complaints.filter(c => {
    if (!c) return false;
    if (viewScope === 'all') return true;
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

  const filtered = userComplaints.filter(c => {
    if (!c) return false;
    const cid = String(c.id || c.complaintId || '').toLowerCase();
    const title = String(c.title || '').toLowerCase();
    const cat = String(c.aiCategory || '').toLowerCase();
    const ward = String(c.ward || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesSearch = !query || cid.includes(query) || title.includes(query) || cat.includes(query) || ward.includes(query);
    return matchesStatus && matchesSearch;
  });

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const clean = trackIdInput.trim().toUpperCase();
    if (!clean) {
      setTrackError('Please enter a ticket ID (e.g. CT-2026-00128)');
      return;
    }
    window.location.href = `/citizen/complaints/${clean}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Civic Complaints"
        subtitle="Track real-time municipal triage, squad dispatches, and verification statuses."
        breadcrumbs={[{ label: "Dashboard", path: "/citizen/dashboard" }, { label: "My Complaints" }]}
        actions={
          <Link
            to="/citizen/report"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Report</span>
          </Link>
        }
      />

      {/* QUICK COMPLAINT TRACKER BAR */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Track Any Complaint by Ticket ID
            </label>
            <input
              type="text"
              value={trackIdInput}
              onChange={(e) => {
                setTrackIdInput(e.target.value);
                setTrackError('');
              }}
              placeholder="e.g. CT-2026-00128"
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto mt-2 sm:mt-5 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md transition-all whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <span>Track Timeline →</span>
          </button>
        </form>
        {trackError && <p className="text-xs text-rose-400 mt-2 font-medium">{trackError}</p>}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewScope('mine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewScope === 'mine'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Reports
            </button>
            <button
              type="button"
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewScope === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Community Reports ({complaints.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, category, or ward..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs whitespace-nowrap">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === status
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(complaint => (
            <ComplaintCard key={complaint.id} complaint={complaint} basePath="/citizen/complaints" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-brand-600 flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Your City is Looking Cleaner! 🌱</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {viewScope === 'mine' 
              ? "You haven't submitted any complaints under this account yet, or they don't match the current filter."
              : "No complaints found matching your selected filter. Report any new garbage issues you spot."}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {viewScope === 'mine' && complaints.length > 0 && (
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                View All Community Reports ({complaints.length})
              </button>
            )}
            <Link
              to="/citizen/report"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Waste</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
