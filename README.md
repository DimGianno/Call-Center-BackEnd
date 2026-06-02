# Call Center Backend API

A backend API for a call center application built with **Node.js**, **Express**, **TypeScript**, **MongoDB Atlas**, and **Mongoose**.

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

### Bonus / Extended Features

- Unarchive a call
- Archive all active calls
- Unarchive all archived calls
- Add notes to a call
- Delete a call
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

---

## Project Structure

```txt
src/
  app.ts
  index.ts

  config/
    db.ts

  controllers/
    callControllers.ts

  db/
    models/
      callDbModel.ts
    seed.ts

  mappers/
    callMapper.ts

  middleware/
    errorHandler.ts
    notFoundHandler.ts
    requestLogger.ts

  models/
    callModel.ts
    serviceTypes.ts

  routes/
    callRoutes.ts

  services/
    callService.ts

  utils/
    validators.ts

  __tests__/
    calls.tests.ts
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

| Script               | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Starts the development server               |
| `npm run build`      | Compiles TypeScript into JavaScript         |
| `npm run start`      | Runs the compiled app from `dist`           |
| `npm run seed`       | Seeds MongoDB with sample call data         |
| `npm test`           | Runs the Jest/SuperTest API test suite      |
| `npm run test:watch` | Runs tests in watch mode during development |

---

## API Endpoints

### General

| Method | Endpoint  | Description                                 |
| ------ | --------- | ------------------------------------------- |
| GET    | `/`       | Root endpoint confirming the API is running |
| GET    | `/health` | Health check endpoint                       |

---

### Calls

| Method | Endpoint                   | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| GET    | `/calls`                   | Get calls with filtering and pagination |
| GET    | `/calls/:callId`           | Get a single call with notes            |
| PATCH  | `/calls/:callId/archive`   | Archive a single call                   |
| PATCH  | `/calls/:callId/unarchive` | Unarchive a single call                 |
| PATCH  | `/calls/archive-all`       | Archive all active calls                |
| PATCH  | `/calls/unarchive-all`     | Unarchive all archived calls            |
| POST   | `/calls/:callId/notes`     | Add a note to a call                    |
| DELETE | `/calls/:callId`           | Delete a call                           |

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

- GET /calls
- filtering and pagination
- GET /calls/:callId
- invalid MongoDB ID handling
- non-existent call handling
- archive/unarchive endpoints
- archive-all/unarchive-all endpoints
- adding notes
- deleting calls
- validation error cases

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The test suite uses an in-memory MongoDB instance, so tests do not modify the development or production database.

---

## CI/CD

This project uses GitHub Actions for continuous integration.

The CI workflow runs automatically on push and pull requests. It checks that the project can be installed, built, and tested successfully.

The workflow runs:

```bash
npm ci
npm run build
npm test
```

The project is currently tested in CI using Node.js 24.

---

## Database Notes

MongoDB is the source of truth for the application.

Calls are stored as MongoDB documents. Notes are embedded inside each call document.

The API maps MongoDB `_id` fields to `id` in responses so clients do not need to work directly with MongoDB-specific field names.

---

## Known Limitations

If I had more time, I would improve the project by adding:

- Authentication and authorization
- Better request validation using a library such as Zod or Joi
- More advanced logging
- Rate limiting
- API documentation with Swagger/OpenAPI
- Deployment configuration
- Separate environments for development and production
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
