-- SIC-ML schema with soft delete (Amber Forest app)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.user_role AS ENUM ('admin', 'analista', 'viewer');
CREATE TYPE public.alert_severity AS ENUM ('critica', 'alta', 'media', 'baja');
CREATE TYPE public.device_status AS ENUM ('online', 'offline', 'unknown');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'viewer',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  node_id text NOT NULL UNIQUE,
  device_type text NOT NULL DEFAULT 'esp32',
  status public.device_status NOT NULL DEFAULT 'unknown',
  last_seen_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  module text NOT NULL DEFAULT 'ids',
  attack_type text,
  severity public.alert_severity NOT NULL DEFAULT 'media',
  score double precision,
  source_ip text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_url text NOT NULL,
  scan_type text NOT NULL DEFAULT 'phishing',
  status text NOT NULL DEFAULT 'pending',
  risk_level text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  algorithm text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deployed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  report_type text NOT NULL,
  summary text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE OR REPLACE VIEW public.v_devices_active AS
  SELECT * FROM public.devices WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW public.v_alerts_active AS
  SELECT * FROM public.alerts WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW public.v_scans_active AS
  SELECT * FROM public.scans WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW public.v_models_active AS
  SELECT * FROM public.models WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW public.v_reports_active AS
  SELECT * FROM public.reports WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW public.v_profiles_active AS
  SELECT * FROM public.profiles WHERE deleted_at IS NULL;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER devices_updated_at BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER scans_updated_at BEFORE UPDATE ON public.scans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER models_updated_at BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_logs_updated_at BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND deleted_at IS NULL
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (id = auth.uid() OR public.current_role() = 'admin'));
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_role() = 'admin');

CREATE POLICY devices_select ON public.devices FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY devices_insert ON public.devices FOR INSERT TO authenticated
  WITH CHECK (public.current_role() IN ('admin', 'analista'));
CREATE POLICY devices_update ON public.devices FOR UPDATE TO authenticated
  USING (public.current_role() IN ('admin', 'analista'));
CREATE POLICY devices_delete ON public.devices FOR DELETE TO authenticated
  USING (public.current_role() = 'admin');

CREATE POLICY alerts_select ON public.alerts FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY alerts_insert ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (public.current_role() IN ('admin', 'analista'));
CREATE POLICY alerts_update ON public.alerts FOR UPDATE TO authenticated
  USING (public.current_role() IN ('admin', 'analista'));
CREATE POLICY alerts_delete ON public.alerts FOR DELETE TO authenticated
  USING (public.current_role() = 'admin');

CREATE POLICY scans_select ON public.scans FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY scans_write ON public.scans FOR ALL TO authenticated
  USING (public.current_role() IN ('admin', 'analista'))
  WITH CHECK (public.current_role() IN ('admin', 'analista'));

CREATE POLICY models_select ON public.models FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY models_write ON public.models FOR ALL TO authenticated
  USING (public.current_role() IN ('admin', 'analista'))
  WITH CHECK (public.current_role() IN ('admin', 'analista'));

CREATE POLICY reports_select ON public.reports FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY reports_write ON public.reports FOR ALL TO authenticated
  USING (public.current_role() IN ('admin', 'analista'))
  WITH CHECK (public.current_role() IN ('admin', 'analista'));

CREATE POLICY audit_select ON public.audit_logs FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.current_role() IN ('admin', 'analista'));
CREATE POLICY audit_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.soft_delete_row(p_table text, p_id uuid)
RETURNS void AS $$
BEGIN
  IF p_table NOT IN ('devices','alerts','scans','models','reports','profiles') THEN
    RAISE EXCEPTION 'tabla no permitida';
  END IF;
  EXECUTE format(
    'UPDATE public.%I SET deleted_at = now(), is_active = false, updated_at = now() WHERE id = $1 AND deleted_at IS NULL',
    p_table
  ) USING p_id;
  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id)
  VALUES (auth.uid(), 'soft_delete', p_table, p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.restore_row(p_table text, p_id uuid)
RETURNS void AS $$
BEGIN
  IF p_table NOT IN ('devices','alerts','scans','models','reports','profiles') THEN
    RAISE EXCEPTION 'tabla no permitida';
  END IF;
  EXECUTE format(
    'UPDATE public.%I SET deleted_at = null, is_active = true, updated_at = now() WHERE id = $1',
    p_table
  ) USING p_id;
  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id)
  VALUES (auth.uid(), 'restore', p_table, p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

INSERT INTO public.alerts (title, module, attack_type, severity, score, source_ip)
VALUES
  ('Tráfico anómalo detectado', 'ids', 'probe', 'alta', 0.91, '192.168.1.45'),
  ('Replay MQTT bloqueado', 'iot', 'replay', 'critica', 1.0, null),
  ('URL sospechosa clasificada', 'phishing', 'phish', 'alta', 0.94, null),
  ('Cabecera CSP ausente', 'web', 'misconfig', 'media', 0.6, null);

INSERT INTO public.devices (name, node_id, device_type, status, last_seen_at)
VALUES
  ('Sensor pasillo', 'esp32-01', 'esp32', 'online', now()),
  ('Sensor almacén', 'esp32-02', 'esp32', 'offline', now() - interval '2 hours'),
  ('Nodo laboratorio', 'esp32-sim', 'esp32', 'online', now());

INSERT INTO public.models (name, version, algorithm, metrics, is_deployed)
VALUES
  ('NSL-KDD Binary RF', '1.0.0', 'random_forest', '{"f1":0.9992,"accuracy":0.9991}'::jsonb, true),
  ('NSL-KDD Linear SVM', '1.0.0', 'svm_linear', '{"f1":0.9778,"accuracy":0.9762}'::jsonb, false);
