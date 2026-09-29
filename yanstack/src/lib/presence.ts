/** 进程内在线访客（本机单进程够用；重启后清零） */

const ONLINE_TTL_MS = 60_000;

type PresenceRecord = {
  lastSeenAt: number;
  path: string;
  isAdmin: boolean;
};

const visitors = new Map<string, PresenceRecord>();

function prune(now = Date.now()) {
  for (const [id, rec] of visitors) {
    if (now - rec.lastSeenAt > ONLINE_TTL_MS) visitors.delete(id);
  }
}

export function touchPresence(input: {
  visitorId: string;
  path?: string;
  isAdmin?: boolean;
}) {
  const id = input.visitorId.trim().slice(0, 64);
  if (!id) return getPresenceSnapshot();

  const now = Date.now();
  prune(now);
  visitors.set(id, {
    lastSeenAt: now,
    path: (input.path || "/").slice(0, 200),
    isAdmin: Boolean(input.isAdmin),
  });
  return getPresenceSnapshot(now);
}

export function getPresenceSnapshot(now = Date.now()) {
  prune(now);
  const list = [...visitors.entries()].map(([id, rec]) => ({
    id,
    path: rec.path,
    isAdmin: rec.isAdmin,
    lastSeenAt: rec.lastSeenAt,
    secondsAgo: Math.max(0, Math.round((now - rec.lastSeenAt) / 1000)),
  }));
  list.sort((a, b) => a.secondsAgo - b.secondsAgo);

  const online = list.length;
  const frontOnline = list.filter((v) => !v.isAdmin).length;
  const adminOnline = list.filter((v) => v.isAdmin).length;

  return { online, frontOnline, adminOnline, visitors: list, ttlSeconds: ONLINE_TTL_MS / 1000 };
}
