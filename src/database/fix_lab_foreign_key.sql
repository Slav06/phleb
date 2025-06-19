-- Fix the foreign key constraint for submissions.lab_id
-- This script fixes the issue where lab_id was incorrectly referencing phlebotomist_profiles instead of labs

-- First, drop the incorrect foreign key constraint if it exists
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'submissions_lab_id_fkey' 
        AND table_name = 'submissions'
    ) THEN
        ALTER TABLE public.submissions DROP CONSTRAINT submissions_lab_id_fkey;
    END IF;
END $$;

-- Now add the correct foreign key constraint
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_lab_id_fkey 
FOREIGN KEY (lab_id) REFERENCES public.labs(id);

-- Update all existing submissions to use Quality Laboratory
UPDATE public.submissions 
SET lab_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE lab_id IS NULL;

-- Verify the constraint is working
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='submissions' 
    AND kcu.column_name='lab_id'; 