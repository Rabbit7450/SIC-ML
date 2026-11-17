import nodemailer from "nodemailer";

/**
 * Envío de credenciales por correo (SMTP) para las cuentas creadas o
 * restablecidas desde el panel de administrador (/equipo).
 *
 * Config por variables de entorno (solo servidor, nunca NEXT_PUBLIC_*):
 *   SMTP_HOST, SMTP_PORT (587 por defecto), SMTP_SECURE ("true" = 465 TLS),
 *   SMTP_USER, SMTP_PASS (opcionales), SMTP_FROM (remitente),
 *   APP_URL (p. ej. http://localhost:3000, para el enlace de acceso).
 *
 * La contraseña NUNCA se guarda en logs ni en audit_logs.
 */

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

export type CredentialsMail = {
  to: string;
  fullName: string;
  loginEmail: string;
  password: string;
  reason: "created" | "reset";
};

function transporter() {
  const secure = (process.env.SMTP_SECURE ?? "false") === "true";
  const port = Number(process.env.SMTP_PORT ?? (secure ? 465 : 587));
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER ?? "", pass: process.env.SMTP_PASS ?? "" }
        : undefined,
    // Timeouts para que el envío nunca bloquee la respuesta de la API.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

export async function sendCredentialsEmail({
  to,
  fullName,
  loginEmail,
  password,
  reason,
}: CredentialsMail): Promise<{ ok: true; messageId: string }> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const from = process.env.SMTP_FROM ?? "SIC-ML <no-reply@sic-ml.lab.local>";
  const subject =
    reason === "created"
      ? "SIC-ML · Tu cuenta fue creada — credenciales de acceso"
      : "SIC-ML · Tu contraseña fue restablecida";

  const intro =
    reason === "created"
      ? `Hola ${fullName}, un administrador creó tu cuenta en SIC-ML. Estos son tus datos de acceso iniciales:`
      : `Hola ${fullName}, un administrador restableció la contraseña de tu cuenta en SIC-ML. Nueva contraseña:`;

  const text = [
    intro,
    "",
    `Usuario (email): ${loginEmail}`,
    `Contraseña: ${password}`,
    "",
    `Acceso: ${appUrl}/login`,
    "",
    "Por seguridad: inicia sesión y cambia la contraseña cuanto antes.",
    "Si no esperabas este correo, avisa al administrador del laboratorio.",
    "",
    "— SIC-ML (laboratorio)",
  ].join("\n");

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#202b38">
    <h2 style="margin:0 0 12px;font-size:18px;color:#315b86">SIC-ML · ${reason === "created" ? "Cuenta creada" : "Contraseña restablecida"}</h2>
    <p>${intro}</p>
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 12px 6px 0;color:#5d6b7a">Usuario (email)</td><td style="padding:6px 0;font-family:monospace"><strong>${loginEmail}</strong></td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#5d6b7a">Contraseña</td><td style="padding:6px 0;font-family:monospace"><strong>${password}</strong></td></tr>
    </table>
    <p><a href="${appUrl}/login" style="background:#315b86;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Entrar al panel</a></p>
    <p style="color:#b54747;font-size:13px"><strong>Seguridad:</strong> inicia sesión y cambia la contraseña cuanto antes. No compartas estas credenciales.</p>
    <p style="color:#5d6b7a;font-size:12px">Si no esperabas este correo, avisa al administrador del laboratorio.</p>
  </div>`;

  const info = await transporter().sendMail({ from, to, subject, text, html });
  return { ok: true, messageId: info.messageId };
}
