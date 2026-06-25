import { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { TbhItem, ParsedSave, MarketItem, AnalyticsData, TabType, SortType } from "../types";
import { GRADE_MAP, GRADE_COLORS, HERO_CLASS_NAMES, GRADE_RANK } from "../constants";
import { PriceManager } from "../services/price/PriceManager";

// @ts-ignore
import tbhDataRaw from "../tbh_data.json";
const tbhData: any = tbhDataRaw;

export function useSaveData() {
  const [saveData, setSaveData] = useState<any>(null);
  const [prices, setPrices] = useState<Record<string, { price: number; updatedAt: number }>>({});
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortType>("value");
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [steamRateLimited, setSteamRateLimited] = useState(false);
  const [steamLoggedIn, setSteamLoggedIn] = useState(false);

  useEffect(() => {
    invoke<boolean>("is_steam_logged_in")
      .then((loggedIn) => setSteamLoggedIn(loggedIn))
      .catch((err) => console.error("Failed to check Steam login:", err));
  }, []);

  const connectSteam = async () => {
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      
      const label = "steam_login_window";
      const loginWin = new WebviewWindow(label, {
        url: "https://steamcommunity.com/login/home/?goto=",
        title: "Steam Login",
        width: 800,
        height: 600,
        center: true,
      });

      setStatusMessage("Waiting for Steam login...");
      
      const interval = setInterval(async () => {
        try {
          const success = await invoke<boolean>("get_steam_cookies", { label });
          if (success) {
            clearInterval(interval);
            setSteamLoggedIn(true);
            setStatusMessage("Successfully connected to Steam!");
            await loginWin.hide();
            refreshPrices(false);
          }
        } catch (e) {
          console.error("Error checking cookies:", e);
        }
      }, 3000);

      loginWin.once("tauri://destroyed", () => {
        clearInterval(interval);
        setStatusMessage("Steam login window closed.");
      });
    } catch (err) {
      console.error("Failed to connect Steam:", err);
      setStatusMessage("Failed to launch Steam login window.");
    }
  };

  const disconnectSteam = async () => {
    try {
      await invoke("logout_steam");
      setSteamLoggedIn(false);
      setStatusMessage("Disconnected from Steam.");
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const win = await WebviewWindow.getByLabel("steam_login_window");
        if (win) {
          await win.close();
        }
      } catch (e) {
        console.warn("Failed to find or close steam_login_window:", e);
      }
    } catch (err) {
      console.error("Failed to logout Steam:", err);
      setStatusMessage("Failed to disconnect from Steam.");
    }
  };

  const priceManager = useMemo(() => new PriceManager(), []);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stopFetching = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoadingPrices(false);
    setStatusMessage("Price fetching stopped by user.");
  };

  const refreshPrices = async (clearCache = false) => {
    if (loadingPrices) return;

    if (clearCache) {
      try {
        localStorage.removeItem("steam_prices_cache");
      } catch (e) {
        console.warn("Failed to clear cached prices:", e);
      }
      setPrices({});
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setSteamRateLimited(false);
    setLoadingPrices(true);
    setStatusMessage("Updating Steam Market prices in background...");
    try {
      const now = Date.now();
      const { prices: sPrices } = await priceManager.fetchPrices((incrementalPrices, current, total, has429) => {
        if (signal.aborted) return;
        if (has429) {
          setSteamRateLimited(true);
        }
        const mappedIncremental: Record<string, { price: number; updatedAt: number }> = {};
        for (const key in incrementalPrices) {
          mappedIncremental[key] = { price: incrementalPrices[key], updatedAt: now };
        }
        setPrices((prev) => ({ ...prev, ...mappedIncremental }));
        setStatusMessage(`Updating prices (Page ${current}/${total})...`);
      }, signal);

      if (signal.aborted) {
        setStatusMessage("Price fetching stopped by user.");
        return;
      }

      setStatusMessage("Market prices updated successfully from Steam.");
      
      setPrices((prev) => {
        const merged = { ...prev };
        for (const key in sPrices) {
          merged[key] = { price: sPrices[key], updatedAt: now };
        }
        try {
          localStorage.setItem("steam_prices_cache", JSON.stringify(merged));
        } catch (e) {
          console.warn("Failed to cache prices:", e);
        }
        return merged;
      });
    } catch (err) {
      if (signal.aborted) {
        setStatusMessage("Price fetching stopped by user.");
        return;
      }
      console.error("Failed to fetch prices:", err);
      if (String(err).includes("429")) {
        setSteamRateLimited(true);
      }
      setStatusMessage("Failed to fetch Steam Market prices.");
    } finally {
      if (!signal.aborted) {
        setLoadingPrices(false);
      }
    }
  };

  const refreshPricesRef = useRef(refreshPrices);
  useEffect(() => {
    refreshPricesRef.current = refreshPrices;
  });

  // Setup periodic refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Periodic background refresh triggered.");
      refreshPricesRef.current(false); // Do NOT clear cache
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  // Fetch prices from Steam on startup
  useEffect(() => {
    // 1. Try to load cached prices from localStorage first
    try {
      const cached = localStorage.getItem("steam_prices_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        const migrated: Record<string, { price: number; updatedAt: number }> = {};
        for (const key in parsed) {
          const val = parsed[key];
          if (typeof val === "number") {
            migrated[key] = { price: val, updatedAt: Date.now() };
          } else if (val && typeof val === "object" && typeof val.price === "number") {
            migrated[key] = { price: val.price, updatedAt: val.updatedAt || Date.now() };
          }
        }
        setPrices(migrated);
        console.log("Loaded prices from localStorage cache.");
      }
    } catch (e) {
      console.warn("Failed to load cached prices:", e);
    }

    // 2. Load local save file immediately without blocking
    loadSaveFile();
  }, [priceManager]);

  // Listen to file watcher updates
  useEffect(() => {
    let unlisten: any = null;

    listen<string>("save_updated", (event) => {
      try {
        const parsed = JSON.parse(event.payload);
        setSaveData(parsed);
        setIsLive(true);
        setStatusMessage("Save file updated in real-time.");
      } catch (err) {
        console.error("Failed to parse watcher payload:", err);
        setStatusMessage("Real-time save parsing error.");
      }
    }).then((fn) => {
      unlisten = fn;
    });

    // Start background watcher on Rust backend
    invoke("start_save_watcher")
      .then(() => {
        console.log("Save watcher thread launched on backend.");
      })
      .catch((err) => {
        console.error("Failed to start save watcher:", err);
      });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const loadSaveFile = () => {
    setStatusMessage("Decrypting SaveFile_Live.es3...");
    invoke<string>("decrypt_save_file")
      .then((res) => {
        const parsed = JSON.parse(res);
        setSaveData(parsed);
        setIsLive(true);
        setStatusMessage("Save file loaded successfully.");
      })
      .catch((err) => {
        console.error("Decrypt save file command failed:", err);
        setStatusMessage("Save file not loaded. Make sure the game is running or you have created a character.");
        setIsLive(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const selectManualSaveFile = () => {
    setStatusMessage("Opening file dialog...");
    invoke<string>("select_custom_save_file")
      .then((path) => {
        setStatusMessage(`Loaded custom save file: ${path}`);
        loadSaveFile();
      })
      .catch((err) => {
        console.error("Select custom save file failed:", err);
        setStatusMessage(err || "Save file selection cancelled.");
      });
  };

  // Parse items from save structure
  const parsedSave = useMemo<ParsedSave | null>(() => {
    if (!saveData) return null;
    
    try {
      let pValueText = saveData.PlayerSaveData.value;
      let playerSave: any;
      if (typeof pValueText === "string") {
        const processed = pValueText
          .replace(/:(\s*)(\d{15,20})/g, ':$1"$2"')
          .replace(/([\[,])\s*(\d{15,20})\s*(?=[,\]])/g, '$1"$2"');
        playerSave = JSON.parse(processed);
      } else {
        playerSave = pValueText;
      }
      
      const itemSaveDatas = playerSave.itemSaveDatas || [];
      const itemLookupMap: Record<string, any> = {};
      for (const item of itemSaveDatas) {
        itemLookupMap[item.UniqueId] = item;
      }
      
      const resolveList = (rawList: any[], _onMarket: boolean, locationLabel: string) => {
        const tempResolved: TbhItem[] = [];
        for (const raw of rawList) {
          const details = itemLookupMap[raw.ItemUniqueId] || raw.Item || (raw.ItemKey != null ? raw : null);
          if (details) {
            const itemKey = String(details.ItemKey);
            const lookupKey = itemKey.endsWith("900") ? itemKey.slice(0, -3) : itemKey;
            
            const props = tbhData.properties[lookupKey] || {};
            const name = tbhData.names[lookupKey] || `Item #${lookupKey}`;
            const gradeCode = props.g || "COM";
            const grade = GRADE_MAP[gradeCode] || "Common";
            const level = props.l || null;
            const gearType = props.t || null;
            const isMaterial = props.tp === "MATERIAL";
            const iconUrl = tbhData.icons[props.s] || null;
            const quantity = raw.Quantity ?? raw.Count ?? raw.Amount ?? details.Quantity ?? details.Count ?? details.Amount ?? 1;
            
            let marketHashName = name;
            if (!isMaterial) {
              marketHashName = name.includes(`(${grade})`) ? `${name} A` : `${name} (${grade}) A`;
            }
            
            const priceData = prices[marketHashName];
            const isExpired = priceData && (Date.now() - priceData.updatedAt > 60 * 60 * 1000);
            const price = (priceData && !isExpired) ? priceData.price : null;
            const totalValue = price !== null ? price * quantity : null;
            const updatedAt = priceData ? priceData.updatedAt : null;
            
            tempResolved.push({
              uniqueId: String(raw.ItemUniqueId),
              itemKey,
              lookupKey,
              name,
              grade,
              gradeColor: GRADE_COLORS[grade] || GRADE_COLORS.Unknown,
              level,
              gearType,
              isMaterial,
              iconUrl,
              quantity,
              marketHashName,
              price,
              totalValue,
              updatedAt,
              isChaotic: !!details.IsChaotic,
              isBlocked: !!details.IsBlocked,
              slot: raw.Index ?? 0,
              location: locationLabel,
              enchantCount: details.EnchantCount,
              enchantData: details.EnchantData,
              engravingCount: details.EngravingAppliedTotalCount,
              inscriptionCount: details.InscriptionAppliedTotalCount,
              decorationCount: details.DecorationAppliedTotalCount
            });
          }
        }

        // Group / Stack identical items in the list view
        const grouped: TbhItem[] = [];
        const groupMap = new Map<string, TbhItem>();

        for (const item of tempResolved) {
          const enchantsSig = item.enchantData
            ? item.enchantData.map((e: any) => `${e.StatType}:${e.Value}:${e.Tier}`).join(",")
            : "";
          const key = `${item.lookupKey}_${item.grade}_${item.level}_${item.isChaotic}_${enchantsSig}_${item.location}`;
          
          const existing = groupMap.get(key);
          if (existing) {
            existing.quantity += item.quantity;
            if (existing.price !== null) {
              existing.totalValue = existing.price * existing.quantity;
            }
          } else {
            const clone = { ...item };
            groupMap.set(key, clone);
            grouped.push(clone);
          }
        }

        return grouped;
      };
      
      const inventory = resolveList(playerSave.inventorySaveDatas || [], false, "Inventory");
      const stash = resolveList(playerSave.stashSaveDatas || [], false, "Stash");
      const tradingStash = resolveList(playerSave.tradingStashSaveDatas || [], true, "Market");
      
      const equipped: TbhItem[] = [];
      const equippedByHero: Record<number, TbhItem[]> = {};

      if (playerSave.heroSaveDatas) {
        for (const hero of playerSave.heroSaveDatas) {
          if (!hero.IsUnLock) continue;
          const heroKey = hero.heroKey;
          const heroName = HERO_CLASS_NAMES[heroKey] || `Hero #${heroKey}`;
          const heroLevel = hero.HeroLevel || 1;
          const itemIds = hero.equippedItemIds || [];
          
          const heroEquipped: TbhItem[] = [];
          for (let slotIdx = 0; slotIdx < itemIds.length; slotIdx++) {
            const uniqueId = String(itemIds[slotIdx]);
            if (uniqueId === "0" || !uniqueId) continue;
            
            const details = itemLookupMap[uniqueId];
            if (details) {
              const itemKey = String(details.ItemKey);
              const lookupKey = itemKey.endsWith("900") ? itemKey.slice(0, -3) : itemKey;
              
              const props = tbhData.properties[lookupKey] || {};
              const name = tbhData.names[lookupKey] || `Item #${lookupKey}`;
              const gradeCode = props.g || "COM";
              const grade = GRADE_MAP[gradeCode] || "Common";
              const level = props.l || null;
              const gearType = props.t || null;
              const isMaterial = props.tp === "MATERIAL";
              const iconUrl = tbhData.icons[props.s] || null;
              const quantity = details.Quantity ?? details.Count ?? details.Amount ?? 1;
              
              let marketHashName = name;
              if (!isMaterial) {
                marketHashName = name.includes(`(${grade})`) ? `${name} A` : `${name} (${grade}) A`;
              }
              
              const priceData = prices[marketHashName];
              const isExpired = priceData && (Date.now() - priceData.updatedAt > 60 * 60 * 1000);
              const price = (priceData && !isExpired) ? priceData.price : null;
              const totalValue = price !== null ? price * quantity : null;
              const updatedAt = priceData ? priceData.updatedAt : null;
              
              const itemObj: TbhItem = {
                uniqueId,
                itemKey,
                lookupKey,
                name,
                grade,
                gradeColor: GRADE_COLORS[grade] || GRADE_COLORS.Unknown,
                level,
                gearType,
                isMaterial,
                iconUrl,
                quantity,
                marketHashName,
                price,
                totalValue,
                updatedAt,
                isChaotic: !!details.IsChaotic,
                isBlocked: !!details.IsBlocked,
                slot: slotIdx,
                location: `${heroName} (Lv ${heroLevel})`,
                enchantCount: details.EnchantCount,
                enchantData: details.EnchantData,
                engravingCount: details.EngravingAppliedTotalCount,
                inscriptionCount: details.InscriptionAppliedTotalCount,
                decorationCount: details.DecorationAppliedTotalCount
              };
              
              heroEquipped.push(itemObj);
              equipped.push(itemObj);
            }
          }
          equippedByHero[heroKey] = heroEquipped;
        }
      }
      
      const rawCombined = [...inventory, ...stash, ...tradingStash, ...equipped];
      
      // Merge identical items across locations (e.g. Wood in Inventory + Stash → one card)
      const crossGroupMap = new Map<string, TbhItem>();
      const crossGroupOrder: TbhItem[] = [];
      for (const item of rawCombined) {
        const enchantsSig = item.enchantData
          ? item.enchantData.map((e: any) => `${e.StatType}:${e.Value}:${e.Tier}`).join(",")
          : "";
        // Key WITHOUT location so items from different locations can be merged
        const key = `${item.lookupKey}_${item.grade}_${item.level}_${item.isChaotic}_${enchantsSig}`;
        const existing = crossGroupMap.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          if (existing.price !== null) {
            existing.totalValue = existing.price * existing.quantity;
          }
          // Show "Multiple" when the same item spans more than one location
          if (existing.location !== item.location) {
            existing.location = "Multiple";
          }
        } else {
          const clone = { ...item };
          crossGroupMap.set(key, clone);
          crossGroupOrder.push(clone);
        }
      }
      const combined = crossGroupOrder;

      const totalStashValue = combined.reduce((acc, item) => acc + (item.totalValue || 0), 0);
      const totalItems = combined.reduce((acc, item) => acc + item.quantity, 0);
      
      return {
        inventory,
        stash,
        tradingStash,
        equipped,
        equippedByHero,
        combined,
        totalStashValue,
        totalItems,
        level: playerSave.commonSaveData?.cubeLevel || 1,
        heroSaveDatas: playerSave.heroSaveDatas || []
      };
    } catch (e) {
      console.error("Save file parsing failed:", e);
      return null;
    }

  }, [saveData, prices]);

  // Tab Item Filter & Sort
  const currentTabItems = useMemo(() => {
    if (!parsedSave) return [];
    
    let list: TbhItem[] = [];
    if (activeTab === "all") {
      list = parsedSave.combined;
    } else if (activeTab === "stash") {
      list = parsedSave.stash;
    } else if (activeTab === "inventory") {
      list = parsedSave.inventory;
    } else if (activeTab === "equipped") {
      list = parsedSave.equipped;
    } else {
      return [];
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => 
        item.name.toLowerCase().includes(q) || 
        (item.gearType && item.gearType.toLowerCase().includes(q))
      );
    }
    
    if (gradeFilter !== "all") {
      list = list.filter((item) => item.grade.toLowerCase() === gradeFilter.toLowerCase());
    }
    
    list.sort((a, b) => {
      if (sortBy === "value") {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (priceB !== priceA) {
          return priceB - priceA;
        }
        return (b.totalValue || 0) - (a.totalValue || 0);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "grade") {
        const rankA = GRADE_RANK[a.grade] || 0;
        const rankB = GRADE_RANK[b.grade] || 0;
        if (rankB !== rankA) {
          return rankB - rankA;
        }
        return (b.totalValue || 0) - (a.totalValue || 0);
      }
      return 0;
    });
    
    return list;
  }, [parsedSave, activeTab, searchQuery, gradeFilter, sortBy]);

  // Market Explorer items
  const marketExplorerItems = useMemo<MarketItem[]>(() => {
    const list: MarketItem[] = [];
    
    const names = tbhData.names;
    const properties = tbhData.properties;
    
    for (const key in properties) {
      const prop = properties[key];
      const isMaterial = prop.tp === "MATERIAL";
      
      const gradeCode = prop.g || "COM";
      const grade = GRADE_MAP[gradeCode] || "Common";
      if (!isMaterial && grade !== "Legendary" && grade !== "Immortal" && grade !== "Arcana" && grade !== "Beyond" && grade !== "Celestial" && grade !== "Divine" && grade !== "Cosmic") {
        continue;
      }
      
      const name = names[key] || "Unknown";
      let marketHashName = name;
      if (!isMaterial) {
        marketHashName = name.includes(`(${grade})`) ? `${name} A` : `${name} (${grade}) A`;
      }
      
      const priceData = prices[marketHashName];
      const isExpired = priceData && (Date.now() - priceData.updatedAt > 60 * 60 * 1000);
      const price = (priceData && !isExpired) ? priceData.price : null;
      const updatedAt = priceData ? priceData.updatedAt : null;
      const spriteKey = prop.s || "";
      const iconUrl = tbhData.icons[spriteKey] || null;
      
      list.push({
        name,
        grade,
        gradeColor: GRADE_COLORS[grade] || GRADE_COLORS.Unknown,
        isMaterial,
        iconUrl,
        marketHashName,
        price,
        itemKey: key,
        lookupKey: key,
        gearType: prop.t || null,
        level: prop.l || null,
        updatedAt,
      });
    }
    
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(q));
    }
    
    if (gradeFilter !== "all") {
      filtered = filtered.filter((item) => item.grade.toLowerCase() === gradeFilter.toLowerCase());
    }
    
    filtered.sort((a, b) => {
      if (sortBy === "value") {
        return (b.price || 0) - (a.price || 0);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "grade") {
        const rankA = GRADE_RANK[a.grade] || 0;
        const rankB = GRADE_RANK[b.grade] || 0;
        if (rankB !== rankA) {
          return rankB - rankA;
        }
        return (b.price || 0) - (a.price || 0);
      }
      return 0;
    });
    
    return filtered.slice(0, 100);
  }, [prices, searchQuery, gradeFilter, sortBy]);

  // Analytics Computations
  const analyticsData = useMemo<AnalyticsData | null>(() => {
    if (!parsedSave) return null;
    
    const combined = parsedSave.combined;
    
    const rarityDistribution: Record<string, { count: number; value: number }> = {};
    for (const grade of Object.values(GRADE_MAP)) {
      rarityDistribution[grade] = { count: 0, value: 0 };
    }
    rarityDistribution["Common"] = { count: 0, value: 0 };
    
    let materialCount = 0;
    let gearCount = 0;
    
    for (const item of combined) {
      if (item.isMaterial) {
        materialCount += item.quantity;
      } else {
        gearCount += item.quantity;
      }
      
      if (!rarityDistribution[item.grade]) {
        rarityDistribution[item.grade] = { count: 0, value: 0 };
      }
      rarityDistribution[item.grade].count += item.quantity;
      rarityDistribution[item.grade].value += item.totalValue || 0;
    }
    
    const sortedHoldings = [...combined]
      .filter((item) => (item.totalValue || 0) > 0)
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
      
    const groupedHoldingsMap: Record<string, TbhItem> = {};
    for (const item of sortedHoldings) {
      const key = `${item.lookupKey}_${item.grade}`;
      if (groupedHoldingsMap[key]) {
        groupedHoldingsMap[key].quantity += item.quantity;
        groupedHoldingsMap[key].totalValue = (groupedHoldingsMap[key].totalValue || 0) + (item.totalValue || 0);
      } else {
        groupedHoldingsMap[key] = { ...item };
      }
    }
    
    const topHoldings = Object.values(groupedHoldingsMap)
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .slice(0, 5);
      
    return {
      rarityDistribution,
      materialCount,
      gearCount,
      topHoldings
    };
  }, [parsedSave]);

  return {
    // State
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    gradeFilter,
    setGradeFilter,
    sortBy,
    setSortBy,
    statusMessage,
    isLive,
    loading,
    loadingPrices,
    steamRateLimited,
    steamLoggedIn,
    
    // Data
    parsedSave,
    currentTabItems,
    marketExplorerItems,
    analyticsData,
    
    // Actions
    loadSaveFile,
    selectManualSaveFile,
    refreshPrices,
    connectSteam,
    disconnectSteam,
    stopFetching,
  };
}
