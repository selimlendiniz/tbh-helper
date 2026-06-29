import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TbhItem } from "../types";
import { ItemCard } from "./ItemCard";
import "../styles/item-card.css";

const CARD_MIN_WIDTH = 300; // 280px min-width + 20px gap
const ROW_HEIGHT = 106;     // item-card height ~86px + 20px gap

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
  const parentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!parentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  const currentWidth = width ?? parentRef.current?.clientWidth ?? 900;
  const colCount = Math.max(1, Math.floor(currentWidth / CARD_MIN_WIDTH));
  const rowCount = Math.ceil(items.length / colCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  if (items.length === 0) {
    return (
      <div className="empty-state" style={{ width: "100%" }}>
        <p>No items match your search filters.</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      style={{ overflow: "auto", height: "100%", willChange: "transform" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * colCount;
          const rowItems = items.slice(startIdx, startIdx + colCount);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                gap: "20px",
                paddingBottom: "20px",
                boxSizing: "border-box",
              }}
            >
              {rowItems.map((item, i) => (
                <ItemCard
                  key={item.uniqueId || (startIdx + i)}
                  item={item}
                  onMouseEnter={onMouseEnter}
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
                  onClick={onClick}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
