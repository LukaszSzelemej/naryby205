alter table push_subs add column if not exists tarlo boolean not null default true;
alter table push_subs add column if not exists hydro boolean not null default false;

create table if not exists hydro_snap (
  kod text primary key,
  cm integer not null,
  at timestamptz not null default now()
);
