import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../context/ComplaintContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, SeverityBadge, ConditionBadge } from '../../components/common/Badges';
import { QuickAssignModal } from '../../components/complaints/QuickAssignModal';
import { 
  Inbox, 
  Filter, 
  Search, 
  Truck, 
  ArrowUpDown, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  MapPin, 
  Flame, 
  Copy,
  Layers
} from 'lucide-react';

export const PriorityQueuePage = () => {
  const { complaints, assignTeam } = useComplaints();
  const { showToast } = useNotifications();

  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningComplaint, setAssigningComplaint] = useState(null);

  // Sorting state (Default: highest AI priority score)
  const [sortBy, setSortBy] = useState('priority');

  const filtered = complaints
    .filter(c => {
      const matchWard = selectedWard === 'All' || (c.ward && c.ward.includes(selectedWard));
      const matchSeverity = selectedSeverity === 'All' || c.severity === selectedSeverity;
      const matchStatus = selectedStatus === 'All' || c.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.aiCategory && c.aiCategory.toLowerCase().includes(q)) ||
        (c.landmark && c.landmark.toLowerCase().includes(q));
      return matchWard && matchSeverity && matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return (b.aiPriorityScore || 0) - (a.aiPriorityScore || 0);
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'confidence') return (b.aiConfidence || 0) - (a.aiConfidence || 0);
      return 0;
    });

  const handleAssignSquad = (complaintId, teamId, teamName, instructions, workerDetails) => {
    assignTeam(complaintId, teamId, teamName, instructions, workerDetails);
    showToast({
      title: "Sanitation Squad Dispatched",
      message: `Assigned ${teamName} (${workerDetails?.workerName || 'Worker Lead'}) to Complaint #${complaintId}.`,
      type: "success"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Municipal AI Priority Queue"
        subtitle="Ranked complaint triage stream ordering severe health hazards, duplicate clusters, and recurring hot zones."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Priority Queue" }]}
        badge={
          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-300">
            {complaints.filter(c => c.severity === "Critical").length} Critical Hazards
          </span>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, landmark..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Ward Filter */}
          <div>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none"
            >
              <option value="All">All Wards (PMC Central)</option>
              <option value="Ward 12">Ward 12 (Shivaji Nagar)</option>
              <option value="Ward 14">Ward 14 (Deccan)</option>
              <option value="Ward 07">Ward 07 (Kothrud)</option>
              <option value="Ward 09">Ward 09 (Hadapsar)</option>
              <option value="Ward 05">Ward 05 (Baner)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none"
            >
              <option value="All">All Severity Levels</option>
              <option value="Critical">🔴 Critical (Score &gt; 80)</option>
              <option value="High">🟠 High (Score 65-80)</option>
              <option value="Medium">🟡 Medium (Score 45-64)</option>
              <option value="Low">🟢 Low (&lt; 45)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none font-semibold text-brand-700"
            >
              <option value="priority">Sort: AI Priority Score (High→Low)</option>
              <option value="date">Sort: Most Recent First</option>
              <option value="confidence">Sort: AI Confidence %</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing <strong>{filtered.length}</strong> prioritized incidents</span>
          <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
            Auto-Triage Active
          </span>
        </div>
      </div>

      {/* Priority Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Priority Score</th>
                <th className="py-3.5 px-4">Complaint ID & Photo</th>
                <th className="py-3.5 px-4">Taxonomy Category</th>
                <th className="py-3.5 px-4">Location / Ward</th>
                <th className="py-3.5 px-4">AI Recurrence & Duplicates</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Squad</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* AI Score Badge */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-sm">
                        <span className={`w-3 h-3 rounded-full ${
                          c.severity === "Critical" ? "bg-rose-600 animate-pulse" : c.severity === "High" ? "bg-amber-500" : "bg-yellow-400"
                        }`}></span>
                        <span className="text-slate-900">{c.aiPriorityScore || 84}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </div>
                      <SeverityBadge severity={c.severity} />
                    </div>
                  </td>

                  {/* ID & Thumbnail */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.imageUrl || "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=120"}
                        alt={c.id}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div>
                        <strong className="font-mono text-brand-700 text-xs block">{c.id}</strong>
                        <span className="text-slate-700 font-semibold line-clamp-1 max-w-[160px]">{c.title}</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </td>

                  {/* Taxonomy */}
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-800 block">{c.aiCategory}</span>
                    <span className="text-[10px] text-slate-500 block">{c.aiSubtype}</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {c.aiConfidence}% AI Conf
                    </span>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4 text-slate-600">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{c.ward}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{c.landmark}</p>
                    </div>
                  </td>

                  {/* Recurrence & Duplicates */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1 text-[11px]">
                      {c.duplicateDetection?.hasDuplicate && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Copy className="w-3 h-3 text-amber-600" />
                          <span>{c.duplicateDetection.duplicateCount} duplicate(s)</span>
                        </span>
                      )}
                      {c.recurrenceDetection?.isRecurring && (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                          <Flame className="w-3 h-3 text-rose-600" />
                          <span>Recurring ({c.recurrenceDetection.recurrenceLevel})</span>
                        </span>
                      )}
                      {!c.duplicateDetection?.hasDuplicate && !c.recurrenceDetection?.isRecurring && (
                        <span className="text-slate-400">Unique incident</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <StatusBadge status={c.status} />
                  </td>

                  {/* Assigned Squad */}
                  <td className="py-4 px-4 text-slate-700">
                    {c.assignedTeamName ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{c.assignedTeamName}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Pending Squad</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status !== "Citizen Verified" && c.status !== "Resolved" ? (
                        <button
                          onClick={() => setAssigningComplaint(c)}
                          className="px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-all shadow-xs"
                        >
                          Assign Squad
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      )}
                      <Link
                        to={`/municipal/complaints/${c.id}`}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                      >
                        Inspect
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 font-medium">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">Priority Queue is Empty</p>
                    <p className="text-xs text-slate-400 mt-0.5">No matching complaints in the registry. All city sectors are clean.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Squad Dispatch Modal */}
      {assigningComplaint && (
        <QuickAssignModal
          isOpen={!!assigningComplaint}
          complaint={assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
          onAssign={handleAssignSquad}
        />
      )}
    </div>
  );
};
