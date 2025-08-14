const KEY = "kanban_state_v1";

const hasChromeStorage =
  typeof chrome !== "undefined" && chrome?.storage && chrome.storage.local;

export async function loadState() {
  if (hasChromeStorage) {
    return new Promise((resolve) => {
      chrome.storage.local.get([KEY], (res) => {
        resolve(res[KEY] || { columns: [], cards: [] });
      });
    });
  }
  // 开发/网页环境兜底
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { columns: [], cards: [] };
  } catch {
    return { columns: [], cards: [] };
  }
}

export async function saveState(state) {
  if (hasChromeStorage) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [KEY]: state }, resolve);
    });
  }
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function subscribeState(handler) {
  if (typeof chrome !== "undefined" && chrome?.storage?.onChanged) {
    const listener = (changes, area) => {
      // 全量日志，确认事件是否抵达
      console.debug("[onChanged] area=", area, "keys=", Object.keys(changes));
      if (area === "local" && changes[KEY]) {
        console.debug("[onChanged] newValue=", changes[KEY].newValue);
        handler(changes[KEY].newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
  return () => {};
}
