import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isValidAuthCookie } from "@/lib/dashboardAuth";

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/api/login") {
    return NextResponse.next();
  }

  const password = process.env.DASHBOARD_PASSWORD;
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Central app-level auth gate. Public paths are excluded below; every matched route needs the signed cookie.
  if (await isValidAuthCookie(authCookie, password)) {
    return NextResponse.next();
  }

  return redirectToLogin(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"
  ]
};
