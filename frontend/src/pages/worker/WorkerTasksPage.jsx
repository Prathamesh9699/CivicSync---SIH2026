import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, SeverityBadge } from '../../components/common/Badges';
import { WorkerEvidenceModal } from '../../components/worker/WorkerEvidenceModal';
import { 
  Inbox, 
  Search, 
  Filter, 
  Camera, 
  Play, 
  MapPin, 
  CheckCircle2, 
  Truck, 
  Clock, 
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';

export const WorkerTasksPage = () => {
  const { complaints = [], startTask } = useComplaints();
  const { currentUser } = useAuth();
  const { showToast, addNotification } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState(null);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  const filteredTasks = safeComplaints.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.id?.toLowerCase().includes(q) ||
      c.complaintId?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.ward?.toLowerCase().includes(q) ||
      c.aiCategory?.toLowerCase().includes(q) ||
      c.landmark?.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Assigned' && (c.status === 'Assigned' || c.status === 'assigned')) ||
      (statusFilter === 'In Progress' && (c.status === 'In Progress' || c.status === 'in_progress')) ||
      (statusFilter === 'Awaiting Verification' && (c.status === 'Awaiting Verification' || c.status === 'awaiting_verification')) ||
      (statusFilter === 'Completed' && (c.status === 'Citizen Verified' || c.status === 'Resolved'));

    return matchSearch && matchStatus;
  });

  const handleStart = async (id) => {
    await startTask(id, {
      workerName: currentUser?.name || 'Squad Lead',
      workerId: currentUser?.userId || 'WRK-FIELD'
    });
    showToast({
      title: "Task Started",
      message: `Status of #${id} changed to In Progress.`,
      type: "info"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Field Sanitation Tasks & Work Orders"
        subtitle="Manage assigned municipal cleaning requests, start on-site sweeps, and provide photographic evidence upon task completion."
        breadcrumbs={[{ label: "Worker Portal", path: "/worker/dashboard" }, { label: "Field Tasks" }]}
        badge={
          <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-300">
            {filteredTasks.length} Work Orders
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, landmark, ward, or waste category..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="All">All Statuses ({safeComplaints.length})</option>
              <option value="Assigned">Assigned (New Work)</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Verification">Evidence Submitted</option>
              <option value="Completed">Verified & Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => {
              const isAssigned = task.status === 'Assigned' || task.status === 'assigned';
              const isInProgress = task.status === 'In Progress' || task.status === 'in_progress';
              const isAwaiting = task.status === 'Awaiting Verification' || task.status === 'awaiting_verification';
              const isCompleted = task.status === 'Citizen Verified' || task.status === 'Resolved';

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={task.imageUrl || task.beforeImageUrl}
                      alt={task.id}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="space-y-1.5 text-xs flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          #{task.id}
                        </span>
                        <SeverityBadge severity={task.severity} />
                        <StatusBadge status={task.status} />
                        <span className="text-[11px] text-slate-400 font-mono">
                          {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Today'}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900">
                        {task.title || task.aiCategory}
                      </h4>

                      <p className="text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{task.ward} • {task.landmark || 'Street Corner'}</span>
                      </p>

                      {task.officerNote && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 max-w-2xl">
                          <strong className="text-slate-700">Supervisor Note:</strong> {task.officerNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Evidence Status */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-2.5 flex-shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="flex items-center gap-2">
                      {isAssigned && (
                        <button
                          type="button"
                          onClick={() => handleStart(task.id)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Cleanup</span>
                        </button>
                      )}

                      {(isAssigned || isInProgress) && (
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForEvidence(task)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Submit Evidence Photo</span>
                        </button>
                      )}

                      {isAwaiting && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Evidence Submitted • Awaiting Municipal Verification</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForEvidence(task)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Update
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{task.status === "Citizen Verified" ? "Citizen & Municipal Verified ✓" : "Resolved & Verified ✓"}</span>
                        </span>
                      )}

                      <Link
                        to={`/worker/tasks/${task.id}`}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-800">No Matching Field Tasks</h4>
            <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        )}
      </div>

      {/* POPUP EVIDENCE PHOTO SUBMISSION MODAL */}
      {selectedTaskForEvidence && (
        <WorkerEvidenceModal
          isOpen={!!selectedTaskForEvidence}
          complaint={selectedTaskForEvidence}
          onClose={() => setSelectedTaskForEvidence(null)}
          onSuccess={() => setSelectedTaskForEvidence(null)}
        />
      )}
    </div>
  );
};
