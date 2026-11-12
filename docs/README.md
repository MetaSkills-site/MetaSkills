# MetaSkills Documentation Index

Welcome to the technical documentation repository for MetaSkills. This hub organizes architectural blueprints, file indexes, component catalogs, endpoint contracts, and data models across the entire monorepo.

*Last Generated: 2026-11-12T14:20:00+05:30*

---

## Recommended Reading Order

For engineers, architects, or autonomous AI agents onboarding onto this codebase, follow this reading progression:

```
1. Architecture Overview (ARCHITECTURE_OVERVIEW.md)
   ↓
2. Local Setup & Environment Guide (../LOCAL_SETUP_ENV.md)
   ↓
3. Unified Contributor Guide (../CONTRIBUTOR_GUIDE.md)
   ↓
4. Codebase Directory and File Index (CODEBASE_DIRECTORY_AND_FILE_INDEX.md)
   ↓
5. Views and Components Catalog (VIEWS_AND_COMPONENTS_CATALOG.md)
   ↓
6. Endpoint Mapping & Contracts (ENDPOINT_MAPPING.md)
   ↓
7. Backend API and Data Models (BACKEND_API_AND_DATA_MODELS.md)
```

---

## Documentation Documents

### 1. [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
Provides the macro architectural design of the MetaSkills platform, covering full-stack boundaries, runtime environments, and external cloud integrations. Details cross-cutting concerns including CSRF defenses, database connection pooling in serverless environments, and the Leitner spaced repetition engine.

### 2. [Codebase Directory and File Index](CODEBASE_DIRECTORY_AND_FILE_INDEX.md)
Presents a complete, searchable structural breakdown of every directory, controller, model, component, and utility across `api/` and `web/`. Serves as a primary reference for locating files and exports quickly using `Ctrl+F`.

### 3. [Views and Components Catalog](VIEWS_AND_COMPONENTS_CATALOG.md)
Catalogs all user-facing views, administrative dashboards, layouts, and reusable component primitives within the React client. Documents component props, local state schemas, child hierarchies, access controls, and route bindings.

### 4. [Endpoint Mapping](ENDPOINT_MAPPING.md)
Maps every frontend service and mutation to its backing Express route and controller handler. Formats precise request payload contracts, HTTP response bodies, authentication requirements, and database touchpoints.

### 5. [Backend API and Data Models](BACKEND_API_AND_DATA_MODELS.md)
Specifies all Mongoose schemas, compound indexes, validation constraints, pre-validate hooks, and database entity relationships. Includes an Entity Relationship diagram illustrating connections between Users, Responses, Modules, Questions, and Passages.

### 6. [Local Setup ENV Guide](../LOCAL_SETUP_ENV.md)
Outlines prerequisite runtimes, package installation steps, database seeding, and port assignments for spinning up the monorepo locally. Details every environment variable needed to run the Express API and Vite development server.

### 7. [Unified Contributor Guide](../CONTRIBUTOR_GUIDE.md)
The central handbook for new contributors joining the MetaSkills project. Covers repository conventions, branch workflows, testing commands, manual verification routines, and pull request quality standards.
