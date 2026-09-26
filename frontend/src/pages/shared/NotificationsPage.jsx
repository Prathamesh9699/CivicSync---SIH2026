import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/PageHeader';
import { 
  Bell, 
  CheckCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Shield, 
  Smartphone, 
  Lock, 
  LogIn, 
  Check, 
  Sparkles,
  Inbox
} from 'lucide-react';

export const NotificationsPage = () => {
  const { currentUser, isAuthenticated, role } = useAuth();
  const { notifications, markAsRead, markAllAsRead, smsLogs } = useNotifications();
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'sms'

  // Filter SMS logs for current user if citizen
  const userSmsLogs = isAuthenticated && currentUser
    ? (role === 'citizen' && currentUser.phone
        ? smsLogs.filter(s => s.recipientPhone?.replace(/[^0-9]/g, '').slice(-10) === currentUser.phone?.replace(/[^0-9]/g, '').slice(-10))
        : smsLogs)
    : [];

  // If not logged in, prompt user to log in
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto shadow-inner border border-slate-200">
          <Lock className="w-8 h-8 text-slate-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-slate-900">Sign In to View Notifications</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            CleanTrack notifications and civic resolution SMS alerts are confidential and visible only for the authenticated logged-in account.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-brand-500/25 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In to Your Account</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PageHeader
        title="Notification Center"
        subtitle={`Real-time notifications and mobile SMS alerts for ${currentUser.name} (${currentUser.userId || 'CIT-2026'}).`}
        breadcrumbs={[{ label: "Notifications" }]}
        actions={
          activeTab === 'inbox' && notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'inbox'
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>In-App Notifications ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sms')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'sms'
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Phone SMS Dispatch Alerts ({userSmsLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: INBOX NOTIFICATIONS */}
      {activeTab === 'inbox' && (
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  notif.read ? "bg-white border-slate-200" : "bg-brand-50/40 border-brand-200 shadow-xs ring-1 ring-brand-100"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    notif.type === 'success' ? "bg-emerald-100 text-emerald-700" :
                    notif.type === 'alert' ? "bg-rose-100 text-rose-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                     notif.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> :
                     <Info className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1.5">{notif.timestamp}</span>
                  </div>
                </div>

                {notif.link && (
                  <Link
                    to={notif.link}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 flex-shrink-0"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No New Notifications</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You're all caught up! When municipal teams update your reports or award Green Points, you'll see alerts here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SMS LOGS */}
      {activeTab === 'sms' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>
                Registered Phone for SMS Alerts: <strong>{currentUser.phone || '+91 98230 11452'}</strong>
              </span>
            </div>
            <span className="bg-emerald-200/70 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Active Carrier Dispatch
            </span>
          </div>

          {userSmsLogs.length > 0 ? (
            userSmsLogs.map((sms) => (
              <div
                key={sms.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <div>
                      <strong className="font-bold text-sm text-slate-900 block">
                        SMS Sent to {sms.recipientPhone}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ticket: {sms.complaintId} • Ward: {sms.ward}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{sms.status || 'DELIVERED'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sms.formattedTime || 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Message Body Styled like a Mobile SMS Message */}
                <div className="bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-slate-100 leading-relaxed font-sans">{sms.message}</p>
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Gateway: {sms.gateway}</span>
                    <span>Tracking: {sms.trackingId}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No SMS Alerts Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever the municipal team resolves your complaint, an SMS notification will be dispatched to your phone number and logged here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
