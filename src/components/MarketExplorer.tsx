import React from "react";
import { TbhItem, MarketItem } from "../types";
import "../styles/market.css";

interface MarketExplorerProps {
  items: MarketItem[];
  onMouseEnter: (item: TbhItem, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick?: (item: MarketItem) => void;
}

export const MarketExplorer: React.FC<MarketExplorerProps> = ({ 
  items, 
  onMouseEnter, 
  onMouseMove, 
  onMouseLeave,
  onClick
}) => {
  return (
    <div className="items-grid">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="item-card" 
          style={{ 
            "--rarity-color": item.gradeColor,
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.2s ease, box-shadow 0.2s ease"
          } as any}
          onMouseEnter={(e) => onMouseEnter(item as any, e)}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={() => onClick && onClick(item)}
        >
          <div className="item-icon-wrapper">
            {item.iconUrl ? (
              <img src={item.iconUrl} alt={item.name} className="item-icon-img" />
            ) : (
              <span className="item-icon-fallback">◆</span>
            )}
          </div>
          <div className="item-info">
            <span className="item-name" title={item.name}>{item.name}</span>
            <div className="item-meta">
              <span className="grade-tag">{item.grade}</span>
            </div>
          </div>
          <div className="item-pricing">
            <span className="item-price-total">
              {item.price !== null && item.price !== undefined
                ? `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : "Price not found"}
            </span>
            <span className="item-price-each">Market Value</span>
            {item.updatedAt && (
              <span style={{ fontSize: "9px", color: "var(--text-dark)", marginTop: "2px" }}>
                Updated: {new Date(item.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="empty-state" style={{ gridColumn: "1/-1" }}>
          <p>No market items match your search filters.</p>
        </div>
      )}
    </div>
  );
};
