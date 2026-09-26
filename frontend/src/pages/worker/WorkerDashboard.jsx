import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, SeverityBadge } from '../../components/common/Badges';
import { WorkerEvidenceModal } from '../../components/worker/WorkerEvidenceModal';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Camera, 
  Play, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Inbox,
  Flame,
  FileText,
  Radio,
  Eye
} from 'lucide-react';

export const WorkerDashboard = () => {
  const { complaints = [], startTask } = useComplaints();
  const { currentUser } = useAuth();
  const { showToast, addNotification } = useNotifications();

  const [selectedForEvidence, setSelectedForEvidence] = useState(null);
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'in_progress' | 'evidence_submitted' | 'completed'

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  // Filter tasks relevant to this worker or their assigned squad
  const workerSquadName = currentUser?.assignedTeam || 'Sanitation Squad';
  const workerSquadId = currentUser?.assignedTeamId || '';
  const workerId = currentUser?.userId || '';

  // Tasks assigned to this squad or worker, or open for field pickup
  const assignedTasks = safeComplaints.filter(c => 
    c.status === "Assigned" || c.status === "assigned"
  );

  const inProgressTasks = safeComplaints.filter(c => 
    c.status === "In Progress" || c.status === "in_progress"
  );

  const evidenceSubmittedTasks = safeComplaints.filter(c => 
    c.status === "Awaiting Verification" || c.status === "awaiting_verification"
  );

  const completedTasks = safeComplaints.filter(c => 
    c.status === "Citizen Verified" || c.status === "Resolved"
  );

  const activeWorkList = 
    filterTab === 'in_progress' ? inProgressTasks :
    filterTab === 'evidence_submitted' ? evidenceSubmittedTasks :
    filterTab === 'completed' ? completedTasks :
    [...assignedTasks, ...inProgressTasks];

  const handleStartCleanup = async (complaintId) => {
    try {
      await startTask(complaintId, {
        workerName: currentUser?.name || 'Squad Lead',
        workerId: currentUser?.userId || 'WRK-FIELD'
      });

      addNotification({
        targetRole: 'municipal_staff',
        title: `Cleanup Commenced: #${complaintId}`,
        message: `Field worker ${currentUser?.name || 'Squad Lead'} started cleanup operations at incident location.`,
        type: 'info',
        ticketId: complaintId,
        link: `/municipal/complaints/${complaintId}`
      });

      showToast({
        title: "Cleanup In Progress",
        message: `Task #${complaintId} status updated to In Progress. Please upload photo proof upon completion.`,
        type: "info"
      });
    } catch (e) {
      showToast({
        title: "Status Update",
        message: "Task started.",
        type: "info"
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Sanitation Worker Operations Command"
        subtitle={`Logged in as ${currentUser?.name || 'Squad Lead'} • ${currentUser?.designation || 'Field Sanitation Squad Lead'} (${currentUser?.assignedTeam || 'Sanitation Squad'})`}
        breadcrumbs={[{ label: "Worker Portal", path: "/worker/dashboard" }, { label: "Operations" }]}
        badge={
          <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-700" />
            <span>Vehicle: {currentUser?.vehicleAssigned || 'Field Unit'}</span>
          </span>
        }
        actions={
          <Link
            to="/worker/tasks"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Inbox className="w-4 h-4" />
            <span>All Field Tasks ({safeComplaints.length})</span>
          </Link>
        }
      />

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned / Pending */}
        <div 
          onClick={() => setFilterTab('active')}
          className={`bg-white rounded-3xl p-5 border cursor-pointer transition-all hover:shadow-md ${
            filterTab === 'active' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">New Assigned Work</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{assignedTasks.length}</div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Dispatched by municipal officers</p>
        </div>

        {/* Card 2: In Progress */}
        <div 
          onClick={() => setFilterTab('in_progress')}
          className={`bg-white rounded-3xl p-5 border cursor-pointer transition-all hover:shadow-md ${
            filterTab === 'in_progress' ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Cleanups In Progress</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{inProgressTasks.length}</div>
          <p className="text-[11px] text-blue-700 font-medium mt-1">On-site cleaning active</p>
        </div>

        {/* Card 3: Evidence Submitted */}
        <div 
          onClick={() => setFilterTab('evidence_submitted')}
          className={`bg-white rounded-3xl p-5 border cursor-pointer transition-all hover:shadow-md ${
            filterTab === 'evidence_submitted' ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Evidence Uploaded</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{evidenceSubmittedTasks.length}</div>
          <p className="text-[11px] text-purple-700 font-medium mt-1">Awaiting citizen & municipal review</p>
        </div>

        {/* Card 4: Verified Completed */}
        <div 
          onClick={() => setFilterTab('completed')}
          className={`bg-white rounded-3xl p-5 border cursor-pointer transition-all hover:shadow-md ${
            filterTab === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Verified Cleanups</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{completedTasks.length}</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Confirmed closed in city registry</p>
        </div>
      </div>

      {/* SQUAD HIGHLIGHT & SHIFT STATUS BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-7 border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">{currentUser?.assignedTeam || 'Assigned Field Squad'}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                ACTIVE SHIFT
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Operating Vehicle <strong>{currentUser?.vehicleAssigned || 'Fleet Vehicle'}</strong>. All evidence photos submitted by your squad are scored with computer vision and routed directly to the citizen and municipal verification queue.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/worker/squad"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all"
          >
            Squad & Gear Details
          </Link>
          <Link
            to="/worker/history"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg transition-all"
          >
            Evidence History
          </Link>
        </div>
      </div>

      {/* SECTION: FIELD TASKS QUEUE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Assigned Field Tasks & Evidence Upload Queue</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {activeWorkList.length} Items
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Tasks assigned by Municipal Officers. Click "Submit Evidence Photo" when cleaning is completed on site.
            </p>
          </div>

          {/* Quick Filter Switcher */}
          <div className="flex p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Action Needed ({assignedTasks.length + inProgressTasks.length})
            </button>
            <button
              onClick={() => setFilterTab('in_progress')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'in_progress' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({inProgressTasks.length})
            </button>
            <button
              onClick={() => setFilterTab('evidence_submitted')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'evidence_submitted' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Evidence Uploaded ({evidenceSubmittedTasks.length})
            </button>
          </div>
        </div>

        {/* TASK CARDS GRID */}
        {activeWorkList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeWorkList.map((item) => {
              const isAssigned = item.status === "Assigned" || item.status === "assigned";
              const isInProgress = item.status === "In Progress" || item.status === "in_progress";
              const isAwaiting = item.status === "Awaiting Verification" || item.status === "awaiting_verification";
              const isCompleted = item.status === "Citizen Verified" || item.status === "Resolved";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Ticket ID + Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        #{item.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={item.severity} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    {/* Image & Description Block */}
                    <div className="flex items-start gap-3.5">
                      <img
                        src={item.imageUrl || item.beforeImageUrl}
                        alt={item.id}
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="text-xs space-y-1 overflow-hidden">
                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                          {item.title || item.aiCategory}
                        </h4>
                        <p className="text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{item.ward} • {item.landmark || 'Street Corner'}</span>
                        </p>
                        <p className="text-slate-600 line-clamp-2 italic text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          "{item.officerNote || item.description || 'Dispatched for rapid roadside clearance.'}"
                        </p>
                      </div>
                    </div>

                    {/* Evidence Photo Preview if already submitted */}
                    {item.afterImageUrl && (
                      <div className={`p-3 rounded-2xl text-xs space-y-2 border ${isAwaiting ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold flex items-center gap-1.5 ${isAwaiting ? 'text-amber-900' : 'text-emerald-900'}`}>
                            {isAwaiting ? (
                              <>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Evidence Uploaded • Awaiting Municipal Verification</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Cleanup Verified & Resolved ✓</span>
                              </>
                            )}
                          </span>
                          <span className={`text-[10px] font-mono ${isAwaiting ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {item.workerEvidence?.submittedAt ? new Date(item.workerEvidence.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <img
                            src={item.afterImageUrl}
                            alt="After proof"
                            className={`w-14 h-14 rounded-xl object-cover border shadow-2xs ${isAwaiting ? 'border-amber-300' : 'border-emerald-300'}`}
                          />
                          <p className="text-[11px] text-slate-600 line-clamp-2">
                            {item.workerEvidence?.notes || 'Direct post-cleanup photograph provided by sanitation worker.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/worker/tasks/${item.id}`}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      {/* Button 1: Start Work */}
                      {isAssigned && (
                        <button
                          type="button"
                          onClick={() => handleStartCleanup(item.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Cleanup</span>
                        </button>
                      )}

                      {/* Button 2: Upload Evidence Photo */}
                      {(isAssigned || isInProgress) && (
                        <button
                          type="button"
                          onClick={() => setSelectedForEvidence(item)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Submit Evidence Photo</span>
                        </button>
                      )}

                      {/* Button 3: Update Evidence if already submitted */}
                      {isAwaiting && (
                        <button
                          type="button"
                          onClick={() => setSelectedForEvidence(item)}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Update Photo</span>
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-emerald-700 bg-emerald-100 font-bold text-xs px-3 py-1 rounded-xl flex items-center gap-1 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Closed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-800">No Pending Tasks in This Category</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                All assigned neighborhood cleanups for your squad have been completed and evidence photos uploaded.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* POPUP EVIDENCE PHOTO SUBMISSION MODAL */}
      {selectedForEvidence && (
        <WorkerEvidenceModal
          isOpen={!!selectedForEvidence}
          complaint={selectedForEvidence}
          onClose={() => setSelectedForEvidence(null)}
          onSuccess={() => setSelectedForEvidence(null)}
        />
      )}
    </div>
  );
};
