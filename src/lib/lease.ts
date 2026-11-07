import { hostname } from "node:os";
import { randomToken } from "./crypto";
import { db } from "./db";
import { log } from "./logger";

/** Identifies this server process. */
export const INSTANCE_ID = `${hostname()}:${process.pid}:${randomToken(4)}`;

/**
 * Durable lease lock (C005). Works through a connection pool, unlike session-level
 * Postgres advisory locks or SELECT … FOR UPDATE outside a transaction.
 * The lease expires on its own, so a crashed instance never blocks the others for long.
 */
export async function acquireLease(name: string, ttlMs: number, holder = INSTANCE_ID): Promise<boolean> {
  const now = new Date();
  await db.workerLock.createMany({ data: [{ name, holder: "", expiresAt: new Date(0) }], skipDuplicates: true });
  const taken = await db.workerLock.updateMany({
    where: { name, OR: [{ expiresAt: { lt: now } }, { holder }] },
    data: { holder, expiresAt: new Date(now.getTime() + ttlMs) },
  });
  return taken.count === 1;
}

export async function releaseLease(name: string, holder = INSTANCE_ID) {
  await db.workerLock.updateMany({ where: { name, holder }, data: { expiresAt: new Date(0) } });
}

/**
 * Runs `fn` only if this instance holds the lease. If the database is unreachable the
 * caller's in-process guard still applies (single-instance dev fallback).
 */
export async function withLease<T>(name: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
  let acquired: boolean;
  try {
    acquired = await acquireLease(name, ttlMs);
  } catch (e) {
    log.warn("lease unavailable, running with in-process guard only", { lease: name, error: e });
    return fn();
  }
  if (!acquired) return null;
  try {
    return await fn();
  } finally {
    await releaseLease(name).catch(() => {});
  }
}
