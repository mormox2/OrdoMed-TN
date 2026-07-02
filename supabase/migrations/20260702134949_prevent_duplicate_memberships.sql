-- A React auth transition can initialize the same account more than once in
-- parallel. Keep exactly one clinic membership per authenticated account and
-- serialize doctor bootstrapping for that account.
with ranked_memberships as (
  select
    m.clinic_id,
    row_number() over (
      partition by m.user_id
      order by c.created_at, c.id
    ) as membership_rank
  from public.clinic_memberships m
  join public.clinics c on c.id = m.clinic_id
), disposable_duplicate_clinics as (
  select r.clinic_id
  from ranked_memberships r
  where r.membership_rank > 1
    and (select count(*) from public.clinic_memberships m where m.clinic_id = r.clinic_id) = 1
    and not exists (select 1 from public.patients p where p.clinic_id = r.clinic_id)
    and not exists (select 1 from public.prescriptions p where p.clinic_id = r.clinic_id)
)
delete from public.clinics c
using disposable_duplicate_clinics d
where c.id = d.clinic_id;

alter table public.clinic_memberships
  add constraint clinic_memberships_user_id_key unique (user_id);

create or replace function private.bootstrap_doctor()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  cid uuid;
begin
  if account_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- Transaction-scoped and account-specific: concurrent callbacks wait here.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(account_id::text, 0)
  );

  select clinic_id
    into cid
    from public.clinic_memberships
   where user_id = account_id;

  if cid is not null then
    return cid;
  end if;

  insert into public.clinics(name)
  values ('Cabinet médical')
  returning id into cid;

  insert into public.clinic_memberships(clinic_id, user_id, role)
  values (cid, account_id, 'doctor');

  insert into public.doctor_configs(clinic_id)
  values (cid);

  return cid;
end
$$;

