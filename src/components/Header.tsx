import React from "react";
import "../styles/header.css";

interface HeaderProps {
  statusMessage: string;
  isLive: boolean;
  onReload: () => void;
  onSelectFile: () => void;
  loadingPrices?: boolean;
  onRefreshPrices: (clearCache: boolean) => void;
  steamRateLimited?: boolean;
  totalStashValue?: number;
  steamLoggedIn?: boolean;
  onConnectSteam?: () => void;
  onDisconnectSteam?: () => void;
  onStopPrices?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  statusMessage, 
  isLive, 
  onReload, 
  onSelectFile,
  loadingPrices,
  onRefreshPrices,
  steamRateLimited,
  totalStashValue,
  steamLoggedIn,
  onConnectSteam,
  onDisconnectSteam,
  onStopPrices
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
        
        <div className="provider-selector-container">
          <span className="provider-select" style={{ fontSize: "12px", fontWeight: 600 }}>Steam Market</span>
        </div>

        <div className={`status-badge ${steamLoggedIn ? "" : "error"}`} style={{ 
          background: steamLoggedIn ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          borderColor: steamLoggedIn ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
          color: steamLoggedIn ? "#10b981" : "#f87171"
        }}>
          <div className="status-dot" style={{ background: steamLoggedIn ? "#10b981" : "#f87171" }} />
          <span>{steamLoggedIn ? "STEAM CONNECTED" : "STEAM DISCONNECTED"}</span>
        </div>

        {steamLoggedIn ? (
          <button 
            onClick={onDisconnectSteam}
            className="tab-btn" 
            style={{ 
              border: "1px solid var(--border-color)", 
              padding: "4px 10px", 
              borderRadius: "6px", 
              fontSize: "12px", 
              background: "rgba(255,255,255,0.02)",
              color: "var(--text-muted)",
              cursor: "pointer"
            }}
          >
            Disconnect Steam
          </button>
        ) : (
          <button 
            onClick={onConnectSteam}
            className="tab-btn" 
            style={{ 
              border: "1px solid rgba(59, 130, 246, 0.4)", 
              padding: "4px 10px", 
              borderRadius: "6px", 
              fontSize: "12px", 
              background: "rgba(59, 130, 246, 0.08)",
              color: "#60a5fa",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🔌 Connect Steam
          </button>
        )}



        <div className={`status-badge ${isLive ? "" : "error"}`}>
          <div className="status-dot" />
          <span>{isLive ? "REAL-TIME SYNC ACTIVE" : "DISCONNECTED"}</span>
        </div>
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
            Reset & Refresh Prices
          </button>
        )}
        <button 
          onClick={onReload} 
          className="tab-btn" 
          style={{ border: "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", background: "rgba(255,255,255,0.02)" }}
        >
          Manual Reload
        </button>
        <button 
          onClick={onSelectFile} 
          className="tab-btn" 
          style={{ border: "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", background: "rgba(255,255,255,0.02)" }}
        >
          Select Save File
        </button>
      </div>
    </header>
  );
};
