-- Migration script to update existing database for lab partnerships
-- Run this after creating the new labs and test_types tables

-- 1. Add missing columns to submissions table if they don't exist
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS lab_id uuid REFERENCES public.labs(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS test_type_id uuid REFERENCES public.test_types(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS phlebotomist_name text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS phlebotomist_email text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS phlebotomist_id uuid REFERENCES public.phlebotomist_profiles(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS special_instructions text;

-- 2. Add missing columns to phlebotomist_profiles table if they don't exist
ALTER TABLE public.phlebotomist_profiles ADD COLUMN IF NOT EXISTS company_address text;
ALTER TABLE public.phlebotomist_profiles ADD COLUMN IF NOT EXISTS agreement_company_name text;
ALTER TABLE public.phlebotomist_profiles ADD COLUMN IF NOT EXISTS agreement_printed_name text;
ALTER TABLE public.phlebotomist_profiles ADD COLUMN IF NOT EXISTS agreement_date text;
ALTER TABLE public.phlebotomist_profiles ADD COLUMN IF NOT EXISTS agreement_signature text;

-- 3. Create admin_activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  action text NOT NULL,
  username text NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create delivery_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.delivery_templates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lab_id uuid REFERENCES public.phlebotomist_profiles(id) ON DELETE CASCADE NOT NULL,
  address_line1 text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create fedex_label_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fedex_label_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  address text NOT NULL,
  requested_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'pending',
  label_url text
);

-- 6. Create upcoming_draws table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.upcoming_draws (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lab_id uuid REFERENCES public.phlebotomist_profiles(id) ON DELETE CASCADE NOT NULL,
  patient_email text NOT NULL,
  status text DEFAULT 'new_request',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Add missing columns to submissions table for additional fields
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_provider text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS policy_number text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS group_number text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS member_id text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_phone text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_email text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_address text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_fax text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_website text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_notes text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS script_image text[];
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS insurance_card_image text[];
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS patient_id_image text[];
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'in_progress';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS deleted_by_lab boolean DEFAULT false;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.phlebotomist_profiles(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS fedex_label_url text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS lab_results_url text;

-- 8. Enable RLS on new tables
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fedex_label_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for new tables
DROP POLICY IF EXISTS "Admins can manage admin activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can manage admin activity log"
  ON public.admin_activity_log FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Phlebotomists can manage their delivery templates" ON public.delivery_templates;
CREATE POLICY "Phlebotomists can manage their delivery templates"
  ON public.delivery_templates FOR ALL
  USING (auth.uid() = lab_id);

DROP POLICY IF EXISTS "Users can view their fedex label requests" ON public.fedex_label_requests;
CREATE POLICY "Users can view their fedex label requests"
  ON public.fedex_label_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE submissions.id = fedex_label_requests.submission_id
      AND submissions.phlebotomist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create fedex label requests" ON public.fedex_label_requests;
CREATE POLICY "Users can create fedex label requests"
  ON public.fedex_label_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE submissions.id = fedex_label_requests.submission_id
      AND submissions.phlebotomist_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Phlebotomists can manage their upcoming draws" ON public.upcoming_draws;
CREATE POLICY "Phlebotomists can manage their upcoming draws"
  ON public.upcoming_draws FOR ALL
  USING (auth.uid() = lab_id);

DROP POLICY IF EXISTS "Users can view their submissions" ON public.submissions;
CREATE POLICY "Users can view their submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = phlebotomist_id);

DROP POLICY IF EXISTS "Users can create submissions" ON public.submissions;
CREATE POLICY "Users can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = phlebotomist_id);

DROP POLICY IF EXISTS "Users can update their submissions" ON public.submissions;
CREATE POLICY "Users can update their submissions"
  ON public.submissions FOR UPDATE
  USING (auth.uid() = phlebotomist_id);

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_phlebotomist_id ON public.submissions(phlebotomist_id);
CREATE INDEX IF NOT EXISTS idx_submissions_lab_id ON public.submissions(lab_id);
CREATE INDEX IF NOT EXISTS idx_submissions_test_type_id ON public.submissions(test_type_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_test_types_lab_id ON public.test_types(lab_id);
CREATE INDEX IF NOT EXISTS idx_test_types_active ON public.test_types(is_active);
CREATE INDEX IF NOT EXISTS idx_labs_active ON public.labs(is_active); 