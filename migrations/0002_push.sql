create table if not exists push_subs (
  endpoint text primary key,
  p256dh text,
  auth text,
  updated_at timestamptz not null default now()
);
