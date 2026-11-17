import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/alerts",
  "/devices",
  "/phishing",
  "/models",
  "/reports",
  "/audit",
  "/equipo",
  "/settings",
];
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Sesión local sobre PostgreSQL: la cookie `sic_user` la establece
 * /api/auth/login tras validar email + contraseña contra `profiles`.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("sic_user")?.value;
  const hasDb = Boolean(process.env.DATABASE_URL);

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuth = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected) {
    if (!hasDb && process.env.NODE_ENV === "production") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "PostgreSQL no está configurado en el servidor (falta DATABASE_URL)." },
          { status: 503 },
        );
      }
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/setup";
      return NextResponse.redirect(redirect);
    }
    if (hasDb && !session) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/login";
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }
  }

  if (isAuth && hasDb && session) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
