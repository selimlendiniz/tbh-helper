export interface TbhItem {
  uniqueId: string;
  itemKey: string;
  lookupKey: string;
  name: string;
  grade: string;
  gradeColor: string;
  level: number | null;
  gearType: string | null;
  isMaterial: boolean;
  iconUrl: string | null;
  quantity: number;
  marketHashName: string;
  price: number | null;
  totalValue: number | null;
  isChaotic: boolean;
  isBlocked: boolean;
  slot: number;
  location?: string;
  enchantCount?: number[];
  enchantData?: any[];
  engravingCount?: number;
  inscriptionCount?: number;
  decorationCount?: number;
  updatedAt?: number | null;
}

export interface MarketItem {
  name: string;
  grade: string;
  gradeColor: string;
  isMaterial: boolean;
  iconUrl: string | null;
  marketHashName: string;
  price: number | null;
  itemKey: string;
  lookupKey: string;
  gearType: string | null;
  level: number | null;
  updatedAt?: number | null;
}

export interface ParsedSave {
  inventory: TbhItem[];
  stash: TbhItem[];
  tradingStash: TbhItem[];
  equipped: TbhItem[];
  equippedByHero: Record<number, TbhItem[]>;
  combined: TbhItem[];
  totalStashValue: number;
  totalItems: number;
  level: number;
  heroSaveDatas: any[];
}

export interface AnalyticsData {
  rarityDistribution: Record<string, { count: number; value: number }>;
  materialCount: number;
  gearCount: number;
  topHoldings: TbhItem[];
}

export type TabType = "all" | "stash" | "inventory" | "equipped" | "market" | "analytics";
export type SortType = "value" | "name" | "grade";
