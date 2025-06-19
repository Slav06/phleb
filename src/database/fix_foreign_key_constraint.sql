-- Complete fix for the lab_id foreign key constraint issue
-- This script will completely recreate the lab_id column with the correct reference

-- Step 1: Drop the lab_id column completely (this will remove the incorrect constraint)
ALTER TABLE public.submissions DROP COLUMN IF EXISTS lab_id;

-- Step 2: Add the lab_id column back with the correct foreign key constraint
ALTER TABLE public.submissions 
ADD COLUMN lab_id uuid REFERENCES public.labs(id);

-- Step 3: Insert Quality Laboratory if it doesn't exist
INSERT INTO public.labs (id, name, address, logo_url, contact_email, contact_phone, is_active, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Quality Laboratory',
    '123 Main Street, Anytown, USA',
    '/qls-logo.png',
    'info@qualitylaboratory.com',
    '+1-555-123-4567',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update all submissions to use Quality Laboratory
UPDATE public.submissions 
SET lab_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 5: Verify the constraint is correct
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

-- Step 6: Verify the data
SELECT 'Verification - submissions with lab:' as info;
SELECT 
    l.name as lab_name,
    COUNT(s.id) as submission_count
FROM public.submissions s
JOIN public.labs l ON s.lab_id = l.id
GROUP BY l.id, l.name; 