# Call Center Backend API

A backend API for a call center application built with **Node.js**, **Express**, **TypeScript**, **MongoDB Atlas**, and **Mongoose**.

Staging URL: https://api-staging.call-center.dimgianno.com/

Production URL: https://api.call-center.dimgianno.com/

The API allows clients to manage call records, filter and paginate call lists, archive/unarchive calls, add notes to calls, delete calls, and seed sample data into the database.

This project was built as part of a backend engineering learning assignment, with focus on REST API design, validation, error handling, persistent storage, testing, and CI/CD.

## Features Implemented

### Core Features

- Get all active calls
- Get all archived calls
- Get a single call by ID
- Archive a call
- Return clean JSON error responses
- MongoDB Atlas database integration
- Mongoose schema/model for calls
- Seed script for sample data
- Environment variable configuration
- User signup and login
- JWT authentication for protected API routes
- Server-side session expiry with HttpOnly cookie sessions
- Authenticated tutorial preference API
- User-owned call records
- Realtime same-account call updates with authenticated Server-Sent Events
- Email verification with a 7-day grace period

### Bonus / Extended Features

- Unarchive a call
- Archive all active calls
- Unarchive all archived calls
- Add notes to a call
- Delete a call
- Reset calls to sample data through the API
- Filter calls by:
    - archived status
    - direction
    - call type

- Pagination support for `GET /calls`
- Request logging middleware
- Centralized not-found handling
- Centralized error handling
- Health check endpoint
- Automated API tests
- GitHub Actions CI workflow

---

## Tech Stack

| Technology        | Why it is used                                              |
| ----------------- | ----------------------------------------------------------- |
| Node.js           | Runtime environment for the backend                         |
| Express           | Web framework for creating API routes and middleware        |
| TypeScript        | Adds type safety and improves maintainability               |
| MongoDB Atlas     | Cloud database used for persistent storage                  |
| Mongoose          | ODM used to define schemas and interact with MongoDB        |
| dotenv            | Loads environment variables from `.env`                     |
| cors              | Allows the frontend to communicate with the backend         |
| tsx               | Runs TypeScript files during development                    |
| Jest              | Test Runner                                                 |
| Supertest         | Tests Express endpoint without manually starting the server |
| MongoMemoryServer | Temporary in-memory MongoDB for tests                       |
| GitHub Actions    | Runs automated build and test checks on push                |
| Swagger / OpenAPI | Interactive API documentation available at /api-docs        |
| Docker            | Containerizes the backend application                       |
| ESLint            | Checks code quality and catches common issues               |
| Prettier          | Enforces consistent code formatting                         |

---

## Project Structure

```txt
src/
  app.ts
  index.ts

  config/
    db.ts
    swagger.ts

  controllers/
    authControllers.ts
    callControllers.ts

  db/
    models/
      callDbModel.ts
      userDbModel.ts
    mockCalls.ts
    seed.ts

  mappers/
    callMapper.ts
    userMapper.ts

  middleware/
    authMiddleware.ts
    errorHandler.ts
    notFoundHandler.ts
    requestLogger.ts

  models/
    callModel.ts
    serviceTypes.ts
    userModel.ts

  routes/
    authRoutes.ts
    callRoutes.ts

  services/
    authService.ts
    callService.ts

  utils/
    jwt.ts
    password.ts
    validators.ts

  __tests__/
    auth.test.ts
    calls.test.ts
```

---

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/DimGianno/Call-Center-BackEnd.git
cd Call-Center-BackEnd
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Create a MongoDB Atlas database

Create a free MongoDB Atlas cluster.

Then create a database user and copy your MongoDB connection string.

The connection string should look similar to this:

```txt
mongodb+srv://USERNAME:PASSWORD@cluster-name.mongodb.net/call-center-db?appName=cluster-name
```

Note: Do not use symbols in your USERNAME and PASSWORD in case of breaking the connection string.

---

### 4. Create a `.env` file

In the project root, create:

```txt
.env
```

Add:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
API_BASE_URL=http://localhost:3000
FRONTEND_ORIGINS=http://localhost:5173
SESSION_TTL_MINUTES=10
AUTH_DEBUG_LOGS=false
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="Call Center <verify@yourdomain.com>"
FRONTEND_PUBLIC_URL=http://localhost:5173
EMAIL_VERIFICATION_GRACE_DAYS=7
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=1440
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

Make sure `.env` is included in `.gitignore` so your database password is not pushed to GitHub.

---

### 5. Seed the database

Run:

```bash
npm run seed
```

This resets the call collection and inserts sample call data.

---

### 6. Start the development server

```bash
npm run dev
```

Expected terminal output:

```txt
Connected to MongoDB
Server is running on port 3000
```

---

### 7. Build the project

```bash
npm run build
```

---

### 8. Run the compiled version

```bash
npm run start
```

---

## Available Scripts

| Script                                | Description                                                     |
| ------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                         | Starts the development server                                   |
| `npm run build`                       | Compiles TypeScript into JavaScript                             |
| `npm run start`                       | Runs the compiled app from `dist`                               |
| `npm run seed`                        | Seeds MongoDB with sample call data                             |
| `npm run backfill:email-verification` | Adds verification deadlines to existing unverified users        |
| `npm run typecheck`                   | Runs TypeScript type-checking                                   |
| `npm run lint`                        | Runs ESLint on the src folder                                   |
| `npm run format`                      | Formats the project with Prettier                               |
| `npm run format:check`                | Checks if files follow Prettier formatting                      |
| `npm test`                            | Runs the Jest/SuperTest API test suite                          |
| `npm run test:watch`                  | Runs tests in watch mode during development                     |
| `npm run check`                       | Runs formatting check, linting, type-checking, build, and tests |

---

## API Endpoints

### General

| Method | Endpoint  | Description                                 |
| ------ | --------- | ------------------------------------------- |
| GET    | `/`       | Root endpoint confirming the API is running |
| GET    | `/health` | Health check endpoint                       |

`GET /health` includes the active runtime environment:

```json
{
    "status": "ok",
    "environment": "staging",
    "message": "API is healthy"
}
```

---

### Auth

| Method | Endpoint                    | Description                                  |
| ------ | --------------------------- | -------------------------------------------- |
| POST   | `/auth/signup`              | Create a user and start a server session     |
| POST   | `/auth/login`               | Log in a user and start a server session     |
| POST   | `/auth/refresh`             | Refresh the current cookie session           |
| POST   | `/auth/resend-verification` | Resend the current user's verification email |
| POST   | `/auth/verify-email`        | Verify an email verification token           |
| POST   | `/auth/logout`              | Delete the current cookie session            |

Successful signup and login responses set an HttpOnly `session` cookie and return:

```json
{
    "user": {
        "id": "665f1f4e91a5b6a4d1c8b123",
        "name": "Dimitrios",
        "email": "user@example.com",
        "created_at": "2026-01-01T10:00:00.000Z"
    },
    "accessToken": "jwt-access-token",
    "emailVerification": {
        "verified": false,
        "verifiedAt": null,
        "requiredAt": "2026-01-08T10:00:00.000Z",
        "gracePeriodExpired": false
    },
    "sessionExpiresAt": "2026-01-01T10:10:00.000Z"
}
```

New users are allowed into the app immediately, but they receive an email verification link.
Unverified users can keep using the app until `emailVerification.requiredAt`. After that, login,
refresh, and protected API routes return:

```json
{
    "error": "Email verification required",
    "code": "EMAIL_VERIFICATION_REQUIRED"
}
```

Verification emails are sent through Resend. Verification tokens are stored hashed, expire after 24
hours by default, and can be used once.

Browser clients should send the cookie on protected requests:

```ts
fetch("https://api.call-center.dimgianno.com/calls", {
    credentials: "include"
});
```

Bearer tokens are still accepted as a temporary compatibility path for existing clients:

```http
Authorization: Bearer jwt-access-token
```

`POST /auth/refresh` requires a valid session cookie, extends the server-owned expiry, re-sets the cookie, and returns the safe user profile with `sessionExpiresAt`.

`POST /auth/logout` deletes the current server session when present and clears the cookie.

---

### Calls

All `/calls` endpoints require either a valid HttpOnly `session` cookie or, temporarily, a legacy JWT bearer token. Calls are scoped to the authenticated user.

| Method | Endpoint                   | Description                               |
| ------ | -------------------------- | ----------------------------------------- |
| GET    | `/calls`                   | Get calls with filtering and pagination   |
| GET    | `/calls/:callId`           | Get a single call with notes              |
| PATCH  | `/calls/:callId/archive`   | Archive a single call                     |
| PATCH  | `/calls/:callId/unarchive` | Unarchive a single call                   |
| PATCH  | `/calls/archive-all`       | Archive all active calls                  |
| PATCH  | `/calls/unarchive-all`     | Unarchive all archived calls              |
| POST   | `/calls/reset`             | Reset current user's calls to sample data |
| POST   | `/calls/:callId/notes`     | Add a note to a call                      |
| DELETE | `/calls/:callId`           | Delete a call                             |

---

### Realtime Call Events

The backend exposes an authenticated Server-Sent Events stream for same-account dashboard sync:

| Method | Endpoint        | Description                                     |
| ------ | --------------- | ----------------------------------------------- |
| GET    | `/events/calls` | Stream call-change invalidation events for user |

The stream requires the same authentication as protected API routes. Browser clients should connect
with credentials included so the HttpOnly `session` cookie is sent.

When a call mutation succeeds, the backend broadcasts a `calls:changed` event only to active SSE
connections for the same authenticated user. Failed mutations do not broadcast.

Event payload shape:

```json
{
    "version": 1,
    "action": "archive",
    "callId": "665f1f4e91a5b6a4d1c8b123"
}
```

`action` can be `archive`, `unarchive`, `delete`, `add_note`, `archive_all`, `unarchive_all`, or
`reset`. Bulk actions and reset may omit `callId`.

The current implementation stores SSE clients in memory, grouped by user ID. That is appropriate
while the backend runs as a single Render web service instance. If the service later scales to
multiple instances, the broadcaster should move to Redis pub/sub or another shared event bus.

---

### Users

All `/users` endpoints require either a valid HttpOnly `session` cookie or, temporarily, a legacy JWT bearer token.

| Method | Endpoint             | Description                                   |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/users/me/tutorial` | Get the current user's tutorial preference    |
| PATCH  | `/users/me/tutorial` | Update the current user's tutorial preference |

Tutorial preference responses return:

```json
{
    "version": 1,
    "hasSeenWelcome": false,
    "completedAt": null,
    "skippedAt": null,
    "completedTopics": []
}
```

`PATCH /users/me/tutorial` accepts partial updates for any tutorial field:

```json
{
    "hasSeenWelcome": true,
    "completedTopics": ["welcome"]
}
```

The current tutorial version is `1`. Date fields must be ISO date strings or `null`.

---

## Query Parameters for `GET /calls`

`GET /calls` supports filtering and pagination.

### Filtering

| Query Parameter | Accepted Values                   | Description                      |
| --------------- | --------------------------------- | -------------------------------- |
| `is_archived`   | `true`, `false`                   | Filters active or archived calls |
| `direction`     | `inbound`, `outbound`             | Filters by call direction        |
| `call_type`     | `answered`, `missed`, `voicemail` | Filters by call type             |

### Pagination

| Query Parameter | Default | Description                            |
| --------------- | ------- | -------------------------------------- |
| `page`          | `1`     | Page number                            |
| `limit`         | `10`    | Number of calls per page, maximum `50` |

### Example Requests

```http
GET /calls
Cookie: session=server-owned-session-token
```

```http
GET /calls?page=1&limit=10
GET /calls?is_archived=true
GET /calls?direction=inbound
GET /calls?call_type=missed
GET /calls?direction=inbound&call_type=answered&page=1&limit=5
```

### Example Response

```json
{
    "calls": [
        {
            "id": "665f1f4e91a5b6a4d1c8b123",
            "direction": "inbound",
            "from": "+33612345678",
            "to": "+33123456789",
            "call_type": "answered",
            "duration": 120,
            "is_archived": false,
            "created_at": "2025-04-10T14:32:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPreviousPage": false
    }
}
```

---

## Get a Single Call

### Request

```http
GET /calls/:callId
```

### Example Response

```json
{
    "id": "665f1f4e91a5b6a4d1c8b123",
    "direction": "inbound",
    "from": "+33612345678",
    "to": "+33123456789",
    "call_type": "answered",
    "duration": 120,
    "is_archived": false,
    "created_at": "2025-04-10T14:32:00.000Z",
    "notes": [
        {
            "id": "665f1f4e91a5b6a4d1c8b456",
            "content": "Customer asked about pricing plan"
        }
    ]
}
```

---

## Add a Note

### Request

```http
POST /calls/:callId/notes
```

### Body

```json
{
    "content": "Customer asked for a callback tomorrow"
}
```

### Response

Returns the updated call with its notes.

---

## Archive / Unarchive

### Archive one call

```http
PATCH /calls/:callId/archive
```

### Unarchive one call

```http
PATCH /calls/:callId/unarchive
```

### Archive all active calls

```http
PATCH /calls/archive-all
```

Example response:

```json
{
    "message": "All active calls archived successfully",
    "modifiedCount": 2
}
```

### Unarchive all archived calls

```http
PATCH /calls/unarchive-all
```

Example response:

```json
{
    "message": "All archived calls unarchived successfully",
    "modifiedCount": 3
}
```

---

## Reset Calls

### Request

```http
POST /calls/reset
```

This deletes the authenticated user's calls and restores sample call data for that user.

### Example Response

```json
{
    "message": "Calls reset successfully",
    "deletedCount": 4,
    "insertedCount": 150
}
```

---

## Delete a Call

### Request

```http
DELETE /calls/:callId
```

### Example Response

```json
{
    "message": "Call 665f1f4e91a5b6a4d1c8b123 deleted successfully"
}
```

---

## Error Handling

The API returns JSON error responses.

### Invalid MongoDB ObjectId

```json
{
    "error": "Invalid call ID format"
}
```

### Call Not Found

```json
{
    "error": "Call not found"
}
```

### Invalid Filter

```json
{
    "error": "Invalid direction filter. Expected 'inbound' or 'outbound'."
}
```

### Unknown Route

```json
{
    "error": "Route not found: PATCH /unknown-route"
}
```

### Unexpected Server Error

```json
{
    "error": "Internal server error"
}
```

---

## Testing

The project includes automated API tests using Jest, Supertest, and MongoMemoryServer.

The tests cover:

- user signup and login
- email verification token creation, verification, expiry, reuse rejection, and resend cooldown
- expired unverified account blocking for login, refresh, session auth, and bearer auth
- server-owned session cookies, expiry, refresh, and logout
- authenticated tutorial preference reads and updates
- JWT validation for protected routes
- user-owned call access
- GET /calls
- filtering and pagination
- GET /calls/:callId
- invalid MongoDB ID handling
- non-existent call handling
- archive/unarchive endpoints
- archive-all/unarchive-all endpoints
- reset calls endpoint
- adding notes
- deleting calls
- authenticated `/events/calls` SSE connections
- realtime call-change broadcasts after successful mutations
- no realtime broadcast after failed mutations
- validation error cases

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The test suite uses an in-memory MongoDB instance, so tests do not modify the development or staging database.

---

## API Documentation

The project includes interactive API documentation using Swagger/OpenAPI.

After starting the development server, open:

http://localhost:3000/api-docs

Staging API docs are available at:

https://api-staging.call-center.dimgianno.com/api-docs

Production API docs are available at:

https://api.call-center.dimgianno.com/api-docs

The Swagger page documents the main API endpoints, including:

- POST /auth/signup
- POST /auth/login
- GET /calls
- GET /calls/:callId
- PATCH /calls/:callId/archive
- PATCH /calls/:callId/unarchive
- PATCH /calls/archive-all
- PATCH /calls/unarchive-all
- POST /calls/reset
- POST /calls/:callId/notes
- DELETE /calls/:callId
- GET /users/me/tutorial
- PATCH /users/me/tutorial

---

## CI/CD

This project uses GitHub Actions for continuous integration and Render for continuous deployment.

## Continuous Integration

The CI workflow runs automatically on push and pull requests. It checks that the project can be installed, formatted, linted, type-checked, built, tested, and containerized successfully.

The workflow runs:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run build
npm test
docker build -t call-center-backend .
```

The project is currently tested in CI using Node.js 24.

A GitHub ruleset is also configured so the protected branch requires CI checks to pass before merging.

## Continuous Deployment

The backend API is deployed on Render as Web Services.

Staging URL: https://api-staging.call-center.dimgianno.com/

Production URL: https://api.call-center.dimgianno.com/

Render is connected to the GitHub repository and automatically redeploys each service when changes are pushed to the branch configured in Render.

Render uses the following commands:

```bash
npm ci --include=dev && npm run build
npm run start
```

The deployed service uses environment variables configured in Render, including:

```json
NODE_VERSION=24
NODE_ENV=<staging or production>
API_BASE_URL=<deployed backend URL>
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<JWT signing secret>
FRONTEND_ORIGINS=<comma-separated frontend origins>
SESSION_TTL_MINUTES=10
AUTH_DEBUG_LOGS=false
RESEND_API_KEY=<Resend API key>
EMAIL_FROM=<verified Resend sender>
NEW_SIGNUP_NOTIFICATION_EMAIL=<private recipient; production only>
FRONTEND_PUBLIC_URL=<deployed frontend URL>
EMAIL_VERIFICATION_GRACE_DAYS=7
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=1440
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

Production Render service:

```env
NODE_ENV=production
API_BASE_URL=https://api.call-center.dimgianno.com
FRONTEND_ORIGINS=https://call-center.dimgianno.com
FRONTEND_PUBLIC_URL=https://call-center.dimgianno.com
MONGODB_URI=<production MongoDB Atlas connection string>
NEW_SIGNUP_NOTIFICATION_EMAIL=<your personal email address>
```

Staging Render service:

```env
NODE_ENV=staging
API_BASE_URL=https://api-staging.call-center.dimgianno.com
FRONTEND_ORIGINS=https://call-center-staging.dimgianno.com
FRONTEND_PUBLIC_URL=https://call-center-staging.dimgianno.com
MONGODB_URI=<staging MongoDB Atlas connection string>
```

Production and staging must use separate `MONGODB_URI` values. The same codebase is deployed to both
Render services, so `API_BASE_URL`, `FRONTEND_ORIGINS`, and `FRONTEND_PUBLIC_URL` must be set per
service.

`NEW_SIGNUP_NOTIFICATION_EMAIL` enables a private notification for each successful signup. Set it
only on the production Render service; the backend ignores it in staging and development. The
recipient is stored in Render and is never exposed to the frontend.

In `staging` and `production`, session cookies are sent with `HttpOnly`, `Secure`, and `SameSite=None` so browsers can include them on cross-site frontend-to-backend requests.

The app also sets Express `trust proxy` for Render so secure cookie behavior is evaluated correctly
behind Render's HTTPS proxy.

`AUTH_DEBUG_LOGS=true` can be enabled temporarily in Render when diagnosing mobile/tablet cookie
issues. It logs safe auth diagnostics such as origin, user agent, whether a Cookie header exists,
whether the session cookie parsed, whether a session document was found, and whether Set-Cookie was
sent. It does not log raw cookies or session tokens.

The .env file is not committed to GitHub. Deployment environment variables are managed through Render's dashboard.

After deploying the email verification schema change, run this once on the target environment so
existing users receive a 7-day verification deadline:

```bash
npm run backfill:email-verification
```

The deployed API includes:

```http
GET /health
GET /api-docs
POST /auth/signup
POST /auth/login
GET /calls
```

---

## Docker

The project includes Docker support.

Files added:

Dockerfile
.dockerignore

The Docker image builds the TypeScript project and runs the compiled backend from dist.

To build the image locally:

```bash
docker build -t call-center-backend .
```

To run the container locally:

```bash
docker run --env-file .env -p 3000:3000 call-center-backend
```

The .env file is not copied into the Docker image. Environment variables such as MONGODB_URI and JWT_SECRET are passed at runtime.

Note: Running Docker locally requires Docker Desktop or another Docker-compatible runtime.

---

## Database Notes

MongoDB is the source of truth for the application.

Calls are stored as MongoDB documents. Notes are embedded inside each call document.

The API maps MongoDB `_id` fields to `id` in responses so clients do not need to work directly with MongoDB-specific field names.

---

## Known Limitations

If I had more time, I would improve the project by adding:

- Account-wide session revocation controls
- More complete request validation across all endpoints
- More advanced logging
- Rate limiting
- Separate production environment in addition to development and staging
- Search by phone number or note content
- Update/edit note functionality
- Delete note functionality

---

## Development Notes

- Empty filter results return `200 OK` with an empty `calls` array.
- Invalid filters return `400 Bad Request`.
- `GET /calls` returns only unarchived calls by default.
- Use `npm run seed` to reset and restore sample data.
- The `.env` file must never be committed to GitHub.
