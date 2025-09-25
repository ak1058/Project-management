// src/App.tsx
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { client } from './lib/apollo-client';
import AuthProvider from './components/AuthProvider';
import OrganizationDashboard from './components/OrganizationDashboard';
import ProjectsPage from './components/ProjectsPage';
import TasksPage from './components/TasksPage';
import { useAuth } from './hooks/useAuth';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <OrganizationDashboard />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <OrganizationDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/:orgSlug/projects" 
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/:orgSlug/:projectSlug/tasks" 
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;