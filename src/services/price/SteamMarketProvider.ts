import { PriceProvider } from "./PriceProvider";
import { fetchUrlWithRetry } from "../../utils";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export class SteamMarketProvider implements PriceProvider {
  id = "steam";
  name = "Steam Market (Direct)";

  async fetchPrices(
    onProgress?: (prices: Record<string, number>, current: number, total: number, has429?: boolean) => void,
    signal?: AbortSignal
  ): Promise<Record<string, number>> {
    const priceMap: Record<string, number> = {};
    let totalCount = 0;

    let isSteamLoggedIn = false;
    try {
      isSteamLoggedIn = await invoke<boolean>("is_steam_logged_in");
    } catch (e) {
      console.warn("Failed to check Steam login in SteamMarketProvider:", e);
    }

    if (isSteamLoggedIn) {
      console.log("Steam logged in. Fetching via child window redirection...");
      const payloadRef: { value: { page: number; data: string } | null } = { value: null };
      const unlisten = await listen<{ page: number; data: string }>("steam_price_data", (event) => {
        payloadRef.value = event.payload;
      });

      try {
        const fetchPageViaWindow = async (startVal: number): Promise<any> => {
          const url = `https://steamcommunity.com/market/search/render/?query=&start=${startVal}&count=10&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=3678970&norender=1`;
          
          // Ensure the hidden window is visible before navigating
          try {
            await invoke("show_steam_window", { label: "steam_login_window" });
          } catch (e) {
            console.warn("show_steam_window failed (non-critical):", e);
          }

          await invoke("navigate_steam_window", { label: "steam_login_window", url });
          payloadRef.value = null;

          // Poll every 800ms: try to extract + check if data arrived
          // Move on the moment we have data — no fixed wait
          const MAX_ATTEMPTS = 25; // max ~20 seconds total
          for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            if (signal?.aborted) throw new Error("Aborted");

            // Wait 800ms between each attempt
            await new Promise<void>((resolve, reject) => {
              const t = setTimeout(resolve, 800);
              if (signal) signal.addEventListener("abort", () => { clearTimeout(t); reject(new Error("Aborted")); });
            });

            if (signal?.aborted) throw new Error("Aborted");

            // If data already arrived via the event listener, we're done
            if (payloadRef.value) break;

            // Otherwise trigger an extract attempt (reads body text and redirects to localhost)
            try {
              await invoke("extract_steam_data", { label: "steam_login_window", start: startVal });
            } catch (e) {
              console.warn("extract_steam_data attempt failed:", e);
            }

            // Give a short moment for the redirect + event to propagate
            await new Promise<void>((resolve) => setTimeout(resolve, 300));
            if (payloadRef.value) break;
          }

          const payload = payloadRef.value;
          if (!payload) {
            throw new Error(`Timeout waiting for page start=${startVal}`);
          }

          // @ts-ignore - TypeScript incorrectly narrows payload to never due to listen() closure interaction
          return JSON.parse((payload as { page: number; data: string }).data);
        };

        const data1 = await fetchPageViaWindow(0);
        if (data1 && data1.success) {
          totalCount = data1.total_count || 0;
          const totalPages = Math.ceil(totalCount / 10);
          if (data1.results) {
            const pagePrices: Record<string, number> = {};
            for (const item of data1.results) {
              const hashName = item.hash_name || item.market_hash_name;
              if (hashName && item.sell_price) {
                const val = item.sell_price / 100;
                priceMap[hashName] = val;
                pagePrices[hashName] = val;
              }
            }
            if (onProgress) {
              onProgress(pagePrices, 1, totalPages);
            }
          }
        }

        const totalPages = Math.ceil(totalCount / 10);

        if (totalCount > 10) {
          for (let start = 10; start < totalCount; start += 10) {
            if (signal?.aborted) break;

            // No fixed inter-page delay — proceed immediately to next page
            const data = await fetchPageViaWindow(start);
            if (data && data.success && data.results) {
              const pagePrices: Record<string, number> = {};
              for (const item of data.results) {
                const hashName = item.hash_name || item.market_hash_name;
                if (hashName && item.sell_price) {
                  const val = item.sell_price / 100;
                  priceMap[hashName] = val;
                  pagePrices[hashName] = val;
                }
              }
              if (onProgress) {
                const currentPage = Math.floor(start / 10) + 1;
                onProgress(pagePrices, currentPage, totalPages);
              }
            }
          }
        }

      } finally {
        unlisten();
      }

      return priceMap;
    }

    // Page 1: start=0, count=10
    const url1 = "https://steamcommunity.com/market/search/render/?query=&start=0&count=10&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=3678970&norender=1";
    let data1;
    let retryCount1 = 0;
    
    while (retryCount1 < 3) {
      if (signal?.aborted) return priceMap;
      try {
        const rawData1 = await fetchUrlWithRetry(url1, 3, 3000);
        data1 = JSON.parse(rawData1);
        if (data1 && data1.success) {
          totalCount = data1.total_count || 0;
          const totalPages = Math.ceil(totalCount / 10);
          if (data1.results) {
            const pagePrices: Record<string, number> = {};
            for (const item of data1.results) {
              const hashName = item.hash_name || item.market_hash_name;
              if (hashName && item.sell_price) {
                const val = item.sell_price / 100;
                priceMap[hashName] = val;
                pagePrices[hashName] = val;
              }
            }
            if (onProgress) {
              onProgress(pagePrices, 1, totalPages);
            }
          }
        }
        break; // Success, break the retry loop
      } catch (e) {
        console.error(`Steam Market Page 1 failed (Attempt ${retryCount1 + 1}/3):`, e);
        const is429 = String(e).includes("429");
        if (is429 && onProgress) {
          onProgress({}, 1, 1, true);
        }
        retryCount1++;
        if (retryCount1 < 3) {
          console.log("Steam 429 on Page 1. Waiting 60s before retrying Page 1...");
          if (signal?.aborted) return priceMap;
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, 60000);
            if (signal) {
              signal.addEventListener("abort", () => {
                clearTimeout(timeout);
                resolve();
              });
            }
          });
        } else {
          throw e; // critical failure after 3 retries
        }
      }
    }

    const totalPages = Math.ceil(totalCount / 10);
    const remainingPages = totalPages - 1;

    const targetDurationMs = 10 * 60 * 1000; // Spread total fetch over 10 minutes
    let delayMs = remainingPages > 0 ? Math.floor(targetDurationMs / remainingPages) : 1500;

    // Fetch the rest of the pages dynamically sequentially with a delay to avoid rate limiting
    if (totalCount > 10) {
      let retryCount = 0;
      for (let start = 10; start < totalCount; start += 10) {
        if (signal?.aborted) return priceMap;
        const url = `https://steamcommunity.com/market/search/render/?query=&start=${start}&count=10&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=3678970&norender=1`;
        try {
          // Wait delayMs to spread requests
          if (signal?.aborted) return priceMap;
          try {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                if (signal?.aborted) {
                  reject(new Error("Aborted"));
                } else {
                  resolve();
                }
              }, delayMs);
              if (signal) {
                signal.addEventListener("abort", () => {
                  clearTimeout(timeout);
                  reject(new Error("Aborted"));
                });
              }
            });
          } catch (e) {
            return priceMap;
          }
          
          if (signal?.aborted) return priceMap;
          const rawData = await fetchUrlWithRetry(url, 3, 3000);
          retryCount = 0; // Success, reset retry counter for this page
          
          const data = JSON.parse(rawData);
          if (data && data.success && data.results) {
            const pagePrices: Record<string, number> = {};
            for (const item of data.results) {
              const hashName = item.hash_name || item.market_hash_name;
              if (hashName && item.sell_price) {
                const val = item.sell_price / 100;
                priceMap[hashName] = val;
                pagePrices[hashName] = val;
              }
            }
            if (onProgress) {
              const currentPage = Math.floor(start / 10) + 1;
              onProgress(pagePrices, currentPage, totalPages);
            }
          }
        } catch (err) {
          console.warn(`Steam Market Page start=${start} failed (non-critical):`, err);
          const is429 = String(err).includes("429");
          if (is429) {
            if (onProgress) {
              onProgress({}, Math.floor(start / 10) + 1, totalPages, true);
            }
            // Increase the delayMs for subsequent pages to back off!
            delayMs = Math.min(delayMs + 2000, 10000);
            console.log(`DEBUG: Adjusting delayMs to ${delayMs}ms due to 429 rate limit.`);

            if (retryCount < 3) {
              retryCount++;
              console.log(`Steam 429 rate limit hit. Waiting 60s (Attempt ${retryCount}/3) before retrying page start=${start}...`);
              if (signal?.aborted) return priceMap;
              try {
                await new Promise<void>((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    if (signal?.aborted) {
                      reject(new Error("Aborted"));
                    } else {
                      resolve();
                    }
                  }, 60000);
                  if (signal) {
                    signal.addEventListener("abort", () => {
                      clearTimeout(timeout);
                      reject(new Error("Aborted"));
                    });
                  }
                });
              } catch (e) {
                return priceMap;
              }
              start -= 10; // retry this iteration
            } else {
              console.warn(`Steam 429 rate limit hit. Maximum retries (3) reached for page start=${start}. Skipping.`);
              retryCount = 0; // reset for next page
            }
          }
        }
      }
    }

    return priceMap;
  }
}
