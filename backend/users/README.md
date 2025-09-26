# Authentication & Users API Documentation

## Base Information
- **Base URL**: `http://localhost:8000/graphql/`
- **Authentication**: JWT Token (Required for all operations except registration and login)
- **Database**: Dockerized PostgreSQL

---

## Models

### User
Custom user model extending `AbstractBaseUser`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | ID | Auto-generated | Unique identifier |
| email | EmailField | Unique | User's email address (used as username) |
| name | CharField | max_length=100 | User's full name |
| password | CharField | Required | Hashed password |
| is_active | BooleanField | default=True | Whether user account is active |
| created_at | DateTimeField | auto_now_add=True | Account creation timestamp |

### OrganizationMember
Represents membership of a user in an organization.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | ID | Auto-generated | Unique identifier |
| user | ForeignKey | Required | Reference to User |
| organization | ForeignKey | Required | Reference to Organization |
| role | CharField | Choices: ADMIN, MEMBER | User's role in organization |

**Unique Constraint**: `(user, organization)` - User can only have one role per organization

---

## GraphQL Schema

### Queries

#### Get Current User Info
```graphql
query {
  me {
    id
    email
    name
    created_at
  }
}
```

**Response:**
```json
{
  "data": {
    "me": {
      "id": "1",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2023-01-01T00:00:00"
    }
  }
}
```

#### Get User's Organizations
```graphql
query {
  myOrganizations {
    id
    name
    slug
    contact_email
  }
}
```

**Response:**
```json
{
  "data": {
    "myOrganizations": [
      {
        "id": "1",
        "name": "Example Org",
        "slug": "example-org",
        "contact_email": "contact@example.com"
      }
    ]
  }
}
```

#### Get Organization Members
```graphql
query GetOrganizationMembers($orgSlug: String!) {
  organizationMembers(orgSlug: $orgSlug) {
    id
    role
    name
    email
    user {
      id
      email
      name
    }
    organization {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "orgSlug": "example-org"
}
```

---

### Mutations

#### User Registration
```graphql
mutation RegisterUser($input: RegisterUserInput!) {
  registerUser(input: $input) {
    user {
      id
      email
      name
      created_at
    }
    token
    success
    errors
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "newuser@example.com",
    "password": "securepassword123",
    "name": "New User",
    "organizationSlug": "example-org"
  }
}
```

**Response:**
```json
{
  "data": {
    "registerUser": {
      "user": {
        "id": "2",
        "email": "newuser@example.com",
        "name": "New User",
        "created_at": "2023-01-01T00:00:00"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "success": true,
      "errors": []
    }
  }
}
```

⚠️ **Special Behavior**: First user to register in an organization automatically becomes an **ADMIN**.

#### User Login
```graphql
mutation LoginUser($input: LoginUserInput!) {
  loginUser(input: $input) {
    user {
      id
      email
      name
    }
    token
    success
    errors
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "user@example.com",
    "password": "userpassword123"
  }
}
```

**Response:**
```json
{
  "data": {
    "loginUser": {
      "user": {
        "id": "1",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "success": true,
      "errors": []
    }
  }
}
```

---

## Input Types

### RegisterUserInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | User's email address |
| password | String | Yes | User's password |
| name | String | Yes | User's full name |
| organization_slug | String | Yes | Slug of organization to join |

### LoginUserInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | String | Yes | User's email address |
| password | String | Yes | User's password |

---

## Authentication Flow

1. **Registration**  
   Client → `RegisterUser` mutation → Returns JWT token  

2. **Login**  
   Client → `LoginUser` mutation → Returns JWT token  

3. **Authenticated Requests**  
   Client → Include JWT in Authorization header → Access protected endpoints  

**Header Format:**
```
Authorization: JWT <token>
```

---

## Role System

### ADMIN
- Full access to all organization resources  
- Can manage organization settings  
- Can add/remove members  

### MEMBER
- Standard user access  
- Can create/edit projects and tasks  
- Limited to their organization's resources  

---

## Error Handling

### Registration Errors
- `"User with this email already exists"`
- `"Organization not found"`

### Login Errors
- `"Invalid credentials"`

### Query Errors
- `"You don't have access to this organization"` (when querying organization members)

---

## Security Features
- **Password Hashing**: Passwords are securely hashed before storage  
- **JWT Tokens**: Stateless authentication with expiration  
- **Organization Isolation**: Users can only access resources from organizations they belong to  
- **Unique Email Enforcement**: No duplicate email addresses allowed  

---

## Usage Examples

### Complete Registration Flow
```graphql
# 1. Register new user
mutation Register {
  registerUser(input: {
    email: "alice@company.com",
    password: "securepass123",
    name: "Alice Smith",
    organizationSlug: "tech-corp"
  }) {
    success
    token
    errors
    user {
      id
      email
      name
    }
  }
}

# 2. Use token in subsequent requests (set in Authorization header)
query GetMyInfo {
  me {
    id
    email
    name
    created_at
  }
}

# 3. Get user's organizations
query GetMyOrgs {
  myOrganizations {
    id
    name
    slug
  }
}
```

### Complete Login Flow
```graphql
# 1. Login
mutation Login {
  loginUser(input: {
    email: "alice@company.com",
    password: "securepass123"
  }) {
    success
    token
    errors
  }
}

# 2. Use token for authenticated operations
query GetProjects {
  projects(orgSlug: "tech-corp") {
    id
    name
    task_count
  }
}
```

---

## API Summary

### Public Endpoints (No Authentication Required)
- `registerUser` - User registration  
- `loginUser` - User login  

### Protected Endpoints (JWT Required)
- `me` - Get current user info  
- `myOrganizations` - Get user's organizations  
- `organizationMembers` - Get organization members list  
- All project/task/organization queries and mutations  
