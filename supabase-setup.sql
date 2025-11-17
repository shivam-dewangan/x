-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('farmer', 'admin', 'company', 'consumer');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE batch_status AS ENUM ('pending_approval', 'approved', 'ready_for_sale', 'sold');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'farmer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create farmer_details table
CREATE TABLE IF NOT EXISTS farmer_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  farm_name TEXT NOT NULL,
  farm_location TEXT NOT NULL,
  certifications TEXT[],
  land_proof_url TEXT,
  approval_status approval_status DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_details table
CREATE TABLE IF NOT EXISTS company_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  gst_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farmer_id UUID REFERENCES profiles(id) NOT NULL,
  batch_number TEXT UNIQUE NOT NULL,
  herb_name TEXT NOT NULL,
  quantity_kg DECIMAL NOT NULL,
  harvest_date DATE NOT NULL,
  farming_conditions TEXT,
  moisture_level DECIMAL,
  price_per_kg DECIMAL,
  images TEXT[],
  purity_report_url TEXT,
  qr_code_data TEXT,
  blockchain_tx_hash TEXT,
  status batch_status DEFAULT 'pending_approval',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) NOT NULL,
  company_id UUID REFERENCES profiles(id) NOT NULL,
  farmer_id UUID REFERENCES profiles(id) NOT NULL,
  quantity_kg DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  farmer_amount DECIMAL NOT NULL, 
  platform_amount DECIMAL NOT NULL,
  payment_status TEXT DEFAULT 'completed',
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create batch_approvals table
CREATE TABLE IF NOT EXISTS batch_approvals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) NOT NULL,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  status approval_status DEFAULT 'pending',
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_approvals ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "View own farmer details" ON farmer_details FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Insert own farmer details" ON farmer_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own farmer details" ON farmer_details FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "View own company details" ON company_details FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Insert own company details" ON company_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own company details" ON company_details FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "View batches" ON batches FOR SELECT USING (auth.uid() = farmer_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'company')));
CREATE POLICY "Insert own batches" ON batches FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Update own batches" ON batches FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "View related purchases" ON purchases FOR SELECT USING (auth.uid() = company_id OR auth.uid() = farmer_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Companies can purchase" ON purchases FOR INSERT WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Admins manage approvals" ON batch_approvals FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "View batch approvals" ON batch_approvals FOR SELECT USING (EXISTS (SELECT 1 FROM batches WHERE id = batch_id AND farmer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));