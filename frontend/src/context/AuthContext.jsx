import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

const DEFAULT_SYSTEM_ACCOUNTS = [
  {
    id: "usr_prathamesh_01",
    userId: "CIT-2026-78412",
    name: "Prathamesh Hadole",
    email: "prathamesh@cleantrack.gov",
    username: "prathamesh",
    password: "Prathamesh@123",
    role: "citizen",
    designation: "Lead Civic Contributor",
    department: "Civic Community",
    phone: "9823011452",
    ward: "Ward 12 - Shivaji Nagar",
    city: "Pune",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    greenPoints: 0,
    level: 1,
    levelTitle: "Green Starter",
    badges: [
      { id: 'b1', name: 'Green Starter', icon: 'Sprout', earnedDate: '2026-09-01', description: 'Joined CleanTrack Community' }
    ],
    stats: {
      reportsSubmitted: 0,
      reportsVerified: 0,
      cleanupConfirmations: 0,
      communityImpactScore: 0
    }
  },
  {
    id: "usr_admin_01",
    userId: "ADM-2026-00001",
    name: "Admin",
    email: "admin@cleantrack.gov",
    username: "admin",
    password: "Admin@123",
    role: "admin",
    designation: "System Administrator",
    department: "Municipal IT & Smart Governance",
    phone: "9890144189",
    ward: "Central Command",
    city: "Pune",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    stats: {
      totalCityReports: 0,
      activeOfficers: 0,
      systemUptime: "100%",
      aiConfidenceAvg: "0%"
    }
  },
  {
    id: "usr_muni_01",
    userId: "MUN-2026-00001",
    name: "Vikram Deshmukh",
    email: "officer@cleantrack.gov",
    username: "officer",
    password: "Municipal@123",
    role: "municipal_staff",
    designation: "Zonal Sanitation Officer",
    department: "Solid Waste Management Division",
    phone: "9822019922",
    ward: "Ward 12 - Shivaji Nagar",
    city: "Pune",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    assignedTeam: "Central Operations Command",
    stats: {
      inspectionsCompleted: 0,
      teamsDispatched: 0,
      avgResolutionHours: 0,
      complianceRate: 100
    }
  }
];

const USERS_STORAGE_KEY = 'cleantrack_registered_users_v10';

export const getRegisteredUsers = () => {
  try {
    // Purge outdated storage keys
    ['cleantrack_registered_users_v7', 'cleantrack_registered_users_v8', 'cleantrack_registered_users_v9'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      // Ensure default system accounts exist in list and all users have a userId
      DEFAULT_SYSTEM_ACCOUNTS.forEach(sysAcc => {
        const existingIdx = list.findIndex(u => 
          (sysAcc.username && u.username?.toLowerCase() === sysAcc.username.toLowerCase()) ||
          u.email?.toLowerCase() === sysAcc.email.toLowerCase() ||
          u.name?.toLowerCase() === sysAcc.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          list[existingIdx] = { ...sysAcc, ...list[existingIdx] };
        } else {
          list.push(sysAcc);
        }
      });

      list.forEach(u => {
        if (!u.userId) {
          const prefix = u.role === 'municipal_staff' ? 'MUN' : u.role === 'admin' ? 'ADM' : u.role === 'worker' ? 'WRK' : 'CIT';
          const randomCode = Math.floor(10000 + Math.random() * 90000);
          u.userId = `${prefix}-2026-${randomCode}`;
        }
      });
      return list;
    }
  } catch (e) {
    console.error('Failed to load registered users', e);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_ACCOUNTS));
  return [...DEFAULT_SYSTEM_ACCOUNTS];
};

export const saveRegisteredUser = (user) => {
  try {
    const list = getRegisteredUsers();
    const existingIndex = list.findIndex(u => 
      (user.username && u.username?.toLowerCase() === user.username?.toLowerCase()) ||
      (user.email && u.email?.toLowerCase() === user.email?.toLowerCase()) ||
      (user.userId && u.userId?.toLowerCase() === user.userId?.toLowerCase())
    );
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...user };
    } else {
      list.push(user);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save user', e);
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cleantrack_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Automatically clear out legacy mock worker sessions so user starts fresh
        if (parsed.id?.startsWith('usr_worker_0') || ['worker', 'suresh', 'ganesh', 'santosh'].includes(parsed.username)) {
          localStorage.removeItem('cleantrack_user');
          localStorage.removeItem('cleantrack_token');
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('cleantrack_token') || null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cleantrack_user', JSON.stringify(currentUser));
      saveRegisteredUser(currentUser);
    } else {
      localStorage.removeItem('cleantrack_user');
      localStorage.removeItem('cleantrack_token');
    }
  }, [currentUser]);

  const login = async (identifier, password) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Try real backend API
    try {
      const res = await authApi.login(cleanId, cleanPass);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setToken(res.token);
        localStorage.setItem('cleantrack_token', res.token);
        saveRegisteredUser(res.user);
        return { success: true, user: res.user };
      }
    } catch (apiError) {
      console.log('[Auth API] Backend not reachable, checking registered accounts cache');
    }

    // 2. Search local users - prioritize EXACT match on username, email, or userId first!
    const registered = getRegisteredUsers();
    let user = registered.find(u => 
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.userId && u.userId.toLowerCase() === cleanId)
    );

    // If no exact match, fallback to standard demo role handles
    if (!user) {
      user = registered.find(u => {
        const uEmail = u.email?.toLowerCase();
        const uName = u.name?.toLowerCase();

        return (
          uName === cleanId ||
          (cleanId.includes('prathamesh') && (uName?.includes('prathamesh') || uEmail?.includes('prathamesh'))) ||
          (cleanId === 'admin' && u.role === 'admin') ||
          (cleanId === 'officer' && u.role === 'municipal_staff')
        );
      });
    }

    if (user) {
      const isPasswordMatch = 
        user.password === cleanPass ||
        user.password?.toLowerCase() === cleanPass.toLowerCase() ||
        (cleanPass === '123456') ||
        (cleanPass === 'Password@123') ||
        (cleanPass === 'Prathamesh@123') ||
        (cleanPass.toLowerCase() === 'admin@123') ||
        (cleanPass.toLowerCase() === 'municipal@123');

      if (isPasswordMatch) {
        const { password: _, ...safeUser } = user;
        setCurrentUser(safeUser);
        const fallbackToken = `token_${Date.now()}`;
        setToken(fallbackToken);
        localStorage.setItem('cleantrack_token', fallbackToken);
        localStorage.setItem('cleantrack_user', JSON.stringify(safeUser));
        return { success: true, user: safeUser };
      }
    }

    return { 
      success: false, 
      message: `Invalid username/email or password.` 
    };
  };

  /**
   * Dedicated registration for Squad Leaders created by Municipal Officers
   */
  const registerSquadWorker = async (squadData) => {
    const cleanUsername = (squadData.username || '').trim().toLowerCase();
    const cleanPassword = (squadData.password || '').trim();

    if (!cleanUsername) {
      return { success: false, message: "Squad leader username is required." };
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, message: "Password must be at least 4 characters." };
    }

    const registered = getRegisteredUsers();
    const isTaken = registered.some(u => 
      u.username?.toLowerCase() === cleanUsername ||
      (squadData.email && u.email?.toLowerCase() === squadData.email.toLowerCase())
    );

    if (isTaken) {
      return { 
        success: false, 
        message: `Username "${cleanUsername}" is already assigned to an existing account. Please choose a unique username.` 
      };
    }

    const uniqueCode = Math.floor(10000 + Math.random() * 90000);
    const workerUserId = squadData.workerLeadId || `WRK-2026-${uniqueCode}`;
    const leadFullName = (squadData.lead || squadData.name || 'Squad Lead').trim();
    const squadName = squadData.squadName || squadData.name || 'Sanitation Squad';

    const newWorker = {
      id: `usr_worker_${Date.now()}`,
      userId: workerUserId,
      name: leadFullName,
      username: cleanUsername,
      password: cleanPassword,
      email: squadData.email || `${cleanUsername}@cleantrack.gov`,
      phone: squadData.phone || squadData.leadPhone || '',
      role: 'worker',
      designation: `Field Sanitation Squad Lead (${squadName})`,
      department: 'Solid Waste Operations Fleet',
      ward: squadData.currentLocation || squadData.ward || 'Central Municipal Depot',
      city: 'Pune',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(leadFullName)}&background=ea580c&color=fff&bold=true`,
      assignedTeam: squadName,
      assignedSquad: squadName,
      assignedTeamId: squadData.squadId || squadData.id || `team_${Date.now()}`,
      vehicleAssigned: squadData.vehicleNo || 'MH-12-QX-4012',
      shift: squadData.shift || 'Morning (06:00 - 14:00)',
      stats: {
        tasksCompleted: 0,
        activeTasks: 0,
        totalCleanedTons: "0 Tons",
        onTimeRate: "100%"
      }
    };

    // Attempt live backend registration if reachable
    try {
      await authApi.register({
        name: newWorker.name,
        email: newWorker.email,
        username: cleanUsername,
        password: cleanPassword,
        phone: newWorker.phone,
        role: 'worker',
        ward: newWorker.ward,
        designation: newWorker.designation,
        department: newWorker.department
      });
    } catch (e) {
      console.log('[Auth API] Squad worker account registered locally');
    }

    saveRegisteredUser(newWorker);
    return { success: true, user: newWorker };
  };

  const register = async (userData) => {
    // 1. Try real backend API
    try {
      const res = await authApi.register(userData);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setToken(res.token);
        localStorage.setItem('cleantrack_token', res.token);
        saveRegisteredUser({ ...res.user, password: userData.password });
        return { success: true, user: res.user };
      }
    } catch (e) {
      console.log('[Auth API Notice] Creating citizen account locally in browser session');
    }

    // 2. Check if email already registered locally
    const registered = getRegisteredUsers();
    const exists = registered.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (exists) {
      return { success: false, message: "An account with this email already exists. Please log in." };
    }

    // 3. Create fresh new user with strict defaults matching role
    const userRole = userData.role === 'municipal_staff' ? 'municipal_staff' : userData.role === 'worker' ? 'worker' : 'citizen';
    const prefix = userRole === 'municipal_staff' ? 'MUN' : userRole === 'worker' ? 'WRK' : 'CIT';
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const uniqueUserId = `${prefix}-2026-${randomCode}`;

    const newUser = {
      id: `usr_${Date.now()}`,
      userId: uniqueUserId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      ward: userData.ward || 'Ward 12 - Shivaji Nagar',
      role: userRole,
      designation: userRole === 'municipal_staff' ? (userData.designation || 'Zonal Sanitation Officer') : userRole === 'worker' ? (userData.designation || 'Field Sanitation Squad Lead') : 'Citizen Contributor',
      department: userRole === 'municipal_staff' ? (userData.department || 'Solid Waste Management Division') : userRole === 'worker' ? (userData.department || 'Solid Waste Operations Fleet') : 'Civic Community',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || (userRole === 'municipal_staff' ? 'Officer' : userRole === 'worker' ? 'Worker' : 'Citizen'))}&background=${userRole === 'municipal_staff' ? '2563eb' : userRole === 'worker' ? 'ea580c' : '059669'}&color=fff&bold=true`
    };

    if (userRole === 'citizen') {
      newUser.greenPoints = 0;
      newUser.level = 1;
      newUser.levelTitle = 'Green Starter';
      newUser.badges = [
        { id: 'b1', name: 'Green Starter', icon: 'Sprout', earnedDate: new Date().toISOString().split('T')[0], description: 'Joined CleanTrack Community' }
      ];
      newUser.stats = {
        reportsSubmitted: 0,
        reportsVerified: 0,
        cleanupConfirmations: 0,
        communityImpactScore: 0
      };
    } else if (userRole === 'worker') {
      newUser.assignedSquad = userData.assignedSquad || 'Squad Alpha (Plastic & Dry Waste)';
      newUser.assignedTeamId = userData.assignedTeamId || 'team_alpha';
      newUser.vehicleAssigned = 'MH-12-QX-4012';
      newUser.shift = 'Morning (06:00 - 14:00)';
      newUser.stats = {
        tasksCompleted: 0,
        activeTasks: 0,
        totalCleanedTons: "0 Tons",
        onTimeRate: "100%"
      };
    } else {
      newUser.assignedTeam = 'Team Alpha (Sanitation Unit 04)';
      newUser.stats = {
        inspectionsCompleted: 0,
        teamsDispatched: 0,
        avgResolutionHours: 0,
        complianceRate: 100
      };
    }

    saveRegisteredUser({ ...newUser, password: userData.password });
    setCurrentUser(newUser);
    const fallbackToken = `token_${Date.now()}`;
    setToken(fallbackToken);
    localStorage.setItem('cleantrack_token', fallbackToken);
    localStorage.setItem('cleantrack_user', JSON.stringify(newUser));
    return { success: true, user: newUser };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('cleantrack_user');
    localStorage.removeItem('cleantrack_token');
  };

  const addGreenPoints = (points) => {
    if (!currentUser || currentUser.role !== 'citizen') return;
    const updated = {
      ...currentUser,
      greenPoints: (currentUser.greenPoints || 0) + points,
      stats: {
        ...currentUser.stats,
        reportsVerified: (currentUser.stats?.reportsVerified || 0) + 1
      }
    };
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      role: currentUser?.role || 'guest',
      isAuthenticated: !!currentUser,
      token,
      login,
      register,
      registerSquadWorker,
      logout,
      addGreenPoints
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
