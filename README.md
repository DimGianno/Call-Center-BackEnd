# Call Center Backend

A simple backend logic project for managing call center calls and notes.

This project was built for a backend learning assignment. It focuses on in-memory data, service logic, validation, TypeScript, and clean project structure. There is no API, web server, or database yet.

## Tech Stack

- Node.js
- TypeScript
- ESLint
- Prettier
- In-memory data

## Features

- Get all active calls
- Get a single call with its notes
- Archive and unarchive calls
- Add notes to calls
- Delete calls and their related notes
- Filter calls by direction, call type, or archived status
- Validate call data
- Handle invalid input and missing calls

## Project Structure

```txt
src/
├── data/
├── models/
├── repositories/
├── services/
├── utils/
└── index.ts
```

## Setup

Install dependencies:

```bash
npm install
```

## Run the Project

Build the TypeScript files:

```bash
npm run build
```

Run the compiled project:

```bash
npm run start
```

Or build and run in one command:

```bash
npm run dev
```

## Checks

Run TypeScript type checking:

```bash
npm run typecheck
```

Run ESLint:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

Format the project:

```bash
npm run format
```

## Testing Notes

This project does not use a testing framework yet.

For now, the service functions are tested manually from:

```txt
src/index.ts
```

The `index.ts` file includes examples with valid input and bad input, so the program demonstrates both successful operations and error handling in the terminal.

## Notes

The project uses in-memory data. Any changes made while the program runs are reset when the program restarts.

No screenshots or demo are included because this project does not have a user interface.