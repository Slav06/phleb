-- Comprehensive script to fix lab data issues
-- This script will check and fix any inconsistencies between labs and submissions

-- 1. First, let's check what labs exist
SELECT 'Current labs in database:' as info;
SELECT id, name, is_active FROM public.labs ORDER BY created_at;

-- 2. Check what lab_ids are being used in submissions
SELECT 'Lab IDs currently in submissions:' as info;
SELECT DISTINCT lab_id, COUNT(*) as submission_count 
FROM public.submissions 
WHERE lab_id IS NOT NULL 
GROUP BY lab_id 
ORDER BY submission_count DESC;

-- 3. Check for submissions with lab_ids that don't exist in labs table
SELECT 'Submissions with invalid lab_ids:' as info;
SELECT s.id, s.lab_id, s.patient_name, s.submitted_at
FROM public.submissions s
LEFT JOIN public.labs l ON s.lab_id = l.id
WHERE s.lab_id IS NOT NULL AND l.id IS NULL;

-- 4. Insert Quality Laboratory if it doesn't exist
INSERT INTO public.labs (id, name, address, logo_url, contact_email, contact_phone, is_active, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- Fixed UUID for Quality Laboratory
    'Quality Laboratory',
    '123 Main Street, Anytown, USA',
    '/qls-logo.png',
    'info@qualitylaboratory.com',
    '+1-555-123-4567',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    logo_url = EXCLUDED.logo_url,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 5. Update all submissions to use Quality Laboratory
UPDATE public.submissions 
SET lab_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE lab_id IS NULL 
   OR lab_id NOT IN (SELECT id FROM public.labs);

-- 6. Verify the fix
SELECT 'After fix - submissions by lab:' as info;
SELECT 
    l.name as lab_name,
    COUNT(s.id) as submission_count
FROM public.submissions s
JOIN public.labs l ON s.lab_id = l.id
GROUP BY l.id, l.name
ORDER BY submission_count DESC;

-- 7. Show final state
SELECT 'Final verification - all submissions should have valid lab_id:' as info;
SELECT 
    COUNT(*) as total_submissions,
    COUNT(lab_id) as submissions_with_lab,
    COUNT(CASE WHEN lab_id IS NOT NULL THEN 1 END) as valid_lab_references
FROM public.submissions; 