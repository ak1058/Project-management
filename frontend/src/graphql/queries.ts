// src/graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_ORGANIZATIONS = gql`
  query GetOrganizations {
    organizations {
      id
      name
      slug
      contactEmail
    }
  }
`;

export const GET_MY_ORGANIZATIONS = gql`
  query GetMyOrganizations {
    myOrganizations {
      id
      name
      slug
      contactEmail
    }
  }
`;

export const GET_PROJECTS = gql`
  query GetProjects($orgSlug: String!) {
    projects(orgSlug: $orgSlug) {
      id
      name
      slug
      description
      status
      dueDate
      createdAt
      taskCount
      completedTasks
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($orgSlug: String!, $projectSlug: String!) {
    project(orgSlug: $orgSlug, projectSlug: $projectSlug) {
      id
      name
      slug
      description
      status
      dueDate
      createdAt
      taskCount
      completedTasks
    }
  }
`;

//  task-related queries
export const GET_TASKS = gql`
  query GetTasks($orgSlug: String!, $projectSlug: String!) {
    tasks(orgSlug: $orgSlug, projectSlug: $projectSlug) {
      id
      taskId
      title
      description
      status
      assignee {
        id
        name
        email
      }
      dueDate
      createdAt
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($orgSlug: String!, $taskId: String!) {  # Remove projectSlug
    task(orgSlug: $orgSlug, taskId: $taskId) {          # Remove projectSlug
      id
      taskId
      title
      description
      status
      assignee {
        id
        name
        email
      }
      dueDate
      createdAt
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      user {
        id
        email
        name
        createdAt
      }
      token
      success
      errors
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      user {
        id
        email
        name
        createdAt
      }
      token
      success
      errors
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: ProjectInput!) {
    createProject(input: $input) {
      project {
        id
        name
        slug
        description
        status
        dueDate
        createdAt
      }
      success
      errors
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($projectSlug: String!, $organizationSlug: String!, $input: UpdateProjectInput!) {
    updateProject(projectSlug: $projectSlug, organizationSlug: $organizationSlug, input: $input) {
      project {
        id
        name
        slug
        description
        status
        dueDate
        createdAt
      }
      success
      errors
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($projectSlug: String!, $organizationSlug: String!) {
    deleteProject(projectSlug: $projectSlug, organizationSlug: $organizationSlug) {
      success
      errors
    }
  }
`;

// task mutations
export const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      task {
        id
        taskId
        title
        description
        status
        assignee {
          id
          name
          email
        }
        dueDate
        createdAt
      }
      success
      errors
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($taskId: String!, $orgSlug: String!, $input: UpdateTaskInput!) {  
    updateTask(taskId: $taskId, orgSlug: $orgSlug, input: $input) {                    
      task {
        id
        taskId
        title
        description
        status
        assignee {
          id
          name
          email
        }
        dueDate
        createdAt
      }
      success
      errors
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($taskId: String!, $orgSlug: String!) {  
    deleteTask(taskId: $taskId, orgSlug: $orgSlug) {          
      success
      errors
    }
  }
`;

// getting org members 
export const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($orgSlug: String!) {
    organizationMembers(orgSlug: $orgSlug) {  # This should match your resolver name
      id
      name
      email
      role
    }
  }
`;

// Task Comments Queries
export const GET_TASK_COMMENTS = gql`
  query GetTaskComments($orgSlug: String!, $taskId: String!) {
    taskComments(orgSlug: $orgSlug, taskId: $taskId) {
      id
      content
      author {
        id
        name
        email
      }
      timestamp
    }
  }
`;

export const CREATE_TASK_COMMENT = gql`
  mutation CreateTaskComment($orgSlug: String!, $taskId: String!, $content: String!) {
    createTaskComment(orgSlug: $orgSlug, taskId: $taskId, content: $content) {
      success
      errors
      comment {
        id
        content
        author {
          id
          name
          email
        }
        timestamp
      }
    }
  }
`;