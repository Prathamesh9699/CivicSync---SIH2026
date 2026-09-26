import React, { useState, useEffect } from 'react';
import { X, Users, Truck, Check, AlertCircle, ShieldCheck, Zap, Clock, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';
import { getStoredTeams } from '../../data/teams';

const PRIORITY_SLA_CONFIG = {
  Critical: {
    label: "Immediate Dispatch (< 2 Hours)",
    slaHours: 2,
    badgeText: "Urgent Siren Dispatch",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    bannerBg: "bg-gradient-to-r from-rose-50 to-rose-100/60 border-rose-200",
    accentColor: "text-rose-600",
    dotColor: "bg-rose-500",
    desc: "Active clinical biohazard / severe road obstruction. Immediate squad mobilization required."
  },
  High: {
    label: "Within 4 Hours (Fast-Track Response)",
    slaHours: 4,
    badgeText: "Priority Turnaround",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    bannerBg: "bg-gradient-to-r from-amber-50 to-amber-100/60 border-amber-200",
    accentColor: "text-amber-600",
    dotColor: "bg-amber-500",
    desc: "Dense waste buildup or commercial corridor accumulation queued for rapid same-day clearance."
  },
  Medium: {
    label: "Within 12 Hours (Standard Shift)",
    slaHours: 12,
    badgeText: "Scheduled Shift",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
    bannerBg: "bg-gradient-to-r from-sky-50 to-sky-100/60 border-sky-200",
    accentColor: "text-sky-600",
    dotColor: "bg-sky-500",
    desc: "Moderate roadside accumulation scheduled for upcoming municipal sanitation sweep."
  },
  Low: {
    label: "Within 24 Hours (Routine Route)",
    slaHours: 24,
    badgeText: "Routine Sweep",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    bannerBg: "bg-gradient-to-r from-emerald-50 to-emerald-100/60 border-emerald-200",
    accentColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
    desc: "Low-density recyclable litter queued for standard daily collection route."
  }
};

export const QuickAssignModal = ({ isOpen, onClose, complaint, onAssign }) => {
  const [teams, setTeams] = useState(getStoredTeams);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [priority, setPriority] = useState('Critical');
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && complaint) {
      const activeTeams = getStoredTeams();
      setTeams(activeTeams);

      // 1. Automatically calculate priority from AI severity
      const complaintSeverity = complaint.severity || 'Critical';
      setPriority(complaintSeverity);

      // 2. Automatically select optimal team based on waste stream
      if (complaint.assignedTeamId && activeTeams.some(t => t.id === complaint.assignedTeamId)) {
        setSelectedTeamId(complaint.assignedTeamId);
      } else if (activeTeams.length > 0) {
        const cat = (complaint.aiCategory || '').toLowerCase();
        const hasBio = complaint.biomedicalDetectionsCount > 0 || cat.includes('medic') || cat.includes('bio') || cat.includes('sharps');
        const hasEwaste = cat.includes('e-waste') || cat.includes('elect');

        const matchedBio = activeTeams.find(t => t.unit?.toLowerCase().includes('medic') || t.unit?.toLowerCase().includes('bio') || t.name?.toLowerCase().includes('bravo'));
        const matchedEwaste = activeTeams.find(t => t.unit?.toLowerCase().includes('e-waste') || t.name?.toLowerCase().includes('charlie'));
        const matchedAvailable = activeTeams.find(t => t.status === 'Available');

        if (hasBio && matchedBio) {
          setSelectedTeamId(matchedBio.id);
        } else if (hasEwaste && matchedEwaste) {
          setSelectedTeamId(matchedEwaste.id);
        } else if (matchedAvailable) {
          setSelectedTeamId(matchedAvailable.id);
        } else {
          setSelectedTeamId(activeTeams[0].id);
        }
      } else {
        setSelectedTeamId('');
      }

      setShowManualOverride(false);
      setInstructions('');
      setError('');
    }
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  const currentSla = PRIORITY_SLA_CONFIG[priority] || PRIORITY_SLA_CONFIG.Critical;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (teams.length === 0) {
      setError('No sanitation squads are registered. Please visit the Assignments tab to register your first squad.');
      return;
    }

    if (!selectedTeamId) {
      setError('Please select an active sanitation team to dispatch.');
      return;
    }

    if (instructions.trim().length > 300) {
      setError('Instructions must not exceed 300 characters.');
      return;
    }

    const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
    if (!selectedTeam) {
      setError('Selected team is invalid or no longer exists.');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      onAssign(
        complaint.id, 
        selectedTeam.id, 
        selectedTeam.name, 
        instructions.trim(),
        {
          workerId: selectedTeam.workerLeadId || `WRK-${selectedTeam.id}`,
          workerName: selectedTeam.workerLeadName || selectedTeam.lead || 'Squad Lead',
          workerPhone: selectedTeam.workerPhone || selectedTeam.leadPhone || '+91 98220 00000'
        }
      );
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Truck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Dispatch Sanitation Squad</h3>
              <p className="text-xs text-emerald-200">Complaint #{complaint.id} • {complaint.ward}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. AUTOMATED AI DISPATCH TIMELINE CARD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>AI Automated Dispatch SLA & Timeline</span>
              </label>
              <button
                type="button"
                onClick={() => setShowManualOverride(!showManualOverride)}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
              >
                {showManualOverride ? "Lock to Auto AI" : "Manual Override"}
              </button>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${currentSla.bannerBg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentSla.dotColor}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentSla.dotColor}`}></span>
                    </span>
                    <span className="text-xs font-black text-slate-900 tracking-tight">
                      {currentSla.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {currentSla.desc}
                  </p>
                </div>

                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap ${currentSla.badgeColor}`}>
                  {priority} Priority
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Target Turnaround: <strong>{currentSla.slaHours}h Max</strong></span>
                </span>
                <span className="text-emerald-700 font-sans font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>AI Pre-Calculated</span>
                </span>
              </div>
            </div>

            {/* Optional Manual Override Dropdown */}
            {showManualOverride && (
              <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 animate-fadeIn">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Custom Priority Level:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Critical">Critical Priority (Immediate dispatch — &lt;2 Hours)</option>
                  <option value="High">High Priority (Within 4 hours)</option>
                  <option value="Medium">Medium Priority (Within 12 hours)</option>
                  <option value="Low">Low Priority (Within 24 hours)</option>
                </select>
              </div>
            )}
          </div>

          {/* 2. SELECT SANITATION TEAM */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span>Assigned Sanitation Team <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-normal text-slate-400 normal-case">Auto-matched to waste stream</span>
            </label>

            {teams.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1.5 text-center">
                <p className="text-xs font-bold flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>No Active Squads Registered</span>
                </p>
                <p className="text-[11px] text-amber-700">
                  Please register a squad & vehicle in the <strong>Assignments</strong> module first to dispatch teams.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {teams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-brand-600 bg-brand-50/60 shadow-xs ring-2 ring-brand-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isSelected ? "bg-brand-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
                        }`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">{team.name}</h4>
                            {isSelected && (
                              <span className="bg-brand-100 text-brand-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                                MATCHED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{team.unit} • {team.vehicleType}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${team.statusColor || 'bg-emerald-100 text-emerald-800'}`}>
                          {team.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Designated Field Worker Lead Preview */}
            {(() => {
              const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
              if (!activeTeam) return null;
              return (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800">Designated Worker Lead:</span>
                      <p className="font-extrabold text-slate-900">{activeTeam?.workerLeadName || activeTeam?.lead || 'Squad Lead'} <span className="font-mono font-medium text-slate-500 text-[11px]">({activeTeam?.workerLeadId || `WRK-${activeTeam?.id}`})</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Provides Photo Proof
                  </span>
                </div>
              );
            })()}
          </div>

          {/* 3. FIELD INSTRUCTIONS */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Special Field Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Bring biohazard sharps containers and prioritize curb clearance."
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            ></textarea>
          </div>

          {/* 4. ACTIONS */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || teams.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Confirm & Dispatch Team</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
