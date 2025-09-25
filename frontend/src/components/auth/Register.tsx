// src/components/Register.tsx
import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { REGISTER_USER, GET_ORGANIZATIONS } from '../../graphql/queries';
import { useAuth } from '../../hooks/useAuth';
import type { AuthResponse, Organization } from '../../types';

const Register: React.FC<{ onToggleMode: () => void }> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationSlug: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const { login } = useAuth();
  
  const [registerUser, { loading }] = useMutation(REGISTER_USER);
  const { data: orgsData, loading: orgsLoading } = useQuery(GET_ORGANIZATIONS);

  const organizations: Organization[] = orgsData?.organizations || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      const { data } = await registerUser({
        variables: {
          input: formData
        }
      });

      const response: AuthResponse = data.registerUser;

      if (response.success && response.token && response.user) {
        login(response.token, response.user);
      } else {
        setErrors(response.errors || ['Registration failed']);
      }
    } catch (error) {
      console.log(error, "error in register");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join ProjectFlow and start managing your projects
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {errors.map((error, index) => (
                  <p key={index}>• {error}</p>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Create a password"
              />
            </div>
            <div>
              <label htmlFor="organizationSlug" className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <select
                id="organizationSlug"
                name="organizationSlug"
                required
                value={formData.organizationSlug}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={orgsLoading}
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.slug}>
                    {org.name}
                  </option>
                ))}
              </select>
              {orgsLoading && (
                <p className="mt-1 text-sm text-gray-500">Loading organizations...</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || orgsLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-200"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;