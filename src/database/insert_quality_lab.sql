-- Insert Quality Laboratory as the first lab
INSERT INTO public.labs (id, name, address, logo_url, contact_email, contact_phone, is_active, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- Fixed UUID for Quality Laboratory
  'Quality Laboratory',
  'New Jersey, USA',
  '/qls-logo.png',
  'info@qualitylaboratory.com',
  '+1-555-123-4567',
  true,
  NOW(),
  NOW()
);

-- Insert some common test types for Quality Laboratory
INSERT INTO public.test_types (lab_id, name, description, cash_price, tube_top_color, is_active, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Complete Blood Count (CBC)', 'Measures red blood cells, white blood cells, and platelets', 45.00, 'Purple', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'Comprehensive Metabolic Panel (CMP)', 'Measures kidney function, liver function, and blood sugar', 65.00, 'Gold', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'Lipid Panel', 'Measures cholesterol and triglycerides', 35.00, 'Red', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'Thyroid Stimulating Hormone (TSH)', 'Measures thyroid function', 25.00, 'Red', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'Hemoglobin A1C', 'Measures average blood sugar over 3 months', 30.00, 'Purple', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'Vitamin D', 'Measures vitamin D levels', 40.00, 'Gold', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'Testosterone', 'Measures testosterone levels', 55.00, 'Red', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'PSA Test', 'Prostate-specific antigen test', 45.00, 'Red', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'Urinalysis', 'Urine analysis', 25.00, 'Yellow', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', 'STD Panel', 'Sexually transmitted disease screening', 85.00, 'Red', true, NOW(), NOW()); 