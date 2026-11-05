import { redirect } from "next/navigation";
import { getPatientSession } from "@/lib/session";

export default async function Home() {
  const s = await getPatientSession();
  if (s?.kind === "LINK" && s.orderId) redirect(`/reports/${s.orderId}`);
  redirect(s ? "/orders" : "/login");
}
