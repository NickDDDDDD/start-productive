# Start Productive

**Start Productive** is a customizable new tab page that helps you stay organized by combining quick-access link management with personal task tracking. Easily store, categorize, and access your most visited websites, while keeping track of daily to-dos — all in one clean and intuitive interface.

---

## ✨ Features

- **Quick-access links:** add, organize, and open your most used sites in one click.
- **Tasks / To-dos:** track daily items right on the new tab.
- **Favicons:** links show a cached favicon when Chrome has one available, with an initial-letter fallback.
- **Local-first:** core data is stored locally in IndexedDB through Dexie.

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

## 💾 Data storage & backups

Core board data is stored in **IndexedDB** through **Dexie**. Links, columns, cards,
visibility settings, and import backups live in separate object stores so large
updates can be written transactionally.

Use the in-app **Export Excel** action to create a portable backup. **Import Excel**
parses the workbook first, shows a preview, and lets you either merge records by
`id` or replace all current data. Replace operations create an IndexedDB backup
before writing the imported workbook.

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
  Export an Excel backup regularly. Core data now lives in IndexedDB, while Excel import/export is the supported backup and restore path.

---

## ⚠️ Disclaimer

Core data is local to the browser profile. Excel export/import is the supported way to move or back up data.
