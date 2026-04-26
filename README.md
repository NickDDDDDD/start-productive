# Start Productive

**Start Productive** is a customizable new tab page that helps you stay organized by combining quick-access link management with personal task tracking. Easily store, categorize, and access your most visited websites, while keeping track of daily to-dos — all in one clean and intuitive interface.

---

## ✨ Features

- **Quick-access links:** add, organize, and open your most used sites in one click.
- **Tasks / To-dos:** track daily items right on the new tab.
- **Favicons:** links show a cached favicon when Chrome has one available, with an initial-letter fallback.
- **Local-first:** data is stored locally (Chrome Storage / `localStorage`).

---

## 🚀 How to use

### Quick-access links

- **Add a link:** click **Add Link (＋)** → fill **Name** and **URL** → (optional) set **Icon** and **Color** → **Save**.
- **Edit / delete:** toggle **Edit** mode, then use the trash icon on a card to remove it.

### Tasks & to-dos

- Add items for today and check them off as you go—right next to your quick links.

### Personalization

- Emoji-friendly names/placeholders (e.g., “🔍 Search cards”).
- Vue 3 + Arco Design Vue UI with Less styles.

---

## 🧩 Frontend stack

- **Vue 3 + Vite:** single-page new-tab UI.
- **Pinia:** central board state for columns, cards, links, visibility, and search.
- **Arco Design Vue:** buttons, inputs, drawer, dropdowns, date/time controls, and feedback UI.
- **Less:** app layout, Kanban sizing, drag states, and small Arco overrides.
- **vue.draggable.next / SortableJS:** link, column, and card ordering.

---

## 🧭 Install as a Chrome Extension (override New Tab)

> This project targets **Manifest V3**. The existing `public/manifest.json` is copied into `dist/` by Vite on build.

### Quick install (fork → build → load)

1. **Fork & clone** the repo.

2. **Install deps:**

   ```bash
   npm install
   # or: pnpm i / yarn
   ```

3. **Build:**

   ```bash
   npm run build   # outputs to dist/
   ```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the **`dist/`** folder (the one that contains `manifest.json`)

5. **Test:** open a new tab — Start Productive should replace the default New Tab.

> You don’t need to create a new `manifest.json` if the repo already has one in `public/`.
> If you want to customize the name/icons/permissions, edit `public/manifest.json` **before** building.

### Reload after changes

- Re-run `npm run build`, then in `chrome://extensions/` click **Reload** on the extension card.
- If the New Tab doesn’t switch, ensure no other New Tab extension is enabled (only one can override at a time).

### Troubleshooting

- **“Could not load manifest.”**
  Make sure you selected the **`dist/`** folder (it must contain `manifest.json`, `index.html`, `assets/`).
- **New Tab not overridden**
  Disable other New Tab extensions; confirm `chrome_url_overrides.newtab` in the manifest points to `index.html`.

---

## 💾 Data storage & backups (important)

> **Heads-up:** The app currently uses **Chrome’s Storage / `localStorage`**. During development or when **reloading the extension**, data may be lost if initialization overwrites storage or if full-object writes are used without merging. We may adopt a more robust persistence approach later.
> **Please back up your data.**

### Manual backup (temporary approach)

Replace `APP_STATE_KEY` with your actual key constant.

**If using `chrome.storage.local`:**

```js
// Read backup
chrome.storage.local.get(['APP_STATE_KEY'], (res) => {
  const json = JSON.stringify(res.APP_STATE_KEY || {}, null, 2);
  console.log(json); // copy this JSON somewhere safe
});

// Restore from backup
const data = /* your backed-up JSON object */;
chrome.storage.local.set({ APP_STATE_KEY: data });
```

**If using `localStorage`:**

```js
// Read backup
const json = localStorage.getItem("APP_STATE_KEY");
console.log(json);

// Restore from backup
localStorage.setItem("APP_STATE_KEY", jsonString);
```

**Recommended:** add in-app **Export / Import** (download/upload JSON) so users don’t need DevTools.

### Developer tips to avoid accidental loss

- **Partial merge on save:** `next = { ...prev, ...partial }` instead of overwriting the whole object.
- **Careful init:** only write defaults when storage is empty—don’t clobber existing saves.
- **Debounce & subscribe:** throttle writes and merge in updates from other tabs to prevent stale overwrites.

---

## 🛠 Scripts

```bash
npm run dev      # local development
npm run build    # produces dist/
npm run preview  # preview the build (new-tab override still requires loading as an extension)
```

---

## ❓ FAQ

- **Bundle is large. What can I do?**
  Arco is currently registered globally for simpler migration. Switch to on-demand imports later if bundle size becomes important.
- **Data disappeared after reloading the extension.**
  Please back up (see above). During development, full overwrites or default initialization can wipe prior data. Use partial merges and export/import.

---

## ⚠️ Disclaimer

**Current storage uses Chrome’s Storage. Data may be lost when reloading the extension in development. We plan to adopt a more robust persistence approach in the future. Please back up your data regularly.**
