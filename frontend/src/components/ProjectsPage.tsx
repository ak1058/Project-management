// src/components/ProjectsPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GET_MY_ORGANIZATIONS, GET_PROJECTS, CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT } from '../graphql/queries';
import type { Organization, Project } from '../types';
import ProjectCard from './ProjectCard'; 

const ProjectsPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS, {
    skip: !isAuthenticated
  });
  
  const { data: projectsData, refetch: refetchProjects } = useQuery(GET_PROJECTS, {
    variables: { orgSlug },
    skip: !orgSlug
  });

  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT);
  const [updateProject, { loading: updatingProject }] = useMutation(UPDATE_PROJECT);
  const [deleteProject] = useMutation(DELETE_PROJECT);

  const organizations: Organization[] = orgsData?.myOrganizations || [];
  const projects: Project[] = projectsData?.projects || [];

  // Set selected organization based on URL parameter
  useEffect(() => {
    if (orgSlug && organizations.length > 0) {
      const org = organizations.find(org => org.slug === orgSlug);
      setSelectedOrg(org || null);
    }
  }, [orgSlug, organizations]);

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createProject({
        variables: {
          input: {
            organizationSlug: orgSlug!,
            name: formData.get('name') as string,
            slug: formData.get('slug') as string || undefined,
            description: formData.get('description') as string,
            status: 'ACTIVE',
            dueDate: formData.get('dueDate') as string || null
          }
        }
      });
      
      setShowCreateProject(false);
      if (formRef.current) formRef.current.reset();
      refetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProject || !orgSlug) return;
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateProject({
        variables: {
          projectSlug: editingProject.slug,
          organizationSlug: orgSlug,
          input: {
            name: formData.get('name') as string,
            slug: formData.get('slug') as string,
            description: formData.get('description') as string,
            status: formData.get('status') as string,
            dueDate: formData.get('dueDate') as string || null
          }
        }
      });
      
      setEditingProject(null);
      if (formRef.current) formRef.current.reset();
      refetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectSlug: string) => {
    if (!orgSlug || !confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      await deleteProject({
        variables: {
          projectSlug,
          organizationSlug: orgSlug
        }
      });
      refetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
  };

  const handleCancel = () => {
    setShowCreateProject(false);
    setEditingProject(null);
    if (formRef.current) formRef.current.reset();
  };

  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Organization not found</h3>
          <p className="text-gray-600 mb-4">The organization you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-gray-900 hover:text-indigo-600 transition duration-200">
                ProjectFlow
              </Link>
              <nav className="ml-8 flex space-x-4">
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Dashboard
                </Link>
                <button className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium bg-gray-100">
                  Projects - {selectedOrg.name}
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
        {/* Projects Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Projects - {selectedOrg.name}
            </h2>
            <p className="text-gray-600">Manage your organization's projects</p>
          </div>
          <button
            onClick={() => setShowCreateProject(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
          >
            + New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first project</p>
            <button
              onClick={() => setShowCreateProject(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
            >
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      {(showCreateProject || editingProject) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h3>
            <form 
              ref={formRef}
              onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingProject?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Slug
                  </label>
                  <input
                    type="text"
                    name="slug"
                    required
                    defaultValue={editingProject?.slug}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter project slug (e.g., blib)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingProject?.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter project description"
                  />
                </div>
                {editingProject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingProject?.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={editingProject?.dueDate || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject || updatingProject}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 disabled:opacity-50"
                >
                  {editingProject 
                    ? (updatingProject ? 'Updating...' : 'Update Project')
                    : (creatingProject ? 'Creating...' : 'Create Project')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;