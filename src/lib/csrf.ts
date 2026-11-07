/**
 * CSRF check for plain route handlers (C003). Server actions already get this from Next.js;
 * route handlers that change state (like POST /logout) call this themselves.
 * A browser always sends Origin on cross-site POSTs, so a mismatch means another site sent it.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;
  if (!origin) {
    // Some older browsers omit Origin on same-origin form posts: fall back to Referer.
    const referer = req.headers.get("referer");
    return !!referer && hostOf(referer) === host;
  }
  return hostOf(origin) === host;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};
