# Nexora CRM

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

- Admin: `admin@nexoracrm.dev` / `Admin@12345`
- Manager: `manager@nexoracrm.dev` / `Manager@12345`

## Environment variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_NAME`

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexora_crm?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
NEXT_PUBLIC_APP_NAME="Nexora CRM"
```

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

4. Seed demo data:

```bash
npm run db:seed
```

5. Start the app:

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
├── .env.example
├── eslint.config.mjs
├── middleware.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma
│   ├── migrations
│   │   └── 0001_init
│   │       └── migration.sql
│   ├── schema.prisma
│   └── seed.ts
├── prisma.config.ts
├── src
│   ├── actions
│   ├── app
│   │   ├── (app)
│   │   │   └── dashboard
│   │   ├── api
│   │   ├── login
│   │   ├── register
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── auth
│   │   ├── form
│   │   ├── forms
│   │   ├── layout
│   │   └── ui
│   └── lib
└── tsconfig.json
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
