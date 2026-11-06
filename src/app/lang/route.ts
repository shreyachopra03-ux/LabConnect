import { NextResponse, type NextRequest } from "next/server";
import { isLang } from "@/lib/i18n";

export function GET(req: NextRequest) {
  const set = req.nextUrl.searchParams.get("set");
  const ref = req.headers.get("referer");
  const back = ref && new URL(ref).origin === req.nextUrl.origin ? ref : new URL("/", req.url);
  const res = NextResponse.redirect(back);
  if (isLang(set)) res.cookies.set("lang", set, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}
