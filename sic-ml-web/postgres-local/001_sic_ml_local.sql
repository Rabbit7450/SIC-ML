-- Esquema PostgreSQL local para SIC-ML. Ejecutar en la base `sic_ml`.
-- No depende de Supabase Auth ni de Row Level Security.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'analista', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('critica', 'alta', 'media', 'baja');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE device_status AS ENUM ('online', 'offline', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  full_name text,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  node_id text NOT NULL UNIQUE,
  device_type text NOT NULL DEFAULT 'esp32',
  status device_status NOT NULL DEFAULT 'unknown',
  last_seen_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  module text NOT NULL DEFAULT 'ids',
  attack_type text,
  severity alert_severity NOT NULL DEFAULT 'media',
  score double precision,
  source_ip text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_url text NOT NULL,
  scan_type text NOT NULL DEFAULT 'phishing',
  status text NOT NULL DEFAULT 'pending',
  risk_level text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  algorithm text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deployed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  report_type text NOT NULL,
  summary text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE OR REPLACE VIEW v_devices_active AS SELECT * FROM devices WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_alerts_active AS SELECT * FROM alerts WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_scans_active AS SELECT * FROM scans WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_models_active AS SELECT * FROM models WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_reports_active AS SELECT * FROM reports WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_profiles_active AS SELECT * FROM profiles WHERE deleted_at IS NULL;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER scans_updated_at BEFORE UPDATE ON scans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER audit_logs_updated_at BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO alerts (title, module, attack_type, severity, score, source_ip) VALUES
  ('Tráfico anómalo detectado', 'ids', 'probe', 'alta', 0.91, '192.168.1.45'),
  ('Replay MQTT bloqueado', 'iot', 'replay', 'critica', 1.00, NULL),
  ('URL sospechosa clasificada', 'phishing', 'phish', 'alta', 0.94, NULL),
  ('Cabecera CSP ausente', 'web', 'misconfig', 'media', 0.60, NULL);

INSERT INTO devices (name, node_id, device_type, status, last_seen_at) VALUES
  ('Sensor pasillo', 'esp32-01', 'esp32', 'online', now()),
  ('Sensor almacén', 'esp32-02', 'esp32', 'offline', now() - interval '2 hours'),
  ('Nodo laboratorio', 'esp32-sim', 'esp32', 'online', now());

INSERT INTO models (name, version, algorithm, metrics, is_deployed) VALUES
  ('NSL-KDD Binary RF', '1.0.0', 'random_forest', '{"f1":0.9992,"accuracy":0.9991}'::jsonb, true),
  ('NSL-KDD Linear SVM', '1.0.0', 'svm_linear', '{"f1":0.9778,"accuracy":0.9762}'::jsonb, false);
