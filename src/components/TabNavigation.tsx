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
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  gradeFilter,
  setGradeFilter,
  sortBy,
  setSortBy
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
        </div>
      )}
    </div>
  );
};
