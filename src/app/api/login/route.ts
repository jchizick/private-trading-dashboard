import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createAuthCookieValue, normalizeReturnPath } from "@/lib/dashboardAuth";

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const formData = await request.formData();
  const submittedPassword = formData.get("password");
  const nextPath = normalizeReturnPath(formData.get("next"));
  const dashboardPassword = process.env.DASHBOARD_PASSWORD?.trim();

  // Password comparison happens only on the server; the browser receives an opaque httpOnly auth cookie.
  if (
    !dashboardPassword ||
    typeof submittedPassword !== "string" ||
    submittedPassword !== dashboardPassword
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", dashboardPassword ? "invalid" : "missing_config");
    loginUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: await createAuthCookieValue(dashboardPassword),
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS
  });

  return response;
}
