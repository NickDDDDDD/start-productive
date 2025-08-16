# Start Productive

**Start Productive** is a customizable new tab page that helps you stay organized by combining quick-access link management with personal task tracking. Easily store, categorize, and access your most visited websites, while keeping track of daily to-dos — all in one clean and intuitive interface.

---

## ✨ Features

- **Quick-access links:** add, organize, and open your most used sites in one click.
- **Tasks / To-dos:** track daily items right on the new tab.
- **Icons & colors:** assign a `react-icons` icon and a color tint to each link for quick visual scanning.
- **Local-first:** data is stored locally (Chrome Storage / `localStorage`).

---

## 🚀 How to use

### Quick-access links

- **Add a link:** click **Add Link (＋)** → fill **Name** and **URL** → (optional) set **Icon** and **Color** → **Save**.
- **Icon (dynamic react-icons):** paste an **icon ID** in the format `pack/ComponentName`, e.g.:
  - `lu/LuPlus`, `ai/AiFillChrome`, `ri/RiDeleteBin2Line`
  - Copy the component name from the _react-icons_ search page, then prefix with the pack (e.g., `lu/`, `ai/`, `ri/`).
  - **Case-sensitive.** If it doesn’t render, verify the spelling and that the pack is enabled in your `PACK_IMPORTERS`.

- **Color:** use the built-in color picker to tint the icon.
- **Edit / delete:** toggle **Edit** mode, then use the trash icon on a card to remove it.

### Tasks & to-dos

- Add items for today and check them off as you go—right next to your quick links.

### Personalization

- Emoji-friendly names/placeholders (e.g., “🔍 Search cards”).
- Tailwind-based styling—extend classes as you like.

---

## 🧩 Icon loading (how it works)

- Each link stores an **`iconId` string** (e.g., `ai/AiFillChrome`), **not** a React component.
- At render time, `loadIconById(iconId)` **dynamically imports** the icon pack and picks the named export.
- To keep bundles small and enable code-splitting, **do not statically import** icons from the same packs elsewhere (e.g., avoid `import { RiX } from "react-icons/ri"` if you dynamically import `ri`).

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

- **My icon doesn’t render. Why?**
  The `iconId` must be `pack/ComponentName` (case-sensitive). Ensure that the pack exists in your `PACK_IMPORTERS` and that you haven’t also statically imported from the same pack elsewhere.
- **Bundle is large. What can I do?**
  Avoid mixing static and dynamic imports for the same `react-icons` pack; restrict `PACK_IMPORTERS` to a few packs you actually use.
- **Data disappeared after reloading the extension.**
  Please back up (see above). During development, full overwrites or default initialization can wipe prior data. Use partial merges and export/import.

---

## ⚠️ Disclaimer

**Current storage uses Chrome’s Storage. Data may be lost when reloading the extension in development. We plan to adopt a more robust persistence approach in the future. Please back up your data regularly.**
