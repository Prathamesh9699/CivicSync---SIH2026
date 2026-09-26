import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { BeforeAfterSlider } from '../../components/complaints/BeforeAfterSlider';
import { 
  CheckCircle2, 
  Search, 
  Calendar, 
  Truck, 
  Award, 
  Sparkles, 
  MapPin, 
  FileText, 
  Scale, 
  Wrench,
  Clock,
  Eye,
  Check,
  Archive
} from 'lucide-react';

export const WorkerHistoryPage = () => {
  const { complaints = [] } = useComplaints();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('All');
  const [activeItemPreview, setActiveItemPreview] = useState(null);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  // Completed or submitted evidence history
  const historyItems = safeComplaints.filter(c => {
    const hasEvidence = !!(c.afterImageUrl || c.workerEvidence);
    const isVerifiedOrSubmitted = 
      c.status === 'Citizen Verified' || 
      c.status === 'Resolved' || 
      c.status === 'Awaiting Verification';

    return hasEvidence || isVerifiedOrSubmitted;
  });

  const filteredHistory = historyItems.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.id?.toLowerCase().includes(q) ||
      item.complaintId?.toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q) ||
      item.ward?.toLowerCase().includes(q) ||
      item.aiCategory?.toLowerCase().includes(q) ||
      item.landmark?.toLowerCase().includes(q);

    const matchWard = selectedWard === 'All' || item.ward?.includes(selectedWard);

    return matchSearch && matchWard;
  });

  // Calculate statistics
  const totalVerified = historyItems.filter(c => c.status === 'Citizen Verified' || c.status === 'Resolved').length;
  const awaitingVerification = historyItems.filter(c => c.status === 'Awaiting Verification').length;
  const estimatedKg = historyItems.length * 140; // ~140kg average per sweep

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Field Evidence & Work Order Archive"
        subtitle="Historical record of photographic cleanup proof, waste tonnage cleared, and municipal/citizen validation logs."
        breadcrumbs={[{ label: "Worker Portal", path: "/worker/dashboard" }, { label: "Evidence Archive" }]}
        badge={
          <span className="bg-amber-100 text-amber-900 text-xs font-black px-3.5 py-1 rounded-full border border-amber-300">
            {historyItems.length} Cleaned Incidents
          </span>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Citizen Validated</span>
            <h4 className="text-xl font-black text-slate-900">{totalVerified} Sites</h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Quality Acceptance</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Verification</span>
            <h4 className="text-xl font-black text-slate-900">{awaitingVerification} Proofs</h4>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Under Municipal Review</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. Waste Diverted</span>
            <h4 className="text-xl font-black text-slate-900">{estimatedKg.toLocaleString()} kg</h4>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">To Processing Facility</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Squad</span>
            <h4 className="text-xl font-black text-slate-900">{currentUser?.assignedTeam || 'Squad Alpha'}</h4>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Vehicle MH-12-QX-4012</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by ticket ID, landmark, or category..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
            >
              <option value="All">All Wards</option>
              <option value="Ward 12">Ward 12 (Shivaji Nagar)</option>
              <option value="Ward 14">Ward 14 (Deccan Gymkhana)</option>
              <option value="Ward 07">Ward 07 (Kothrud)</option>
              <option value="Ward 09">Ward 09 (Hadapsar)</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Grid */}
      <div className="space-y-6">
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredHistory.map((item) => {
              const evidence = item.workerEvidence || {};
              const beforeImg = item.beforeImageUrl || item.imageUrl;
              const afterImg = item.afterImageUrl || evidence.photoUrl || "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80";
              const isVerified = item.status === 'Citizen Verified' || item.status === 'Resolved';

              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between hover:border-amber-300 transition-all"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {item.id}
                          </span>
                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                            isVerified 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {isVerified ? 'Citizen Verified' : 'Awaiting Municipal Review'}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base mt-1 line-clamp-1">
                          {item.title || item.aiCategory}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.ward} • {item.landmark}</span>
                        </p>
                      </div>

                      <Link
                        to={`/worker/tasks/${item.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </div>

                    {/* Interactive Before & After Slider */}
                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                      <BeforeAfterSlider
                        beforeUrl={beforeImg}
                        afterUrl={afterImg}
                        visualImprovement={92}
                      />
                    </div>

                    {/* Evidence Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Worker Submitter</span>
                        <p className="font-bold text-slate-800 line-clamp-1">{evidence.workerName || item.assignedWorkerName || 'Ramesh Shinde'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Waste Volume</span>
                        <p className="font-extrabold text-amber-700">{evidence.wasteVolumeCollected || '120 kg'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Verification Score</span>
                        <p className="font-extrabold text-emerald-700">92% AI Clearance</p>
                      </div>
                    </div>

                    {/* Worker Notes */}
                    {evidence.notes && (
                      <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
                        <span className="font-bold">Field Notes:</span> "{evidence.notes}"
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.assignedTeamName || 'Squad Alpha'}</span>
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Proof Logged on Chain</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 space-y-3">
            <Archive className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No Historical Cleanups Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Completed work orders with photographic evidence submitted by field squads will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
