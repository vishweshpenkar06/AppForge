# Application Flow

## End-to-End Journey
1. The user opens the compiler workspace.
2. The user enters a natural-language requirement.
3. The compiler derives intent, design, schema, validation, and implementation guidance.
4. The user reviews the PRD, TRD, App Flow, UI/UX Brief, Backend Schema, and Implementation Plan.
5. The user exports the generated package or continues into implementation.

## Primary Pages
Home: Landing page and overview
Dashboard: Primary application workspace

## API Surfaces
GET /api/tasks - List tasks
POST /api/tasks - Create tasks

## Workflow States
- Draft
- Compiling
- Review Ready
- Exported

## Edge Cases
- Prompt is vague and requires assumptions to be recorded
- Multiple entities map to the same route and must be merged
- The user may request an app structure that needs role normalization