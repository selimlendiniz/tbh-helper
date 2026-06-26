import React from "react";
import "../styles/header.css";

interface HeaderProps {
  statusMessage: string;
  loadingPrices?: boolean;
  onRefreshPrices: (clearCache: boolean) => void;
  steamRateLimited?: boolean;
  totalStashValue?: number;
  onStopPrices?: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  statusMessage,
  loadingPrices,
  onRefreshPrices,
  steamRateLimited,
  totalStashValue,
  onStopPrices,
  onOpenSettings,
}) => {
  return (
    <header className="dashboard-header fade-in">
      <div className="brand-section" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="brand-logo-glow" />
          <h1 className="brand-title">TBH Helper</h1>
        </div>
        {totalStashValue !== undefined && (
          <div style={{
            background: "rgba(255, 128, 0, 0.08)",
            border: "1px solid rgba(255, 128, 0, 0.25)",
            borderRadius: "8px",
            padding: "4px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: "1.2",
            minWidth: "120px"
          }}>
            <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
              Inventory Value
            </span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#ff8000", fontFamily: "var(--font-mono, monospace)" }}>
              ${totalStashValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      <div className="status-container" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{statusMessage}</span>
        {loadingPrices && (
          <div className="loading-spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#ff8000", margin: 0 }} />
        )}
        {steamRateLimited && (
          <span style={{
            fontSize: "11px",
            fontWeight: "bold",
            color: "#f59e0b",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            padding: "2px 8px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            ⚠ Steam Rate Limited (429)
          </span>
        )}

        {loadingPrices ? (
          <button
            onClick={onStopPrices}
            className="tab-btn"
            style={{
              border: "1px solid rgba(239, 68, 68, 0.4)",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#f87171",
              cursor: "pointer"
            }}
          >
            ⏹ Stop Fetching
          </button>
        ) : (
          <button
            onClick={() => onRefreshPrices(true)}
            className="tab-btn"
            style={{
              border: "1px solid var(--border-color)",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer"
            }}
          >
            Reset &amp; Refresh Prices
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="tab-btn"
          title="Settings"
          style={{
            border: "1px solid var(--border-color)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "14px",
            background: "rgba(255,255,255,0.02)",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: 600,
            transition: "all 0.15s"
          }}
        >
          ⚙ Settings
        </button>
      </div>
    </header>
  );
};

