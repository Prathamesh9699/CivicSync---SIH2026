import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { AuditLog } from '../models/AuditLog.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, username, password, phone, ward, address, role, designation, department } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    const userExists = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        ...(username ? [{ username: username.trim().toLowerCase() }] : [])
      ]
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email or username already exists' });
    }

    const userRole = role === 'municipal_staff' ? 'municipal_staff' : role === 'worker' ? 'worker' : 'citizen';
    const passwordHash = await User.hashPassword(password);

    const prefix = userRole === 'municipal_staff' ? 'MUN' : userRole === 'worker' ? 'WRK' : 'CIT';
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const userId = `${prefix}-${new Date().getFullYear()}-${randomCode}`;

    const userDoc = {
      userId,
      username: username ? username.trim().toLowerCase() : email.split('@')[0].toLowerCase(),
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      role: userRole,
      ward: ward || 'Ward 12 - Shivaji Nagar',
      address: address || '',
      designation: userRole === 'municipal_staff' ? (designation || 'Zonal Sanitation Officer') : userRole === 'worker' ? (designation || 'Field Sanitation Squad Lead') : 'Citizen Contributor',
      department: userRole === 'municipal_staff' ? (department || 'Solid Waste Management Division') : userRole === 'worker' ? (department || 'Solid Waste Operations Fleet') : 'Civic Community'
    };

    if (userRole === 'citizen') {
      userDoc.greenPoints = 0;
      userDoc.level = 1;
      userDoc.levelTitle = 'Green Starter';
      userDoc.badges = [
        { id: 'b1', name: 'Green Starter', icon: 'Sprout', earnedDate: new Date().toISOString().split('T')[0], description: 'Joined CleanTrack' }
      ];
    } else if (userRole === 'worker') {
      userDoc.assignedSquad = 'Squad Alpha (Plastic & Dry Waste)';
      userDoc.assignedTeamId = 'team_alpha';
      userDoc.vehicleAssigned = 'MH-12-QX-4012';
      userDoc.stats = {
        tasksCompleted: 0,
        activeTasks: 0,
        totalCleanedTons: "0 Tons",
        onTimeRate: "100%"
      };
    } else {
      userDoc.assignedTeam = 'Team Alpha (Sanitation Unit 04)';
      userDoc.stats = {
        inspectionsCompleted: 0,
        teamsDispatched: 0,
        avgResolutionHours: 0,
        complianceRate: 100
      };
    }

    const user = await User.create(userDoc);

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id.toString(),
      detail: `New ${userRole} ${user.name} registered with email ${user.email}`
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() },
        { name: new RegExp(`^${email}$`, 'i') },
        { userId: email }
      ]
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact system administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      detail: `User ${user.name} (${user.role}) logged in.`
    });

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
