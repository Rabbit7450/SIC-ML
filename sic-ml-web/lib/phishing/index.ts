/**
 * Tipos y utilidades compartidas del módulo anti-phishing.
 *
 * Reflejan la respuesta del servicio FastAPI (`phishing/api.py`, endpoint
 * POST /check-url): lista de dominios conocidos (blocklist) + modelo ML
 * sobre features léxicas de la URL (`phishing/features/url_features.py`).
 */

export type PhishingVerdict = "phish" | "suspicious" | "legit" | "unknown";
export type PhishingSource = "blocklist" | "model" | "rules" | "none";

export type PhishingCheck = {
  url: string;
  verdict: PhishingVerdict;
  score: number | null;
  source: PhishingSource;
  blocklist_match: string | null;
  model_score: number | null;
  rule_score?: number | null;
  features: Record<string, number>;
  notes: string[];
};

/** Análisis persistido en PostgreSQL (tabla scans) o de la sesión actual. */
export type PhishingHistoryItem = PhishingCheck & {
  id?: string;
  created_at?: string;
};

export const verdictLabel: Record<PhishingVerdict, string> = {
  phish: "Phishing",
  suspicious: "Sospechosa",
  legit: "Legítima",
  unknown: "Desconocido",
};

export const verdictClass: Record<PhishingVerdict, string> = {
  phish: "border-accent/30 bg-accent/10 text-accent",
  suspicious: "border-warning/30 bg-warning/10 text-warning",
  legit: "border-secondary/30 bg-secondary/10 text-secondary",
  unknown: "border-border bg-background-elevated text-muted",
};

export const sourceLabel: Record<PhishingSource, string> = {
  blocklist: "Lista de phishing conocida",
  model: "Modelo ML",
  rules: "Reglas heurísticas",
  none: "Sin fuente disponible",
};

/**
 * Traduce las features léxicas devueltas por la API (mismas claves que
 * `features/url_features.py`) a señales legibles cuando indican riesgo.
 */
export function describeSignals(features: Record<string, number>): string[] {
  const signals: string[] = [];
  const flag = (key: string) => (features[key] ?? 0) >= 1;

  if (!flag("https")) signals.push("Usa HTTP sin cifrado");
  if (flag("ip_in_host")) signals.push("Usa una dirección IP como host");
  if (flag("at_symbol")) signals.push("Contiene @ en la URL");
  if (flag("double_slash_path")) signals.push("Doble barra en la ruta");
  if (flag("suspicious_tld")) signals.push("TLD usado con frecuencia en campañas abusivas");
  if (flag("shortener")) signals.push("Acortador de URL");
  if (flag("has_login")) signals.push("Contiene términos de login, cuenta o verificación");
  if (flag("typosquat")) signals.push("Typosquatting: el dominio se parece letra a letra a una marca conocida");
  if (flag("brand_mismatch")) signals.push("Marca en el subdominio: el dominio registrable es otro");
  if (flag("brand_in_registrable")) signals.push("Dominio de una marca legítima registrada");
  if ((features.subdomains ?? 0) >= 3) signals.push("Exceso de subdominios");
  if ((features.hyphens ?? 0) >= 3) signals.push("Exceso de guiones en el host");
  if ((features.hyphens_registrable ?? 0) >= 2) signals.push("Varios guiones en el dominio registrable");
  if (flag("punycode")) signals.push("Punycode (posible alfabeto mixto)");
  if ((features.digits_sld ?? 0) >= 2) signals.push("Varios dígitos en el dominio (confusión visual)");
  if ((features.sld_length ?? 0) >= 14) signals.push("Nombre de dominio inusualmente largo");
  if ((features.length ?? 0) >= 140 || (features.path_length ?? 0) + (features.query_length ?? 0) >= 60) {
    signals.push("URL inusualmente larga");
  }
  if ((features.special_chars ?? 0) >= 4) signals.push("Caracteres especiales en la URL");
  if ((features.digits ?? 0) >= 6) signals.push("Muchos dígitos en el host");
  if (flag("userinfo")) signals.push("Credenciales en la URL (usuario:clave@host)");
  if (flag("unusual_port")) signals.push("Puerto no estándar");
  if (flag("hex_encoding")) signals.push("Codificación hexadecimal en ruta o consulta");
  if (flag("double_ext")) signals.push("Doble extensión en el archivo de la ruta");
  if ((features.suspicious_words ?? 0) >= 2) signals.push("Varias palabras de señuelo (login, verify, wallet…)");
  if (flag("brand_in_path") && !flag("brand_in_registrable")) signals.push("Marca de tercero en la ruta");
  if ((features.host_entropy ?? 0) >= 3.8) signals.push("Host de alta entropía (parece aleatorio)");
  if ((features.longest_label ?? 0) >= 20) signals.push("Etiqueta de host inusualmente larga");

  return signals;
}

