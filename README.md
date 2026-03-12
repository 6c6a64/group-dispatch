# Group Dispatch

`Group Dispatch` is a constraint-based assignment app for children and aides.
It helps place children into groups and subgroups while respecting strict compatibility rules.

## What It Does

- Manages children, aides, groups, and subgroups
- Validates assignment constraints in real time
- Shows conflict diagnostics before/after moves
- Supports automatic assignment with preview
- Persists shared data with login (Supabase)

## Core Constraints

- Age-range matching by group
- Child-child incompatibilities
- Child-aide incompatibilities
- Subgroup ratio limits
- One aide per subgroup

## Tech Stack

- React (CRA)
- Supabase (Auth + Postgres + RLS)
- Vercel (deployment)

## Prerequisites

- Node 20+
- npm 10+

## Run Locally

```bash
npm install
npm start
```

If Supabase env vars are missing, the app runs in local in-memory mode.

## Supabase Setup (Persistence + Login)

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/migrations/20260312180000_group_dispatch_schema.sql`.
3. Optional: run `supabase/seed_demo.sql` to load demo data.
4. Enable Email/Password in `Authentication > Providers`.
5. Create local env vars:

```bash
cp .env.example .env.local
```

Add:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY`

## Deploy (Vercel)

1. Import the project in Vercel.
2. Add the same `REACT_APP_*` env vars in Vercel.
3. Deploy.
