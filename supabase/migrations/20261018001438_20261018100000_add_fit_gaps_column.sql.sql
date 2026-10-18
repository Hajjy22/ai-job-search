/*
# Add fit-gap analysis to job postings

1. Plain-English explanation
   Upgrades the fit-score engine. In addition to the reasons why a job fits
   (already stored in `fit_reasons`), the scorer now also records the
   important requirements from the posting that the user's profile does NOT
   cover. Showing both sides — strengths and gaps — makes the score honest
   and actionable.

2. Modified tables
   - `job_postings`: adds one nullable column `fit_gaps` (array of short
     text snippets, e.g. missing skills). Existing rows keep their data;
     the column is simply empty (NULL) until a job is re-scored.

3. Security
   - No policy changes: the column belongs to the existing owner-scoped
     row-level security already enabled on `job_postings`.

4. Important notes
   - Idempotent: the column is only added if it does not already exist.
   - No data is removed or changed.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_postings' AND column_name = 'fit_gaps'
  ) THEN
    ALTER TABLE public.job_postings ADD COLUMN fit_gaps text[] DEFAULT '{}';
  END IF;
END $$;
