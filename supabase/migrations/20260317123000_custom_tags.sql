-- Add free-text tags for children and aides

alter table public.acco_specialites
  drop constraint if exists acco_specialites_allowed;

create table if not exists public.enfants_tags (
  enfant_id text not null references public.enfants(id) on delete cascade,
  tag text not null,
  position integer not null default 0 check (position >= 0),
  primary key (enfant_id, tag)
);

create index if not exists idx_enfants_tags_enfant_position
  on public.enfants_tags(enfant_id, position);

alter table public.enfants_tags enable row level security;

drop policy if exists enfants_tags_authenticated_all on public.enfants_tags;
create policy enfants_tags_authenticated_all on public.enfants_tags
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.enfants_tags to authenticated;
