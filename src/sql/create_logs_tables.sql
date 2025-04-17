
-- Create tables for logs
CREATE TABLE IF NOT EXISTS public.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  related_record_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to payment_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL NOT NULL,
  billing_id UUID REFERENCES public.billing_info(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  description TEXT,
  payment_mode TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  student_count INTEGER,
  price_per_student NUMERIC,
  is_special_case BOOLEAN DEFAULT false,
  excess_student_count INTEGER DEFAULT 0,
  excess_days INTEGER DEFAULT 0
);
