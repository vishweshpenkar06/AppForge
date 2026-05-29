# Backend Schema

## Tables
tasks (id:uuid, createdAt:datetime, updatedAt:datetime)

## Core Entity Summary
1. tasks should include 3 documented fields and its relationships should be explicit.

## Roles
- user

## Permissions
user: read, write

## API Contract Summary
1. GET /api/tasks - undefined
2. POST /api/tasks - undefined

## Schema Guidance
- Include stable IDs and timestamp fields where appropriate.
- Keep route files aligned with the normalized route path.
- Prefer explicit relationships over implicit assumptions.