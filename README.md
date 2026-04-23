# HimConnect

**HP Students → Mentors → Jobs**

A text-only community platform connecting Himachal Pradesh students with HP seniors for mentorship, referrals, and job opportunities.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express + Socket.io |
| Database | MongoDB (Mongoose) |
| Auth | JWT |
| Hosting | Vercel (client) + Render (server) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/himconnect.git
cd himconnect

# install server deps
cd server && npm install

# install client deps
cd ../client && npm install
```

### 2. Environment Variables

**server/.env**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/himconnect
JWT_SECRET=replace_with_long_random_string
CLIENT_URL=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the database

```bash
cd server
npm run seed
```

This creates **20 dummy users** (10 mentors, 10 students) + 10 posts + 3 jobs.  
All accounts password: `Test@1234`  
Sample login: `aditya@himconnect.dev` / `Test@1234`

### 4. Run locally

```bash
# terminal 1 — server
cd server && npm run dev

# terminal 2 — client
cd client && npm run dev
```

Open http://localhost:5173

---

## Deploy

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL)

### Frontend → Vercel

1. Import repo on [Vercel](https://vercel.com)
2. Root directory: `client`
3. Framework: **Vite**
4. Add environment variables: `VITE_API_URL` (your Render URL), `VITE_SOCKET_URL` (same)

---

## Features

| Feature | Status |
|---|---|
| Signup / Login (JWT) | ✅ |
| Onboarding (role + profile) | ✅ |
| HP Wins Feed (posts + likes) | ✅ |
| Mentor discovery + filter | ✅ |
| Jobs board + interest button | ✅ |
| Connect / Schedule meet | ✅ |
| District rooms (Socket.io) | ✅ |
| DMs (Socket.io) | ✅ |
| Notifications | ✅ |
| Trusted Mentor badge (4.5★ / 5+ sessions) | ✅ |
| Learn + Help streaks | ✅ |
| Founding Member badge (first 1000) | ✅ |
| Settings / Edit profile | ✅ |

---

## API Reference

```
POST   /auth/signup
POST   /auth/login

GET    /users/me
PUT    /users/me
GET    /users/:id
GET    /users?role=mentor&field=CSE&district=Shimla

POST   /posts
GET    /posts/feed?type=all&page=1
POST   /posts/:id/like

POST   /jobs
GET    /jobs?referral=true
POST   /jobs/:id/interested

POST   /connections
GET    /connections
PUT    /connections/:id

GET    /messages/rooms
GET    /messages/:roomId
POST   /messages/:roomId
GET    /messages/dm/:userId
POST   /messages/dm/:userId

GET    /notifications
PUT    /notifications/read-all

POST   /streaks/learn
POST   /streaks/help
```

---

## Project Structure

```
himconnect/
├── client/
│   ├── src/
│   │   ├── components/   # Navbar, PostCard, MentorCard, JobCard, modals
│   │   ├── context/      # AuthContext
│   │   ├── hooks/        # useSocket
│   │   ├── pages/        # All pages
│   │   └── utils/        # api.js (axios instance)
│   └── ...
└── server/
    ├── src/
    │   ├── models/       # User, Post, Job, Connection, Message, Notification
    │   ├── routes/       # All API routes
    │   ├── middleware/   # JWT auth
    │   ├── socket/       # Socket.io handlers
    │   └── seed/         # Seed script
    └── server.js
```

---

## Color Palette

| Token | Hex |
|---|---|
| Primary green | `#0D7C4D` |
| Accent orange | `#F97316` |
| Background | `#FFFFFF` |

---

Built with ❤️ for HP students everywhere.
