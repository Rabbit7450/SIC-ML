# SIC-ML Web · Amber Forest

App Next.js 15 (App Router) + Supabase + Vercel. Stack 100 % free tier.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend + API | Next.js 15 |
| DB / Auth / Realtime | Supabase |
| ORM | Drizzle |
| UI | Tailwind 4 + componentes tipo shadcn |
| Motion / icons / charts | Framer Motion · Lucide · Recharts |

## Soft delete

Todas las tablas importantes tienen `deleted_at` + `is_active`.

| Acción | Cómo |
| --- | --- |
| Alta | `INSERT` |
| Baja lógica | `UPDATE deleted_at=now(), is_active=false` vía `/api/soft-delete` |
| Restaurar | `action: "restore"` |
| Baja física | `action: "hard_delete"` (solo admin + confirmación) |
| Consultas | `WHERE deleted_at IS NULL` + vistas `v_*_active` + RLS |

Migración SQL: `supabase/migrations/001_sic_ml_schema.sql`

## Arranque local

```bash
cd sic-ml-web
cp .env.example .env.local
# Completa URL + publishable/anon key de Supabase
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Sin keys, el dashboard usa **datos demo**.

### Aplicar schema en Supabase

1. Dashboard Supabase → SQL Editor
2. Pegar y ejecutar `supabase/migrations/001_sic_ml_schema.sql`
3. Auth → Enable Email (y Google si quieres)
4. Primer usuario → en SQL: `UPDATE profiles SET role = 'admin' WHERE email = 'tu@correo';`

Proyecto URL detectado: `https://afxdqewnpkzzxhbnkatl.supabase.co`

## Despliegue Vercel (gratis)

1. Sube el repo a GitHub
2. Importa en Vercel el directorio `sic-ml-web`
3. Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o anon), `SUPABASE_SECRET_KEY` solo si usas admin server-side
4. Deploy

## Paleta Amber Forest

Dark mode por defecto. Primario `#F59E0B`, secundario `#10B981`, acento `#F43F5E`, fondo `#1C1917`.
