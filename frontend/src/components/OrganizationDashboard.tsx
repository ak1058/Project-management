// src/components/OrganizationDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GET_MY_ORGANIZATIONS } from '../graphql/queries';
import type { Organization } from '../types';
import Login from './auth/Login';
import Register from './auth/Register';

const OrganizationDashboard: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const navigate = useNavigate();
  
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS, {
    skip: !isAuthenticated
  });

  const organizations: Organization[] = orgsData?.myOrganizations || [];

  const handleOrganizationSelect = (org: Organization) => {
    setSelectedOrg(org);
    // Navigate to the projects page for the selected organization
    navigate(`/${org.slug}/projects`);
  };

  if (!isAuthenticated) {
    return isLoginMode ? 
      <Login onToggleMode={() => setIsLoginMode(false)} /> : 
      <Register onToggleMode={() => setIsLoginMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ProjectFlow</h1>
              <nav className="ml-8 flex space-x-4">
                <button className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium bg-gray-100">
                  Dashboard
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-700 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedOrg?.id === org.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => handleOrganizationSelect(org)}
              >
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <p className="text-sm text-gray-600">{org.contactEmail}</p>
                <div className="mt-2 text-xs text-indigo-600 font-medium">
                  Click to view projects →
                </div>
              </div>
            ))}
          </div>
        </div>

        {organizations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600">You don't have access to any organizations yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDashboard;