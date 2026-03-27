# Q&A Rooms

Live Q&A sessions similar to Mentimeter/Slido — submit and vote on questions in real time.

## Features

- **Admins** enter with `roomId` + password → JWT stored in `sessionStorage`
- **Guests** enter with `roomId` only — anonymous identity via `localStorage` UUID token
- **Real-time** via Socket.IO (WebSocket with polling fallback)
- Admins can **approve, reject, archive** questions
- Guests can **submit** questions and **vote once** per question (toggle)
- Multiple simultaneous admins per room
- Room title/description **editable live** by admin, broadcasts to all guests

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Prisma 5 — SQLite (dev) / PostgreSQL (prod) |
| Real-time | Socket.IO 4 via custom Node server |
| Auth | JWT + bcryptjs |
| Validation | Zod v4 |
| Deploy | Render |

## Local Development

```bash
# 1. Install
npm install

# 2. Push schema to SQLite dev db + generate Prisma client
npm run db:push
npm run db:generate

# 3. Start custom server (Next.js + Socket.IO)
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
├── prisma/schema.prisma          # DB schema (SQLite dev / PG prod)
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing: join or create room
│   │   ├── room/[roomId]/page.tsx       # Guest view
│   │   ├── room/[roomId]/admin/page.tsx # Admin panel
│   │   └── api/rooms/            # REST API routes
│   ├── components/               # React components
│   ├── lib/
│   │   ├── prisma.ts             # Singleton PrismaClient
│   │   ├── auth.ts               # JWT sign/verify
│   │   ├── socket-client.ts      # Singleton Socket.IO client
│   │   └── browser-token.ts      # Anonymous UUID per browser
│   └── types/index.ts            # Shared types + Socket event types
├── server.ts                     # Custom HTTP server with Socket.IO
├── tsconfig.server.json          # TS config for server compilation
└── render.yaml                   # Render deploy config
```

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/rooms` | — | Create room |
| GET | `/api/rooms/[roomId]` | — | Room info |
| POST | `/api/rooms/[roomId]/auth` | — | Admin login → JWT |
| PUT | `/api/rooms/[roomId]` | Bearer JWT | Update title/description |
| GET | `/api/rooms/[roomId]/questions` | Optional JWT | List Qs (guests: APPROVED; admins: all) |
| POST | `/api/rooms/[roomId]/questions` | — | Submit question |
| PATCH | `/api/rooms/[roomId]/questions/[id]` | Bearer JWT | Moderate |
| POST | `/api/rooms/[roomId]/questions/[id]/vote` | — | Toggle vote |

## Socket.IO Events

**Client → Server:** `room:join`, `question:submit`, `question:vote`, `question:moderate`, `room:update`

**Server → Client:** `question:new` (admins), `question:approved` (all), `question:rejected` (admins), `question:archived` (admins), `question:vote_update` (all), `room:updated` (all)

## Deploy to Render

1. Change `provider = "sqlite"` → `"postgresql"` in `prisma/schema.prisma`
2. Run `prisma migrate dev --name postgres-init`
3. Push to GitHub
4. In Render: **New → Blueprint** → select repo (uses `render.yaml`)

Render will provision Postgres, set `DATABASE_URL`, generate `JWT_SECRET`, and run the build + start commands automatically.

## Unique votes

Each browser gets a UUID in `localStorage` (`qa_browser_token`). The `Vote` table enforces `@@unique([questionId, voterToken])`. Voting twice toggles (removes) the vote.
