// src/utils/favicon.js

// ================= 共用工具 =================

function normalizeUrl(input) {
  try {
    const s = (input || "").trim();
    const u = s.startsWith("http") ? new URL(s) : new URL(`https://${s}`);
    return u;
  } catch (e) {
    console.log("[favicon] normalizeUrl failed:", { input, error: String(e) });
    return null;
  }
}

// 去掉常见前缀子域（目前仅 www.）
function stripWww(hostname = "") {
  return hostname.replace(/^www\./i, "");
}

// 粗略“品牌名”（不依赖 PSL，覆盖常见场景）
const GENERIC = new Set([
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
  // 常见国家/地区 TLD
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
function brandOf(hostname = "") {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  for (let i = parts.length - 2; i >= 0; i--) {
    if (!GENERIC.has(parts[i])) return parts[i];
  }
  return parts[0] || hostname;
}

// ================= 仅从已打开标签页获取 =================

/**
 * 只从“已打开的标签页”里取对应站点的 favicon。
 * 需要 manifest.json：
 *   "permissions": ["tabs"],
 *   "host_permissions": ["<all_urls>"]
 */
export async function getFaviconFromOpenTabs(siteUrl) {
  try {
    if (!globalThis.chrome?.tabs?.query) {
      return null;
    }

    const u = normalizeUrl(siteUrl);
    if (!u) {
      return null;
    }

    // 拿到所有 tab（需要 host 权限才能看到 url）
    const tabs = await chrome.tabs.query({});

    const origin = u.origin;
    const host = u.hostname.toLowerCase();
    const hostNoWww = stripWww(host);
    const brand = brandOf(host);

    // 统一结构
    const parsedTabs = tabs.map((t) => {
      const raw = t.url || t.pendingUrl || "";
      try {
        const tu = new URL(raw);
        return {
          tab: t,
          url: raw,
          origin: tu.origin,
          host: tu.hostname.toLowerCase(),
          hostNoWww: stripWww(tu.hostname),
          brand: brandOf(tu.hostname),
          hasFav: !!t.favIconUrl,
        };
      } catch {
        return {
          tab: t,
          url: raw,
          origin: "",
          host: "",
          hostNoWww: "",
          brand: "",
          hasFav: !!t.favIconUrl,
        };
      }
    });

    // 1) 严格同源
    const sameOriginTabs = parsedTabs.filter((x) => x.origin === origin);
    let hit = sameOriginTabs.find((x) => x.hasFav);

    // 2) 去 www. 后主机名一致
    if (!hit) {
      const sameHostNoWww = parsedTabs.filter(
        (x) => x.hostNoWww && x.hostNoWww === hostNoWww,
      );

      hit = sameHostNoWww.find((x) => x.hasFav);
    }

    // 3) 品牌名一致（如 google.com vs google.com.au）
    if (!hit) {
      const sameBrand = parsedTabs.filter((x) => x.brand && x.brand === brand);

      hit = sameBrand.find((x) => x.hasFav);
    }

    const result = hit?.tab?.favIconUrl ?? null;
    if (result) {
      console.log("[favicon] hit:", {
        matchedBy:
          hit.origin === origin
            ? "origin"
            : hit.hostNoWww === hostNoWww
              ? "host-no-www"
              : "brand",
        tabId: hit.tab.id,
        tabUrl: hit.url,
        favIconUrl: result,
      });
    } else {
      console.log("[favicon] no favicon found for:", { origin, host, brand });
    }

    return result;
  } catch (e) {
    console.log("[favicon] error:", String(e));
    return null;
  }
}

// ================= 本地缓存（stale-while-revalidate） =================

// 缓存键：去 www 的 hostname；条目包含 { url, exp, host, brand }
const CACHE_KEY = "favicon_cache_v1";
const DEFAULT_TTL_MS = 30 * 24 * 3600 * 1000; // 30 天

function hostKeyFromUrl(u) {
  return stripWww(u.hostname.toLowerCase());
}

async function loadCache() {
  try {
    if (chrome?.storage?.local?.get) {
      const obj = await chrome.storage.local.get(CACHE_KEY);
      const cache = obj?.[CACHE_KEY] || {};
      return cache;
    }
  } catch (e) {
    console.log("[favicon] loadCache chrome.storage error:", String(e));
  }
  // fallback 到 localStorage（开发环境）
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  try {
    if (chrome?.storage?.local?.set) {
      await chrome.storage.local.set({ [CACHE_KEY]: cache });
      return;
    }
  } catch (e) {
    console.log("[favicon] saveCache chrome.storage error:", String(e));
  }
  // fallback
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.log("[favicon] saveCache localStorage error:", String(e));
  }
}

async function putCachedFavicon(siteUrl, favUrl, ttlMs = DEFAULT_TTL_MS) {
  const u = normalizeUrl(siteUrl);
  if (!u || !favUrl) return;
  const key = hostKeyFromUrl(u);
  const cache = await loadCache();
  cache[key] = {
    url: favUrl,
    exp: ttlMs > 0 ? Date.now() + ttlMs : 0,
    host: key,
    brand: brandOf(u.hostname),
  };
  await saveCache(cache);
}

/**
 * 读取缓存：
 * - 命中且未过期：直接返回并可选择续期（此处不续期，交给上层决定）
 * - 命中过期：如果 allowStale=true，先返回旧值；若 revalidate=true 异步刷新
 * - 未命中：支持按 brand 兜底（同品牌下的任意条目）
 */
async function getCachedFavicon(
  siteUrl,
  { allowStale = true, revalidate = true } = {},
) {
  const u = normalizeUrl(siteUrl);
  if (!u) return null;

  const key = hostKeyFromUrl(u);
  const brand = brandOf(u.hostname);
  const cache = await loadCache();

  const hit = cache[key];

  const isExpired = (entry) => entry?.exp > 0 && Date.now() > entry.exp;

  // 1) 先看当前 host key
  if (hit) {
    if (!isExpired(hit)) {
      return hit.url || null;
    }
    // 过期
    if (allowStale && hit.url) {
      if (revalidate) {
        // 异步 SWR：尝试用“已打开标签页”刷新
        getFaviconFromOpenTabs(siteUrl).then((live) => {
          if (live) putCachedFavicon(siteUrl, live);
        });
      }
      return hit.url;
    } else {
      console.log("[favicon] cache expired, delete", { key });
      delete cache[key];
      await saveCache(cache);
    }
  }

  // 2) 用 brand 兜底（例如 google.com 与 google.com.au 共享一份）
  const brandEntry = Object.values(cache).find(
    (e) => e && e.brand === brand && e.url && !isExpired(e),
  );
  if (brandEntry) {
    return brandEntry.url;
  }

  // 3) 允许过期也用（brand 层）
  if (allowStale) {
    const staleBrandEntry = Object.values(cache).find(
      (e) => e && e.brand === brand && e.url && isExpired(e),
    );
    if (staleBrandEntry) {
      if (revalidate) {
        getFaviconFromOpenTabs(siteUrl).then((live) => {
          if (live) putCachedFavicon(siteUrl, live);
        });
      }
      return staleBrandEntry.url;
    }
  }

  return null;
}

// ================= 对外入口（SWR 包装） =================

/**
 * getFavicon(siteUrl):
 * - 先尝试从“已打开的标签页”拿（命中则写缓存）
 * - 否则使用缓存（SWR：过期也先用，并在后台尝试刷新）
 * - 全程不发网络请求
 */
export async function getFavicon(siteUrl) {
  // 1) 实时 tab
  const live = await getFaviconFromOpenTabs(siteUrl);
  if (live) {
    await putCachedFavicon(siteUrl, live);
    return live;
  }

  // 2) 缓存（stale-while-revalidate）
  const cached = await getCachedFavicon(siteUrl, {
    allowStale: true,
    revalidate: true,
  });
  return cached; // 可能是 null（都没命中）
}
