-- This file contains SQL commands to set up the Supabase database properly
-- Run these commands in your Supabase SQL editor

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_approvals ENABLE ROW LEVEL SECURITY;

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for batches table
CREATE POLICY "Farmers can view own batches" ON batches
  FOR SELECT USING (
    auth.uid() = farmer_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'company'))
  );

CREATE POLICY "Farmers can insert own batches" ON batches
  FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update own batches" ON batches
  FOR UPDATE USING (auth.uid() = farmer_id);

-- RLS Policies for farmer_details table
CREATE POLICY "Farmers can view own details" ON farmer_details
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can insert own details" ON farmer_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can update own details" ON farmer_details
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for company_details table
CREATE POLICY "Companies can view own details" ON company_details
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Companies can insert own details" ON company_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can update own details" ON company_details
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for purchases table
CREATE POLICY "Users can view related purchases" ON purchases
  FOR SELECT USING (
    auth.uid() = company_id OR 
    auth.uid() = farmer_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Companies can insert purchases" ON purchases
  FOR INSERT WITH CHECK (
    auth.uid() = company_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'company')
  );

-- RLS Policies for batch_approvals table
CREATE POLICY "Admins can manage approvals" ON batch_approvals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view approvals for their batches" ON batch_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM batches 
      WHERE id = batch_id AND farmer_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );