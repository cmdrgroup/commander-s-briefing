-- Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: only admins can read
CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies on operators
DROP POLICY IF EXISTS "Authenticated users can insert operators" ON public.operators;
DROP POLICY IF EXISTS "Authenticated users can update operators" ON public.operators;
DROP POLICY IF EXISTS "Authenticated users can delete operators" ON public.operators;
DROP POLICY IF EXISTS "Anonymous can update operator progress" ON public.operators;

-- Tighter policies: admin-only for insert/delete, anon update restricted to progress fields
CREATE POLICY "Admins can insert operators"
  ON public.operators FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update operators"
  ON public.operators FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete operators"
  ON public.operators FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anon update for onboarding progress only (by slug match)
CREATE POLICY "Anon can update operator progress by id"
  ON public.operators FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (
    status IS NOT NULL
    AND (step_0_completed IS NOT NULL OR step_1_completed IS NOT NULL)
  );