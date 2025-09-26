// src/types/index.ts
export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  slug: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  dueDate?: string;
  createdAt: string;
  taskCount?: number;
  completedTasks?: number;
}

export interface Task {
  id: string;
  taskId: string;  
  title: string;
  description: string;
  status: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  dueDate?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  }
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  success: boolean;
  errors?: string[];
}