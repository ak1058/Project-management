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
import TaskDetailPage from './components/TaskDetailPage';
import CreateOrg from './components/CreateOrg';


// Add a loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Updated Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

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
      <Route path="/createorg" element={<CreateOrg />} />
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
      <Route 
        path="/:orgSlug/projects/:projectSlug/tasks/:taskId" 
        element={
          <ProtectedRoute>
            <TaskDetailPage  />
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