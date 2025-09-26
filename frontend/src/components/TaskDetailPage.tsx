import React from 'react';
import { useQuery } from '@apollo/client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GET_TASK, GET_PROJECT } from '../graphql/queries';
import TaskComments from '../components/TaskComments';
import type { Task, Project } from '../types';

const TaskDetailPage: React.FC = () => {
  const { orgSlug, projectSlug, taskId } = useParams<{ 
    orgSlug: string; 
    projectSlug: string; 
    taskId: string;
  }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const { data: taskData, loading: taskLoading, error: taskError } = useQuery(GET_TASK, {
    variables: { orgSlug: orgSlug!, taskId: taskId! },
    skip: !orgSlug || !taskId
  });

  const { data: projectData, loading: projectLoading } = useQuery(GET_PROJECT, {
    variables: { orgSlug: orgSlug!, projectSlug: projectSlug! },
    skip: !orgSlug || !projectSlug
  });

  const task: Task | null = taskData?.task || null;
  const project: Project | null = projectData?.project || null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'To Do';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'DONE':
        return 'Done';
      default:
        return status;
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (taskLoading || projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (taskError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
          <p className="text-gray-600 mb-4">{taskError.message}</p>
          <Link 
            to={`/${orgSlug}/projects/${projectSlug}/tasks`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
          >
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  if (!task || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
          <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or you don't have access to it.</p>
          <Link 
            to={`/${orgSlug}/projects/${projectSlug}/tasks`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
          >
            Back to Tasks
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
                <Link 
                  to={`/${orgSlug}/projects`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Projects
                </Link>
                <Link 
                  to={`/${orgSlug}/projects/${projectSlug}/tasks`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Tasks
                </Link>
                <button className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium bg-gray-100">
                  Task Details
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
          <span>/</span>
          <Link to={`/${orgSlug}/projects`} className="hover:text-indigo-600">{orgSlug}</Link>
          <span>/</span>
          <Link to={`/${orgSlug}/projects/${projectSlug}/tasks`} className="hover:text-indigo-600">{project.name}</Link>
          <span>/</span>
          <span className="text-gray-900">Task #{task.taskId}</span>
        </div>

        {/* Task Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                  <span className="text-sm text-gray-500">#{task.taskId}</span>
                </div>
              </div>
              <Link
                to={`/${orgSlug}/projects/${projectSlug}/tasks`}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 transition duration-200"
              >
                ← Back to Tasks
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Assignee</h3>
                  {task.assignee ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-700">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.assignee.name}</p>
                        <p className="text-xs text-gray-500">{task.assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Unassigned</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Due Date</h3>
                  <p className="text-gray-900">
                    {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Created</h3>
                  <p className="text-gray-900">{formatDate(task.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <TaskComments 
          orgSlug={orgSlug!}
          taskId={task.taskId}
          taskTitle={task.title}
        />
      </div>
    </div>
  );
};

export default TaskDetailPage;