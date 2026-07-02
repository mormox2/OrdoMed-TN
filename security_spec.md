# Supabase security specification

## Trust boundaries

The browser uses only the public publishable key. Authorization is enforced by PostgreSQL RLS and server-controlled memberships. The service-role key must never enter the frontend or a VITE environment variable.

## Access model

- Doctors administer their own clinic, patients, drafts, signed prescriptions and audit history.
- Secretaries may read and update patients in their clinic but cannot read prescriptions or audit events.
- Users from another clinic have no access.
- Roles and clinic memberships cannot be selected through user metadata.

## Invariants

- Every exposed table has RLS enabled.
- Signed prescriptions and their items are immutable.
- Audit events are append-only and bind actor_id to auth.uid().
- Invitations are single-use, email-bound and expire.
- Account and membership changes run through restricted RPC functions.

## Verification

Run `supabase test db`, then test positive and negative access scenarios with two clinics, one doctor and one secretary per clinic.
