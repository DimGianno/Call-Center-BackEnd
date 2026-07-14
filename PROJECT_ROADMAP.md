# Project Roadmap

## Current Status

- **Project maturity:** Production-ready
- **Actively developed:** Yes
- **Last reviewed:** 2026-07-14

## Active Work

### Complete account-aware password recovery

- **Priority:** High
- **Status:** In progress
- **Progress:** Unknown forgot-password emails now produce a tested `404` response without creating a reset token or sending email.
- **Remaining work:** Commit, merge, and deploy the coordinated backend and frontend branches.
- **Security decision:** The explicit not-found response improves user guidance but intentionally reveals whether an email address is registered; route-sensitive rate limiting remains a planned mitigation against automated discovery.

## Known Limitations

### Realtime events are limited to one service instance

- **Area:** Backend
- **Severity:** High
- **User impact:** Realtime call updates may not reach all of a user's connected clients if the API is scaled across multiple service instances.
- **Technical impact:** SSE connections are held in process memory, so event delivery is not shared between instances and does not survive a process restart.
- **Current workaround:** Run the backend as a single Render web service instance.
- **Suggested resolution:** Publish call-change events through shared infrastructure such as Redis pub/sub and let each instance forward relevant events to its connected clients.
- **Status:** Known

### Public endpoints do not have general rate limiting

- **Area:** Security
- **Severity:** High
- **User impact:** Automated or excessive requests could degrade service availability or abuse authentication and email-related endpoints.
- **Technical impact:** The API has targeted email resend cooldowns but no repository-wide request throttling layer.
- **Current workaround:** Email verification and password reset requests have configurable resend cooldowns.
- **Suggested resolution:** Add route-sensitive rate limits, with stricter policies for authentication, password recovery, and email delivery endpoints.
- **Status:** Known

### Request validation is not complete across all endpoints

- **Area:** API
- **Severity:** Medium
- **User impact:** Invalid requests may receive less consistent validation feedback depending on the endpoint.
- **Technical impact:** Validation rules and error handling are not applied uniformly across the full route surface.
- **Current workaround:** Existing endpoint-specific checks and centralized error handling reject supported invalid cases.
- **Suggested resolution:** Define shared request schemas for every path parameter, query, and body, then enforce them through common validation middleware.
- **Status:** Known

### Call discovery is limited to existing filters

- **Area:** API
- **Severity:** Medium
- **User impact:** Users cannot search calls by phone number or note content.
- **Technical impact:** The call query layer supports archived state, direction, call type, and pagination but has no text-search path.
- **Current workaround:** Use the existing filters and pagination, then inspect matching call records.
- **Suggested resolution:** Add a validated search query with suitable MongoDB indexes and user-ownership constraints.
- **Status:** Known

### Existing notes cannot be edited

- **Area:** API
- **Severity:** Medium
- **User impact:** Users can add and delete notes but cannot correct an existing note through the API.
- **Technical impact:** The note API supports creation and deletion but does not expose an update operation.
- **Current workaround:** Delete the incorrect note and add a corrected replacement.
- **Suggested resolution:** Add an ownership-protected note update operation with validation, tests, and OpenAPI documentation.
- **Status:** Known

## Next Features

### Search calls by phone number or note content

- **Priority:** High
- **Status:** Idea
- **Value:** Helps users locate relevant calls without manually paging through filtered lists.
- **Scope:** Add account-scoped text search to the call-list endpoint, including validation, indexing, tests, and API documentation.
- **Dependencies:** A documented search behavior and appropriate MongoDB indexes
- **Complexity:** Medium
- **Portfolio relevance:** Demonstrates query design, indexing, authorization-aware search, and performance-conscious API development.

### Edit individual notes

- **Priority:** High
- **Status:** Idea
- **Value:** Lets users correct outdated notes without deleting and recreating them.
- **Scope:** Add an authenticated note update endpoint, validation, tests, and OpenAPI documentation.
- **Dependencies:** A documented note-editing and audit policy
- **Complexity:** Medium
- **Portfolio relevance:** Extends the embedded-document model with precise mutation semantics and authorization coverage.

### Account-wide session management controls

- **Priority:** Medium
- **Status:** Idea
- **Value:** Gives users visibility into active sessions and a direct way to sign out other devices.
- **Scope:** Expose authenticated session listing and selective or account-wide revocation endpoints without returning raw session tokens.
- **Dependencies:** Session metadata and a user-facing session-management design
- **Complexity:** Medium
- **Portfolio relevance:** Highlights secure session lifecycle design, privacy-aware API responses, and multi-device account protection.

## Technical Improvements

### Add shared realtime event delivery

- **Priority:** High
- **Reason:** The current in-memory SSE registry supports only one running API instance.
- **Expected outcome:** Realtime call changes are delivered consistently when the service scales horizontally or an instance restarts.
- **Affected area:** `src/services/callEventsService.ts`, event routing, deployment architecture, and realtime tests
- **Status:** Idea

### Standardize request validation

- **Priority:** High
- **Reason:** The README identifies incomplete request validation, while validation behavior currently varies by endpoint.
- **Expected outcome:** All route inputs produce consistent, typed validation errors before business logic executes.
- **Affected area:** `src/utils/validators.ts`, route middleware, controllers, Swagger schemas, and API tests
- **Status:** Idea

### Introduce route-sensitive rate limiting

- **Priority:** High
- **Reason:** The public API has no general throttling despite exposing authentication and email-sending operations.
- **Expected outcome:** Reduced abuse risk and more predictable service availability under repeated requests.
- **Affected area:** Authentication routes, call routes, application middleware, deployment proxy configuration, and tests
- **Status:** Idea

### Adopt structured application logging

- **Priority:** Medium
- **Reason:** Request and diagnostic events are primarily written through direct console logging, and the README identifies more advanced logging as an improvement area.
- **Expected outcome:** Searchable, consistently shaped logs with request context and safe handling of authentication data.
- **Affected area:** `src/middleware/requestLogger.ts`, `src/utils/authDebugLogger.ts`, startup and database logging, and deployment observability
- **Status:** Idea

## Suggested Next Milestones

1. **API security and validation hardening**
    - Goal: Apply consistent input protection and abuse controls across the public API.
    - Included work: Shared request schemas, route-sensitive rate limiting, validation and throttling tests, and updated OpenAPI documentation.
    - Completion criteria: Every endpoint validates its inputs consistently, sensitive endpoints enforce documented limits, and the full quality-check workflow passes.

2. **Call search and note management**
    - Goal: Make call records easier to find and their notes fully manageable.
    - Included work: Account-scoped text search, MongoDB indexing, a note update endpoint, tests, and documentation.
    - Completion criteria: Users can search supported call fields and safely add, edit, or delete their own notes with automated authorization and validation coverage.

3. **Horizontally scalable realtime delivery**
    - Goal: Preserve realtime call updates across multiple API instances.
    - Included work: Shared event transport, instance-safe SSE fan-out, reconnect behavior, deployment configuration, and multi-instance integration tests.
    - Completion criteria: A call mutation reaches the user's connected clients across separate service instances without cross-account event leakage.
