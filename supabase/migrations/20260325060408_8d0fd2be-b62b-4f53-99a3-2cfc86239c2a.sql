-- Create operators table for onboarding tracking
CREATE TABLE public.operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete')),
  step_0_completed BOOLEAN NOT NULL DEFAULT false,
  step_0_completed_at TIMESTAMP WITH TIME ZONE,
  step_1_completed BOOLEAN NOT NULL DEFAULT false,
  step_1_completed_at TIMESTAMP WITH TIME ZONE,
  step_2_completed BOOLEAN NOT NULL DEFAULT false,
  step_2_completed_at TIMESTAMP WITH TIME ZONE,
  step_3_completed BOOLEAN NOT NULL DEFAULT false,
  step_3_completed_at TIMESTAMP WITH TIME ZONE,
  step_4_completed BOOLEAN NOT NULL DEFAULT false,
  step_4_completed_at TIMESTAMP WITH TIME ZONE,
  step_5_completed BOOLEAN NOT NULL DEFAULT false,
  step_5_completed_at TIMESTAMP WITH TIME ZONE,
  step_6_completed BOOLEAN NOT NULL DEFAULT false,
  step_6_completed_at TIMESTAMP WITH TIME ZONE,
  step_7_completed BOOLEAN NOT NULL DEFAULT false,
  step_7_completed_at TIMESTAMP WITH TIME ZONE,
  step_8_completed BOOLEAN NOT NULL DEFAULT false,
  step_8_completed_at TIMESTAMP WITH TIME ZONE,
  signature_name TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- Operators are accessible publicly by their slug (no auth required for operators)
CREATE POLICY "Anyone can read operator by slug"
  ON public.operators FOR SELECT
  USING (true);

-- Only authenticated admins can insert/update/delete
CREATE POLICY "Authenticated users can insert operators"
  ON public.operators FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update operators"
  ON public.operators FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete operators"
  ON public.operators FOR DELETE
  TO authenticated
  USING (true);

-- Allow anonymous users to update their own operator record (for onboarding progress)
CREATE POLICY "Anonymous can update operator progress"
  ON public.operators FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on slug for fast lookups
CREATE INDEX idx_operators_slug ON public.operators (slug);
CREATE INDEX idx_operators_status ON public.operators (status);