-- group-dispatch relational schema (shared data for authenticated users)

create table if not exists public.accos (
  id text primary key,
  nom text not null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.enfants (
  id text primary key,
  nom text not null,
  age integer not null check (age >= 0),
  ratio_max integer not null check (ratio_max >= 1),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.groupes (
  id text primary key,
  nom text not null,
  age_min integer not null,
  age_max integer not null,
  responsable_id text null references public.accos(id) on delete set null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  constraint groupes_age_bounds check (age_min <= age_max)
);

create table if not exists public.groupes_accos (
  groupe_id text not null references public.groupes(id) on delete cascade,
  acco_id text not null references public.accos(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  primary key (groupe_id, acco_id),
  unique (acco_id)
);

create table if not exists public.groupes_enfants (
  groupe_id text not null references public.groupes(id) on delete cascade,
  enfant_id text not null references public.enfants(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  primary key (groupe_id, enfant_id),
  unique (enfant_id)
);

create table if not exists public.sousgroupes (
  id text primary key,
  groupe_id text not null references public.groupes(id) on delete cascade,
  acco_id text not null references public.accos(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (acco_id),
  unique (groupe_id, id),
  constraint sousgroupes_acco_in_group
    foreign key (groupe_id, acco_id)
    references public.groupes_accos(groupe_id, acco_id)
    on delete cascade
);

create table if not exists public.sousgroupes_enfants (
  sousgroupe_id text not null,
  groupe_id text not null,
  enfant_id text not null,
  position integer not null default 0 check (position >= 0),
  primary key (sousgroupe_id, enfant_id),
  unique (groupe_id, enfant_id),
  constraint sousgroupes_enfants_subgroup_fk
    foreign key (sousgroupe_id, groupe_id)
    references public.sousgroupes(id, groupe_id)
    on delete cascade,
  constraint sousgroupes_enfants_group_child_fk
    foreign key (groupe_id, enfant_id)
    references public.groupes_enfants(groupe_id, enfant_id)
    on delete cascade,
  constraint sousgroupes_enfants_child_fk
    foreign key (enfant_id)
    references public.enfants(id)
    on delete restrict
);

create table if not exists public.acco_specialites (
  acco_id text not null references public.accos(id) on delete cascade,
  specialite text not null,
  position integer not null default 0 check (position >= 0),
  primary key (acco_id, specialite),
  constraint acco_specialites_allowed
    check (specialite in ('TSA', 'TDAH', 'Moteur', 'Comportement', 'Sensoriel', 'Autre'))
);

create table if not exists public.enfants_incompat_enfants (
  enfant_id text not null references public.enfants(id) on delete cascade,
  incompatible_enfant_id text not null references public.enfants(id) on delete cascade,
  primary key (enfant_id, incompatible_enfant_id),
  constraint enfants_incompat_enfants_not_self check (enfant_id <> incompatible_enfant_id)
);

create table if not exists public.enfants_incompat_accos (
  enfant_id text not null references public.enfants(id) on delete cascade,
  acco_id text not null references public.accos(id) on delete cascade,
  primary key (enfant_id, acco_id)
);

create index if not exists idx_groupes_position on public.groupes(position);
create index if not exists idx_sousgroupes_group_position on public.sousgroupes(groupe_id, position);
create index if not exists idx_groupes_enfants_group_position on public.groupes_enfants(groupe_id, position);
create index if not exists idx_groupes_accos_group_position on public.groupes_accos(groupe_id, position);
create index if not exists idx_sousgroupes_enfants_group_position on public.sousgroupes_enfants(groupe_id, position);

alter table public.accos enable row level security;
alter table public.acco_specialites enable row level security;
alter table public.enfants enable row level security;
alter table public.enfants_incompat_enfants enable row level security;
alter table public.enfants_incompat_accos enable row level security;
alter table public.groupes enable row level security;
alter table public.groupes_accos enable row level security;
alter table public.groupes_enfants enable row level security;
alter table public.sousgroupes enable row level security;
alter table public.sousgroupes_enfants enable row level security;

drop policy if exists accos_authenticated_all on public.accos;
create policy accos_authenticated_all on public.accos
  for all to authenticated using (true) with check (true);

drop policy if exists acco_specialites_authenticated_all on public.acco_specialites;
create policy acco_specialites_authenticated_all on public.acco_specialites
  for all to authenticated using (true) with check (true);

drop policy if exists enfants_authenticated_all on public.enfants;
create policy enfants_authenticated_all on public.enfants
  for all to authenticated using (true) with check (true);

drop policy if exists enfants_incompat_enfants_authenticated_all on public.enfants_incompat_enfants;
create policy enfants_incompat_enfants_authenticated_all on public.enfants_incompat_enfants
  for all to authenticated using (true) with check (true);

drop policy if exists enfants_incompat_accos_authenticated_all on public.enfants_incompat_accos;
create policy enfants_incompat_accos_authenticated_all on public.enfants_incompat_accos
  for all to authenticated using (true) with check (true);

drop policy if exists groupes_authenticated_all on public.groupes;
create policy groupes_authenticated_all on public.groupes
  for all to authenticated using (true) with check (true);

drop policy if exists groupes_accos_authenticated_all on public.groupes_accos;
create policy groupes_accos_authenticated_all on public.groupes_accos
  for all to authenticated using (true) with check (true);

drop policy if exists groupes_enfants_authenticated_all on public.groupes_enfants;
create policy groupes_enfants_authenticated_all on public.groupes_enfants
  for all to authenticated using (true) with check (true);

drop policy if exists sousgroupes_authenticated_all on public.sousgroupes;
create policy sousgroupes_authenticated_all on public.sousgroupes
  for all to authenticated using (true) with check (true);

drop policy if exists sousgroupes_enfants_authenticated_all on public.sousgroupes_enfants;
create policy sousgroupes_enfants_authenticated_all on public.sousgroupes_enfants
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on
  public.accos,
  public.acco_specialites,
  public.enfants,
  public.enfants_incompat_enfants,
  public.enfants_incompat_accos,
  public.groupes,
  public.groupes_accos,
  public.groupes_enfants,
  public.sousgroupes,
  public.sousgroupes_enfants
to authenticated;
