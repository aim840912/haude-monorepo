-- Revoke residual write privileges from Data API roles
--
-- INTENT: defence in depth for the RLS model introduced in 20260304_enable_rls_all_tables.
--
-- AUDIT FINDING (2026-07-20): anon / authenticated held REFERENCES, TRIGGER and
-- TRUNCATE on all 30 public tables. They correctly held NO SELECT/INSERT/UPDATE/
-- DELETE, so no data was readable or writable through PostgREST. TRUNCATE is not
-- reachable through the PostgREST REST interface either, so this was not
-- exploitable — but granting destructive privileges to anonymous roles has no
-- upside, so they are removed here.
--
-- STRATEGY (unchanged): the database is reached only by the NestJS API via
-- DATABASE_URL (postgres role, bypasses RLS). anon / authenticated are expected
-- to hold no privileges at all on the public schema.
--
-- PORTABILITY: `anon` / `authenticated` are Supabase-provisioned roles and do not
-- exist on a vanilla PostgreSQL instance (e.g. the local Docker dev database).
-- Every statement is therefore guarded on role existence so this migration is a
-- no-op off-Supabase instead of failing with `role "anon" does not exist`.
--
-- Idempotent — REVOKE on a privilege that was never granted is a no-op.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN

    -- 1) Strip all residual privileges from the Data API roles.
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated';

    -- 2) Stop future tables from inheriting privileges by default.
    --    Without this, every `prisma migrate deploy` that creates a table would
    --    re-grant privileges and silently undo step 1.
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated';

    RAISE NOTICE 'Data API roles found — privileges revoked.';
  ELSE
    RAISE NOTICE 'Data API roles (anon/authenticated) absent — skipping (not a Supabase instance).';
  END IF;
END
$$;

-- 3) Enable RLS on Prisma's own migration table.
--    It is created by `prisma migrate` after the 20260304 migration ran, so it
--    was never covered. It holds no personal data (migration names + checksums)
--    and anon has no SELECT on it, but leaving RLS off shows up in the Supabase
--    Security Advisor as an error. Harmless on vanilla PostgreSQL too.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
