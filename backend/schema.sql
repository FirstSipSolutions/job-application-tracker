-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Status enum — enforced at DB level, not just app level
CREATE TYPE application_status AS ENUM (
  'draft',
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'withdrawn'
);

CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  VARCHAR(255)        NOT NULL,
  job_title     VARCHAR(255)        NOT NULL,
  status        application_status  NOT NULL DEFAULT 'draft',
  job_url       TEXT,
  date_applied  DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Speeds up filtering by status (e.g. "show all Interviewing")
CREATE INDEX idx_applications_status ON applications(status);

-- Speeds up sorting by newest first
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- Auto-updates updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();