import React from "react";
import { TabType, SortType } from "../types";
import { GRADE_MAP } from "../constants";
import "../styles/tabs.css";

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  gradeFilter: string;
  setGradeFilter: (g: string) => void;
  sortBy: SortType;
  setSortBy: (s: SortType) => void;
  hideNoPriceItems: boolean;
  setHideNoPriceItems: (v: boolean) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  gradeFilter,
  setGradeFilter,
  sortBy,
  setSortBy,
  hideNoPriceItems,
  setHideNoPriceItems,
}) => {
  return (
    <div className="controls-row fade-in">
      <div className="tabs-list">
        <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
          All Items
        </button>
        <button className={`tab-btn ${activeTab === "stash" ? "active" : ""}`} onClick={() => setActiveTab("stash")}>
          Stash
        </button>
        <button className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
          Inventory
        </button>
        <button className={`tab-btn ${activeTab === "equipped" ? "active" : ""}`} onClick={() => setActiveTab("equipped")}>
          Equipped
        </button>
        <button className={`tab-btn ${activeTab === "market" ? "active" : ""}`} onClick={() => setActiveTab("market")}>
          Market Prices
        </button>
        <button className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
          Analytics
        </button>
        <button className={`tab-btn ${activeTab === "wishlist" ? "active" : ""}`} onClick={() => setActiveTab("wishlist")}>
          Wishlist ⭐
        </button>
      </div>

      {activeTab !== "analytics" && (
        <div className="filters-list">
          <input 
            type="text" 
            placeholder="Search item name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select 
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="select-input"
          >
            <option value="all">All Rarities</option>
            {Object.values(GRADE_MAP).map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="select-input"
          >
            <option value="value">Sort by Unit Price</option>
            <option value="name">Sort by Name</option>
            <option value="grade">Sort by Rarity</option>
          </select>

          {activeTab === "market" && (
            <button
              className={`tab-btn ${hideNoPriceItems ? "active" : ""}`}
              onClick={() => setHideNoPriceItems(!hideNoPriceItems)}
              title="Toggle visibility of items without a price"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                border: hideNoPriceItems
                  ? "1px solid rgba(255, 128, 0, 0.5)"
                  : "1px solid var(--border-color)",
                background: hideNoPriceItems
                  ? "rgba(255, 128, 0, 0.1)"
                  : "rgba(255,255,255,0.02)",
                color: hideNoPriceItems ? "#ff8000" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {hideNoPriceItems ? "👁 Show All" : "🚫 Hide No-Price"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
