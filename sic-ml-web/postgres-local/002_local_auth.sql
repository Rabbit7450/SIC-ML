-- Ejecutar en sic_ml con el usuario postgres o sicml.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Administrador inicial. Cambia esta contraseña al entrar por primera vez.
INSERT INTO profiles (email, full_name, role, password_hash)
SELECT 'admin@lab.local', 'Administrador SIC-ML', 'admin', crypt('Admin123!', gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@lab.local');

ALTER TABLE profiles ALTER COLUMN password_hash SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_active_idx ON profiles (lower(email)) WHERE deleted_at IS NULL;
