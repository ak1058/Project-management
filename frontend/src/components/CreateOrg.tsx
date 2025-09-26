// CreateOrg.tsx
import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_ORGANIZATION } from '../graphql/queries';
import { GET_ORGANIZATIONS } from '../graphql/queries';
import type { Organization } from '../types';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateOrg: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactEmail: ''
  });

  const navigate = useNavigate();

  // Query to get all organizations
  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATIONS);

  // Mutation for creating organization
  const [createOrganization, { loading: creating }] = useMutation(CREATE_ORGANIZATION, {
    onCompleted: (data) => {
      if (data.createOrganization.success) {
        toast.success('Organization created successfully!');
        setFormData({ name: '', slug: '', contactEmail: '' });
        setShowCreateForm(false);
        refetch(); 
      } else {
        const errors = data.createOrganization.errors;
        toast.error(errors?.[0] || 'Failed to create organization');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred while creating organization');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim() || !formData.contactEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    createOrganization({
      variables: {
        input: {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          contactEmail: formData.contactEmail.trim()
        }
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleLoginRedirect = () => {
    navigate('/');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-lg">Error loading organizations: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Organization Management
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create and manage your organizations in one place. Get started by creating your first organization.
          </p>
        </div>

        {/* Create Organization Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Organizations</h2>
            <div className="flex space-x-3">
              {/* Login Button - Added before Create Organization button */}
              <button
                onClick={handleLoginRedirect}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🔐</span>
                <span>Login</span>
              </button>
              
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Organization</span>
              </button>
            </div>
          </div>

          {/* Create Organization Form */}
          {showCreateForm && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Organization</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter organization name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="organization-slug"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@organization.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    {creating ? 'Creating...' : 'Create Organization'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Organizations List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Organizations</h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : data?.organizations?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-gray-500 text-lg">No organizations found</div>
                <p className="text-gray-400 mt-2">Create your first organization to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.organizations.map((org: Organization) => (
                  <div key={org.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-semibold text-gray-900 truncate">{org.name}</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Slug:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{org.slug}</code>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Email:</span>
                        <span className="truncate">{org.contactEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">ID:</span>
                        <span className="text-xs font-mono truncate">{org.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Organizations</h3>
            <p className="text-gray-600">Create and manage multiple organizations with unique settings and members.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Projects</h3>
            <p className="text-gray-600">Organize your work with projects and track progress in real-time.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Management</h3>
            <p className="text-gray-600">Assign tasks, set deadlines, and collaborate with your team efficiently.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrg;