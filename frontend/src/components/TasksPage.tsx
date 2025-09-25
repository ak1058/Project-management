// src/components/TasksPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  GET_MY_ORGANIZATIONS, 
  GET_PROJECT, 
  GET_TASKS, 
  CREATE_TASK, 
  UPDATE_TASK, 
  DELETE_TASK,
  GET_ORGANIZATION_MEMBERS 
} from '../graphql/queries';
import type { Organization, Project, Task } from '../types';

interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const TasksPage: React.FC = () => {
  const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug: string }>();
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>(''); // Changed to empty string for "No assignee"
  const formRef = useRef<HTMLFormElement>(null);

  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS, {
    skip: !isAuthenticated
  });

  const { data: projectData } = useQuery(GET_PROJECT, {
    variables: { orgSlug: orgSlug!, projectSlug: projectSlug! },
    skip: !orgSlug || !projectSlug
  });

  const { data: tasksData, refetch: refetchTasks } = useQuery(GET_TASKS, {
    variables: { orgSlug: orgSlug!, projectSlug: projectSlug! },
    skip: !orgSlug || !projectSlug
  });

  const { data: membersData } = useQuery(GET_ORGANIZATION_MEMBERS, {
    variables: { orgSlug: orgSlug! },
    skip: !orgSlug
  });

  const [createTask, { loading: creatingTask }] = useMutation(CREATE_TASK);
  const [updateTask, { loading: updatingTask }] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);

  const organizations: Organization[] = orgsData?.myOrganizations || [];
  const tasks: Task[] = tasksData?.tasks || [];
  const project: Project | null = projectData?.project || null;
  const organizationMembers: OrganizationMember[] = membersData?.organizationMembers || [];

  // Set selected organization and project
  useEffect(() => {
    if (orgSlug && organizations.length > 0) {
      const org = organizations.find(org => org.slug === orgSlug);
      setSelectedOrg(org || null);
    }
    if (project) {
      setCurrentProject(project);
    }
  }, [orgSlug, organizations, project]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTasks = selectedStatus === 'ALL' 
    ? tasks 
    : tasks.filter(task => task.status === selectedStatus);

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createTask({
        variables: {
          input: {
            organizationSlug: orgSlug!,
            projectSlug: projectSlug!,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            status: 'TODO',
            dueDate: formData.get('dueDate') as string || null,
            assigneeEmail: selectedAssignee || null // Use selectedAssignee
          }
        }
      });
      
      setShowCreateTask(false);
      setSelectedAssignee(''); // Reset assignee
      if (formRef.current) formRef.current.reset();
      refetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask || !orgSlug) return;
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateTask({
        variables: {
          taskId: editingTask.taskId,
          orgSlug: orgSlug,
          input: {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            status: formData.get('status') as string,
            dueDate: formData.get('dueDate') as string || null,
            assigneeEmail: selectedAssignee // Use selectedAssignee
          }
        }
      });
      
      setEditingTask(null);
      setSelectedAssignee(''); // Reset assignee
      if (formRef.current) formRef.current.reset();
      refetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!orgSlug || !confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    
    try {
      await deleteTask({
        variables: {
          taskId: taskId,
          orgSlug: orgSlug
        }
      });
      refetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedAssignee(task.assignee?.email || ''); // Pre-fill current assignee
  };

  const handleCancel = () => {
    setShowCreateTask(false);
    setEditingTask(null);
    setSelectedAssignee(''); // Reset assignee
    if (formRef.current) formRef.current.reset();
  };

  const quickUpdateTaskStatus = async (task: Task, newStatus: string) => {
    try {
      await updateTask({
        variables: {
          taskId: task.taskId,
          orgSlug: orgSlug!,
          input: {
            status: newStatus
          }
        }
      });
      refetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (!selectedOrg || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {!selectedOrg ? 'Organization not found' : 'Project not found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {!selectedOrg 
              ? "The organization you're looking for doesn't exist or you don't have access to it."
              : "The project you're looking for doesn't exist or you don't have access to it."
            }
          </p>
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
                <Link 
                  to={`/${orgSlug}/projects`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Projects
                </Link>
                <button className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium bg-gray-100">
                  Tasks - {currentProject.name}
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
        {/* Tasks Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
              <span>/</span>
              <Link to={`/${orgSlug}/projects`} className="hover:text-indigo-600">{selectedOrg.name}</Link>
              <span>/</span>
              <span className="text-gray-900">{currentProject.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tasks - {currentProject.name}
            </h2>
            <p className="text-gray-600">Manage tasks for this project</p>
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
          >
            + New Task
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'ALL', label: 'All Tasks', count: taskCounts.all },
                { key: 'TODO', label: 'To Do', count: taskCounts.todo },
                { key: 'IN_PROGRESS', label: 'In Progress', count: taskCounts.inProgress },
                { key: 'DONE', label: 'Done', count: taskCounts.done }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setSelectedStatus(key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    selectedStatus === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.taskId && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          #{task.taskId}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {task.assignee ? (
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-indigo-700">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className={task.assignee.email === user?.email ? 'font-medium text-indigo-600' : ''}>
                            {task.assignee.name} {task.assignee.email === user?.email && '(You)'}
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-gray-400">No assignee</span>
                      )}
                      {task.dueDate && (
                        <span>Due: {formatDate(task.dueDate)}</span>
                      )}
                      <span>Created: {formatDate(task.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Quick status update buttons */}
                    {task.status !== 'TODO' && (
                      <button
                        onClick={() => quickUpdateTaskStatus(task, 'TODO')}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition duration-200"
                        title="Move to To Do"
                      >
                        To Do
                      </button>
                    )}
                    {task.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => quickUpdateTaskStatus(task, 'IN_PROGRESS')}
                        className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded transition duration-200"
                        title="Move to In Progress"
                      >
                        In Progress
                      </button>
                    )}
                    {task.status !== 'DONE' && (
                      <button
                        onClick={() => quickUpdateTaskStatus(task, 'DONE')}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition duration-200"
                        title="Move to Done"
                      >
                        Done
                      </button>
                    )}
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                      title="Edit task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.taskId)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">✓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus === 'ALL' ? 'No tasks yet' : `No ${selectedStatus.toLowerCase().replace('_', ' ')} tasks`}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedStatus === 'ALL' 
                ? 'Get started by creating your first task' 
                : `There are no tasks with status "${selectedStatus.toLowerCase().replace('_', ' ')}"`
              }
            </p>
            {selectedStatus === 'ALL' && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                Create Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {(showCreateTask || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form 
              ref={formRef}
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingTask?.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    defaultValue={editingTask?.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter task description"
                  />
                </div>
                
                {/* Assignee Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee (Optional)
                  </label>
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No assignee</option>
                    {organizationMembers.map((member) => (
                      <option key={member.id} value={member.email}>
                        {member.name} ({member.email}) {member.email === user?.email && '(You)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a team member to assign this task to
                  </p>
                </div>

                {editingTask && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingTask?.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
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
                    defaultValue={editingTask?.dueDate || ''}
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
                  disabled={creatingTask || updatingTask}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 disabled:opacity-50"
                >
                  {editingTask 
                    ? (updatingTask ? 'Updating...' : 'Update Task')
                    : (creatingTask ? 'Creating...' : 'Create Task')
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

export default TasksPage;