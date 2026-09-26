import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogIn, LayoutDashboard } from 'lucide-react';

export const AccessRestrictedPage = () => {
  const { role, currentUser } = useAuth();

  const getDashboardPath = () => {
    if (role === 'citizen') return '/citizen/dashboard';
    if (role === 'municipal_staff') return '/municipal/dashboard';
    if (role === 'admin' || role === 'administrator') return '/admin/dashboard';
    return '/';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your current account role (<strong>{role === 'municipal_staff' ? 'Municipal Staff' : role}</strong>) does not have authorization to view this module.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          {currentUser ? (
            <Link
              to={getDashboardPath()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to My Authorized Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Authorized Account</span>
            </Link>
          )}

          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
