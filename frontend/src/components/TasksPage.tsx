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
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskCardProps {
  task: Task;
  user: any;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, user, onEdit, onDelete, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'rotate-3 shadow-xl' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{task.title}</h3>
          {task.taskId && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mb-2 inline-block">
              #{task.taskId}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="text-gray-400 hover:text-indigo-600 transition-colors duration-200 p-1"
            title="Edit task"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.taskId);
            }}
            className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
            title="Delete task"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div>
        <p className="text-xs text-gray-600 mb-3 line-clamp-3">{task.description}</p>
        
        <div className="space-y-2">
          {task.assignee ? (
            <div className="flex items-center text-xs">
              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-indigo-700">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className={`truncate ${task.assignee.email === user?.email ? 'font-medium text-indigo-600' : 'text-gray-600'}`}>
                {task.assignee.name} {task.assignee.email === user?.email && '(You)'}
              </span>
            </div>
          ) : (
            <span className="text-xs italic text-gray-400">No assignee</span>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            {task.dueDate && (
              <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                Due: {formatDate(task.dueDate)}
              </span>
            )}
            <span>{formatDate(task.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  status: string;
  tasks: Task[];
  count: number;
  color: string;
  user: any;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  title, 
  status, 
  tasks, 
  count, 
  color, 
  user, 
  onEdit, 
  onDelete 
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const columnStyle = {
    backgroundColor: isOver ? 'rgba(243, 244, 246, 0.8)' : undefined,
    border: isOver ? '2px dashed #4f46e5' : undefined,
  };

  return (
    <div 
      ref={setNodeRef}
      style={columnStyle}
      className="bg-gray-50 rounded-lg p-4 min-h-[600px] flex flex-col transition-all duration-200"
    >
      <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${color}`}>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
          {count}
        </span>
      </div>
      
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm">No tasks</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

interface TabViewProps {
  tasks: Task[];
  user: any;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  taskCounts: {
    todo: number;
    inProgress: number;
    done: number;
  };
}

const TabView: React.FC<TabViewProps> = ({ tasks, user, onEdit, onDelete, taskCounts }) => {
  const [activeTab, setActiveTab] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');

  const tasksByStatus = {
    TODO: tasks.filter(task => task.status === 'TODO'),
    IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS'),
    DONE: tasks.filter(task => task.status === 'DONE'),
  };

  const tabs = [
    { 
      id: 'TODO' as const, 
      name: 'To Do', 
      count: taskCounts.todo, 
      color: 'text-gray-600 border-gray-300 hover:border-gray-400' 
    },
    { 
      id: 'IN_PROGRESS' as const, 
      name: 'In Progress', 
      count: taskCounts.inProgress, 
      color: 'text-yellow-600 border-yellow-300 hover:border-yellow-400' 
    },
    { 
      id: 'DONE' as const, 
      name: 'Done', 
      count: taskCounts.done, 
      color: 'text-green-600 border-green-300 hover:border-green-400' 
    },
  ];

  const getActiveTabColor = (tabId: string) => {
    switch (tabId) {
      case 'TODO':
        return 'border-gray-500 text-gray-900 bg-gray-50';
      case 'IN_PROGRESS':
        return 'border-yellow-500 text-yellow-900 bg-yellow-50';
      case 'DONE':
        return 'border-green-500 text-green-900 bg-green-50';
      default:
        return 'border-gray-500 text-gray-900 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? getActiveTabColor(tab.id)
                  : `text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300`
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>{tab.name}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id 
                    ? 'bg-white text-gray-900' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {tasksByStatus[activeTab].length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">
              {activeTab === 'TODO' && '📝'}
              {activeTab === 'IN_PROGRESS' && '⚡'}
              {activeTab === 'DONE' && '✅'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {tabs.find(t => t.id === activeTab)?.name.toLowerCase()} tasks
            </h3>
            <p className="text-gray-600">
              {activeTab === 'TODO' && "Tasks you create will appear here"}
              {activeTab === 'IN_PROGRESS' && "Tasks in progress will appear here"}
              {activeTab === 'DONE' && "Completed tasks will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasksByStatus[activeTab].map((task) => (
              <div key={task.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{task.title}</h3>
                    {task.taskId && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded mb-2 inline-block">
                        #{task.taskId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => onEdit(task)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors duration-200 p-1"
                      title="Edit task"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(task.taskId)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
                      title="Delete task"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-3">{task.description}</p>
                  
                  <div className="space-y-2">
                    {task.assignee ? (
                      <div className="flex items-center text-xs">
                        <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-indigo-700">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className={`truncate ${task.assignee.email === user?.email ? 'font-medium text-indigo-600' : 'text-gray-600'}`}>
                          {task.assignee.name} {task.assignee.email === user?.email && '(You)'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs italic text-gray-400">No assignee</span>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {task.dueDate && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                      <span>
                        {new Date(task.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TasksPage: React.FC = () => {
  const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug: string }>();
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'tab'>('kanban');
  const formRef = useRef<HTMLFormElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const tasksByStatus = {
    TODO: tasks.filter(task => task.status === 'TODO'),
    IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS'),
    DONE: tasks.filter(task => task.status === 'DONE'),
  };

  const taskCounts = {
    all: tasks.length,
    todo: tasksByStatus.TODO.length,
    inProgress: tasksByStatus.IN_PROGRESS.length,
    done: tasksByStatus.DONE.length
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setDraggedTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDraggedTask(null);
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) {
      setDraggedTask(null);
      return;
    }

    // Determine new status based on drop target
    let newStatus = activeTask.status;
    
    // Check if dropped on a column (droppable area)
    if (over.id === 'TODO' || over.id === 'IN_PROGRESS' || over.id === 'DONE') {
      newStatus = over.id as string;
    } else {
      // Check if dropped on a task in a different column
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask && overTask.status !== activeTask.status) {
        newStatus = overTask.status;
      }
    }

    // Update task status if it changed
    if (newStatus !== activeTask.status) {
      try {
        await updateTask({
          variables: {
            taskId: activeTask.taskId,
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
    }

    setDraggedTask(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'border-gray-300';
      case 'IN_PROGRESS':
        return 'border-yellow-300';
      case 'DONE':
        return 'border-green-300';
      default:
        return 'border-gray-300';
    }
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
            assigneeEmail: selectedAssignee || null
          }
        }
      });
      
      setShowCreateTask(false);
      setSelectedAssignee('');
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
            assigneeEmail: selectedAssignee
          }
        }
      });
      
      setEditingTask(null);
      setSelectedAssignee('');
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
    setSelectedAssignee(task.assignee?.email || '');
  };

  const handleCancel = () => {
    setShowCreateTask(false);
    setEditingTask(null);
    setSelectedAssignee('');
    if (formRef.current) formRef.current.reset();
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
            <p className="text-gray-600">
              {viewMode === 'kanban' 
                ? 'Drag and drop tasks to update their status' 
                : 'Click on tabs to view tasks by status'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition duration-200 ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('tab')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition duration-200 ${
                  viewMode === 'tab' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
            <button
              onClick={() => setShowCreateTask(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Render based on view mode */}
        {viewMode === 'kanban' ? (
          <>
            {/* Task Summary - only shown in kanban view */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{taskCounts.all}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{taskCounts.todo}</div>
                <div className="text-sm text-gray-600">To Do</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-yellow-600">{taskCounts.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{taskCounts.done}</div>
                <div className="text-sm text-gray-600">Done</div>
              </div>
            </div>

            {/* Kanban Board */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-3 gap-6">
                <KanbanColumn
                  title="To Do"
                  status="TODO"
                  tasks={tasksByStatus.TODO}
                  count={taskCounts.todo}
                  color={getStatusColor('TODO')}
                  user={user}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
                
                <KanbanColumn
                  title="In Progress"
                  status="IN_PROGRESS"
                  tasks={tasksByStatus.IN_PROGRESS}
                  count={taskCounts.inProgress}
                  color={getStatusColor('IN_PROGRESS')}
                  user={user}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
                
                <KanbanColumn
                  title="Done"
                  status="DONE"
                  tasks={tasksByStatus.DONE}
                  count={taskCounts.done}
                  color={getStatusColor('DONE')}
                  user={user}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              </div>

              <DragOverlay>
                {draggedTask ? (
                  <TaskCard
                    task={draggedTask}
                    user={user}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    isDragging={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        ) : (
          /* Tab View */
          <TabView
            tasks={tasks}
            user={user}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            taskCounts={taskCounts}
          />
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12 mt-8">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first task</p>
            <button
              onClick={() => setShowCreateTask(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
            >
              Create Task
            </button>
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