import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  Shield, 
  Save, 
  CheckCircle2, 
  Copy, 
  Check, 
  IdCard, 
  QrCode, 
  Sparkles,
  Building2
} from 'lucide-react';

export const ProfilePage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [ward, setWard] = useState(currentUser?.ward || "Ward 12 - Shivaji Nagar");
  const [copiedId, setCopiedId] = useState(false);
  const [errors, setErrors] = useState({});

  const uniqueUserId = currentUser?.userId || (currentUser?.id?.startsWith('CIT-') || currentUser?.id?.startsWith('MUN-') || currentUser?.id?.startsWith('ADM-') ? currentUser.id : `CIT-2026-${Math.abs((currentUser?.email || 'user').split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0)%90000 + 10000)}`);

  const points = typeof currentUser?.greenPoints === 'number' ? currentUser.greenPoints : 0;

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(uniqueUserId);
    setCopiedId(true);
    showToast({
      title: "User ID Copied",
      message: `${uniqueUserId} copied to clipboard.`,
      type: "success"
    });
    setTimeout(() => setCopiedId(false), 3000);
  };

  const isValidPhone = (p) => {
    const clean = p.replace(/[\s\-\(\)\+]/g, '');
    return /^(91)?[6-9]\d{9}$/.test(clean);
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = "Full name is required.";
    } else if (name.trim().length < 3) {
      errs.name = "Name must be at least 3 characters long.";
    }

    if (phone.trim() && !isValidPhone(phone)) {
      errs.phone = "Please enter a valid 10-digit mobile number (e.g. 9823011452).";
    }

    if (!ward.trim()) {
      errs.ward = "Primary ward is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    showToast({
      title: "Profile Updated",
      message: "Your profile information has been saved successfully.",
      type: "success"
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PageHeader
        title="User Profile & Civic Identity"
        subtitle="Manage your contact details, unique account credentials, and municipal ward preferences."
        breadcrumbs={[{ label: "Profile" }]}
      />

      {/* Unique Civic Identity Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-forest-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl space-y-6 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-400/30 text-emerald-300 flex items-center justify-center font-bold">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                Official CleanTrack Digital ID
              </span>
              <h3 className="text-base font-extrabold text-white">Pune Municipal Civic Registry</h3>
            </div>
          </div>

          {/* Unique User ID Badge with 1-Click Copy */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl font-mono text-sm font-extrabold text-emerald-300 tracking-wider flex items-center gap-2 shadow-inner">
              <span className="text-[11px] text-slate-400 font-sans font-bold">ID:</span>
              <span>{uniqueUserId}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyUserId}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 flex items-center gap-1.5 text-xs font-bold"
              title="Copy User ID to clipboard"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedId ? "Copied" : "Copy ID"}</span>
            </button>
          </div>
        </div>

        {/* User Card Core Information */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=059669&color=fff&bold=true`}
            alt={currentUser?.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md flex-shrink-0"
          />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">{currentUser?.name || "User Profile"}</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                {currentUser?.role === 'municipal_staff' ? 'Municipal Officer' : currentUser?.role === 'admin' || currentUser?.role === 'administrator' ? 'Administrator' : 'Citizen Contributor'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/50">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono">{currentUser?.email} {currentUser?.phone ? `• ${currentUser?.phone}` : ''}</p>
            <p className="text-xs text-slate-400 font-medium">{currentUser?.ward || "Ward 12 - Shivaji Nagar"} • Pune Municipal Corporation</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center sm:text-right space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Civic Impact</span>
            <div className="flex items-center sm:justify-end gap-1.5 text-amber-300 font-extrabold text-lg">
              <Award className="w-5 h-5 text-amber-400" />
              <span>{points} Green Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Personal Information & Preferences</h3>
            <p className="text-xs text-slate-500">Update your verified name, phone number, and jurisdiction</p>
          </div>
          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
            Account: {uniqueUserId}
          </span>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                className={`w-full text-xs sm:text-sm border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  errors.name ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder="10-digit mobile number"
                className={`w-full text-xs sm:text-sm border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  errors.phone ? "border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.phone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Primary Municipal Ward / Zone <span className="text-rose-500">*</span>
              </label>
              <select
                value={ward}
                onChange={(e) => {
                  setWard(e.target.value);
                  if (errors.ward) setErrors(prev => ({ ...prev, ward: '' }));
                }}
                className={`w-full text-xs sm:text-sm border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                  errors.ward ? "border-rose-400 focus:ring-2 focus:ring-rose-400" : "border-slate-200 focus:ring-2 focus:ring-brand-500"
                }`}
              >
                <option value="Ward 12 - Shivaji Nagar">Ward 12 - Shivaji Nagar</option>
                <option value="Ward 05 - Baner">Ward 05 - Baner</option>
                <option value="Ward 07 - Kothrud">Ward 07 - Kothrud</option>
                <option value="Ward 14 - Deccan Gymkhana">Ward 14 - Deccan Gymkhana</option>
                <option value="Ward 09 - Hadapsar">Ward 09 - Hadapsar</option>
                <option value="Ward 11 - Viman Nagar">Ward 11 - Viman Nagar</option>
              </select>
              {errors.ward && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.ward}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
