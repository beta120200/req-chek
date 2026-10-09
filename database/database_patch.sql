-- ============================================================
-- ReqCheck: patch for an EXISTING database (run once in the Supabase SQL editor)
-- Safe to run more than once.
-- ============================================================

-- 1) Create a public.users row whenever someone signs up with Supabase Auth.
--    user_documents.user_id and user_services.user_id reference public.users, so
--    without this every insert for a new account fails with a foreign-key error.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Back-fill accounts that signed up before the trigger existed.
INSERT INTO public.users (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name')
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2) requirement_options.id is a PRIMARY KEY, but the original seed reused the ids
--    'national-id' (Voter's ID option AND NBI option), so the NBI "National ID"
--    option was silently skipped by ON CONFLICT DO NOTHING. Add it under a unique id.
INSERT INTO requirement_options (id, requirement_id, doc_id, name, depends_on_doc_id, note) VALUES
    ('nbi-national-id', 'nbi-valid-ids', 'national-id', 'National ID (PhilSys)', 'psa',
     'Apply for a National ID through PhilSys. A PSA birth certificate may be used as supporting documentation during registration.')
ON CONFLICT (id) DO NOTHING;
