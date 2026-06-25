import React from "react";
import { TbhItem } from "../types";
import "../styles/item-card.css";

interface ItemCardProps {
  item: TbhItem;
  onMouseEnter: (item: TbhItem, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick?: (item: TbhItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onMouseEnter, 
  onMouseMove, 
  onMouseLeave,
  onClick
}) => {
  return (
    <div 
      className="item-card" 
      style={{ 
        "--rarity-color": item.gradeColor, 
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease" 
      } as any}
      onMouseEnter={(e) => onMouseEnter(item, e)}
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
        {item.quantity > 1 && (
          <span style={{ position: "absolute", bottom: "-6px", right: "-6px", background: "#111", border: "1px solid var(--border-color)", fontSize: "12px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", zIndex: 10 }}>
            x{item.quantity}
          </span>
        )}
      </div>
      <div className="item-info">
        <span className="item-name" title={item.name}>{item.name}</span>
        <div className="item-meta">
          <span className="grade-tag">{item.grade}</span>
          {item.level && <span className="level-tag">LVL {item.level}</span>}
          {item.isChaotic && <span style={{ color: "#ec4899", fontWeight: "bold", fontSize: "9px" }}>CHAOTIC</span>}
          {item.location && <span className="location-tag">{item.location}</span>}
        </div>
      </div>
      <div className="item-pricing">
        <span className="item-price-total">
          {item.price !== null 
            ? `$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
            : "Price not found"}
        </span>
        <span className="item-price-each">
          {item.quantity > 1 ? (
            item.totalValue !== null 
              ? `Total: $${item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${item.quantity}x)` 
              : `x${item.quantity}`
          ) : (
            "Market Value"
          )}
        </span>
        {item.updatedAt && (
          <span style={{ fontSize: "9px", color: "var(--text-dark)", marginTop: "2px" }}>
            Updated: {new Date(item.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
};
