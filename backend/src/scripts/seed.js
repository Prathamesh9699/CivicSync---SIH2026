import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { Hotspot } from '../models/Hotspot.js';
import { Notification } from '../models/Notification.js';
import { Assignment } from '../models/Assignment.js';
import { Reward } from '../models/Reward.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { AuditLog } from '../models/AuditLog.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { Verification } from '../models/Verification.js';

const seedDatabase = async () => {
  console.log('[Seed Engine] Connecting to MongoDB...');
  const conn = await connectDB();
  if (!conn) {
    console.error('[Seed Engine] Aborting seed: MongoDB connection failed.');
    process.exit(1);
  }

  try {
    console.log('[Seed Engine] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Complaint.deleteMany({}),
      Hotspot.deleteMany({}),
      Notification.deleteMany({}),
      Assignment.deleteMany({}),
      Reward.deleteMany({}),
      SystemSetting.deleteMany({}),
      AuditLog.deleteMany({}),
      AIAnalysis.deleteMany({}),
      Verification.deleteMany({})
    ]);

    console.log('[Seed Engine] Creating System Settings...');
    await SystemSetting.create({
      key: 'default_config',
      normalSlaHours: 48,
      mediumSlaHours: 24,
      criticalSlaHours: 12,
      slaWarningHours: 6,
      reportRewardPoints: 10,
      verificationRewardPoints: 50,
      reminderIntervalHours: 6
    });

    console.log('[Seed Engine] Creating System Administrator Account...');
    const adminPasswordHash = await User.hashPassword('Admin@123');

    const adminUser = await User.create({
      userId: 'ADM-2026-00001',
      name: 'Admin',
      email: 'admin@cleantrack.gov',
      phone: '9890144189',
      passwordHash: adminPasswordHash,
      role: 'administrator',
      ward: 'Central Command',
      designation: 'System Administrator',
      department: 'Municipal IT & Smart Governance'
    });

    console.log('[Seed Engine] Creating Verified Municipal Officer Account...');
    const officerPasswordHash = await User.hashPassword('Municipal@123');

    const officerUser = await User.create({
      userId: 'MUN-2026-00001',
      name: 'Vikram Deshmukh',
      email: 'officer@cleantrack.gov',
      phone: '9822019922',
      passwordHash: officerPasswordHash,
      role: 'municipal_staff',
      ward: 'Ward 12 - Shivaji Nagar',
      designation: 'Zonal Sanitation Officer',
      department: 'Solid Waste Management Division',
      assignedTeam: 'Squad Alpha (Plastic & Dry Waste)'
    });

    console.log('[Seed Engine] Creating Citizen Account for Prathamesh Hadole...');
    const citizenPasswordHash = await User.hashPassword('Prathamesh@123');

    const citizenUser = await User.create({
      userId: 'CIT-2026-78412',
      name: 'Prathamesh Hadole',
      email: 'prathamesh@cleantrack.gov',
      phone: '9823011452',
      passwordHash: citizenPasswordHash,
      role: 'citizen',
      ward: 'Ward 02 - Mangalwar Peth / Somwar Peth',
      designation: 'Lead Civic Contributor',
      department: 'Civic Community',
      greenPoints: 0,
      level: 1,
      levelTitle: 'Green Starter'
    });

    console.log('[Seed Engine] Creating Sanitation Field Worker Account...');
    const workerPasswordHash = await User.hashPassword('Worker@123');

    const workerUser = await User.create({
      userId: 'WRK-2026-00001',
      name: 'Ramesh Shinde',
      email: 'worker@cleantrack.gov',
      phone: '9822099411',
      passwordHash: workerPasswordHash,
      role: 'worker',
      ward: 'Ward 12 - Shivaji Nagar',
      designation: 'Field Sanitation Squad Lead',
      department: 'Solid Waste Operations Fleet',
      assignedSquad: 'Squad Alpha (Plastic & Dry Waste)',
      assignedTeamId: 'team_alpha',
      shift: 'Morning (06:00 - 14:00)',
      vehicleAssigned: 'MH-12-QX-4012'
    });

    await AuditLog.create({
      userId: adminUser._id,
      userName: adminUser.name,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SystemSetting',
      entityId: 'default_config',
      detail: 'CleanTrack system initialized with verified accounts.'
    });

    console.log('====================================================');
    console.log('✅ CleanTrack Database Initialized Successfully!');
    console.log(`👤 Admin Account:`);
    console.log(`   - Username / Email: admin@cleantrack.gov`);
    console.log(`   - Password: Admin@123`);
    console.log(`   - Phone: 9890144189`);
    console.log(`👤 Municipal Staff Account:`);
    console.log(`   - Username / Email: officer@cleantrack.gov`);
    console.log(`   - Password: Municipal@123`);
    console.log(`   - Phone: 9822019922`);
    console.log(`👤 Sanitation Worker Account:`);
    console.log(`   - Username / Email: worker@cleantrack.gov`);
    console.log(`   - Password: Worker@123`);
    console.log(`   - Phone: 9822099411`);
    console.log(`👤 Citizen Account:`);
    console.log(`   - Username / Email: prathamesh@cleantrack.gov`);
    console.log(`   - Password: Prathamesh@123`);
    console.log(`   - Phone: 9823011452`);
    console.log(`📦 Seeded: 4 Core System Accounts across 4 Roles.`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Engine Error]', error);
    process.exit(1);
  }
};

seedDatabase();
