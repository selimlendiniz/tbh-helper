export interface PriceProvider {
  id: string;
  name: string;
  fetchPrices(
    onProgress?: (prices: Record<string, number>, current: number, total: number, has429?: boolean) => void,
    signal?: AbortSignal
  ): Promise<Record<string, number>>;
}
