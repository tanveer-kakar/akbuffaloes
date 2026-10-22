import { notifyBuffaloesUpdated } from "@/data/buffaloBreedsData";

const CLOUD_SYNC_BASE = "https://kvdb.io/ak_buffaloes_v2_";
const SYNC_TABLES = [
  "buffalo_listings",
  "gallery_items",
  "promo_popups",
  "festival_settings",
  "festival_occasions",
  "farm_settings",
];

let lastSyncTimes: Record<string, number> = {};

/**
 * Pushes updated table records to the shared cloud KV store so that any other
 * browser or device immediately receives the updates on static hosting (Netlify).
 */
export async function pushCloudSync(table: string, records: unknown[]): Promise<void> {
  if (typeof window === "undefined" || !records || !Array.isArray(records)) return;
  if (!SYNC_TABLES.includes(table)) return;

  try {
    const payload = JSON.stringify(records);
    // 1. Try sending to local/Netlify /api/data endpoint
    try {
      void fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table,
          operation: "upsert",
          values: records,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // 2. Also push to Cloud KV store as static hosting cross-browser bridge
    try {
      void fetch(`${CLOUD_SYNC_BASE}${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch(() => {});
    } catch {
      // ignore
    }

    lastSyncTimes[table] = Date.now();
  } catch {
    // ignore network sync errors
  }
}

/**
 * Pulls the latest records for a table from the shared cloud KV store or /api/data,
 * merges them into localStorage, and notifies listeners so the UI reflects changes instantly.
 */
export async function pullCloudSync(table: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!SYNC_TABLES.includes(table)) return false;

  const now = Date.now();
  // Don't pull too frequently (at most once every 3 seconds per table)
  if (lastSyncTimes[table] && now - lastSyncTimes[table] < 3000) {
    return false;
  }
  lastSyncTimes[table] = now;

  const storageKey = `ak_offline_${table}`;

  // 1. Try pulling from /api/data first
  try {
    const apiRes = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table,
        operation: "select",
        projection: "*",
      }),
    });
    const contentType = apiRes.headers.get("content-type") || "";
    if (apiRes.ok && !contentType.includes("text/html")) {
      const json = await apiRes.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        mergeIntoLocalStorage(storageKey, json.data, table);
        return true;
      }
    }
  } catch {
    // API not reachable, try cloud KV fallback
  }

  // 2. Try pulling from Cloud KV store
  try {
    const cloudRes = await fetch(`${CLOUD_SYNC_BASE}${table}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    if (cloudRes.ok) {
      const data = await cloudRes.json();
      if (Array.isArray(data) && data.length > 0) {
        mergeIntoLocalStorage(storageKey, data, table);
        return true;
      }
    }
  } catch {
    // ignore cloud sync error
  }

  return false;
}

function mergeIntoLocalStorage(storageKey: string, remoteRecords: any[], table: string) {
  try {
    const rawLocal = localStorage.getItem(storageKey);
    let localRecords: any[] = rawLocal ? JSON.parse(rawLocal) : [];

    if (!Array.isArray(localRecords) || localRecords.length === 0) {
      localStorage.setItem(storageKey, JSON.stringify(remoteRecords));
      triggerTableUpdate(table);
      return;
    }

    // Merge by id
    const mergedMap = new Map<string, any>();
    for (const item of localRecords) {
      if (item && item.id) mergedMap.set(String(item.id), item);
    }

    let hasChanges = false;
    for (const remote of remoteRecords) {
      if (!remote || !remote.id) continue;
      const remoteId = String(remote.id);
      const local = mergedMap.get(remoteId);

      if (!local) {
        mergedMap.set(remoteId, remote);
        hasChanges = true;
      } else {
        const localTime = local.updated_at ? Date.parse(local.updated_at) : 0;
        const remoteTime = remote.updated_at ? Date.parse(remote.updated_at) : 0;
        // If remote is strictly newer or has fields updated, apply remote
        if (remoteTime > localTime) {
          mergedMap.set(remoteId, { ...local, ...remote });
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      const mergedList = Array.from(mergedMap.values());
      localStorage.setItem(storageKey, JSON.stringify(mergedList));
      triggerTableUpdate(table);
    }
  } catch {
    // ignore JSON merge errors
  }
}

function triggerTableUpdate(table: string) {
  if (table === "buffalo_listings") {
    notifyBuffaloesUpdated();
  } else if (table === "promo_popups") {
    try {
      window.dispatchEvent(new CustomEvent("ak-promo-popups-updated"));
    } catch {}
  } else if (table === "festival_settings" || table === "festival_occasions") {
    try {
      window.dispatchEvent(new CustomEvent("ak_buffalo_festival_sync"));
    } catch {}
  }
}
