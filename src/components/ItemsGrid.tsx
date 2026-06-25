import React from "react";
import { TbhItem } from "../types";
import { ItemCard } from "./ItemCard";

interface ItemsGridProps {
  items: TbhItem[];
  onMouseEnter: (item: TbhItem, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick?: (item: TbhItem) => void;
}

export const ItemsGrid: React.FC<ItemsGridProps> = ({ 
  items, 
  onMouseEnter, 
  onMouseMove, 
  onMouseLeave,
  onClick
}) => {
  return (
    <div className="items-grid">
      {items.map((item, index) => (
        <ItemCard
          key={item.uniqueId || index}
          item={item}
          onMouseEnter={onMouseEnter}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        />
      ))}
      {items.length === 0 && (
        <div className="empty-state" style={{ gridColumn: "1/-1" }}>
          <p>No stash items match your search filters.</p>
        </div>
      )}
    </div>
  );
};
