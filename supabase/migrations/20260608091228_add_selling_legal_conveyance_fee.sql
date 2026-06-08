ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS selling_legal_conveyance_fee decimal NOT NULL DEFAULT 1500;
