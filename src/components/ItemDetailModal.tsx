import React, { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { fetchUrlWithRetry } from "../utils";
import { TbhItem, WishlistItem } from "../types";
import "../styles/item-detail-modal.css";

interface ItemDetailModalProps {
  item: TbhItem | null;
  onClose: () => void;
  wishlist?: WishlistItem[];
  onAddToWishlist?: (item: WishlistItem) => void;
  onRemoveFromWishlist?: (itemKey: string) => void;
}

interface PricePoint {
  date: string;
  fullDate?: string;
  price: number;
  volume: number;
  timestamp: number;
}

interface ActiveListing {
  price: number;
  count: number;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ 
  item, 
  onClose,
  wishlist = [],
  onAddToWishlist,
  onRemoveFromWishlist
}) => {
  if (!item) return null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [listings, setListings] = useState<ActiveListing[]>([]);

  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [alertType, setAlertType] = useState<"below" | "above">("below");

  const wishlistedItem = useMemo(() => {
    if (!item) return undefined;
    return wishlist.find((w) => w.itemKey === item.itemKey);
  }, [item, wishlist]);

  const isWishlisted = !!wishlistedItem;

  // Initialize form fields when item changes
  useEffect(() => {
    if (item) {
      if (isWishlisted && wishlistedItem) {
        setTargetPrice(wishlistedItem.targetPrice);
        setAlertType(wishlistedItem.alertType);
      } else {
        setTargetPrice(item.price || 0);
        setAlertType("below");
      }
    }
  }, [item, isWishlisted, wishlistedItem]);
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState<"all" | "7d" | "3d" | "1d">("all");

  const chartRef = useRef<SVGSVGElement>(null);

  const handleOpenInSteamApp = () => {
    const url = `steam://openurl/https://steamcommunity.com/market/listings/3678970/${encodeURIComponent(item.marketHashName)}`;
    invoke("open_in_browser", { url }).catch((err) => {
      console.error("Failed to open Steam Desktop Client:", err);
    });
  };

  const handleOpenInSteamWeb = () => {
    const url = `https://steamcommunity.com/market/listings/3678970/${encodeURIComponent(item.marketHashName)}`;
    invoke("open_in_browser", { url }).catch((err) => {
      console.error("Failed to open Steam Web Browser:", err);
    });
  };

  // Fetch prices on open
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setHistory([]);
    setListings([]);

    const fetchDetailData = async () => {
      try {
        const encodedHash = encodeURIComponent(item.marketHashName);
        let parsedHistory: PricePoint[] = [];
        let parsedListings: ActiveListing[] = [];

        // 1. Fetch main Steam Market page HTML
        const htmlUrl = `https://steamcommunity.com/market/listings/3678970/${encodedHash}`;
        const html = await fetchUrlWithRetry(htmlUrl);
        
        if (active) {
          // Parse historical prices from SSR query cache JSON
          const pricesMatch = html.match(/prices\\*":\s*(\[[\s\S]*?\])/);
          if (pricesMatch) {
            const cleanJson = pricesMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\/g, '');
            try {
              const pricesList = JSON.parse(cleanJson);
              if (Array.isArray(pricesList) && pricesList.length > 0) {
                parsedHistory = pricesList.map((p: any) => {
                  const d = new Date(p.time * 1000);
                  const dateCleanShort = d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
                  const dateCleanFull = d.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  });
                  let price = parseFloat(p.price_median) || 0;
                  return {
                    date: dateCleanShort,
                    fullDate: dateCleanFull,
                    price,
                    volume: parseInt(p.purchases) || 0,
                    timestamp: p.time * 1000
                  };
                });
              }
            } catch (jsonErr) {
              console.warn("Failed to parse prices JSON:", jsonErr);
            }
          } else {
            // Try legacy regex format fallback
            const historyMatch = html.match(/line1\s*=\s*(\[[\s\S]*?\]);/);
            if (historyMatch) {
              try {
                const rawPoints = JSON.parse(historyMatch[1]);
                parsedHistory = rawPoints.map((p: any) => {
                  const dateRaw = String(p[0]);
                  const d = new Date(dateRaw);
                  const timestamp = d.getTime();
                  const isValid = !isNaN(timestamp);
                  
                  let dateCleanShort = dateRaw;
                  let dateCleanFull = dateRaw;
                  
                  if (isValid) {
                    dateCleanShort = d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });
                    dateCleanFull = d.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false
                    });
                  } else {
                    const parts = dateRaw.split(" ");
                    dateCleanShort = parts.length >= 3 ? `${parts[0]} ${parts[1]} ${parts[2]}` : dateRaw;
                  }

                  let price = parseFloat(p[1]) || 0;
                  return {
                    date: dateCleanShort,
                    fullDate: dateCleanFull,
                    price,
                    volume: parseInt(p[2]) || 0,
                    timestamp: isValid ? timestamp : 0
                  };
                });
              } catch (jsonErr) {
                console.warn("Failed to parse legacy history JSON:", jsonErr);
              }
            }
          }

          // Parse sell orders from SSR query cache JSON
          const sellOrdersMatch = html.match(/rgCompactSellOrders\\*":\s*(\[[\s\S]*?\])/);
          if (sellOrdersMatch) {
            const cleanJson = sellOrdersMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\/g, '');
            try {
              const sellOrdersList = JSON.parse(cleanJson);
              if (Array.isArray(sellOrdersList)) {
                for (let i = 0; i < sellOrdersList.length; i += 2) {
                  const price = sellOrdersList[i] / 100;
                  const count = sellOrdersList[i + 1];
                  parsedListings.push({ price, count });
                }
              }
            } catch (jsonErr) {
              console.warn("Failed to parse sell orders JSON:", jsonErr);
            }
          }

          setHistory(parsedHistory);
          setListings(parsedListings);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to fetch market data:", err);
        if (active) {
          setError("Failed to retrieve Steam Market data. The market may be rate-limiting requests or you are offline.");
          setLoading(false);
        }
      }
    };

    fetchDetailData();

    return () => {
      active = false;
    };
  }, [item]);

  // Dynamic filter history computation
  const filteredHistory = useMemo(() => {
    if (history.length === 0) return [];
    
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    
    switch (activeFilter) {
      case "7d": {
        const maxTime = Math.max(...history.map(p => p.timestamp));
        return history.filter(p => p.timestamp >= maxTime - 7 * MS_PER_DAY);
      }
      case "3d": {
        const maxTime3 = Math.max(...history.map(p => p.timestamp));
        return history.filter(p => p.timestamp >= maxTime3 - 3 * MS_PER_DAY);
      }
      case "1d": {
        const maxTime1 = Math.max(...history.map(p => p.timestamp));
        return history.filter(p => p.timestamp >= maxTime1 - 1 * MS_PER_DAY);
      }
      case "all":
      default:
        return history;
    }
  }, [history, activeFilter]);

  // Stats calculation
  const chartStats = useMemo(() => {
    if (filteredHistory.length === 0) return { low: 0, avg: 0, high: 0 };
    
    const prices = filteredHistory.map(p => p.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    return { low, avg, high };
  }, [filteredHistory]);



  const trendPercent = useMemo(() => {
    if (filteredHistory.length === 0 || chartStats.avg === 0) return null;
    const latestPrice = filteredHistory[filteredHistory.length - 1].price;
    const avgPrice = chartStats.avg;
    const diff = latestPrice - avgPrice;
    return (diff / avgPrice) * 100;
  }, [filteredHistory, chartStats.avg]);

  // Chart coordinate calculations
  const chartWidth = 520;
  const chartHeight = 220;
  const padding = { top: 20, bottom: 35, left: 50, right: 25 };

  const chartBounds = useMemo(() => {
    if (filteredHistory.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const prices = filteredHistory.map(p => p.price);
    const maxP = Math.max(...prices);
    const minP = Math.min(...prices);
    
    const range = maxP - minP;
    const minY = Math.max(0, minP - (range * 0.1 || 0.1));
    const maxY = maxP + (range * 0.1 || 0.1);

    return {
      minX: 0,
      maxX: filteredHistory.length - 1,
      minY,
      maxY
    };
  }, [filteredHistory]);

  const points = useMemo(() => {
    if (filteredHistory.length === 0) return [];
    
    const { maxX, minY, maxY } = chartBounds;
    const renderWidth = chartWidth - padding.left - padding.right;
    const renderHeight = chartHeight - padding.top - padding.bottom;

    return filteredHistory.map((p, i) => {
      const x = padding.left + (maxX > 0 ? (i / maxX) * renderWidth : renderWidth / 2);
      const y = padding.top + renderHeight - ((p.price - minY) / (maxY - minY || 1)) * renderHeight;
      return { x, y, data: p };
    });
  }, [filteredHistory, chartBounds]);

  const svgPaths = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    const baseHeight = chartHeight - padding.bottom;
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseHeight} L ${points[0].x} ${baseHeight} Z`;

    return { linePath, areaPath };
  }, [points]);

  // Y-axis grid values
  const yTicks = useMemo(() => {
    const { minY, maxY } = chartBounds;
    const step = (maxY - minY) / 4;
    return Array.from({ length: 5 }).map((_, i) => minY + step * i);
  }, [chartBounds]);

  // X-axis grid labels (start, mid, end)
  const xLabels = useMemo(() => {
    if (filteredHistory.length === 0) return [];
    if (filteredHistory.length === 1) {
      return [{ text: filteredHistory[0].date, x: padding.left + (chartWidth - padding.left - padding.right) / 2 }];
    }
    const midIdx = Math.floor(filteredHistory.length / 2);
    return [
      { text: filteredHistory[0].date, x: padding.left },
      { text: filteredHistory[midIdx].date, x: padding.left + (chartWidth - padding.left - padding.right) / 2 },
      { text: filteredHistory[filteredHistory.length - 1].date, x: chartWidth - padding.right }
    ];
  }, [filteredHistory]);



  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (points.length === 0 || !chartRef.current) return;

    const svg = chartRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPoint = point.matrixTransform(ctm.inverse());
    const mouseX = svgPoint.x;

    let closest = points[0];
    let minDist = Math.abs(closest.x - mouseX);
    
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }

    setHoveredPoint(closest.data);
    setHoverPos({ x: closest.x, y: closest.y });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const formatPrice = (val: number) => {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Modal Header */}
        <div className="modal-header-section">
          <div className="modal-item-icon-wrapper" style={{ borderColor: item.gradeColor }}>
            {item.iconUrl ? (
              <img src={item.iconUrl} alt={item.name} className="modal-item-icon-img" />
            ) : (
              <span className="modal-item-fallback">◆</span>
            )}
          </div>
          <div className="modal-item-text-info">
            <h2 className="modal-item-title">{item.name}</h2>
            <div className="modal-item-meta">
              <span className="grade-tag" style={{ color: item.gradeColor }}>{item.grade} Grade</span>
              {item.level && <span className="level-tag">LVL {item.level}</span>}
              {item.isChaotic && <span className="chaotic-tag">CHAOTIC</span>}
              {item.location && <span className="location-tag">Held in {item.location}</span>}
              <button 
                onClick={handleOpenInSteamApp}
                className="steam-link-btn"
                title="Open this item directly in the Steam Desktop Application"
              >
                Steam App ↗
              </button>
              <button 
                onClick={handleOpenInSteamWeb}
                className="steam-link-btn web"
                title="Open this item in your default Web Browser"
              >
                Web Browser ↗
              </button>
            </div>
          </div>
          <div className="modal-item-pricing-header" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span className="price-label">LAST KNOWN PRICE</span>
            <span className="price-value gold">
              {item.price !== null ? formatPrice(item.price) : "Price not found"}
            </span>
            {item.updatedAt && (
              <span style={{ fontSize: "10px", color: "var(--text-dark)", marginTop: "2px" }}>
                Updated: {new Date(item.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        <div className="modal-divider" />

        {/* Modal Content Grid */}
        <div className="modal-body-layout">
          
          {/* Left Column: Interactive Price History Chart */}
          <div className="modal-chart-container">
            <div className="chart-header-row">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 className="section-title" style={{ margin: 0 }}>Price History</h3>
                {trendPercent !== null && (
                  <span className={`trend-indicator ${trendPercent < 0 ? "below" : "above"}`}>
                    {trendPercent < 0 ? "▼" : "▲"} {Math.abs(trendPercent).toFixed(1)}% {trendPercent < 0 ? "below" : "above"} avg
                  </span>
                )}
              </div>
              
              <div className="chart-filters">
                <button 
                  className={`chart-filter-btn ${activeFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </button>

                <button 
                  className={`chart-filter-btn ${activeFilter === "7d" ? "active" : ""}`}
                  onClick={() => setActiveFilter("7d")}
                >
                  7d
                </button>
                <button 
                  className={`chart-filter-btn ${activeFilter === "3d" ? "active" : ""}`}
                  onClick={() => setActiveFilter("3d")}
                >
                  3d
                </button>
                <button 
                  className={`chart-filter-btn ${activeFilter === "1d" ? "active" : ""}`}
                  onClick={() => setActiveFilter("1d")}
                >
                  1d
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="modal-inner-loader">
                <div className="loading-spinner" />
                <p>Loading historical market prices...</p>
              </div>
            ) : error ? (
              <div className="modal-error-box">
                <span className="error-icon">⚠</span>
                <p>{error}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="modal-error-box">
                <span className="error-icon">ℹ</span>
                <p>No historical sales records found for this item on the Steam Market.</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="modal-error-box">
                <span className="error-icon">ℹ</span>
                <p>No historical sales records found for this selected period.</p>
              </div>
            ) : (
              <>
                <div className="chart-wrapper">
                  <svg 
                    ref={chartRef}
                    width="100%" 
                    height={chartHeight} 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="interactive-svg-chart"
                  >
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    {yTicks.map((val, idx) => {
                      const renderHeight = chartHeight - padding.top - padding.bottom;
                      const y = padding.top + renderHeight - ((val - chartBounds.minY) / (chartBounds.maxY - chartBounds.minY || 1)) * renderHeight;
                      return (
                        <g key={idx} className="chart-gridline-group">
                          <line 
                            x1={padding.left} 
                            y1={y} 
                            x2={chartWidth - padding.right} 
                            y2={y} 
                            className="grid-line"
                          />
                          <text 
                            x={padding.left - 8} 
                            y={y + 4} 
                            className="axis-label y-axis"
                          >
                            {formatPrice(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis labels */}
                    {xLabels.map((lbl, idx) => (
                      <text 
                        key={idx} 
                        x={lbl.x} 
                        y={chartHeight - 12} 
                        className={`axis-label x-axis ${idx === 0 ? "start" : idx === 2 ? "end" : "mid"}`}
                      >
                        {lbl.text}
                      </text>
                    ))}

                    {/* Area fill path */}
                    <path d={svgPaths.areaPath} fill="url(#areaGrad)" />

                    {/* Line stroke path */}
                    <path d={svgPaths.linePath} fill="none" stroke="var(--accent-gold)" strokeWidth="2" />



                    {/* Hover vertical line and tooltip marker dot */}
                    {hoveredPoint && (
                      <g>
                        <line 
                          x1={hoverPos.x} 
                          y1={padding.top} 
                          x2={hoverPos.x} 
                          y2={chartHeight - padding.bottom} 
                          className="hover-vertical-line"
                        />
                        <circle 
                          cx={hoverPos.x} 
                          cy={hoverPos.y} 
                          r="5" 
                          fill="var(--accent-gold)" 
                          stroke="#fff" 
                          strokeWidth="1.5"
                          className="hover-point-dot"
                        />
                      </g>
                    )}
                  </svg>

                  {/* Floating Tooltip inside container */}
                  {hoveredPoint && (
                    <div 
                      className="chart-hover-tooltip"
                      style={{ 
                        left: `${(hoverPos.x / chartWidth) * 100}%`,
                        top: `${(hoverPos.y / chartHeight) * 100}%`,
                        transform: `translate(${hoverPos.x + 10 > chartWidth - 140 ? "-110%" : "10px"}, -50%)`
                      }}
                    >
                      <div className="tooltip-date">{hoveredPoint.fullDate || hoveredPoint.date}</div>
                      <div className="tooltip-stat">Price: <span className="val">{formatPrice(hoveredPoint.price)}</span></div>
                      <div className="tooltip-stat">Volume: <span className="val">{hoveredPoint.volume}</span></div>
                    </div>
                  )}
                </div>

                {/* Stats Row under chart */}
                <div className="chart-stats-row">
                  <div className="chart-stat-item">
                    <span className="chart-stat-label">Low</span>
                    <span className="chart-stat-val low">{formatPrice(chartStats.low)}</span>
                  </div>
                  <div className="chart-stat-item">
                    <span className="chart-stat-label">Avg</span>
                    <span className="chart-stat-val avg">{formatPrice(chartStats.avg)}</span>
                  </div>
                  <div className="chart-stat-item">
                    <span className="chart-stat-label">High</span>
                    <span className="chart-stat-val high">{formatPrice(chartStats.high)}</span>
                  </div>

                </div>
              </>
            )}
          </div>

          {/* Right Column: Active Market Listings + Wishlist */}
          <div className="modal-listings-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Wishlist Settings Block */}
            <div className="wishlist-settings-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <h3 className="section-title" style={{ margin: 0, fontSize: "14px", color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⭐ Price Alerts & Wishlist</span>
              </h3>
              
              {isWishlisted && wishlistedItem ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    Tracking: Alerts when price goes <strong>{wishlistedItem.alertType === "below" ? "below" : "above"} ${wishlistedItem.targetPrice.toFixed(2)}</strong>.
                  </p>
                  <button 
                    onClick={() => onRemoveFromWishlist && onRemoveFromWishlist(item.itemKey)}
                    className="clear-history-btn" 
                    style={{ padding: "6px", width: "100%", justifyContent: "center" }}
                  >
                    🗑 Stop Tracking
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-dark)", fontWeight: "bold" }}>TARGET PRICE ($)</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={targetPrice} 
                        onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)} 
                        style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", width: "100%" }}
                      />
                    </div>
                    <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-dark)", fontWeight: "bold" }}>CONDITION</span>
                      <select 
                        value={alertType} 
                        onChange={(e) => setAlertType(e.target.value as "below" | "above")}
                        style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", width: "100%", cursor: "pointer" }}
                      >
                        <option value="below">Drops below or equals</option>
                        <option value="above">Rises above or equals</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={() => onAddToWishlist && onAddToWishlist({
                      itemKey: item.itemKey,
                      name: item.name,
                      grade: item.grade,
                      gradeColor: item.gradeColor,
                      iconUrl: item.iconUrl,
                      marketHashName: item.marketHashName,
                      targetPrice,
                      alertType
                    })}
                    style={{ background: "rgba(255, 184, 48, 0.1)", border: "1px solid rgba(255, 184, 48, 0.3)", color: "var(--accent-gold)", padding: "8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease", marginTop: "4px" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 184, 48, 0.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 184, 48, 0.1)"}
                  >
                    ⭐ Track Price
                  </button>
                </div>
              )}
            </div>

            <div>
              <h3 className="section-title">Cheapest Active Listings</h3>
            {loading ? (
              <div className="modal-inner-loader">
                <div className="loading-spinner" />
              </div>
            ) : listings.length === 0 ? (
              <div className="empty-listings-state">
                <p>No active listings found for sale on Steam.</p>
              </div>
            ) : (
              <div className="listings-table-wrapper">
                <table className="listings-table">
                  <thead>
                    <tr>
                      <th>Price</th>
                      <th style={{ textAlign: "right" }}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.slice(0, 8).map((lst, idx) => (
                      <tr key={idx} className="listing-row">
                        <td className="listing-price gold">{formatPrice(lst.price)}</td>
                        <td className="listing-qty" style={{ textAlign: "right" }}>{lst.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  </div>
);
};
