/*
# JobHunt dashboard schema

1. Plain-English summary
Replaces the old invoicing tables (clients, invoices, invoice_items) with tables for an AI job-search
dashboard: job postings the user found, the applications they track, and their CV/cover-letter library.

2. New Tables
- `job_postings`: one row per job the user wants to track. Fields: title, company, location, work mode
  (remote/hybrid/onsite), url, description, ai fit score (0-100), fit reasons, salary range, source,
  status (new/saved/applied/archived), dates.
- `applications`: one row per application per job. Fields: job reference, stage
  (saved/applied/screening/interview/final/offer/hired/rejected/withdrawn), fit score snapshot, applied date,
  next action + next action date, notes, last contact date.
- `documents`: CV, cover letter and other docs. Fields: doc type, title, content (text), version, is_active.

3. Modified tables
- `profiles`: keeps email, full_name, adds job-search fields: headline, target_roles, location, work_mode,
  skills, years_experience, bio, resume_url. Drops nothing.

4. Dropped tables
- `invoice_items`, `invoices`, `clients`: old invoice app tables with zero rows. Removed to keep the
  database clean. (No user data existed in them.)

5. Security
- RLS enabled on all tables.
- Owner-scoped CRUD policies per verb (select/insert/update/delete) for `job_postings`, `applications`,
  `documents`, `profiles` — every user sees only their own rows.
- All policies scoped TO authenticated (app requires sign-in).

6. Important notes
- Owner columns default to auth.uid() so client inserts without user_id still pass RLS.
- Indexes on user_id, status, stage, and FK columns for dashboard queries.
- Use IF NOT EXISTS / DROP POLICY IF EXISTS so the migration is safe to re-run.
*/

-- Drop old invoice tables (verified empty, replaced by job-search schema)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- ---------------------------------------------------------------
-- job_postings
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  work_mode text NOT NULL DEFAULT 'onsite' CHECK (work_mode IN ('remote','hybrid','onsite')),
  url text,
  description text,
  fit_score integer CHECK (fit_score >= 0 AND fit_score <= 100),
  fit_reasons text[] DEFAULT '{}',
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD',
  source text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','saved','applied','archived')),
  posted_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_job_postings_user ON job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(user_id, status);

DROP POLICY IF EXISTS "select_own_job_postings" ON job_postings;
CREATE POLICY "select_own_job_postings" ON job_postings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_job_postings" ON job_postings;
CREATE POLICY "insert_own_job_postings" ON job_postings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_job_postings" ON job_postings;
CREATE POLICY "update_own_job_postings" ON job_postings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_job_postings" ON job_postings;
CREATE POLICY "delete_own_job_postings" ON job_postings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'applied' CHECK (stage IN ('saved','applied','screening','interview','final','offer','hired','rejected','withdrawn')),
  fit_score integer CHECK (fit_score >= 0 AND fit_score <= 100),
  applied_date date,
  next_action text,
  next_action_date date,
  last_contact_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_posting_id);

DROP POLICY IF EXISTS "select_own_applications" ON applications;
CREATE POLICY "select_own_applications" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_applications" ON applications;
CREATE POLICY "insert_own_applications" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_applications" ON applications;
CREATE POLICY "update_own_applications" ON applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_applications" ON applications;
CREATE POLICY "delete_own_applications" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'cv' CHECK (doc_type IN ('cv','cover_letter','other')),
  title text NOT NULL,
  content text,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(user_id, doc_type);

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- profiles: extend for job search
-- ---------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='headline') THEN
    ALTER TABLE profiles ADD COLUMN headline text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='target_roles') THEN
    ALTER TABLE profiles ADD COLUMN target_roles text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='location') THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='work_mode') THEN
    ALTER TABLE profiles ADD COLUMN work_mode text DEFAULT 'remote';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='skills') THEN
    ALTER TABLE profiles ADD COLUMN skills text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='years_experience') THEN
    ALTER TABLE profiles ADD COLUMN years_experience integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='resume_url') THEN
    ALTER TABLE profiles ADD COLUMN resume_url text;
  END IF;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);