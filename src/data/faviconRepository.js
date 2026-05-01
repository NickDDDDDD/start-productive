import { db } from "./boardRepository";

export async function getCachedFavicon(key) {
  if (!key) return null;
  return db.favicons.get(key);
}

export async function putCachedFavicon(entry) {
  if (!entry?.key || !entry?.url) return null;

  const record = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };
  await db.favicons.put(record);
  return record;
}

export async function findCachedFaviconByBrand(brand, { allowStale = false } = {}) {
  if (!brand) return null;
  const entries = await db.favicons.where("brand").equals(brand).toArray();
  const now = Date.now();
  return entries.find((entry) => {
    if (!entry?.url) return false;
    if (allowStale) return true;
    return !isExpired(entry, now);
  }) || null;
}

export async function deleteCachedFavicon(key) {
  if (!key) return;
  await db.favicons.delete(key);
}

export function isExpired(entry, now = Date.now()) {
  return entry?.exp > 0 && now > entry.exp;
}
