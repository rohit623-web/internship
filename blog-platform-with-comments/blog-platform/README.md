# BlogSpace — Blog Platform with Comments

A full-stack blogging platform where users can register, log in, write posts, and comment on each other's posts.

## Features

- 🔐 User registration & login with JWT authentication (passwords hashed with bcrypt)
- ✍️ Create, edit, and delete your own blog posts
- 💬 Comment on any post; delete your own comments
- 🔌 RESTful API backend (Express) with a SQLite database (no external DB server needed)
- 🎨 Lightweight vanilla-JS single-page frontend included, served by the same backend

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** SQLite (via `better-sqlite3`) — file-based, zero setup
- **Auth:** JSON Web Tokens (JWT) + bcryptjs for password hashing
- **Frontend:** HTML/CSS/vanilla JavaScript (hash-based router, no build step)

## Project Structure

```
blog-platform/
├── server.js              # App entry point
├── db/database.js         # SQLite connection + schema
├── middleware/auth.js      # JWT verification middleware
├── routes/
│   ├── auth.js             # /api/auth/register, /api/auth/login
│   ├── posts.js            # /api/posts CRUD
│   └── comments.js         # /api/posts/:postId/comments CRUD
├── public/                 # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example
└── package.json
```

## Setup

1. **Install dependencies** (requires Node.js 18+):
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and set `JWT_SECRET` to a long random string.

3. **Run the server:**
   ```bash
   npm start
   ```
   Or for auto-reload during development:
   ```bash
   npm run dev
   ```

4. **Open the app:** visit `http://localhost:5000` in your browser. The SQLite database file (`db/blog.sqlite`) is created automatically on first run.

## API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint           | Body                              | Auth |
|--------|---------------------|------------------------------------|------|
| POST   | `/auth/register`    | `{ username, email, password }`    | No   |
| POST   | `/auth/login`       | `{ email, password }`              | No   |

Both return `{ token, user }` on success. Send the token in subsequent requests as:
```
Authorization: Bearer <token>
```

### Posts
| Method | Endpoint        | Body                     | Auth        |
|--------|------------------|---------------------------|-------------|
| GET    | `/posts`         | —                         | No          |
| GET    | `/posts/:id`     | —                         | No          |
| POST   | `/posts`         | `{ title, content }`     | Yes         |
| PUT    | `/posts/:id`     | `{ title, content }`     | Yes (owner) |
| DELETE | `/posts/:id`     | —                         | Yes (owner) |

### Comments
| Method | Endpoint                              | Body          | Auth        |
|--------|-----------------------------------------|---------------|-------------|
| GET    | `/posts/:postId/comments`               | —             | No          |
| POST   | `/posts/:postId/comments`               | `{ content }` | Yes         |
| DELETE | `/posts/:postId/comments/:commentId`    | —             | Yes (owner) |

## Notes & Possible Extensions

- The included frontend is intentionally simple (no build tools) so it runs by just opening the server — swap it for React/Vue if you prefer.
- To switch from SQLite to PostgreSQL/MySQL/MongoDB, only `db/database.js` and the `db.prepare(...)` calls in the route files need to change — the route/API contract stays the same.
- Ideas for extending: pagination, post tags/categories, likes, image uploads, password reset via email, rate limiting, refresh tokens.

## License

MIT — free to use and modify for your own projects.
