import { z } from "zod";

/**
 * Nombre de persona: solo letras (con acentos/ñ), espacios, apóstrofo, guion y punto.
 * No se permiten números ni caracteres especiales.
 */
export const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’.\- ]+$/;
export const NAME_MESSAGE = "El nombre solo puede contener letras, espacios, guion, apóstrofo o punto (sin números).";

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres.")
  .max(100, "Máximo 100 caracteres.")
  .regex(NAME_PATTERN, NAME_MESSAGE);

/** Valida en el cliente antes de enviar (devuelve mensaje de error o null). */
export function validateName(value: string): string | null {
  const v = value.trim();
  if (v.length < 2) return "Mínimo 2 caracteres.";
  if (v.length > 100) return "Máximo 100 caracteres.";
  if (!NAME_PATTERN.test(v)) return NAME_MESSAGE;
  return null;
}
