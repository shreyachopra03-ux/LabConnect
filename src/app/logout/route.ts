import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/csrf";
import { endPatientSession } from "@/lib/session";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });
  await endPatientSession();
  return NextResponse.redirect(new URL("/login", req.url), 303);
}
