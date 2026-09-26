export const DEMO_USERS = [
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
    greenPoints: 150,
    level: 2,
    levelTitle: "Eco Champion",
    badges: [
      { id: 'b1', name: 'Green Starter', icon: 'Sprout', earnedDate: '2026-08-01', description: 'Joined CleanTrack Community' },
      { id: 'b2', name: 'Eco Champion', icon: 'Award', earnedDate: '2026-08-15', description: 'Verified Cleanups' }
    ],
    stats: {
      reportsSubmitted: 4,
      reportsVerified: 3,
      cleanupConfirmations: 3,
      communityImpactScore: 92
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
    assignedTeam: "Pending Squad Allocation",
    stats: {
      inspectionsCompleted: 0,
      teamsDispatched: 0,
      avgResolutionHours: 0,
      complianceRate: 100
    }
  }
];

export const GREEN_CITIZENS_LEADERBOARD = [];
