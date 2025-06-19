-- Add user tracking to submissions table
-- This script adds a column to track who created each blood draw submission

-- Add the created_by_user column to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS created_by_user text;

-- Add a comment to explain the column
COMMENT ON COLUMN public.submissions.created_by_user IS 'Tracks who created the submission: admin name or "LAB" for mobile lab users';

-- Update existing submissions to set default values
-- For submissions with phlebotomist_id, set as "LAB"
UPDATE public.submissions 
SET created_by_user = 'LAB' 
WHERE created_by_user IS NULL AND phlebotomist_id IS NOT NULL;

-- For submissions without phlebotomist_id, set as "LAB" (assuming they were created by labs)
UPDATE public.submissions 
SET created_by_user = 'LAB' 
WHERE created_by_user IS NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_created_by_user ON public.submissions(created_by_user); 