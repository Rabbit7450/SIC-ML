import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nodemailer usa requires dinámicos: debe cargarse desde node_modules en
  // runtime (servidor) y no empaquetarse, o el envío SMTP se cuelga en producción.
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
