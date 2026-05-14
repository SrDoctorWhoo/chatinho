# Workflow Preferences: Chatinho

## Development Cycle
We follow a task-based workflow using Conductor tracks. Each feature or bug is a track with its own specification and implementation plan.

## TDD Policy
- **Flexible**: Tests are highly recommended for complex business logic, especially message processing and AI flows.
- **Verification**: Each phase must be verified manually or through automated tests.

## Commit Strategy
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`.
- Include Track ID in commit messages if possible.

## Agent Orchestration
We use a specialized **Orchestrator & Router Agent** to manage complex tasks.
- **Routing First**: Every complex request must first be analyzed by the `orchestrator-router`.
- **Specialization**: The orchestrator will delegate to specialized agents (e.g., `ai-engineer`, `ui-ux-designer`) based on the task requirements.
- **Plan-First**: For multi-file changes, the orchestrator must initiate a `conductor` track and plan before execution.

## Code Quality
- All components should follow the premium design guidelines (glassmorphism, modern typography).
- Responsive design is mandatory for all UI components.
