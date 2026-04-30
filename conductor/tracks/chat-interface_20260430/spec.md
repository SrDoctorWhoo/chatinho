# Specification: Real-time Chat Interface

**Track ID:** chat-interface_20260430
**Type:** Feature
**Created:** 2026-04-30
**Status:** Draft

## Summary
Implement a real-time messaging interface that allows attendants to communicate with WhatsApp contacts. It includes a conversation list, a message history view, and a real-time update mechanism.

## Context
As defined in `product.md`, Chatinho needs a human service module. This track covers the UI and communication layer for real-time chat between attendants and clients.

## User Story
As an Attendant, I want to see a list of active conversations and chat with customers in real-time so that I can provide fast and effective support.

## Acceptance Criteria
- [ ] Display a list of active conversations with contact name, last message, and timestamp.
- [ ] Real-time message history view with scroll-to-bottom.
- [ ] Input area for sending text messages to WhatsApp.
- [ ] Socket.io integration to show new messages instantly without refreshing.
- [ ] Visual indicators for "Unread" messages and "In Service" status.

## Dependencies
- Evolution API (already in Docker).
- Next.js API routes (already setup for basic instances).
- Socket.io (server and client).

## Out of Scope
- File/Media sending (images, videos) - will be handled in a later track.
- Automated AI suggestions (Fase 4).
- Detailed report analytics (Fase 5).

## Technical Notes
- We need a separate Node.js server for Socket.io as Next.js 15 App Router doesn't support it natively in the same process effectively.
- We will use the Evolution API webhooks to trigger Socket.io events.
