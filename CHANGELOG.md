# Changelog

## [0.0.4] - 2026-06-29

### Added

- **Live orderbook polling**: `fetchOrderBook()` in `marketDataService.ts` — fetches Steam Market `/market/orderbook` JSON API every 5 seconds
- **Orderbook UI**: buy/sell grid replaces "Cheapest Active Listings" in right column; summary strip with Highest Buy / Lowest Sell / Spread + 🟢 LIVE badge
- **Live price header**: "Live Price" badge + "Last Known Price" reference in modal header
- **Live chart points**: `livePricePoints` state accumulates up to 60 data points, merged with SSR history for graph display
- **Pulsing green dot** on latest chart point (`liveChartPulse` CSS animation)
- **Green tooltip**: border and price/volume values turn green when hovering a live data point
- **`fetch_url` header support** in Rust backend: `headers: Option<HashMap<String, String>>`
- **`fetchUrlWithRetry` header parameter**: `headers?: Record<string, string>`
- **`updateItemPrice` action** in `useSaveData` hook — writes live price back to parent store
- **Locale keys** for orderbook UI: `livePrice`, `highestBuy`, `lowestSell`, `spread`, `buyOrders`, `sellOrders`, `orderbookUnavailable`, `loadingOrderbook`
- **`fetchStartedRef` guard** to prevent duplicate initial fetches in React StrictMode
- **`fetchUrlPostWithRetry` utility**: POST request with exponential backoff retry, uses Tauri `fetch_url_post` command
- **Steam search fallback**: when local item list has no results, searches Steam Market API via `SteamMarketProvider.searchItems()`
- **Multi-token search**: search query is split into tokens; numeric tokens match level/name/marketHashName, text tokens match name (TR/EN)/marketHashName/gearType/grade
- **`matchSearchQuery` shared utility**: DRY multi-token filtering used by both filteredItems and marketFilteredItems
- **Steam search UI indicators**: "Searching Steam Market..." spinner in empty state + "Steam..." badge in search input (market tab only)
- **400ms debounced Steam search**: avoids excessive API calls while typing
- **Steam results auto-cache**: prices from Steam search are immediately cached in the price store
- **Dedup with local results**: Steam search results merged with local items, duplicates excluded
- **`gearType`/`level` parsing**: extracted from Steam's `type` field ("Bow - Lv. 80" → `{ gearType: "BOW", level: 80 }`)
- **Grade inference**: from market hash name parentheses `(Legendary)` or Steam name color codes
- **Price utility functions**: `centsToDollars()`, `parsePriceString()`, `formatPrice()`, `formatPriceShort()` in `src/utils/index.ts`
- **`marketDataService.ts`**: dedicated service with `fetchMarketDetail()` — fetches and parses Steam Market SSR HTML for price history + sell orders

### Changed

- **`ItemDetailModal`**: initial load uses `Promise.all([fetchMarketDetail, fetchOrderBook])` in parallel; orderbook polling with `setInterval(5000)` and `clearInterval` cleanup
- **`fetchMarketDetail`** simplified: SSR listing parsing removed (orderbook API replaces it)
- **`modal-header-section` padding-right**: 36px to avoid overlap with close (X) button
- **SteamMarketProvider**: `parseSteamPrice()` removed, uses shared `parsePriceString()` + `centsToDollars()` instead; all `sell_price / 100` → `centsToDollars(item.sell_price)`
- **`ItemDetailModal` SSR parsing extracted**: inline regex HTML parsing moved to `marketDataService.ts`, component now calls `fetchMarketDetail()`
- **`formatPrice` usage**: local `const formatPrice` removed, uses shared `formatPrice` from utils (identical behavior)
- **Search filter unified**: both "all items" and "market" tabs use the shared `matchSearchQuery()` instead of duplicated inline `includes()` logic

### Fixed

- **Duplicate initial fetch prevention**: `fetchStartedRef` guards against StrictMode / parent re-render
- **`onPriceUpdate` dependency-trigger prevention**: `useRef` instead of dependency array avoids unnecessary effect re-runs

## [0.0.3] - 2026-06-29

### Added

- **Item database panel**: `gear_details.json` with comprehensive gear data, integrated into item detail modal
- **Material effects system**: `MaterialEffectsPanel` component with full `material_effects.json` (4247 entries) — maps material IDs to their effects
- **Item stats card**: detailed stat breakdown in `ItemDetailModal` with `getInherentStats()`, `getInherentOptions()`, `STAT_TRANSLATIONS`
- **Unique mods**: `getUniqueModKeyById()` for identifying and displaying unique item modifiers
- **Category type filter** (`typeFilter`): filter items by gear type (weapon, armor, accessory, etc.)
- **Unique items toggle** (`onlyUniqueFilter`): show/hide only unique-named items
- **Unobtainable item warnings**: `isUnobtainableItem()` marks deprecated/removed items in the UI
- **Grade-based styling**: improved `GRADE_COLORS` and `GRADE_RANK` constants for consistent grade display
- **Extended `MarketItem` type**: `statModifier` interface for structured stat data

### Changed

- **Item detail modal** (`ItemDetailModal.tsx`): major expansion — item stats card, wiki link button, stat translations (EN/TR), unobtainable badges, material effects panel
- **`ItemsGrid` and `MarketExplorer`**: both accept `typeFilter` and `onlyUniqueFilter` props for category/unique filtering
- **Item card**: added grade-based visual enhancements
- **Utility exports**: `getInherentStats`, `getInherentOptions`, `getUniqueModKeyById`, `isUnobtainableItem` added to `src/utils/index.ts`
- **Styles**: added `materials.css` (536 lines) and extended `item-detail-modal.css`

### Fixed

- **Type safety**: `statModifier` field added to item types to match actual game data structure

## [0.0.2] - 2026-06-29

### Added

- **Steam price fetch config**: all tunable parameters (`pageSize`, retries, delays) centralized in `src/services/price/config.ts`
- **Turkish agent guide**: `.agents/AGENTS_TR.md` with full Turkish translation of architecture and development documentation

### Changed

- **Page size 10 → 100**: reduces ~75 Steam Market pages to ~8 per full price fetch (configurable via `PriceFetchConfig.pageSize`)
- **Price fetch DRY refactor**: extracted `buildSearchUrl()`, `calcTotalPages()`, `calcCurrentPage()` helpers, removed duplicated pagination math
- **Price fetch completely hidden**: removed `show_steam_window` call — no more visible "Steam Market Sync" window during price refresh
- **AGENTS.md** rewritten with comprehensive project architecture, commands, and conventions

### Fixed

- **Misleading 429 log**: non-429 errors on Page 1 no longer log "Steam 429" or trigger unnecessary 60s backoff; only real 429 errors wait, others retry immediately
