import { PriceProvider } from "./PriceProvider";
import { SteamMarketProvider } from "./SteamMarketProvider";

export class PriceManager {
  private provider: PriceProvider;

  constructor() {
    this.provider = new SteamMarketProvider();
  }

  async fetchPrices(
    onProgress?: (prices: Record<string, number>, current: number, total: number, has429?: boolean) => void,
    signal?: AbortSignal
  ): Promise<{ prices: Record<string, number>; source: string }> {
    console.log(`Fetching prices from Steam Market...`);
    const prices = await this.provider.fetchPrices(onProgress, signal);
    return { prices, source: this.provider.name };
  }
}
