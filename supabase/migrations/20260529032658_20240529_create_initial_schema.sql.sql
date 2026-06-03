/*
# Create Initial Schema for Property Investment Calculator

1. New Tables
  - `user_roles`: Manages user roles (admin/user)
  - `evaluations`: Stores property evaluation data
  - `tax_formulas`: Stores configurable BSD and ABSD rate tables

2. Enum Types
  - `property_type_enum`: Residential, Industrial, Commercial
  - `lb_profile_enum`: Individual, IHC, Operating
  - `evaluation_status_enum`: Draft, Complete

3. Security
  - Enable RLS on all tables
  - Users can only access their own evaluations
  - Tax formulas readable by authenticated users
  - Only admins can update tax formulas and manage roles

4. Important Notes
  - All monetary values stored as DECIMAL for precision
  - Percentages stored as DECIMAL (e.g., 2.5% = 0.025)
  - Timestamps use timestamptz for timezone awareness
  - Cascade delete on user_id to maintain referential integrity
*/

-- Create enum types
CREATE TYPE property_type_enum AS ENUM ('Residential', 'Industrial', 'Commercial');
CREATE TYPE lb_profile_enum AS ENUM ('Individual', 'IHC', 'Operating');
CREATE TYPE evaluation_status_enum AS ENUM ('Draft', 'Complete');

-- Create user_roles table for admin management (MUST be created first)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Property Details
  property_name text NOT NULL,
  property_address text DEFAULT '',
  property_type property_type_enum NOT NULL DEFAULT 'Industrial',
  size_sqft decimal NOT NULL,
  lease_left integer NOT NULL,
  purchase_price decimal NOT NULL,
  market_valuation decimal DEFAULT 0,
  bank_valuation decimal DEFAULT 0,
  
  -- Buyer Profile Flags
  absd boolean DEFAULT false,
  gst_registered boolean DEFAULT true,
  lb_profile lb_profile_enum NOT NULL DEFAULT 'IHC',
  
  -- Loan Terms
  loan_interest_rate decimal NOT NULL DEFAULT 0.025,
  loan_tenure_years integer NOT NULL DEFAULT 30,
  downpayment_percent decimal NOT NULL DEFAULT 0.20,
  
  -- Costs
  corp_sect_fee decimal DEFAULT 0,
  legal_conveyance_fee decimal DEFAULT 1500,
  legal_jv_fee decimal DEFAULT 0,
  bank_facilities_fee decimal DEFAULT 3600,
  insurance decimal DEFAULT 3500,
  rental_agents_commission decimal DEFAULT 0,
  backup_funds_months integer DEFAULT 3,
  
  -- Rental Info
  rental_current decimal NOT NULL,
  rental_expected decimal DEFAULT 0,
  property_tax_monthly decimal NOT NULL,
  mcst_monthly decimal NOT NULL,
  
  -- JV Structure
  lot_size integer NOT NULL DEFAULT 10,
  ci_percent decimal NOT NULL DEFAULT 0.40,
  dm_percent decimal NOT NULL DEFAULT 0.30,
  lb_percent decimal NOT NULL DEFAULT 0.30,
  
  -- Growth Scenarios
  plan_exit_year integer NOT NULL DEFAULT 3,
  conservative_growth decimal NOT NULL DEFAULT 0.03,
  baseline_growth decimal NOT NULL DEFAULT 0.04,
  target_growth decimal NOT NULL DEFAULT 0.05,
  aggressive_growth decimal NOT NULL DEFAULT 0.06,
  
  -- Status & Timestamps
  status evaluation_status_enum NOT NULL DEFAULT 'Draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tax_formulas table (admin-configurable)
CREATE TABLE IF NOT EXISTS tax_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_type text NOT NULL,
  formula_name text NOT NULL,
  formula_config jsonb NOT NULL,
  description text DEFAULT '',
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(formula_type, formula_name)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_formulas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles"
  ON user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for evaluations table
CREATE POLICY "Users can view own evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluations"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evaluations"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own evaluations"
  ON evaluations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tax_formulas table
CREATE POLICY "Authenticated users can view tax formulas"
  ON tax_formulas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage tax formulas"
  ON tax_formulas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_formulas_updated_at
  BEFORE UPDATE ON tax_formulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default BSD formula (IRAS tiered rates)
INSERT INTO tax_formulas (formula_type, formula_name, formula_config, description) VALUES
('BSD', 'standard', 
 '[
   {"min": 0, "max": 180000, "rate": 0.01},
   {"min": 180000, "max": 360000, "rate": 0.02},
   {"min": 360000, "max": 1000000, "rate": 0.03},
   {"min": 1000000, "max": 1500000, "rate": 0.04},
   {"min": 1500000, "max": 3000000, "rate": 0.05},
   {"min": 3000000, "max": null, "rate": 0.06}
 ]'::jsonb,
 'IRAS Buyer Stamp Duty tiered rates - effective from 15 Feb 2023'
);

-- Insert default ABSD formulas
INSERT INTO tax_formulas (formula_type, formula_name, formula_config, description) VALUES
('ABSD', 'citizen_first_property', 
 '{"rate": 0, "description": "Singapore Citizen buying first property"}'::jsonb,
 'No ABSD for Singapore Citizens buying first property'
),
('ABSD', 'citizen_second_property',
 '{"rate": 0.17, "description": "Singapore Citizen buying second property"}'::jsonb,
 '17% ABSD for Singapore Citizens buying second property'
),
('ABSD', 'citizen_third_property',
 '{"rate": 0.25, "description": "Singapore Citizen buying third and subsequent properties"}'::jsonb,
 '25% ABSD for Singapore Citizens buying third and subsequent properties'
),
('ABSD', 'pr_first_property',
 '{"rate": 0.05, "description": "Singapore PR buying first property"}'::jsonb,
 '5% ABSD for Singapore PR buying first property'
),
('ABSD', 'pr_second_property',
 '{"rate": 0.25, "description": "Singapore PR buying second and subsequent properties"}'::jsonb,
 '25% ABSD for Singapore PR buying second and subsequent properties'
),
('ABSD', 'foreigner',
 '{"rate": 0.60, "description": "Foreigner buying any property"}'::jsonb,
 '60% ABSD for foreigners buying any property'
),
('ABSD', 'entity',
 '{"rate": 0.65, "description": "Entity buying any property"}'::jsonb,
 '65% ABSD for entities buying any property'
);

-- Create indexes for performance
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX idx_evaluations_property_name ON evaluations(property_name);
CREATE INDEX idx_tax_formulas_type_name ON tax_formulas(formula_type, formula_name);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
