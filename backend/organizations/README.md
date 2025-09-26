# Django Organization app Documentation

## Overview
This API provides a GraphQL interface for managing organizations

## Base Information
- **Base URL**: `http://localhost:8000/graphql/`

- **Database**: Dockerized PostgreSQL

---

# Organization API

## Models

### Organization
Represents an organization entity.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | ID | Auto-generated | Unique identifier |
| name | CharField | Unique, max_length=100 | Organization name |
| slug | SlugField | Unique | URL-friendly identifier |
| contact_email | EmailField | Unique | Contact email address |
| created_at | DateTimeField | auto_now_add=True | Creation timestamp |

## GraphQL Schema

### Queries

#### Get All Organizations
```graphql
query {
  organizations {
    id
    name
    slug
    contact_email
    created_at
  }
}
```

**Response:**
```json
{
  "data": {
    "organizations": [
      {
        "id": "1",
        "name": "Example Org",
        "slug": "example-org",
        "contact_email": "contact@example.com",
        "created_at": "2023-01-01T00:00:00"
      }
    ]
  }
}
```

### Mutations

#### Create Organization
```graphql
mutation CreateOrganization($input: OrganizationInput!) {
  createOrganization(input: $input) {
    organization {
      id
      name
      slug
      contact_email
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
    "name": "New Organization",
    "slug": "new-org",
    "contact_email": "info@neworg.com"
  }
}
```

**Response:**
```json
{
  "data": {
    "createOrganization": {
      "organization": {
        "id": "2",
        "name": "New Organization",
        "slug": "new-org",
        "contact_email": "info@neworg.com",
        "created_at": "2023-01-01T00:00:00"
      },
      "success": true,
      "errors": []
    }
  }
}
```

**Error Responses:**
- `"Organization with this slug already exists"`
- `"Organization with this name already exists"`
- `"Organization with this email already exists"`

## Input Types

### OrganizationInput
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Organization name |
| slug | String | Yes | URL-friendly slug |
| contact_email | String | Yes | Contact email address |

---

## Authentication Requirements
⚠️ **Note**: Currently, the organization endpoints don't require authentication, but this will be added when we integrate JWT.

---

## Error Handling
All mutations return a standardized response format:
- `success`: Boolean indicating operation status
- `errors`: Array of error messages (empty if success is true)

## Validation Rules
1. Organization name must be unique
2. Organization slug must be unique
3. Contact email must be unique and valid
4. Slug must be URL-friendly
