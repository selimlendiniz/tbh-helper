import React, { useState, useRef, useMemo } from "react";
import { AnalyticsData, ParsedSave, PortfolioPoint } from "../types";
import { GRADE_COLORS } from "../constants";
import "../styles/analytics.css";

interface AnalyticsPanelProps {
  analyticsData: AnalyticsData;
  parsedSave: ParsedSave;
  portfolioHistory?: PortfolioPoint[];
  onClearPortfolio?: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ 
  analyticsData, 
  parsedSave,
  portfolioHistory = [],
  onClearPortfolio
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<PortfolioPoint | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef<SVGSVGElement>(null);

  const chartWidth = 900;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 60 };

  const history = portfolioHistory || [];

  const chartBounds = useMemo(() => {
    if (history.length === 0) return { minY: 0, maxY: 0 };
    const values = history.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    
    const diff = maxVal - minVal;
    const paddingVal = diff === 0 ? maxVal * 0.1 || 10 : diff * 0.15;
    return {
      minY: Math.max(0, minVal - paddingVal),
      maxY: maxVal + paddingVal
    };
  }, [history]);

  const points = useMemo(() => {
    if (history.length === 0) return [];
    
    const { minY, maxY } = chartBounds;
    const renderWidth = chartWidth - padding.left - padding.right;
    const renderHeight = chartHeight - padding.top - padding.bottom;
    const maxX = history.length - 1;

    return history.map((p, i) => {
      const x = padding.left + (maxX > 0 ? (i / maxX) * renderWidth : renderWidth / 2);
      const y = padding.top + renderHeight - ((p.value - minY) / (maxY - minY || 1)) * renderHeight;
      return { x, y, data: p };
    });
  }, [history, chartBounds]);

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

  const yTicks = useMemo(() => {
    const { minY, maxY } = chartBounds;
    const step = (maxY - minY) / 4;
    return Array.from({ length: 5 }).map((_, i) => minY + step * i);
  }, [chartBounds]);

  const xLabels = useMemo(() => {
    if (history.length === 0) return [];
    if (history.length === 1) {
      return [{ text: history[0].date, x: padding.left + (chartWidth - padding.left - padding.right) / 2 }];
    }
    const midIdx = Math.floor(history.length / 2);
    return [
      { text: history[0].date, x: padding.left },
      { text: history[midIdx].date, x: padding.left + (chartWidth - padding.left - padding.right) / 2 },
      { text: history[history.length - 1].date, x: chartWidth - padding.right }
    ];
  }, [history]);

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

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your Stash Value History? This action cannot be undone.")) {
      onClearPortfolio && onClearPortfolio();
    }
  };

  return (
    <div className="analytics-section">
      {/* Portfolio History Panel */}
      <div className="chart-panel portfolio-history-panel">
        <div className="chart-header-row">
          <h3 className="chart-title" style={{ border: 0, padding: 0, margin: 0 }}>Stash Value History</h3>
          {history.length >= 1 && (
            <button onClick={handleClearHistory} className="clear-history-btn" title="Reset all recorded stash values">
              🗑 Clear History
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <div className="portfolio-onboarding-box">
            <span className="portfolio-onboarding-icon">📈</span>
            <h4 className="portfolio-onboarding-title">Portfolio Tracking Active!</h4>
            <p className="portfolio-onboarding-desc">
              Your Stash value history chart will start drawing once you load save files. We save one snapshot per day to track your progress over time.
            </p>
          </div>
        ) : (
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
                <linearGradient id="portfolioAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
                      ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis labels */}
              {xLabels.map((lbl, idx) => (
                <text 
                  key={idx} 
                  x={lbl.x} 
                  y={chartHeight - 10} 
                  className={`axis-label x-axis ${idx === 0 ? "start" : idx === 2 ? "end" : "mid"}`}
                >
                  {lbl.text.replace(/, \d{4}/, "")}
                </text>
              ))}

              {/* Area fill path */}
              {points.length >= 2 && <path d={svgPaths.areaPath} fill="url(#portfolioAreaGrad)" />}

              {/* Line stroke path */}
              {points.length >= 2 && <path d={svgPaths.linePath} fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" />}

              {/* Single point persistent dot */}
              {points.length === 1 && (
                <circle 
                  cx={points[0].x} 
                  cy={points[0].y} 
                  r="6" 
                  fill="var(--accent-gold)" 
                  stroke="#fff" 
                  strokeWidth="2"
                  filter="drop-shadow(0 0 4px var(--accent-gold))"
                />
              )}

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
                <div className="tooltip-date">{hoveredPoint.date}</div>
                <div className="tooltip-stat">Stash: <span className="val">${hoveredPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              </div>
            )}

            {history.length === 1 && (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "8px", fontStyle: "italic" }}>
                Trend line will start drawing once you load save files on different days.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="charts-row">
        {/* Rarity Breakdown */}
        <div className="chart-panel">
          <h3 className="chart-title">Rarity Distribution</h3>
          <div className="rarity-bar-container">
            {Object.entries(analyticsData.rarityDistribution)
              .filter(([_, data]) => data.count > 0)
              .sort((a, b) => b[1].value - a[1].value)
              .map(([grade, data]) => {
                const percentage = (data.count / parsedSave.totalItems) * 100;
                return (
                  <div key={grade} className="rarity-row">
                    <div className="rarity-label-row">
                      <span style={{ color: GRADE_COLORS[grade] }}>{grade} ({data.count})</span>
                      <span style={{ color: "var(--accent-gold)" }}>${data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="rarity-progress-bg">
                      <div 
                        className="rarity-progress-bar" 
                        style={{ width: `${percentage}%`, "--color": GRADE_COLORS[grade] } as any}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Holdings */}
        <div className="chart-panel">
          <h3 className="chart-title">Top 5 Most Valuable Holdings</h3>
          <div className="leaderboard-list">
            {analyticsData.topHoldings.map((item, index) => (
              <div key={index} className="leaderboard-row" style={{ borderLeft: `4px solid ${item.gradeColor}` }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", minWidth: 0 }}>
                  <div className="item-icon-wrapper" style={{ width: "38px", height: "38px" }}>
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.name} className="item-icon-img" style={{ width: "24px", height: "24px" }} />
                    ) : (
                      <span className="item-icon-fallback" style={{ fontSize: "14px" }}>◆</span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="item-name" style={{ fontSize: "14px" }} title={item.name}>{item.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Qty: {item.quantity} · {item.grade}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="item-price-total" style={{ fontSize: "14px" }}>
                    ${item.totalValue ? item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-dark)" }}>
                    ${item.price ? item.price.toFixed(2) : "0"} each
                  </div>
                </div>
              </div>
            ))}
            {analyticsData.topHoldings.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No valuable holdings found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
