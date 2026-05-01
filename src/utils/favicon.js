import {
  deleteCachedFavicon,
  findCachedFaviconByBrand,
  getCachedFavicon as readCachedFavicon,
  isExpired,
  putCachedFavicon as writeCachedFavicon,
} from "../data/faviconRepository";
import { createLogger } from "./logger";

const logger = createLogger("favicon");
const GENERIC_DOMAIN_PARTS = new Set([
  "com",
  "net",
  "org",
  "gov",
  "edu",
  "co",
  "ac",
  "mil",
  "int",
  "biz",
  "info",
  "name",
  "io",
  "ai",
  "app",
  "dev",
  "tech",
  "me",
  "tv",
  "cc",
  "au",
  "uk",
  "us",
  "cn",
  "hk",
  "tw",
  "de",
  "fr",
  "jp",
  "it",
  "nl",
  "se",
  "no",
  "es",
  "ru",
  "br",
  "ca",
  "pl",
  "ch",
  "in",
]);
const DEFAULT_TTL_MS = 30 * 24 * 3600 * 1000;

function normalizeUrl(input) {
  try {
    const value = (input || "").trim();
    return value.startsWith("http")
      ? new URL(value)
      : new URL(`https://${value}`);
  } catch (error) {
    logger.debug("normalizeUrl failed", { input, error: String(error) });
    return null;
  }
}

function stripWww(hostname = "") {
  return hostname.replace(/^www\./i, "");
}

function brandOf(hostname = "") {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  for (let index = parts.length - 2; index >= 0; index -= 1) {
    if (!GENERIC_DOMAIN_PARTS.has(parts[index])) return parts[index];
  }
  return parts[0] || hostname;
}

function hostKeyFromUrl(url) {
  return stripWww(url.hostname.toLowerCase());
}

function parseTab(tab) {
  const raw = tab.url || tab.pendingUrl || "";
  try {
    const url = new URL(raw);
    return {
      tab,
      url: raw,
      origin: url.origin,
      host: url.hostname.toLowerCase(),
      hostNoWww: stripWww(url.hostname),
      brand: brandOf(url.hostname),
      hasFav: Boolean(tab.favIconUrl),
    };
  } catch {
    return {
      tab,
      url: raw,
      origin: "",
      host: "",
      hostNoWww: "",
      brand: "",
      hasFav: Boolean(tab.favIconUrl),
    };
  }
}

function findOpenTabMatch(parsedTabs, target) {
  return (
    parsedTabs.find((tab) => tab.origin === target.origin && tab.hasFav) ||
    parsedTabs.find(
      (tab) => tab.hostNoWww && tab.hostNoWww === target.hostNoWww && tab.hasFav,
    ) ||
    parsedTabs.find((tab) => tab.brand && tab.brand === target.brand && tab.hasFav)
  );
}

export async function getFaviconFromOpenTabs(siteUrl) {
  try {
    if (!globalThis.chrome?.tabs?.query) return null;

    const url = normalizeUrl(siteUrl);
    if (!url) return null;

    const tabs = await globalThis.chrome.tabs.query({});
    const target = {
      origin: url.origin,
      host: url.hostname.toLowerCase(),
      hostNoWww: stripWww(url.hostname),
      brand: brandOf(url.hostname),
    };
    const hit = findOpenTabMatch(tabs.map(parseTab), target);
    const result = hit?.tab?.favIconUrl ?? null;

    if (result) {
      logger.debug("open tab favicon hit", {
        matchedBy:
          hit.origin === target.origin
            ? "origin"
            : hit.hostNoWww === target.hostNoWww
              ? "host-no-www"
              : "brand",
        tabId: hit.tab.id,
        tabUrl: hit.url,
      });
    } else {
      logger.debug("no open tab favicon found", target);
    }

    return result;
  } catch (error) {
    logger.warn("open tab favicon lookup failed", error);
    return null;
  }
}

export async function putCachedFavicon(siteUrl, faviconUrl, ttlMs = DEFAULT_TTL_MS) {
  const url = normalizeUrl(siteUrl);
  if (!url || !faviconUrl) return null;

  const key = hostKeyFromUrl(url);
  return writeCachedFavicon({
    key,
    url: faviconUrl,
    exp: ttlMs > 0 ? Date.now() + ttlMs : 0,
    host: key,
    brand: brandOf(url.hostname),
  });
}

export async function getCachedFavicon(
  siteUrl,
  { allowStale = true, revalidate = true } = {},
) {
  const url = normalizeUrl(siteUrl);
  if (!url) return null;

  const key = hostKeyFromUrl(url);
  const brand = brandOf(url.hostname);
  const hit = await readCachedFavicon(key);

  if (hit) {
    if (!isExpired(hit)) return hit.url || null;
    if (allowStale && hit.url) {
      if (revalidate) {
        getFaviconFromOpenTabs(siteUrl).then((live) => {
          if (live) putCachedFavicon(siteUrl, live);
        });
      }
      return hit.url;
    }

    logger.debug("cache expired, deleting", { key });
    await deleteCachedFavicon(key);
  }

  const brandEntry = await findCachedFaviconByBrand(brand);
  if (brandEntry) return brandEntry.url;

  if (!allowStale) return null;

  const staleBrandEntry = await findCachedFaviconByBrand(brand, {
    allowStale: true,
  });
  if (staleBrandEntry?.url) {
    if (revalidate) {
      getFaviconFromOpenTabs(siteUrl).then((live) => {
        if (live) putCachedFavicon(siteUrl, live);
      });
    }
    return staleBrandEntry.url;
  }

  return null;
}

export async function getFavicon(siteUrl) {
  const live = await getFaviconFromOpenTabs(siteUrl);
  if (live) {
    await putCachedFavicon(siteUrl, live);
    return live;
  }

  return getCachedFavicon(siteUrl, {
    allowStale: true,
    revalidate: true,
  });
}
