import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { getStoredTeams, saveStoredTeams, syncSquadStatusesWithComplaints } from '../../data/teams';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Truck, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  PlusCircle, 
  ArrowRight,
  Shield,
  X,
  Sparkles,
  Search,
  Filter,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';

export const AssignmentsPage = () => {
  const { complaints } = useComplaints();
  const { registerSquadWorker } = useAuth();
  const { showToast, addNotification } = useNotifications();

  const [teams, setTeams] = useState(getStoredTeams);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('squads'); // 'squads' | 'vehicles'
  const [showPassword, setShowPassword] = useState(false);

  // Automatically sync squad operational status with active complaint dispatches
  useEffect(() => {
    if (complaints && complaints.length >= 0) {
      const synced = syncSquadStatusesWithComplaints(complaints);
      setTeams(synced);
    }
  }, [complaints]);

  // New Team Form State
  const [newTeam, setNewTeam] = useState({
    name: '',
    unit: 'Plastic & Dry Waste Compactor',
    lead: '',
    leadPhone: '',
    username: '',
    password: '',
    members: 4,
    vehicleNo: '',
    vehicleType: 'Hydraulic Compactor (6 Ton)',
    status: 'Available',
    currentLocation: 'Shivaji Nagar Civic Depot',
    equipment: 'Hydraulic Loader, Segregated Bins, Safety PPE',
    shift: 'Morning (06:00 - 14:00)'
  });

  const [formErrors, setFormErrors] = useState({});

  const toggleTeamStatus = (teamId) => {
    const updated = teams.map(t => {
      if (t.id === teamId) {
        const nextStatus = t.status === "Available" ? "Cleaning" : t.status === "Cleaning" ? "Maintenance" : "Available";
        const nextColor = nextStatus === "Available" 
          ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
          : nextStatus === "Cleaning" 
          ? "bg-amber-100 text-amber-800 border-amber-300" 
          : "bg-slate-100 text-slate-800 border-slate-300";
        return { ...t, status: nextStatus, statusColor: nextColor };
      }
      return t;
    });

    setTeams(updated);
    saveStoredTeams(updated);

    showToast({
      title: "Vehicle & Squad Status Refreshed",
      message: `Operational status updated in municipal dispatch database.`,
      type: "info"
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!newTeam.name.trim()) errors.name = "Squad name is required";
    if (!newTeam.lead.trim()) errors.lead = "Supervisor / Driver name is required";
    if (!newTeam.vehicleNo.trim()) errors.vehicleNo = "Vehicle registration number is required (e.g. MH-12-QX-4892)";

    const cleanUsername = (newTeam.username || '').trim().toLowerCase();
    if (!cleanUsername) {
      errors.username = "Squad leader login username is required";
    } else if (cleanUsername.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    } else if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      errors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!newTeam.password) {
      errors.password = "Squad leader login password is required";
    } else if (newTeam.password.length < 4) {
      errors.password = "Password must be at least 4 characters long";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const squadId = `team_${Date.now()}`;
    const vehicleReg = newTeam.vehicleNo.trim().toUpperCase();

    // Register authenticated worker user account for the squad leader
    const regResult = await registerSquadWorker({
      username: cleanUsername,
      password: newTeam.password.trim(),
      lead: newTeam.lead.trim(),
      leadPhone: newTeam.leadPhone.trim(),
      squadName: newTeam.name.trim(),
      squadId: squadId,
      vehicleNo: vehicleReg,
      currentLocation: newTeam.currentLocation.trim(),
      shift: newTeam.shift
    });

    if (!regResult.success) {
      setFormErrors({ username: regResult.message });
      return;
    }

    const created = {
      id: squadId,
      name: newTeam.name.trim(),
      unit: newTeam.unit,
      lead: newTeam.lead.trim() + (newTeam.leadPhone ? ` (${newTeam.leadPhone.trim()})` : ''),
      workerLeadName: newTeam.lead.trim(),
      workerLeadId: regResult.user?.userId || `WRK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      leaderUsername: cleanUsername,
      workerPhone: newTeam.leadPhone.trim(),
      members: Number(newTeam.members) || 4,
      vehicleNo: vehicleReg,
      vehicleType: newTeam.vehicleType,
      status: newTeam.status,
      statusColor: newTeam.status === "Available" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300",
      currentLocation: newTeam.currentLocation.trim() || "Central Municipal Depot",
      equipment: newTeam.equipment.split(',').map(s => s.trim()).filter(Boolean),
      activeAssignmentsCount: 0,
      rating: 5.0,
      shift: newTeam.shift
    };

    const updated = [created, ...teams];
    setTeams(updated);
    saveStoredTeams(updated);
    setIsAddModalOpen(false);

    addNotification({
      title: "New Squad & Leader Account Registered",
      message: `${created.name} registered! Squad Leader can now log in to the Worker module with username "${cleanUsername}".`,
      type: "success"
    });

    showToast({
      title: "Squad Registered with Worker Credentials",
      message: `Squad Leader login provisioned: Username @${cleanUsername}`,
      type: "success"
    });

    setNewTeam({
      name: '',
      unit: 'Plastic & Dry Waste Compactor',
      lead: '',
      leadPhone: '',
      username: '',
      password: '',
      members: 4,
      vehicleNo: '',
      vehicleType: 'Hydraulic Compactor (6 Ton)',
      status: 'Available',
      currentLocation: 'Shivaji Nagar Civic Depot',
      equipment: 'Hydraulic Loader, Segregated Bins, Safety PPE',
      shift: 'Morning (06:00 - 14:00)'
    });
    setFormErrors({});
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Sanitation Squad & Registered Vehicle Fleet"
        subtitle="Manage municipal rapid response teams, vehicle capacities, specialized gear, and route loads."
        breadcrumbs={[{ label: "Command Center", path: "/municipal/dashboard" }, { label: "Assignments" }]}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Squad & Vehicle</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('squads')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'squads' ? "bg-brand-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Active Sanitation Squads ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'vehicles' ? "bg-brand-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Registered Vehicles & Numbers ({teams.length})
        </button>
      </div>

      {/* Tab 1: Squad Cards Grid */}
      {activeTab === 'squads' && (
        teams.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Sanitation Squads Registered Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Start fresh by registering your first municipal squad with its leader credentials (username & password), assigned vehicle, and operational capacity.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add First Squad & Vehicle</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">{team.name}</h3>
                      <p className="text-xs text-slate-500">{team.unit}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          Worker Login: <strong className="text-amber-700">@{team.leaderUsername || 'worker'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleTeamStatus(team.id)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${team.statusColor || 'bg-emerald-100 text-emerald-800'}`}
                    title="Click to toggle status (automatically updated when dispatched to complaints)"
                  >
                    {team.status}
                  </button>
                </div>

                {/* Core Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 font-medium">Supervisor / Driver</span>
                    <p className="font-bold text-slate-800">{team.lead}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 font-medium">Vehicle Reg & Type</span>
                    <p className="font-bold text-slate-800 font-mono">{team.vehicleNo || 'MH-12-REG'} • {team.vehicleType}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 font-medium">Crew Size</span>
                    <p className="font-bold text-slate-800">{team.members} Sanitation Workers</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 font-medium">Duty Shift</span>
                    <p className="font-bold text-slate-800">{team.shift}</p>
                  </div>
                </div>

                {/* Equipment Inventory */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Onboard Specialized Equipment:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(team.equipment || []).map((eq, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{team.currentLocation}</span>
                  </div>
                  <span className="font-bold text-brand-700">
                    {team.activeAssignmentsCount || 0} Active {team.activeAssignmentsCount === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab 2: Registered Vehicles Table */}
      {activeTab === 'vehicles' && (
        teams.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Registered Vehicles in Fleet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vehicles are registered along with each sanitation squad. Register your first squad to initialize the vehicle fleet.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Vehicle & Squad</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Municipal Registered Vehicle Registry</h3>
                <p className="text-xs text-slate-500">Live operational status and assigned squad drivers</p>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200">
                {teams.filter(t => t.status === "Available").length} / {teams.length} Vehicles Available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Vehicle Registration No</th>
                    <th className="py-3.5 px-4">Vehicle Classification</th>
                    <th className="py-3.5 px-4">Assigned Squad</th>
                    <th className="py-3.5 px-4">Driver / Supervisor</th>
                    <th className="py-3.5 px-4">Depot Location</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teams.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-extrabold text-slate-900 text-sm">
                        {t.vehicleNo || 'MH-12-QX-4012'}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800">
                        {t.vehicleType}
                      </td>
                      <td className="py-4 px-4 font-semibold text-blue-700">
                        {t.name}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        <div className="font-bold text-slate-800">{t.lead}</div>
                        <div className="text-[10px] font-mono text-amber-700 mt-0.5">
                          Login: @{t.leaderUsername || 'worker'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {t.currentLocation}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${t.statusColor || 'bg-emerald-100 text-emerald-800'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => toggleTeamStatus(t.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* REGISTER SQUAD & VEHICLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Register New Squad & Vehicle</h3>
                  <p className="text-xs text-slate-300">Add operational sanitation vehicle, response team, and supervisor worker credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} noValidate className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Squad / Team Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Squad Echo (Specialized)"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {formErrors.name && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Division / Waste Stream</label>
                  <select
                    value={newTeam.unit}
                    onChange={(e) => setNewTeam({ ...newTeam, unit: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    <option value="Plastic & Dry Waste Compactor">Plastic & Dry Waste Compactor</option>
                    <option value="Medical & Bio-Hazard Safety Unit">Medical & Bio-Hazard Safety Unit</option>
                    <option value="E-Waste Recovery & Disposal">E-Waste Recovery & Disposal</option>
                    <option value="Rapid Street Sweeper Fleet">Rapid Street Sweeper Fleet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-12-QX-4892"
                    value={newTeam.vehicleNo}
                    onChange={(e) => setNewTeam({ ...newTeam, vehicleNo: e.target.value })}
                    className="w-full text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {formErrors.vehicleNo && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.vehicleNo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type & Capacity</label>
                  <input
                    type="text"
                    placeholder="e.g. Hydraulic Compactor (6 Ton)"
                    value={newTeam.vehicleType}
                    onChange={(e) => setNewTeam({ ...newTeam, vehicleType: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supervisor / Lead Driver *</label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Sharma"
                    value={newTeam.lead}
                    onChange={(e) => setNewTeam({ ...newTeam, lead: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {formErrors.lead && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.lead}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9822019922"
                    value={newTeam.leadPhone}
                    onChange={(e) => setNewTeam({ ...newTeam, leadPhone: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* SQUAD LEADER CREDENTIALS FOR WORKER MODULE LOGIN */}
                <div className="sm:col-span-2 p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          Squad Leader Worker Login Credentials *
                        </h4>
                        <p className="text-[11px] text-amber-800">
                          Used by this squad supervisor to sign into the field Worker Operations module
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                      Worker Portal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Leader Login Username *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">@</span>
                        <input
                          type="text"
                          placeholder="e.g. rahul_lead or squad_echo"
                          value={newTeam.username}
                          onChange={(e) => setNewTeam({ ...newTeam, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                          className="w-full text-xs pl-7 pr-3 border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                      {formErrors.username && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.username}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Leader Login Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password (min 4 chars)"
                          value={newTeam.password}
                          onChange={(e) => setNewTeam({ ...newTeam, password: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {formErrors.password && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.password}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crew Size (Workers)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTeam.members}
                    onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newTeam.status}
                    onChange={(e) => setNewTeam({ ...newTeam, status: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    <option value="Available">Available (Ready for Dispatch)</option>
                    <option value="Cleaning">On Duty / In Field</option>
                    <option value="Maintenance">In Workshop Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Depot / Ward Jurisdiction</label>
                <input
                  type="text"
                  placeholder="e.g. Kothrud Civic Depot (Ward 08)"
                  value={newTeam.currentLocation}
                  onChange={(e) => setNewTeam({ ...newTeam, currentLocation: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Onboard Equipment (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Hydraulic Loader, PPE Gear, High-Density Bags, Pressure Washer"
                  value={newTeam.equipment}
                  onChange={(e) => setNewTeam({ ...newTeam, equipment: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Squad & Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
