-- Ejecutar en sic_ml. Crea cinco cuentas por rol.
-- Contraseñas iniciales: Admin123!, Analista123! y Viewer123!.
-- Cambiarlas tras el primer inicio de sesión.

INSERT INTO profiles (email, full_name, role, password_hash)
VALUES
  ('admin01@lab.local', 'Administrador Principal', 'admin', crypt('Admin123!', gen_salt('bf'))),
  ('admin02@lab.local', 'Administrador de Plataforma', 'admin', crypt('Admin123!', gen_salt('bf'))),
  ('admin03@lab.local', 'Administrador de Seguridad', 'admin', crypt('Admin123!', gen_salt('bf'))),
  ('admin04@lab.local', 'Administrador de Operaciones', 'admin', crypt('Admin123!', gen_salt('bf'))),
  ('admin05@lab.local', 'Administrador de Auditoría', 'admin', crypt('Admin123!', gen_salt('bf'))),
  ('analista01@lab.local', 'Analista SOC 01', 'analista', crypt('Analista123!', gen_salt('bf'))),
  ('analista02@lab.local', 'Analista SOC 02', 'analista', crypt('Analista123!', gen_salt('bf'))),
  ('analista03@lab.local', 'Analista de Incidentes', 'analista', crypt('Analista123!', gen_salt('bf'))),
  ('analista04@lab.local', 'Analista de Amenazas', 'analista', crypt('Analista123!', gen_salt('bf'))),
  ('analista05@lab.local', 'Analista IoT', 'analista', crypt('Analista123!', gen_salt('bf'))),
  ('viewer01@lab.local', 'Lector de Seguridad 01', 'viewer', crypt('Viewer123!', gen_salt('bf'))),
  ('viewer02@lab.local', 'Lector de Seguridad 02', 'viewer', crypt('Viewer123!', gen_salt('bf'))),
  ('viewer03@lab.local', 'Lector de Auditoría', 'viewer', crypt('Viewer123!', gen_salt('bf'))),
  ('viewer04@lab.local', 'Lector de Riesgos', 'viewer', crypt('Viewer123!', gen_salt('bf'))),
  ('viewer05@lab.local', 'Lector Ejecutivo', 'viewer', crypt('Viewer123!', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = true,
    deleted_at = NULL;

SELECT role, count(*) AS total_usuarios
FROM profiles
WHERE deleted_at IS NULL
GROUP BY role
ORDER BY role;
