# Koru CRM

Full-stack CRM system built with **Next.js 16 App Router**, **NestJS**, **TypeScript**, **Tailwind CSS 4**, **Prisma**, **PostgreSQL**, and secure JWT auth with HTTP-only cookies.

## Features

- Sign up, sign in, logout, protected dashboard routes
- Role system: `ADMIN`, `MANAGER`
- Team invites (link or nickname) and workspace joining
- Dashboard metrics, activity feed, analytics
- Clients, leads, deals, notes, tasks, meetings
- Real-time chat with direct messages, group chats, polls, reactions, forwarding, pinning
- Record comments with `@mention` support and notifications
- End-to-end promo code validation and usage tracking
- In-app notifications with SSE push
- Search, filters, sorting, pagination
- Admin user management
- Multi-language support (EN, UK, PL, DE, FR)
- Seeded demo data and credentials

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend API | NestJS 11 (standalone REST API) |
| ORM | Prisma 6 (3 schemas: main, chat, auth) |
| Database | PostgreSQL |
| Auth | Custom JWT (jose) + HTTP-only cookies |
| Validation | class-validator / class-transformer (backend), Zod (env) |
| UI | Radix UI primitives, Lucide icons, Sonner toasts |
| Language | TypeScript 5 |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@korucrm.dev` | `Admin@12345` |
| Manager | `manager@korucrm.dev` | `Manager@12345` |

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Main PostgreSQL connection string |
| `CHAT_DATABASE_URL` | Chat database connection string |
| `AUTH_DATABASE_URL` | Auth database connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 16 chars) |
| `NEXT_PUBLIC_APP_NAME` | App display name (default: `Koru`) |
| `APP_ORIGIN` | Public frontend URL for generated links (invite URLs, etc.) |
| `COOKIE_SECURE` | `"false"` for HTTP, `"true"` for HTTPS |

Example `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/koru_crm?schema=public"
CHAT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/koru_chat?schema=public"
AUTH_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/koru_auth?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
NEXT_PUBLIC_APP_NAME="Koru"
APP_ORIGIN="http://localhost:3000"
COOKIE_SECURE="false"
```

## Local Setup

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ with three databases: `koru_crm`, `koru_chat`, `koru_auth`

### Steps

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Create local PostgreSQL databases:

```bash
createdb koru_crm
createdb koru_chat
createdb koru_auth
```

4. Generate Prisma clients:

```bash
npm run prisma:generate
```

5. Run the main database migration:

```bash
npm run prisma:migrate
```

6. Sync the chat schema:

```bash
npm run prisma:push:chat
```

7. Sync the auth schema:

```bash
npm run prisma:push:auth
```

8. Seed demo data:

```bash
npm run db:seed
```

9. Start frontend and backend together:

```bash
# Frontend (Next.js) — http://localhost:3000
# Backend (NestJS) — http://localhost:4000
npm run dev
```

For a production build, use `npm run build` followed by `npm start`; it starts both services together as well.

The frontend runs Next.js server actions that call backend services directly. The NestJS backend provides a standalone REST API on port 4000 with the `/api` prefix.

## REST API Endpoints

All endpoints use the `/api` prefix. Protected endpoints require a valid session cookie or `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/logout` | ✅ | Sign out |
| GET | `/api/auth/me` | ✅ | Get current user |

### Clients

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/clients` | ✅ | Create client |
| PATCH | `/api/clients/:id` | ✅ | Update client |
| POST | `/api/clients/notes` | ✅ | Add note to a record |

### Leads

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/leads` | ✅ | Create lead |
| PATCH | `/api/leads/:id` | ✅ | Update lead |

### Deals

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/deals` | ✅ | Create deal |
| PATCH | `/api/deals/:id` | ✅ | Update deal |

### Tasks

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tasks` | ✅ | List tasks (paginated, filterable) |
| GET | `/api/tasks/:id` | ✅ | Get task details |
| POST | `/api/tasks` | ✅ | Create task |
| PATCH | `/api/tasks/:id` | ✅ | Update task |
| PATCH | `/api/tasks/:id/status` | ✅ | Quick status change |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |

### Meetings

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/meetings` | ✅ | Create meeting |
| PATCH | `/api/meetings/:id` | ✅ | Update meeting |
| PATCH | `/api/meetings/:id/status` | ✅ | Update meeting status |
| DELETE | `/api/meetings/:id` | ✅ | Delete meeting |

### Comments

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/comments` | ✅ | Create/update comment on a task or meeting |

### Users

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/users` | ✅ | Create user (admin/manager) |
| POST | `/api/users/invite` | ✅ | Generate team invite token |
| POST | `/api/users/join-team` | ✅ | Join a team via invite or nickname |
| PATCH | `/api/users/settings/profile` | ✅ | Update own profile |
| PATCH | `/api/users/settings/chat-appearance` | ✅ | Update chat appearance |
| PATCH | `/api/users/:id` | ✅ | Update a user |

### Promo Codes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/promo-codes` | Admin | Create promo code |
| PATCH | `/api/promo-codes/:id` | Admin | Update promo code |
| POST | `/api/promo-codes/validate` | ✅ | Validate a promo code against an amount |

### Chat

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/chat/conversations` | ✅ | Create direct or group conversation |
| POST | `/api/chat/messages` | ✅ | Send message (text, media, poll) |
| PATCH | `/api/chat/messages/:id` | ✅ | Edit own message |
| DELETE | `/api/chat/messages/:id` | ✅ | Delete own message |
| POST | `/api/chat/conversations/:id/mute` | ✅ | Mute/unmute conversation |
| POST | `/api/chat/conversations/:id/pin` | ✅ | Pin/unpin a message |
| POST | `/api/chat/messages/:id/forward` | ✅ | Forward message to another conversation |
| POST | `/api/chat/messages/polls/:pollId/vote` | ✅ | Vote on a poll |

## Prisma Commands

```bash
# Generate all Prisma clients
npm run prisma:generate

# Create/apply migration (main schema)
npm run prisma:migrate

# Push chat schema changes
npm run prisma:push:chat

# Push auth schema changes
npm run prisma:push:auth

# Open Prisma Studio
npm run prisma:studio

# Seed demo data
npm run db:seed
```

## Production Build

```bash
npm run lint
npm run build
```

## Promo Code Flow

1. User enters a promo code in the deal form.
2. The frontend calls `POST /api/promo-codes/validate`.
3. The server validates: code exists, is active, not expired, within usage limit.
4. The server calculates discount and returns the final amount.
5. On deal save, the server validates again and atomically writes `Deal`, `PromoCodeUsage`, increments `usedCount`, and logs the activity.
6. Existing promo usage is adjusted correctly when a deal is edited.

Promo validation logic lives on the server only.

## Project Structure

```text
.
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma          # Main CRM schema
│   │   ├── chat-schema.prisma     # Chat schema
│   │   ├── auth/
│   │   │   └── schema.prisma      # Auth schema
│   │   └── seed.ts
│   ├── prisma.config.ts
│   └── src/
│       ├── main.ts                # NestJS bootstrap
│       ├── app.module.ts
│       ├── config/
│       ├── common/
│       │   ├── auth/              # JWT, guards, decorators
│       │   ├── database/          # Prisma services (main, chat, auth)
│       │   ├── scope/             # Role-based access helpers
│       │   ├── activity/          # Activity logging
│       │   ├── i18n/              # Translations
│       │   ├── nest/              # Frontend adapter (app-context)
│       │   ├── next/              # Next.js session & middleware
│       │   └── validation/        # DTO validation
│       └── modules/
│           ├── auth/
│           ├── chat/
│           ├── clients/
│           ├── comments/
│           ├── deals/
│           ├── leads/
│           ├── meetings/
│           ├── promo-codes/
│           ├── tasks/
│           └── users/
├── frontend/
│   ├── src/
│   │   ├── actions/               # Next.js server actions
│   │   ├── app/                   # App Router pages
│   │   ├── components/
│   │   └── lib/
│   ├── middleware.ts
│   └── next.config.ts
├── scripts/
├── package.json
└── README.md
```

## Screens

- Landing page
- Login / Registration
- Dashboard (metrics, activity feed)
- Clients list & detail
- Leads list
- Deals list
- Tasks list & detail
- Meetings
- Chat (direct & group)
- Promo codes
- Analytics
- Settings (profile, chat appearance, team management)

## Roles

| Role | Capabilities |
|------|-------------|
| `ADMIN` | Full access: manage users, promo codes, all CRM records |
| `MANAGER` | Manage CRM records within their team scope, view promo code data |

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add environment variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `CHAT_DATABASE_URL`
   - `AUTH_DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_NAME`
4. Use a PostgreSQL database compatible with Prisma.
5. Run migrations against production:

```bash
npx prisma migrate deploy
```

6. Optionally seed demo data:

```bash
npm run db:seed
```

Notes:

- Dashboard routes are forced dynamic so build-time does not query the database.
- Prisma uses a singleton client in development to avoid hot-reload connection churn.
- The build script already runs `prisma generate`.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial CRM system"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
