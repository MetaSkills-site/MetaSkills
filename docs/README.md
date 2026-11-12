# MetaSkills Documentation

Single source of truth for all non-production documentation, specifications, architecture diagrams, and roadmaps for the MetaSkills platform.

## Directory Structure

As defined in the project architecture guidelines:

- **`architecture/`**: System and subsystem designs, component architecture, and Architectural Decision Records (ADRs).
- **`planning/`**: Implementation roadmaps, milestone planning, and Product Requirement Documents (PRDs).
- **`research/`**: Auth and technology research, third-party library evaluations, and proof-of-concept findings.
- **`api/`**: API contracts, endpoint definitions, and schema specifications.
- **`changelogs/`**: Release notes, version history, and patch documentation.

## Guidelines

- **Permanent vs Scratch**: Persistent project documentation belongs here in `docs/`. Ephemeral developer scratchpads and ad-hoc scripts belong in `scratch/` (which is gitignored).
- **Contract Accuracy**: Ensure contracts documented in `docs/api/` remain synchronized with the server implementation in `api/` and client consumers in `web/`.
