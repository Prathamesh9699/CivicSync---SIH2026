import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { CitizenLayout } from '../layouts/CitizenLayout';
import { MunicipalLayout } from '../layouts/MunicipalLayout';
import { WorkerLayout } from '../layouts/WorkerLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Guards
import { ProtectedRoute } from './ProtectedRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { HowItWorksPage } from '../pages/public/HowItWorksPage';
import { AIIntelligencePage } from '../pages/public/AIIntelligencePage';
import { LoginPage } from '../pages/public/LoginPage';

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard';
import { ReportWastePage } from '../pages/citizen/ReportWastePage';
import { MyComplaintsPage } from '../pages/citizen/MyComplaintsPage';
import { ComplaintDetailPage } from '../pages/citizen/ComplaintDetailPage';
import { CitizenHotspotsPage } from '../pages/citizen/CitizenHotspotsPage';
import { GreenPointsPage } from '../pages/citizen/GreenPointsPage';

// Municipal Pages
import { MunicipalDashboard } from '../pages/municipal/MunicipalDashboard';
import { PriorityQueuePage } from '../pages/municipal/PriorityQueuePage';
import { DuplicateDetectionPage } from '../pages/municipal/DuplicateDetectionPage';
import { RecurringWastePage } from '../pages/municipal/RecurringWastePage';
import { GISHotspotPage } from '../pages/municipal/GISHotspotPage';
import { AIRecommendationsPage } from '../pages/municipal/AIRecommendationsPage';
import { AssignmentsPage } from '../pages/municipal/AssignmentsPage';
import { VerificationPage } from '../pages/municipal/VerificationPage';
import { MunicipalAnalyticsPage } from '../pages/municipal/MunicipalAnalyticsPage';
import { AIReportsPage } from '../pages/municipal/AIReportsPage';
import { InvalidReportsPage } from '../pages/municipal/InvalidReportsPage';

// Worker Pages
import { WorkerDashboard } from '../pages/worker/WorkerDashboard';
import { WorkerTasksPage } from '../pages/worker/WorkerTasksPage';
import { WorkerHistoryPage } from '../pages/worker/WorkerHistoryPage';
import { WorkerSquadPage } from '../pages/worker/WorkerSquadPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { MunicipalWatchPage } from '../pages/admin/MunicipalWatchPage';
import { AIMonitoringPage } from '../pages/admin/AIMonitoringPage';

// Shared Pages
import { ProfilePage } from '../pages/shared/ProfilePage';
import { NotificationsPage } from '../pages/shared/NotificationsPage';
import { HelpFAQPage } from '../pages/shared/HelpFAQPage';
import { AccessRestrictedPage } from '../pages/shared/AccessRestrictedPage';
import { NotFoundPage } from '../pages/shared/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/ai-intelligence" element={<AIIntelligencePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/help" element={<HelpFAQPage />} />
        <Route path="/access-restricted" element={<AccessRestrictedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Citizen Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['citizen', 'admin', 'administrator']} />}>
        <Route element={<CitizenLayout />}>
          <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
          <Route path="/citizen/report" element={<ReportWastePage />} />
          <Route path="/citizen/complaints" element={<MyComplaintsPage />} />
          <Route path="/citizen/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="/citizen/hotspots" element={<CitizenHotspotsPage />} />
          <Route path="/citizen/green-points" element={<GreenPointsPage />} />
        </Route>
      </Route>

      {/* Municipal Staff Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['municipal_staff', 'admin', 'administrator']} />}>
        <Route element={<MunicipalLayout />}>
          <Route path="/municipal/dashboard" element={<MunicipalDashboard />} />
          <Route path="/municipal/complaints" element={<PriorityQueuePage />} />
          <Route path="/municipal/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="/municipal/duplicates" element={<DuplicateDetectionPage />} />
          <Route path="/municipal/recurring" element={<RecurringWastePage />} />
          <Route path="/municipal/hotspots" element={<GISHotspotPage />} />
          <Route path="/municipal/ai-recommendations" element={<AIRecommendationsPage />} />
          <Route path="/municipal/assignments" element={<AssignmentsPage />} />
          <Route path="/municipal/verification" element={<VerificationPage />} />
          <Route path="/municipal/analytics" element={<MunicipalAnalyticsPage />} />
          <Route path="/municipal/reports" element={<AIReportsPage />} />
          <Route path="/municipal/invalid-reports" element={<InvalidReportsPage />} />
        </Route>
      </Route>

      {/* Field Worker Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['worker', 'admin', 'administrator']} />}>
        <Route element={<WorkerLayout />}>
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          <Route path="/worker/tasks" element={<WorkerTasksPage />} />
          <Route path="/worker/tasks/:id" element={<ComplaintDetailPage />} />
          <Route path="/worker/history" element={<WorkerHistoryPage />} />
          <Route path="/worker/squad" element={<WorkerSquadPage />} />
        </Route>
      </Route>

      {/* Admin Protected Routes - Strictly Administrator Role Only */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'administrator']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/municipal-watch" element={<MunicipalWatchPage />} />
          <Route path="/admin/ai-monitoring" element={<AIMonitoringPage />} />
          <Route path="/admin/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
};
