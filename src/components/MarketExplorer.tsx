import React, { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TbhItem, MarketItem } from "../types";
import "../styles/market.css";

const CARD_MIN_WIDTH = 300; // px — matches minmax(280px, 1fr) + gap
const ROW_HEIGHT = 94;      // item-card height ~86px + 8px gap

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
  onClick,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Measure actual columns dynamically
  const getColCount = useCallback(() => {
    const w = parentRef.current?.clientWidth ?? 900;
    return Math.max(1, Math.floor(w / CARD_MIN_WIDTH));
  }, []);

  const colCount = getColCount();
  const rowCount = Math.ceil(items.length / colCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No market items match your search filters.</p>
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
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                gap: "12px",
                paddingBottom: "12px",
                boxSizing: "border-box",
              }}
            >
              {rowItems.map((item, i) => (
                <div
                  key={startIdx + i}
                  className="item-card"
                  style={{
                    "--rarity-color": item.gradeColor,
                    cursor: onClick ? "pointer" : "default",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
