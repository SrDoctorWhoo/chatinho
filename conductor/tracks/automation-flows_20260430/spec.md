# Specification: Automation and Conversation Flows

**Track ID:** automation-flows_20260430
**Type:** Feature
**Created:** 2026-04-30
**Status:** Draft

## Summary
Implement a visual/easy-to-use flow builder that allows managers to define automated responses, menus, and conditional logic for WhatsApp conversations.

## Context
As defined in `product.md`, the system must support bot automation. This track provides the management interface and the execution engine for these bots.

## User Story
As a Manager, I want to easily customize conversation flows so that I can automate common customer inquiries without needing a developer.

## Acceptance Criteria
- [ ] Visual or form-based Flow Builder interface.
- [ ] Nodes for:
  - **Message**: Send a simple text.
  - **Question**: Ask something and wait for input.
  - **Menu**: Give options (1, 2, 3) and branch based on selection.
  - **Transfer**: Hand over to a human attendant.
- [ ] Flow Engine that identifies the current node for a contact and processes the incoming message.
- [ ] Ability to set a "Default/Welcome" flow for new contacts.

## Dependencies
- Prisma models for `ChatbotFlow`, `ChatbotNode`, `ChatbotOption`.
- Webhook integration (to trigger the engine).

## Out of Scope
- Advanced AI branching (Phase 4).
- External API calls within nodes (Phase 5).

## Technical Notes
- We will use `reactflow` or a similar library if we go for a visual graph, or a nested list approach for simplicity in MVP.
- The engine will be a stateless service that looks up the contact's `currentFlowStep` in the database.
