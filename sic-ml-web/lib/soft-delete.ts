export type SoftDeleteEntity =
  | "devices"
  | "alerts"
  | "scans"
  | "models"
  | "reports"
  | "profiles";

export const softDeletePatch = {
  deleted_at: new Date().toISOString(),
  is_active: false,
} as const;

export const restorePatch = {
  deleted_at: null,
  is_active: true,
} as const;

export const activeFilter = { deleted_at: null as null };

/** Patch para baja lógica (usar con .update()). */
export function markSoftDeleted() {
  return {
    deleted_at: new Date().toISOString(),
    is_active: false,
  };
}

/** Patch para restaurar. */
export function markRestored() {
  return {
    deleted_at: null,
    is_active: true,
  };
}
