# Project Updates

## Latest Stable State

- **Last updated:** 2026-07-22
- **Current version:** 1.0.0
- **Current status:** Active
- **Primary branch:** `master`
- **Production URL:** https://api.call-center.dimgianno.com/
- **Staging URL:** https://api-staging.call-center.dimgianno.com/

## Current Project Summary

Call Center Backend is a TypeScript and Express API for call center users to manage their own call records, notes, archive state, and tutorial preferences. It provides cookie- and bearer-based authentication, email verification and password recovery, plus account-scoped realtime updates through Server-Sent Events. MongoDB provides persistent storage, while Swagger documentation, automated API tests, GitHub Actions, Docker, and Render deployments support development and delivery.

## Latest Updates

### 2026-07-22 - Dependency security and tooling refresh

- **Type:** Maintenance
- **Status:** Completed
- **Summary:** Updated safe same-major backend dependencies on `master` and cleared the npm audit report.
- **User impact:** No behavior changes; the API keeps the same routes and authentication behavior while running on a refreshed dependency set.
- **Technical impact:** Updated Mongoose, ESLint, Prettier, tsx, Supertest types, and TypeScript ESLint packages; resolved transitive `body-parser`, `brace-expansion`, and `js-yaml` advisories. Node types remain aligned with the Node 24 runtime, and the TypeScript 7 compiler plus TypeScript 6 compatibility API setup remains unchanged.
- **Related area:** Maintenance

### 2026-07-14 — Forgot-password account validation

- **Type:** Fix
- **Status:** Completed
- **Summary:** Added account-aware forgot-password responses to `master`.
- **User impact:** Users who enter an unknown email receive a clear not-found message instead of being shown a successful reset request.
- **Technical impact:** The password-reset service reports whether the normalized email belongs to an account, the endpoint returns `404` for unknown accounts, and API tests and OpenAPI guidance cover the new response. This intentionally exposes account existence in exchange for clearer recovery feedback.
- **Related area:** Authentication

### 2026-07-13 — Individual note deletion and tutorial v2 API

- **Type:** Feature
- **Status:** Completed
- **Summary:** Added account-scoped individual note deletion and tutorial version 2 to `master`.
- **User impact:** Clients can delete one note without deleting its call, and returning users can discover updated tutorial content.
- **Technical impact:** Added a validated note-deletion endpoint, `delete_note` realtime events, tutorial `newTopics` migration state, OpenAPI documentation, and API tests.
- **Related area:** API

### 2026-07-13 — Secure password recovery and credential revocation

- **Type:** Feature
- **Status:** Completed
- **Summary:** Added forgot-password, reset-password, and authenticated password-change flows.
- **User impact:** Users can recover or change their password, and existing credentials are invalidated after a successful change.
- **Technical impact:** Password reset tokens are stored as SHA-256 hashes, expire after a configurable interval, and are single-use. Successful resets and password changes revoke cookie sessions and previously issued bearer tokens.
- **Related area:** Authentication

### 2026-07-13 — Environment-aware signup notifications

- **Type:** Feature
- **Status:** Completed
- **Summary:** Added private email notifications for successful signups in staging and production, including the source environment in each message.
- **User impact:** Project operators can identify new registrations and the environment in which they occurred without exposing the notification recipient to clients.
- **Technical impact:** The Resend-based notification service is enabled by deployment environment variables and is covered by authentication tests.
- **Related area:** Backend

### 2026-07-08 — Email verification with a grace period

- **Type:** Feature
- **Status:** Completed
- **Summary:** Added verification emails, hashed expiring tokens, resend cooldowns, and a configurable grace period for new and existing accounts.
- **User impact:** New users can enter the application immediately but must verify their email before their grace period expires.
- **Technical impact:** Added verification token persistence, authentication enforcement, automated coverage, and a backfill command for existing users.
- **Related area:** Authentication

### 2026-07-07 — Account-scoped realtime call updates

- **Type:** Feature
- **Status:** Completed
- **Summary:** Added an authenticated Server-Sent Events endpoint that broadcasts successful call mutations to the same user's active clients.
- **User impact:** A user's open clients can refresh call data when calls are archived, restored, deleted, reset, or when notes are added or deleted.
- **Technical impact:** Added user-grouped in-memory SSE client management, mutation broadcasts, and tests for successful and failed mutation behavior.
- **Related area:** API

### 2026-07-01 — Persistent tutorial preferences

- **Type:** Feature
- **Status:** Completed
- **Summary:** Added authenticated endpoints for reading and partially updating a user's tutorial progress.
- **User impact:** Clients can preserve onboarding progress and completion state across sessions.
- **Technical impact:** Extended the user model and added dedicated routes, controllers, services, and API tests.
- **Related area:** Backend

### 2026-06-25 — Server-owned cookie sessions

- **Type:** Improvement
- **Status:** Completed
- **Summary:** Added expiring server-side sessions alongside bearer-token authentication.
- **User impact:** Browser clients can authenticate with secure HttpOnly cookies and refresh or end their sessions through the API.
- **Technical impact:** Added persisted session records, session middleware and services, environment-aware cookie settings, and session lifecycle tests.
- **Related area:** Authentication

## Current Capabilities

- Register, sign in, refresh sessions, and sign out using bearer tokens or secure cookie sessions.
- Verify email addresses and enforce verification after a configurable grace period.
- Request password recovery, reset forgotten passwords, and change authenticated passwords.
- Isolate call records by authenticated user.
- List, filter, and paginate active or archived calls.
- Retrieve, archive, unarchive, reset, and delete call records.
- Add and delete individual notes on call records.
- Broadcast account-scoped call changes through authenticated Server-Sent Events.
- Store and update per-user tutorial preferences.
- Expose health and interactive Swagger/OpenAPI documentation endpoints.
- Validate behavior with Jest, Supertest, and an in-memory MongoDB test database.
- Build and verify the service through GitHub Actions and a multi-stage Docker image.

## Portfolio Highlights

- Layered TypeScript API architecture with routes, controllers, services, persistence models, mappers, and middleware.
- Security-focused authentication using HttpOnly sessions, bearer tokens, hashed single-use verification and reset tokens, expiry controls, and credential revocation.
- User-owned data access and account-scoped realtime updates using authenticated Server-Sent Events.
- Automated API coverage with isolated MongoDB test data for authentication, calls, tutorial preferences, and realtime events.
- Continuous integration for formatting, linting, type checking, compilation, tests, and container builds.
- Separate staging and production deployments on Render with environment-specific database, CORS, email, and cookie configuration.
