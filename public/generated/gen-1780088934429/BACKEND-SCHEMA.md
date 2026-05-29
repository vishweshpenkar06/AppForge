# Backend Schema

## Tables
items (id:uuid, createdAt:datetime, updatedAt:datetime)

## Roles
- user

## Permissions
user: read, write

## Auth Strategy
Workspace-aware Clerk auth with role checks