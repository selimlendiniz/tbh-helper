import React from "react";
import { WishlistItem, TbhItem } from "../types";
import "../styles/wishlist.css";

interface WishlistPanelProps {
  wishlist: WishlistItem[];
  prices: Record<string, { price: number; updatedAt: number }>;
  onRemove: (itemKey: string) => void;
  onClickItem: (item: TbhItem) => void;
}

export const WishlistPanel: React.FC<WishlistPanelProps> = ({
  wishlist,
  prices,
  onRemove,
  onClickItem,
}) => {
  const handleCardClick = (item: WishlistItem) => {
    const priceData = prices[item.marketHashName];
    const currentPrice = priceData ? priceData.price : null;
    const stub: TbhItem = {
      uniqueId: `wishlist_${item.itemKey}`,
      itemKey: item.itemKey,
      lookupKey: item.itemKey,
      name: item.name,
      grade: item.grade,
      gradeColor: item.gradeColor,
      level: null,
      gearType: null,
      isMaterial: false,
      iconUrl: item.iconUrl,
      quantity: 1,
      marketHashName: item.marketHashName,
      price: currentPrice,
      totalValue: currentPrice,
      isChaotic: false,
      isBlocked: false,
      slot: 0,
    };
    onClickItem(stub);
  };

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-empty-state">
        <span className="wishlist-empty-icon">⭐</span>
        <h3>Your Wishlist is Empty</h3>
        <p>
          You are not tracking any items yet. Open any item detail from Stash or Market tabs, and use the <strong>Price Alerts & Wishlist</strong> card to track prices.
        </p>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-grid">
        {wishlist.map((item) => {
          const priceData = prices[item.marketHashName];
          const currentPrice = priceData ? priceData.price : null;
          
          let alertTriggered = false;
          if (currentPrice !== null) {
            if (item.alertType === "below" && currentPrice <= item.targetPrice) {
              alertTriggered = true;
            } else if (item.alertType === "above" && currentPrice >= item.targetPrice) {
              alertTriggered = true;
            }
          }

          return (
            <div 
              key={item.itemKey} 
              className={`wishlist-card ${alertTriggered ? "triggered" : ""}`}
              onClick={() => handleCardClick(item)}
              style={{ "--rarity-color": item.gradeColor } as any}
            >
              <div className="wishlist-card-header">
                <div className="item-icon-wrapper" style={{ width: "42px", height: "42px" }}>
                  {item.iconUrl ? (
                    <img src={item.iconUrl} alt={item.name} className="item-icon-img" style={{ width: "28px", height: "28px" }} />
                  ) : (
                    <span className="item-icon-fallback" style={{ fontSize: "14px" }}>◆</span>
                  )}
                </div>
                <div className="wishlist-name-col">
                  <h4 className="wishlist-item-name" title={item.name}>{item.name}</h4>
                  <span className="grade-tag" style={{ fontSize: "8px", padding: "1px 4px" }}>{item.grade}</span>
                </div>
                <button 
                  className="wishlist-delete-btn"
                  title="Remove from Wishlist"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.itemKey);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="wishlist-card-body">
                <div className="wishlist-stat-row">
                  <span className="lbl">Target Alert:</span>
                  <span className="val alert-target-val">
                    {item.alertType === "below" ? "≤" : "≥"} ${item.targetPrice.toFixed(2)}
                  </span>
                </div>
                <div className="wishlist-stat-row">
                  <span className="lbl">Current Price:</span>
                  <span className={`val current-price-val ${alertTriggered ? "glow-green" : ""}`}>
                    {currentPrice !== null ? `$${currentPrice.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              {alertTriggered && (
                <div className="wishlist-card-status">
                  🚨 Target Reached!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
