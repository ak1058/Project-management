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
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee: User;
  dueDate?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  success: boolean;
  errors?: string[];
}