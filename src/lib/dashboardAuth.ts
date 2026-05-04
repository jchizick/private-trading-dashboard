export const AUTH_COOKIE_NAME = "trading_dashboard_auth";

const AUTH_COOKIE_VERSION = "v1";
const AUTH_SIGNATURE_PAYLOAD = "private-trading-dashboard-auth";

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function createPasswordSignature(password: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(AUTH_SIGNATURE_PAYLOAD));

  return toBase64Url(signature);
}

// Auth cookies store only a password-derived HMAC, never the dashboard password itself.
export async function createAuthCookieValue(password: string) {
  return `${AUTH_COOKIE_VERSION}.${await createPasswordSignature(password)}`;
}

export async function isValidAuthCookie(cookieValue: string | undefined, password: string | undefined) {
  const normalizedPassword = password?.trim();

  if (!cookieValue || !normalizedPassword) {
    return false;
  }

  return cookieValue === await createAuthCookieValue(normalizedPassword);
}

export function normalizeReturnPath(value: FormDataEntryValue | string | null | undefined) {
  const path = typeof value === "string" ? value : "/";

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}
