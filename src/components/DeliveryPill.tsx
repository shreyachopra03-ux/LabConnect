export function DeliveryPill({ status }: { status: string }) {
  const cls = status === "DELIVERED" ? "ready" : status === "FAILED" ? "danger" : "processing";
  return <span className={`pill ${cls}`}>{status.toLowerCase()}</span>;
}
