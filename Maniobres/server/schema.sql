-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Dedicated Maniobres project. Tables are accessible only to the validating Edge Function.
create table public.maniobres_rooms (
 code text primary key, owner_hash text not null, puzzle text not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 days'
);
create table public.maniobres_scores (
 id bigint generated always as identity primary key, actor_hash text not null, name text not null,
 day date not null, room text not null default '', puzzle text not null,
 moves integer not null check(moves between 1 and 500), points integer not null check(points between 10 and 100),
 seconds integer not null check(seconds between 0 and 86400), log jsonb not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 days',
 unique(actor_hash,day,room)
);
create index maniobres_scores_board on public.maniobres_scores(room,day);
create index maniobres_scores_expiry on public.maniobres_scores(expires_at);
create index maniobres_rooms_owner on public.maniobres_rooms(owner_hash);
create table public.maniobres_limits(bucket text primary key, count integer not null, expires_at timestamptz not null);
alter table public.maniobres_rooms enable row level security;
alter table public.maniobres_scores enable row level security;
alter table public.maniobres_limits enable row level security;
revoke all on public.maniobres_rooms,public.maniobres_scores,public.maniobres_limits from anon,authenticated;
grant all on public.maniobres_rooms,public.maniobres_scores,public.maniobres_limits to service_role;
grant usage,select on sequence public.maniobres_scores_id_seq to service_role;
create function public.maniobres_rate(p_bucket text,p_limit integer) returns boolean language sql security invoker set search_path='' as $$
 with bumped as (insert into public.maniobres_limits(bucket,count,expires_at) values(p_bucket,1,now()+interval '2 minutes') on conflict(bucket) do update set count=public.maniobres_limits.count+1 returning count) select count<=p_limit from bumped;
$$;
revoke all on function public.maniobres_rate(text,integer) from public,anon,authenticated;
grant execute on function public.maniobres_rate(text,integer) to service_role;
create function public.maniobres_save(p_actor text,p_name text,p_day date,p_room text,p_puzzle text,p_moves integer,p_points integer,p_seconds integer,p_log jsonb) returns void language sql security invoker set search_path='' as $$
 insert into public.maniobres_scores(actor_hash,name,day,room,puzzle,moves,points,seconds,log)
 values(p_actor,p_name,p_day,p_room,p_puzzle,p_moves,p_points,p_seconds,p_log)
 on conflict(actor_hash,day,room) do update set moves=excluded.moves,points=excluded.points,seconds=excluded.seconds,log=excluded.log where excluded.moves<public.maniobres_scores.moves;
$$;
revoke all on function public.maniobres_save(text,text,date,text,text,integer,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.maniobres_save(text,text,date,text,text,integer,integer,integer,jsonb) to service_role;
create extension if not exists pg_cron;
select cron.schedule('maniobres-expiry','15 3 * * *',$$delete from public.maniobres_scores where expires_at<=now(); delete from public.maniobres_scores where room<>'' and room in(select code from public.maniobres_rooms where expires_at<=now()); delete from public.maniobres_rooms where expires_at<=now(); delete from public.maniobres_limits where expires_at<=now(); delete from cron.job_run_details where end_time<now()-interval '7 days';$$);
