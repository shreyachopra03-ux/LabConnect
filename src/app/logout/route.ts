import { NextResponse } from "next/server";
import { endPatientSession } from "@/lib/session";

export async function POST(req: Request) {
  await endPatientSession();
  return NextResponse.redirect(new URL("/login", req.url), 303);
}
