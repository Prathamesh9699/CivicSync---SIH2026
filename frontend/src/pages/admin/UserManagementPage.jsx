import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DEMO_USERS } from '../../data/users';
import { useNotifications } from '../../context/NotificationContext';
import { Users, Search, Shield, User, Building2, Check, X, Edit2, UserPlus } from 'lucide-react';

export const UserManagementPage = () => {
  const { showToast } = useNotifications();
  const [usersList, setUsersList] = useState(() => {
    try {
      const raw = localStorage.getItem('cleantrack_registered_users_v6');
      const registered = raw ? JSON.parse(raw) : [];
      const all = [...DEMO_USERS];
      registered.forEach(r => {
        if (!all.some(u => u.email === r.email)) {
          all.push(r);
        }
      });
      return all;
    } catch (e) {
      return DEMO_USERS;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New User Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('municipal_staff');
  const [newWard, setNewWard] = useState('Ward 12 - Shivaji Nagar');
  const [newDesignation, setNewDesignation] = useState('Zonal Inspection Officer');

  const filteredUsers = usersList.filter(u => {
    const matchRole = filterRole === 'All' || u.role === filterRole;
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.userId && u.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.id && u.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.ward?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  const toggleUserStatus = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextActive = u.isActive !== false ? false : true;
        return { ...u, isActive: nextActive };
      }
      return u;
    }));

    showToast({
      title: "User Permissions Updated",
      message: `User account status synchronized with RBAC policy.`,
      type: "info"
    });
  };

  const [modalErrors, setModalErrors] = useState({});

  const validateModalForm = () => {
    const errors = {};
    if (!newName.trim()) {
      errors.name = "Full name is required.";
    } else if (newName.trim().length < 3) {
      errors.name = "Name must be at least 3 characters.";
    }

    if (!newEmail.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (newPhone.trim() && !/^(91)?[6-9]\d{9}$/.test(newPhone.replace(/[\s\-\(\)\+]/g, ''))) {
      errors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (!newDesignation.trim()) {
      errors.designation = "Official designation is required.";
    }

    setModalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    const prefix = newRole === 'municipal_staff' ? 'MUN' : newRole === 'admin' ? 'ADM' : 'CIT';
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const userId = `${prefix}-2026-${randomCode}`;

    const newUser = {
      id: `usr_${Date.now()}`,
      userId,
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+91 98220 00000',
      role: newRole,
      ward: newWard,
      designation: newDesignation.trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName.trim())}&background=7c3aed&color=fff&bold=true`,
      isActive: true
    };

    const updatedList = [newUser, ...usersList];
    setUsersList(updatedList);
    try {
      localStorage.setItem('cleantrack_registered_users', JSON.stringify(updatedList));
    } catch (err) {}

    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewDesignation('Zonal Field Officer');
    setModalErrors({});

    showToast({
      title: "New User Provisioned",
      message: `Created account for ${newName} with ID: ${userId}.`,
      type: "success"
    });
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="User & Role-Based Access Control (RBAC)"
        subtitle="Manage citizen profiles, municipal officers, zonal authorizations, and administrative privileges."
        breadcrumbs={[{ label: "Admin Console", path: "/admin/dashboard" }, { label: "Users" }]}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Municipal Officer / User</span>
          </button>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name, email, User ID (CIT-2026-...), or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500 font-semibold"
            >
              <option value="All">Filter: All User Roles</option>
              <option value="citizen">Citizens Only</option>
              <option value="municipal_staff">Municipal Staff</option>
              <option value="admin">System Administrators</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
          <span>Displaying <strong>{filteredUsers.length}</strong> active user accounts</span>
          <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
            RBAC Enforcement Active
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User ID & Credential</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role / Designation</th>
                <th className="py-3.5 px-4">Ward / Jurisdiction</th>
                <th className="py-3.5 px-4">Phone / Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {filteredUsers.map((user) => {
                const userDisplayId = user.userId || (user.id?.startsWith('CIT-') || user.id?.startsWith('MUN-') || user.id?.startsWith('ADM-') ? user.id : `${user.role === 'municipal_staff' ? 'MUN' : user.role === 'admin' ? 'ADM' : 'CIT'}-2026-${Math.abs((user.email || 'user').split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0)%90000 + 10000)}`);

                return (
                  <tr key={user.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 text-[11px]">
                        {userDisplayId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-600" />
                        <div>
                          <strong className="text-white block font-bold">{user.name}</strong>
                          <span className="text-[11px] text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${
                        user.role === 'admin' ? "bg-purple-900/60 text-purple-300 border-purple-700" :
                        user.role === 'municipal_staff' ? "bg-blue-900/60 text-blue-300 border-blue-700" :
                        "bg-emerald-900/60 text-emerald-300 border-emerald-700"
                      }`}>
                        {user.role}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-1">{user.designation || "Active Citizen"}</span>
                    </td>
                    <td className="py-3.5 px-4">{user.ward || "All PMC Zones"}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">{user.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                        user.isActive !== false ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                        {user.isActive !== false ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        {user.isActive !== false ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Municipal Officer / User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold">Provision New User Account</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} noValidate className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (modalErrors.name) setModalErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Ramesh Kadam"
                  className={`w-full p-2.5 bg-slate-950 border rounded-xl text-white focus:outline-none transition-all ${
                    modalErrors.name ? "border-rose-500 focus:ring-2 focus:ring-rose-500" : "border-slate-700 focus:ring-2 focus:ring-purple-500"
                  }`}
                />
                {modalErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{modalErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (modalErrors.email) setModalErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="e.g. ramesh.kadam@clean-city.gov"
                  className={`w-full p-2.5 bg-slate-950 border rounded-xl text-white focus:outline-none transition-all ${
                    modalErrors.email ? "border-rose-500 focus:ring-2 focus:ring-rose-500" : "border-slate-700 focus:ring-2 focus:ring-purple-500"
                  }`}
                />
                {modalErrors.email && (
                  <p className="text-[11px] text-rose-400 mt-1">{modalErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value);
                    if (modalErrors.phone) setModalErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder="e.g. 9822011223"
                  className={`w-full p-2.5 bg-slate-950 border rounded-xl text-white focus:outline-none transition-all ${
                    modalErrors.phone ? "border-rose-500 focus:ring-2 focus:ring-rose-500" : "border-slate-700 focus:ring-2 focus:ring-purple-500"
                  }`}
                />
                {modalErrors.phone && (
                  <p className="text-[11px] text-rose-400 mt-1">{modalErrors.phone}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="municipal_staff">Municipal Staff</option>
                    <option value="citizen">Citizen</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ward</label>
                  <select
                    value={newWard}
                    onChange={(e) => setNewWard(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Ward 12 - Shivaji Nagar">Ward 12 - Shivaji Nagar</option>
                    <option value="Ward 05 - Baner">Ward 05 - Baner</option>
                    <option value="Ward 07 - Kothrud">Ward 07 - Kothrud</option>
                    <option value="Ward 14 - Deccan">Ward 14 - Deccan</option>
                    <option value="All PMC Zones">All PMC Zones</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Official Designation <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => {
                    setNewDesignation(e.target.value);
                    if (modalErrors.designation) setModalErrors(prev => ({ ...prev, designation: '' }));
                  }}
                  placeholder="e.g. Zonal Sanitation Officer"
                  className={`w-full p-2.5 bg-slate-950 border rounded-xl text-white focus:outline-none transition-all ${
                    modalErrors.designation ? "border-rose-500 focus:ring-2 focus:ring-rose-500" : "border-slate-700 focus:ring-2 focus:ring-purple-500"
                  }`}
                />
                {modalErrors.designation && (
                  <p className="text-[11px] text-rose-400 mt-1">{modalErrors.designation}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
