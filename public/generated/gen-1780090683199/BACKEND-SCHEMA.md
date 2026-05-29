# Backend Schema

## Tables
items (id:uuid, createdAt:datetime, updatedAt:datetime)

## Core Entity Summary
1. items should include 3 documented fields and its relationships should be explicit.

## Roles
- user

## Permissions
user: read, write

## API Contract Summary
1. GET /api/items - undefined
2. POST /api/items - undefined

## Schema Guidance
- Include stable IDs and timestamp fields where appropriate.
- Keep route files aligned with the normalized route path.
- Prefer explicit relationships over implicit assumptions.