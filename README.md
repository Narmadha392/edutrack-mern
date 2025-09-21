# EduTrack (MERN)

A resume-ready MERN learning platform with essential features:

- Authentication (register/login with JWT)
- Course catalog with search
- Instructor course creation
- Enrollments and simple lesson progress tracking

This project is intentionally not over-engineered but follows clean structure and best practices you can talk about in interviews.

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt
- Frontend: React (Vite), React Router, Axios

## Project Structure

```
Edutrack2/
  server/
    src/
      index.js
      models/{User.js, Course.js, Enrollment.js}
      routes/{auth.js, courses.js, enrollments.js}
      middleware/auth.js
    package.json
    .env.example
  client/
    src/
      pages/{Login.jsx, Register.jsx, Dashboard.jsx, Courses.jsx, CourseDetail.jsx}
      services/api.js
      styles.css
      App.jsx
      main.jsx
    index.html
    vite.config.js
    package.json
    .env.example
```

## Getting Started

Prereqs:
- Node.js 18+
- MongoDB running locally (or Atlas connection string)

1. Backend setup

```
cd server
cp .env.example .env  # on Windows create .env with same content
npm install
npm run dev
```

2. Frontend setup (in another terminal)

```
cd client
cp .env.example .env
npm install
npm run dev
```

- Frontend runs on http://localhost:5173
- API runs on http://localhost:5000

## Seeding a Course Quickly

After registering a user, you can create an instructor by updating the role in DB or modify register payload to `{ role: 'instructor' }` temporarily.

Create a course via HTTP:
```
POST http://localhost:5000/api/courses
Authorization: Bearer <your token>
Body:
{
  "title": "JavaScript Basics",
  "description": "Learn JS fundamentals",
  "tags": ["javascript", "beginner"],
  "lessons": [
    { "title": "Intro", "content": "What is JS?" },
    { "title": "Variables", "content": "let/const" }
  ]
}
```

## Talking Points for Resume/Interviews

- JWT auth middleware (`server/src/middleware/auth.js`).
- Mongoose models with relations and unique composite index for enrollments.
- RESTful API structure with role-based access control for course creation.
- React app with protected routes and Axios interceptor for tokens.
- Clean, modern dark UI with minimal CSS.

## Production Notes (Future Work)

- Add pagination and sorting to courses.
- File uploads for course assets.
- Admin dashboard and analytics.
- Unit tests (Jest) and E2E (Playwright/Cypress).
