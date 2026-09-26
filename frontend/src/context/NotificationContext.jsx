import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationApi } from '../services/api';
import { smsService } from '../services/smsService';

const NotificationContext = createContext();

const NOTIFICATIONS_STORAGE_KEY = 'cleantrack_all_notifications_v4';

const getStoredAllNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveStoredAllNotifications = (notifs) => {
  try {
    const safe = Array.isArray(notifs) ? notifs : [];
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(safe));
  } catch (e) {}
};

export const NotificationProvider = ({ children }) => {
  const { currentUser, role, isAuthenticated } = useAuth();
  const [allNotifications, setAllNotifications] = useState(getStoredAllNotifications);
  const [activeToast, setActiveToast] = useState(null);
  const [smsLogs, setSmsLogs] = useState(() => {
    try {
      return smsService.getAllLogs() || [];
    } catch (e) {
      return [];
    }
  });

  // Helper to check if a notification belongs to the current user
  const matchesCurrentUser = useCallback((n, user) => {
    if (!user || !n) return false;
    
    // 1. Explicit userId match
    if (n.userId && n.userId !== 'all') {
      const matchId = (
        (user.id && n.userId === user.id) ||
        (user.userId && n.userId === user.userId) ||
        (user._id && (n.userId === user._id || String(n.userId) === String(user._id))) ||
        (user.email && n.userId === user.email) ||
        (user.phone && n.userPhone && String(n.userPhone).replace(/\D/g, '') === String(user.phone).replace(/\D/g, ''))
      );
      return matchId;
    }

    // 2. Role-specific notification
    if (n.targetRole && n.targetRole !== 'all') {
      return n.targetRole === user.role;
    }

    // 3. Broadcast to all users
    return n.targetRole === 'all' || !n.targetRole;
  }, []);

  // Filtered notifications strictly visible to the logged-in user
  const safeList = Array.isArray(allNotifications) ? allNotifications : [];
  const notifications = isAuthenticated && currentUser
    ? safeList.filter(n => matchesCurrentUser(n, currentUser))
    : [];

  const unreadCount = notifications.filter(n => n && !n.read).length;

  const fetchLiveNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    try {
      const res = await notificationApi.getAll(currentUser.role);
      if (res.success && res.notifications && Array.isArray(res.notifications)) {
        const formatted = res.notifications.map(n => ({
          id: n._id || n.id,
          userId: n.userId || null,
          targetRole: n.targetRole || 'all',
          title: n.title,
          message: n.message,
          type: n.type === 'sla_escalated' || n.priority === 'critical' ? 'alert' : n.type === 'complaint_resolved' ? 'success' : 'info',
          read: n.isRead,
          timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          link: n.link || ''
        }));

        setAllNotifications(prev => {
          const merged = [...formatted];
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p);
            }
          });
          saveStoredAllNotifications(merged);
          return merged;
        });
      }
    } catch (e) {
      // Offline fallback
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    fetchLiveNotifications();
    setSmsLogs(smsService.getAllLogs());
  }, [fetchLiveNotifications, currentUser]);

  const addNotification = ({
    title,
    message,
    type = "success",
    link = "",
    ticketId = null,
    userId = null,
    targetRole = null
  }) => {
    // Determine effective recipient
    const recipientUserId = userId || (currentUser ? (currentUser.id || currentUser.userId || currentUser._id) : null);
    const recipientRole = targetRole || (currentUser ? currentUser.role : 'all');

    const newNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: recipientUserId,
      targetRole: recipientRole,
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      link,
      ticketId
    };

    setAllNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveStoredAllNotifications(updated);
      return updated;
    });

    showToast({ title, message, type });
  };

  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
    } catch (e) {}
    setAllNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveStoredAllNotifications(updated);
      return updated;
    });
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead(currentUser?.role || 'citizen');
    } catch (e) {}
    setAllNotifications(prev => {
      const updated = prev.map(n => {
        if (currentUser && matchesCurrentUser(n, currentUser)) {
          return { ...n, read: true };
        }
        return n;
      });
      saveStoredAllNotifications(updated);
      return updated;
    });
  };

  const showToast = ({ title, message, type = "success", smsData = null }) => {
    setActiveToast({ title, message, type, smsData, id: Date.now() });
    setTimeout(() => {
      setActiveToast(null);
    }, 6000);
  };

  /**
   * Dispatch SMS text message to citizen's phone and alert UI
   */
  const dispatchResolutionSms = async ({
    phone,
    complaintId,
    ward = 'Civic Area',
    category = 'Waste',
    citizenName = 'Citizen',
    pointsEarned = 50,
    officerName = 'Municipal Sanitation Squad'
  }) => {
    const targetPhone = phone || (currentUser?.phone) || '+91 98230 11452';
    const sms = await smsService.sendComplaintResolvedSms({
      phone: targetPhone,
      complaintId,
      ward,
      category,
      citizenName,
      pointsEarned,
      officerName
    });

    setSmsLogs(smsService.getAllLogs());

    // Show high-visibility SMS toast
    showToast({
      title: `📱 SMS Sent to ${sms.recipientPhone}`,
      message: `"${sms.message}"`,
      type: "sms",
      smsData: sms
    });

    return sms;
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      allNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      showToast,
      activeToast,
      smsLogs,
      dispatchResolutionSms,
      refreshNotifications: fetchLiveNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
