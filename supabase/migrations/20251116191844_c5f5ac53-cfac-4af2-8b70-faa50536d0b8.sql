-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('farmer', 'admin', 'company', 'consumer');

-- Create batch status enum
CREATE TYPE public.batch_status AS ENUM ('pending_approval', 'approved', 'ready_for_sale', 'sold');

-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'consumer',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Farmer details table
CREATE TABLE public.farmer_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  farm_name TEXT NOT NULL,
  farm_location TEXT NOT NULL,
  certifications TEXT[],
  land_proof_url TEXT,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company details table
CREATE TABLE public.company_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  gst_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  herb_name TEXT NOT NULL,
  harvest_date DATE NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  farming_conditions TEXT,
  moisture_level DECIMAL(5,2),
  purity_report_url TEXT,
  images TEXT[],
  status batch_status NOT NULL DEFAULT 'pending_approval',
  price_per_kg DECIMAL(10,2),
  blockchain_tx_hash TEXT,
  qr_code_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batch approvals table
CREATE TABLE public.batch_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  status approval_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES auth.users(id),
  farmer_id UUID NOT NULL REFERENCES auth.users(id),
  quantity_kg DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  farmer_amount DECIMAL(12,2) NOT NULL,
  platform_amount DECIMAL(12,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Farmer details policies
CREATE POLICY "Farmers can view own details"
  ON public.farmer_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Farmers can insert own details"
  ON public.farmer_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can update own details"
  ON public.farmer_details FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all farmer details"
  ON public.farmer_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update farmer details"
  ON public.farmer_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Company details policies
CREATE POLICY "Companies can view own details"
  ON public.company_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own details"
  ON public.company_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can update own details"
  ON public.company_details FOR UPDATE
  USING (auth.uid() = user_id);

-- Batches policies
CREATE POLICY "Farmers can view own batches"
  ON public.batches FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can insert own batches"
  ON public.batches FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own batches"
  ON public.batches FOR UPDATE
  USING (auth.uid() = farmer_id);

CREATE POLICY "Admins can view all batches"
  ON public.batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Companies can view approved batches"
  ON public.batches FOR SELECT
  USING (
    status = 'ready_for_sale' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'company'
    )
  );

CREATE POLICY "Public can view batches by ID"
  ON public.batches FOR SELECT
  USING (true);

-- Batch approvals policies
CREATE POLICY "Admins can manage approvals"
  ON public.batch_approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Purchases policies
CREATE POLICY "Companies can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = company_id);

CREATE POLICY "Farmers can view purchases of their batches"
  ON public.purchases FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Companies can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmer_details_updated_at
  BEFORE UPDATE ON public.farmer_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_details_updated_at
  BEFORE UPDATE ON public.company_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consumer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();