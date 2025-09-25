// src/components/OrganizationDashboard.tsx
import React from 'react';

const OrganizationDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-red-500-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Organizations</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Organization cards will go here */}
          <div className="bg-red-700 p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-900">Acme Corporation</h3>
            <p className="text-gray-600 text-sm">acme</p>
            <p className="text-gray-500 text-xs mt-2">contact@acme.com</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">GraphQL data will be loaded here...</p>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;