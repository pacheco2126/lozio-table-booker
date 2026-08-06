CREATE OR REPLACE FUNCTION public.generate_job_ref()
RETURNS bigint
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate bigint;
BEGIN
  LOOP
    candidate := 100000 + floor(random() * 900000)::bigint;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.job_postings WHERE ref = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

ALTER TABLE public.job_postings ALTER COLUMN ref DROP IDENTITY IF EXISTS;
ALTER TABLE public.job_postings ALTER COLUMN ref SET DEFAULT public.generate_job_ref();