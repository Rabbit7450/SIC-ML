export type PhishingSignal = { code: string; label: string; weight: number };
export type UrlAnalysis = { url: string; label: "legit" | "phish"; score: number; method: "heuristic_v2"; signals: PhishingSignal[] };
const riskyTlds = new Set(["xyz", "top", "zip", "mov", "click", "work", "gq", "tk", "ml", "cf"]);
const lureWords = /(?:login|log-in|verify|verification|secure|security|account|update|wallet|bank|invoice|password|signin|auth)/i;
const ipHost = /^(?:\d{1,3}\.){3}\d{1,3}$/;
export function analyzeUrl(input: string): UrlAnalysis {
  const raw = input.trim(); const parsed = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Solo se admiten direcciones HTTP o HTTPS.");
  const host = parsed.hostname.toLowerCase(); const parts = host.split("."); const tld = parts.at(-1) ?? ""; const signals: PhishingSignal[] = [];
  const add = (code:string,label:string,weight:number) => signals.push({code,label,weight});
  if (parsed.protocol === "http:") add("http", "Usa HTTP sin cifrado", 0.12);
  if (ipHost.test(host)) add("ip_host", "La URL usa una dirección IP en vez de dominio", 0.3);
  if (host.includes("xn--")) add("punycode", "Dominio internacionalizado (Punycode)", 0.22);
  if (riskyTlds.has(tld)) add("risky_tld", `TLD .${tld} usado con frecuencia en campañas abusivas`, 0.18);
  if (parsed.username || raw.includes("@")) add("userinfo", "Contiene credenciales o un separador @", 0.25);
  if (parts.length >= 5) add("subdomains", "Exceso de subdominios", 0.12);
  if ((host.match(/-/g) ?? []).length >= 3) add("hyphens", "Exceso de guiones en el host", 0.1);
  if (host.length >= 55 || parsed.href.length >= 140) add("long_url", "URL inusualmente larga", 0.1);
  if (parsed.port && !["80", "443"].includes(parsed.port)) add("unusual_port", "Puerto no estándar", 0.08);
  const lureCount = (parsed.pathname + parsed.search + host).match(new RegExp(lureWords.source, "gi"))?.length ?? 0;
  if (lureCount) add("credential_lure", "Términos asociados a inicio de sesión o verificación", Math.min(0.24, 0.1 + lureCount * 0.05));
  if (/%[0-9a-f]{2}/i.test(parsed.pathname + parsed.search)) add("encoding", "Codificación de caracteres en ruta o consulta", 0.06);
  const score = Math.min(0.98, signals.reduce((sum, signal) => sum + signal.weight, 0));
  return { url: parsed.toString(), label: score >= 0.38 ? "phish" : "legit", score, method: "heuristic_v2", signals };
}
