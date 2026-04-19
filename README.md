# Koru

Minimalist full-stack CRM built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and secure JWT auth with HTTP-only cookies.

It includes:

- Sign up, sign in, logout, protected dashboard routes
- Role system: `ADMIN`, `MANAGER`
- Dashboard metrics, activity feed, analytics
- Clients, leads, deals, notes, tasks, follow-ups
- End-to-end promo code validation and usage tracking
- Search, filters, sorting, pagination
- Admin user management
- Seeded demo data and credentials
- Vercel-friendly build and Prisma setup

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- PostgreSQL
- Zod validation
- Custom JWT auth with secure cookies
- Sonner toast notifications
- Radix UI primitives

## Demo credentials

- Admin: `admin@korucrm.dev` / `Admin@12345`
- Manager: `manager@korucrm.dev` / `Manager@12345`

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required app variables:

- `DATABASE_URL`
- `CHAT_DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_NAME`
- `APP_ORIGIN`
- `COOKIE_SECURE`

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/koru_crm?schema=public"
CHAT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/koru_chat?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
NEXT_PUBLIC_APP_NAME="Koru"
APP_ORIGIN="http://localhost:3000"
COOKIE_SECURE="false"
```

Optional Docker Compose overrides:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
APP_DB_NAME=koru_crm
CHAT_DB_NAME=koru_chat
```

`docker compose` reads the root `.env` automatically. Inside containers, Compose overrides `DATABASE_URL` and `CHAT_DATABASE_URL` to use the `postgres` service instead of `localhost`.

Runtime notes:

- `APP_ORIGIN` is the public frontend URL used for generated links such as invite URLs
- set `COOKIE_SECURE="false"` for plain HTTP on localhost or LAN
- set `COOKIE_SECURE="true"` when the app is served over HTTPS

## Docker setup

Services exposed by Docker Compose:

- `frontend` on `http://localhost:3000`
- `backend` on `http://localhost:4000`
- PostgreSQL on `localhost:5432`

### Start the stack

Before the first run, make sure Docker Desktop or another Docker daemon is running.

```bash
cp .env.example .env
docker compose up --build -d
```

Or use the npm alias to run Compose in the foreground:

```bash
npm run docker:up
```

After startup:

- open `http://localhost:3000`
- backend health endpoint is available at `http://localhost:4000/api`
- PostgreSQL data is stored in the `postgres_data` Docker volume

### What happens automatically

- PostgreSQL creates two databases: `koru_crm` and `koru_chat`
- the backend runs `prisma migrate deploy`
- the backend syncs the chat schema with `prisma db push`
- the frontend starts only after the backend healthcheck passes

### Seed demo data

Run this after the containers are up:

```bash
npm run docker:seed
```

Equivalent raw command:

```bash
docker compose run --rm backend npm run db:seed
```

### Useful Docker commands

```bash
npm run docker:logs
npm run docker:down
docker compose down -v
```

Use `docker compose down -v` when you need a clean PostgreSQL volume, for example after changing `POSTGRES_*`, `APP_DB_NAME`, or `CHAT_DB_NAME`.

### Run from another device

If you want to open the same running instance from another laptop or phone on your local network:

1. Find the IP address of the machine that runs Docker.
2. Set `APP_ORIGIN` in `.env`, for example `APP_ORIGIN="http://192.168.1.50:3000"`.
3. Set `COOKIE_SECURE="false"` if you are using plain HTTP.
4. Restart the stack:

```bash
docker compose up --build -d
```

Then open `http://<host-ip>:3000` from the other device.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Run the first migration:

```bash
npm run prisma:migrate
```

4. Sync the chat schema:

```bash
npm run prisma:push:chat
```

5. Seed demo data:

```bash
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

App URL:

- `http://localhost:3000`

## Production build check

```bash
npm run lint
npm run build
```

## Prisma commands

Generate client:

```bash
npm run prisma:generate
```

Create/apply local migration:

```bash
npm run prisma:migrate
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

Seed data:

```bash
npm run db:seed
```

## Promo code flow

1. A user enters a promo code in the deal form.
2. The frontend calls `POST /api/promo-codes/validate`.
3. The server checks:
   - code exists
   - code is active
   - code is not expired
   - usage limit has not been reached
4. The server calculates discount and final amount.
5. On deal save, the server action validates again and writes:
   - `Deal`
   - `PromoCodeUsage`
   - promo `usedCount`
   - activity log entry
6. Existing promo usage is adjusted correctly when a deal is edited.

Promo validation logic lives on the server only. The client never decides whether a code is valid.

## Project structure

```text
.
├── backend
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   ├── chat-schema.prisma
│   │   └── seed.ts
│   └── src
├── frontend
│   ├── src
│   │   ├── actions
│   │   ├── app
│   │   ├── components
│   │   └── lib
│   ├── middleware.ts
│   └── next.config.ts
├── docker
│   ├── backend
│   │   └── start.sh
│   └── postgres
│       └── init
│           └── 01-create-databases.sh
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## Push to GitHub

Create a new repository, then run:

```bash
git init
git add .
git commit -m "Initial CRM system"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

If the repo already exists, use your normal remote and branch flow.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add environment variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_NAME`
4. Use a PostgreSQL database compatible with Prisma.
5. Run migrations against production:

```bash
npx prisma migrate deploy
```

6. Optionally seed demo data in the target database:

```bash
npm run db:seed
```

7. Deploy.

Notes:

- Dashboard routes are forced dynamic so build-time does not try to query the database.
- Prisma uses a singleton client in development to avoid hot-reload connection churn.
- The build script already runs `prisma generate`.

## Main screens

- Landing page
- Login
- Registration
- Dashboard
- Clients list
- Client detail
- Leads list
- Deals list
- Promo codes
- Analytics
- Settings

## Roles

- `ADMIN`
  - manage users
  - create/edit/disable promo codes
  - full dashboard access
- `MANAGER`
  - manage CRM records
  - view promo code data
  - cannot manage users or promo code administration
