# Financial MLM Backend

Production-ready Node.js + Express backend (MVC, MongoDB/Mongoose, ES modules).

## Structure

```
backend/
├── config/          # Environment & DB config
├── controllers/      # Request handlers (MVC)
├── jobs/            # Scheduled/cron jobs
├── middleware/      # Express middleware (e.g. error handling)
├── models/          # Mongoose models
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Shared utilities
├── app.js           # Express app setup
├── server.js        # Entry point (DB connect + start server)
└── .env.example     # Env template
```

## Setup

1. Copy `.env.example` to `.env` and set `MONGO_URI`, `PORT`, `NODE_ENV`.
2. `npm install`
3. `npm run dev` (development) or `npm start` (production)

## Scripts

- `npm start` — Run server (production)
- `npm run dev` — Run with nodemon
