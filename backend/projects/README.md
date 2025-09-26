# Projects API Documentation

## Models

### Project
Represents a project within an organization.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | ID | Auto-generated | Unique identifier |
| organization | ForeignKey | Required | Reference to Organization |
| name | CharField | max_length=200 | Project name |
| slug | SlugField | Unique, max_length=50 | URL-friendly identifier |
| description | TextField | Optional | Project description |
| status | CharField | Choices: ACTIVE, COMPLETED, ON_HOLD | Project status |
| due_date | DateField | Optional | Project due date |
| created_at | DateTimeField | auto_now_add=True | Creation timestamp |

### Task
Represents a task within a project.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | ID | Auto-generated | Unique identifier |
| project | ForeignKey | Required | Reference to Project |
| task_id | CharField | Unique, max_length=50 | Auto-generated ID (e.g., "PROJ-1") |
| title | CharField | max_length=200 | Task title |
| description | TextField | Optional | Task description |
| status | CharField | Choices: TODO, IN_PROGRESS, DONE | Task status |
| assignee | ForeignKey | Optional | Assigned user |
| due_date | DateTimeField | Optional | Task due date |
| created_at | DateTimeField | auto_now_add=True | Creation timestamp |

### TaskComment
Represents a comment on a task.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | ID | Auto-generated | Unique identifier |
| task | ForeignKey | Required | Reference to Task |
| content | TextField | Required | Comment content |
| author | ForeignKey | Required | Comment author |
| timestamp | DateTimeField | auto_now_add=True | Comment timestamp |

## GraphQL Schema

### Queries

#### Get All Projects in Organization
```graphql
query GetProjects($orgSlug: String!) {
  projects(orgSlug: $orgSlug) {
    id
    name
    slug
    description
    status
    due_date
    created_at
    task_count
    completed_tasks
  }
}
```

**Variables:**
```json
{
  "orgSlug": "example-org"
}
```

#### Get Single Project
```graphql
query GetProject($orgSlug: String!, $projectSlug: String!) {
  project(orgSlug: $orgSlug, projectSlug: $projectSlug) {
    id
    name
    slug
    description
    status
    due_date
    created_at
    task_count
    completed_tasks
  }
}
```

#### Get Tasks in Project
```graphql
query GetTasks($orgSlug: String!, $projectSlug: String!) {
  tasks(orgSlug: $orgSlug, projectSlug: $projectSlug) {
    id
    task_id
    title
    description
    status
    assignee {
      id
      email
    }
    due_date
    created_at
  }
}
```

#### Get Single Task
```graphql
query GetTask($orgSlug: String!, $taskId: String!) {
  task(orgSlug: $orgSlug, taskId: $taskId) {
    id
    task_id
    title
    description
    status
    assignee {
      id
      email
    }
    due_date
    created_at
  }
}
```

#### Get Task Comments
```graphql
query GetTaskComments($orgSlug: String!, $taskId: String!) {
  task_comments(orgSlug: $orgSlug, taskId: $taskId) {
    id
    content
    author {
      id
      email
    }
    timestamp
  }
}
```

### Mutations

#### Create Project
```graphql
mutation CreateProject($input: ProjectInput!) {
  createProject(input: $input) {
    project {
      id
      name
      slug
      description
      status
      due_date
      created_at
    }
    success
    errors
  }
}
```

**Variables:**
```json
{
  "input": {
    "organizationSlug": "example-org",
    "name": "New Project",
    "slug": "new-project",
    "description": "Project description",
    "status": "ACTIVE",
    "dueDate": "2024-12-31"
  }
}
```

#### Update Project
```graphql
mutation UpdateProject($projectSlug: String!, $organizationSlug: String!, $input: UpdateProjectInput!) {
  updateProject(projectSlug: $projectSlug, organizationSlug: $organizationSlug, input: $input) {
    project {
      id
      name
      slug
      description
      status
      due_date
    }
    success
    errors
  }
}
```

#### Delete Project
```graphql
mutation DeleteProject($projectSlug: String!, $organizationSlug: String!) {
  deleteProject(projectSlug: $projectSlug, organizationSlug: $organizationSlug) {
    success
    errors
  }
}
```

#### Create Task
```graphql
mutation CreateTask($input: TaskInput!) {
  createTask(input: $input) {
    task {
      id
      task_id
      title
      description
      status
      assignee {
        email
      }
      due_date
    }
    success
    errors
  }
}
```

**Variables:**
```json
{
  "input": {
    "organizationSlug": "example-org",
    "projectSlug": "new-project",
    "title": "New Task",
    "description": "Task description",
    "status": "TODO",
    "dueDate": "2024-12-31",
    "assigneeEmail": "user@example.com"
  }
}
```

#### Update Task
```graphql
mutation UpdateTask($taskId: String!, $orgSlug: String!, $input: UpdateTaskInput!) {
  updateTask(taskId: $taskId, orgSlug: $orgSlug, input: $input) {
    task {
      id
      task_id
      title
      description
      status
      assignee {
        email
      }
      due_date
    }
    success
    errors
  }
}
```

#### Delete Task
```graphql
mutation DeleteTask($taskId: String!, $orgSlug: String!) {
  deleteTask(taskId: $taskId, orgSlug: $orgSlug) {
    success
    errors
  }
}
```

#### Create Task Comment
```graphql
mutation CreateTaskComment($orgSlug: String!, $taskId: String!, $content: String!) {
  createTaskComment(orgSlug: $orgSlug, taskId: $taskId, content: $content) {
    success
    errors
    comment {
      id
      content
      author {
        email
      }
      timestamp
    }
  }
}
```

## Input Types

### ProjectInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| organization_slug | String | Yes | Organization identifier |
| name | String | Yes | Project name |
| slug | String | No | URL-friendly slug (auto-generated if not provided) |
| description | String | No | Project description |
| status | String | No | Project status (default: ACTIVE) |
| due_date | Date | No | Project due date |

### UpdateProjectInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | No | Project name |
| slug | String | No | URL-friendly slug |
| description | String | No | Project description |
| status | String | No | Project status |
| due_date | Date | No | Project due date |

### TaskInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| organization_slug | String | Yes | Organization identifier |
| project_slug | String | Yes | Project identifier |
| title | String | Yes | Task title |
| description | String | No | Task description |
| status | String | No | Task status (default: TODO) |
| due_date | Date | No | Task due date |
| assignee_email | String | No | Assignee's email |

### UpdateTaskInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | No | Task title |
| description | String | No | Task description |
| status | String | No | Task status |
| due_date | Date | No | Task due date |
| assignee_email | String | No | Assignee's email (empty string to clear) |

## Authentication & Authorization
🔐 **JWT Token Required** for all project operations

**Access Rules:**
- User must be a member of the organization to access projects
- User must have organization membership to perform any project/task operations
- Assignee must be a member of the same organization

## Real-time Features
- Task comments support WebSocket real-time updates
- Comments are broadcast to room: `task_comments_{org_slug}_{task_id}`

## Error Handling
All mutations return standardized response:
- `success`: Boolean indicating operation status
- `errors`: Array of error messages

**Common Errors:**
- `"You don't have access to this organization"`
- `"Project not found"`
- `"Task not found"`
- `"User with this email not found"`
- `"Assignee must be a member of the organization"`

---

## Status Values

### Project Status
- `ACTIVE` - Project is actively being worked on
- `COMPLETED` - Project has been completed
- `ON_HOLD` - Project is temporarily paused

### Task Status
- `TODO` - Task has not been started
- `IN_PROGRESS` - Task is currently being worked on
- `DONE` - Task has been completed
