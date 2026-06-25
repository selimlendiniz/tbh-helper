# TBH Helper

> A feature-rich companion app for **Task Bar Hero** — view your inventory, track item values, and monitor Steam Market prices in real time.

[🇹🇷 Türkçe README için tıklayın](./README_TR.md)

---

## ⬇️ Download & Install

**No build required.** Just download the latest installer and run it.

👉 **[Download the latest release](https://github.com/selimlendiniz/tbh-helper/releases/latest)**

1. Download `TBH.Helper_x.x.x_x64-setup.exe` from the Assets section
2. Run the installer
3. Launch **TBH Helper** from your Start Menu or Desktop shortcut

> **Windows only.** The app reads the game's save file from a Windows-specific path.

---

## Features

- 🗂️ **Inventory Viewer** — Browse all your items across Inventory, Stash, Market listings, and Equipped slots
- 💰 **Steam Market Prices** — Automatically fetches live prices from the Steam Community Market
- 📊 **Analytics Panel** — Breakdown of your holdings by rarity, top-value items, and portfolio overview
- 🛒 **Market Explorer** — Search all tradable items and their current market values
- 🔴 **Real-Time Sync** — Watches your save file for changes and updates the view live
- 🔐 **Steam Account Integration** — Log in to Steam inside the app to bypass rate limits
- 🧮 **Total Inventory Value** — Displayed at a glance in the top navigation bar
- 🔍 **Search & Filter** — Filter by grade, search by name, and sort by value / name / grade

---

## How It Works

### Save File

The app automatically reads the game's encrypted save file located at:

```
%USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3
```

It decrypts the file using AES-128-CBC with PBKDF2-SHA1 key derivation, then parses your character data, inventory, stash, and equipped items.

You can also load a **custom save file** via the "Select Save File" button.

### Price Fetching

Prices are fetched from the [Steam Community Market](https://steamcommunity.com/market/) for the game's App ID.

There are two modes:

| Mode | How it works |
|---|---|
| **Guest** (no login) | Direct HTTP requests via Rust backend. Subject to Steam's 429 rate limits. |
| **Steam Connected** | Opens a Tauri webview window, logs you in to Steam, then navigates through market pages using your session cookies — much more reliable. |

Fetched prices are cached in `localStorage` and expire after 1 hour.

### Item Database

All item metadata (names, grades, types, levels, icons) is bundled locally in `tbh_data.json`. This file was extracted from the game's assets. If the game receives an update with new items, this file may need to be regenerated.

---

## Steam Integration

1. Click **Connect Steam** in the top bar
2. A Steam login window will open — sign in as you normally would
3. Once logged in, the app detects your session cookies and closes/hides the window
4. All subsequent price fetches will use your Steam session — no more 429 errors

To disconnect, click **Disconnect Steam**.

---

## External Dependencies

| Service | Purpose | When |
|---|---|---|
| `steamcommunity.com/market/` | Live item prices | Price refresh |
| `steamcommunity.com/login/` | Steam login page (webview) | Connect Steam |
| `fonts.googleapis.com` | Outfit font | App startup |

---

## For Developers

### Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri](https://tauri.app/) (Rust) |
| Frontend | React + TypeScript |
| Bundler | Vite |
| Styling | Vanilla CSS |
| Font | Outfit (Google Fonts) |

### Requirements

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/selimlendiniz/tbh-helper.git
cd tbh-helper

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run tauri dev

# 4. Build for production
npm run tauri build
```

### Project Structure

```
tbhhelper/
├── src/
│   ├── components/          # React UI components
│   │   ├── Header.tsx       # Top navigation bar
│   │   ├── ItemsGrid.tsx    # Item card grid
│   │   ├── ItemDetailModal.tsx  # Item detail popup
│   │   ├── MarketExplorer.tsx   # Market search view
│   │   ├── AnalyticsPanel.tsx   # Portfolio analytics
│   │   └── EquippedPanel.tsx    # Hero equipment view
│   ├── hooks/
│   │   └── useSaveData.ts   # Core state & data logic
│   ├── services/price/
│   │   └── SteamMarketProvider.ts  # Steam Market price fetcher
│   ├── utils/               # Helpers (fetch, stat formatting, etc.)
│   ├── types/               # TypeScript interfaces
│   ├── constants/           # Grade maps, class names, colors
│   └── tbh_data.json        # Bundled item database (~1.1 MB)
├── src-tauri/
│   ├── src/lib.rs           # Rust backend (file decrypt, fetch, Steam window)
│   └── capabilities/        # Tauri permission config
└── index.html
```

---

## License

MIT — feel free to use, modify, and distribute.

---

## Disclaimer

This is an **unofficial** third-party tool. It is not affiliated with, endorsed by, or connected to TesseractStudio or Valve Corporation. Use at your own risk.
