// src/components/OrganizationDashboard.tsx
import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import { 
  GET_MY_ORGANIZATIONS, 
  GET_PROJECTS, 
  CREATE_PROJECT, 
  UPDATE_PROJECT, 
  DELETE_PROJECT 
} from '../graphql/queries';
import type { Organization, Project } from '../types';
import Login from './auth/Login';
import Register from './auth/Register';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectSlug: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const progress = project.taskCount ? Math.round((project.completedTasks || 0) / project.taskCount * 100) : 0;
  
  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800'
  };

  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Action buttons */}
      {showActions && (
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => onEdit(project)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 rounded-full transition duration-200"
            title="Edit project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(project.slug)}
            className="bg-red-100 hover:bg-red-200 text-red-800 p-2 rounded-full transition duration-200"
            title="Delete project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500">Slug: {project.slug}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>Tasks: {project.taskCount || 0}</span>
          <span>Completed: {project.completedTasks || 0}</span>
        </div>
        
        {project.dueDate && (
          <div className="text-sm text-gray-500">
            Due: {new Date(project.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

const OrganizationDashboard: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS, {
    skip: !isAuthenticated
  });
  
  const { data: projectsData, refetch: refetchProjects } = useQuery(GET_PROJECTS, {
    variables: { orgSlug: selectedOrg?.slug },
    skip: !selectedOrg
  });

  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT);
  const [updateProject, { loading: updatingProject }] = useMutation(UPDATE_PROJECT);
  const [deleteProject] = useMutation(DELETE_PROJECT);

  const organizations: Organization[] = orgsData?.myOrganizations || [];
  const projects: Project[] = projectsData?.projects || [];

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createProject({
        variables: {
          input: {
            organizationSlug: selectedOrg!.slug,
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
    if (!editingProject || !selectedOrg) return;
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateProject({
        variables: {
          projectSlug: editingProject.slug,
          organizationSlug: selectedOrg.slug,
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
    if (!selectedOrg || !confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      await deleteProject({
        variables: {
          projectSlug,
          organizationSlug: selectedOrg.slug
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
                onClick={() => setSelectedOrg(org)}
              >
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <p className="text-sm text-gray-600">{org.contactEmail}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedOrg && (
          <>
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
          </>
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

export default OrganizationDashboard;