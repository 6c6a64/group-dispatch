create table if not exists public.group_layout_snapshots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text generated always as (lower(btrim(name))) stored,
  groups_state jsonb not null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_layout_snapshots_name_not_blank check (btrim(name) <> "")
);

create unique index if not exists idx_group_layout_snapshots_name_normalized
  on public.group_layout_snapshots(name_normalized);

alter table public.group_layout_snapshots enable row level security;

drop policy if exists group_layout_snapshots_authenticated_all on public.group_layout_snapshots;
create policy group_layout_snapshots_authenticated_all on public.group_layout_snapshots
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.group_layout_snapshots to authenticated;
