// src/graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_ORGANIZATIONS = gql`
  query GetOrganizations {
    organizations {
      id
      name
      slug
      contactEmail
      createdAt
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