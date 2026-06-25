import React from "react";
import { AnalyticsData, ParsedSave } from "../types";
import { GRADE_COLORS } from "../constants";
import "../styles/analytics.css";

interface AnalyticsPanelProps {
  analyticsData: AnalyticsData;
  parsedSave: ParsedSave;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analyticsData, parsedSave }) => {
  return (
    <div className="analytics-section">
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
