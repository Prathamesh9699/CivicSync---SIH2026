import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary sectionName="CleanTrack Application">
      <BrowserRouter>
        <AuthProvider>
          <ComplaintProvider>
            <NotificationProvider>
              <ErrorBoundary sectionName="Page Content">
                <AppRoutes />
              </ErrorBoundary>
            </NotificationProvider>
          </ComplaintProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
