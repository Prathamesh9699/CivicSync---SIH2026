import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStoredTeams } from '../../data/teams';
import { PageHeader } from '../../components/common/PageHeader';
import { 
  Truck, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  Radio, 
  CheckCircle2, 
  Clock, 
  BatteryCharging, 
  Fuel, 
  Wrench,
  CheckSquare,
  Square,
  HeartPulse,
  HardHat
} from 'lucide-react';

export const WorkerSquadPage = () => {
  const { currentUser } = useAuth();

  const squad = getStoredTeams().find(t => 
    t.id === currentUser?.assignedTeamId || 
    t.name === currentUser?.assignedTeam ||
    (currentUser?.assignedTeam && t.name?.toLowerCase().includes(currentUser.assignedTeam.toLowerCase()))
  ) || {
    name: currentUser?.assignedTeam || 'Sanitation Squad',
    vehicleNo: currentUser?.vehicleAssigned || 'Field Unit',
    vehicleType: 'Hydraulic Compactor (6 Ton)',
    currentLocation: currentUser?.ward || 'Central Municipal Depot',
    shift: currentUser?.shift || 'Morning (06:00 - 14:00)',
    members: 4,
    lead: currentUser?.name || 'Squad Lead',
    workerLeadId: currentUser?.userId || 'WRK-FIELD',
    workerPhone: currentUser?.phone || '+91 98220 00000'
  };

  // Daily PPE Checklist state
  const [ppeChecklist, setPpeChecklist] = useState({
    vest: true,
    gloves: true,
    boots: true,
    mask: true,
    eyewear: false,
    firstAid: true
  });

  const toggleCheck = (key) => {
    setPpeChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allPassed = Object.values(ppeChecklist).every(Boolean);

  const teamRoster = [
    {
      name: currentUser?.name || squad.lead || 'Squad Lead',
      id: currentUser?.userId || squad.workerLeadId || 'WRK-2026-00001',
      role: `${squad.name} Lead & Sanitation Specialist`,
      phone: currentUser?.phone || squad.workerPhone || '+91 98765 43210',
      status: 'On Duty (Shift A)',
      isLead: true
    },
    {
      name: 'Sunil Pawar',
      id: 'WRK-2026-00014',
      role: 'Heavy Compactor Operator & Driver',
      phone: '+91 98221 55678',
      status: 'On Duty (Shift A)',
      isLead: false
    },
    {
      name: 'Deepak Kamble',
      id: 'WRK-2026-00028',
      role: 'Bio-Safety Handler & Sweep Operator',
      phone: '+91 98114 99823',
      status: 'On Duty (Shift A)',
      isLead: false
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Sanitation Squad Fleet & Field Safety"
        subtitle="Live vehicle health, telemetry, team squad roster, and mandatory municipal PPE inspection protocols."
        breadcrumbs={[{ label: "Worker Portal", path: "/worker/dashboard" }, { label: "Fleet & Safety" }]}
        badge={
          <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{squad.name} Operational</span>
          </span>
        }
      />

      {/* Vehicle Telemetry Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">{squad.vehicleType} {squad.vehicleNo}</h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assigned to: {squad.name} • {squad.currentLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>GPS Transponder 43.129</span>
            </div>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Fuel Reserve</span>
              <Fuel className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-black text-white">84%</p>
            <p className="text-[10px] text-emerald-400 font-sans">Range ~240 km</p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Bin Payload</span>
              <Truck className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xl font-black text-white">2.1 / 4.5 T</p>
            <p className="text-[10px] text-sky-300 font-sans">46% Capacity Filled</p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Hydraulic Pressure</span>
              <Wrench className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-white">210 bar</p>
            <p className="text-[10px] text-emerald-400 font-sans">Optimal Operating Range</p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Shift Window</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-black text-white">06:00 - 14:00</p>
            <p className="text-[10px] text-purple-300 font-sans">Shift A (Morning)</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Roster & PPE Safety Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Squad Team Roster (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Squad Alpha Field Personnel</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">3 Active Crew Members</span>
            </div>

            <div className="space-y-3">
              {teamRoster.map((member) => (
                <div 
                  key={member.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    member.isLead ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm ${
                      member.isLead ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm">{member.name}</h4>
                        {member.isLead && (
                          <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.2 rounded-md">
                            SQUAD LEAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{member.role}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{member.id} • {member.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{member.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency & Municipal Dispatch Hotline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-700 border-b border-slate-100 pb-3">
              <PhoneCall className="w-5 h-5 text-rose-600" />
              <h3 className="font-black text-slate-900 text-base">Emergency Hotlines & Dispatch Radio</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-rose-900 uppercase text-[10px] tracking-wider">Hazardous Spill Hotline</span>
                <p className="text-base font-black text-rose-700 font-mono">1800-233-5555</p>
                <p className="text-[11px] text-rose-800">Direct link to Municipal Biohazard Squad</p>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-blue-900 uppercase text-[10px] tracking-wider">Depot Dispatch Control</span>
                <p className="text-base font-black text-blue-700 font-mono">+91 20 2550 1234</p>
                <p className="text-[11px] text-blue-800">Radio Channel #04 (Sector 04 Operations)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Daily Safety & PPE Inspection Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Daily PPE Safety Check</h3>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                allPassed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {allPassed ? 'Compliant' : 'Inspection Pending'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Mandatory municipal safety compliance requires all squad personnel to inspect and wear approved gear before undertaking on-ground clearing tasks.
            </p>

            <div className="space-y-2.5">
              {[
                { id: 'vest', label: 'High-Visibility Reflective Vest', desc: 'Class 3 safety vest with reflective bands' },
                { id: 'gloves', label: 'Puncture-Proof Heavy Work Gloves', desc: 'Nitrile/Kevlar reinforced against glass and sharps' },
                { id: 'boots', label: 'Steel-Toe Waterproof Safety Boots', desc: 'Anti-slip puncture resistant soles' },
                { id: 'mask', label: 'N95 / Particulate Dust Respirator', desc: 'Mandatory for dry dust and biohazard areas' },
                { id: 'eyewear', label: 'Protective Safety Glasses / Visor', desc: 'Splash and airborne debris protection' },
                { id: 'firstAid', label: 'Mobile First Aid & Antiseptic Kit', desc: 'Inspected and loaded in vehicle cabin' },
              ].map((item) => {
                const isChecked = ppeChecklist[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{item.label}</h5>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Municipal Safety Directive #2026-B</span>
              </span>
              <p className="text-[11px] text-slate-500">
                All field staff are insured under the Pune Civic Health & Sanitation Worker Protection Scheme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
