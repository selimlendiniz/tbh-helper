import React from "react";
import "../styles/empty-state.css";

interface EmptyStateProps {
  onRetry: () => void;
}

export const LoadingState: React.FC = () => {
  return (
    <div className="empty-state">
      <div className="loading-spinner" />
      <p>Loading application data...</p>
    </div>
  );
};

export const NoSaveState: React.FC<EmptyStateProps> = ({ onRetry }) => {
  return (
    <div className="empty-state">
      <p style={{ fontSize: "18px", fontWeight: 600 }}>No Save File Data Loaded</p>
      <p style={{ maxWidth: "500px", fontSize: "14px", lineHeight: "1.6" }}>
        We could not load or decrypt your Task Bar Hero save file from 
        <code> %USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3</code>. 
        Please make sure the game is running, a character has been created, and that you have at least saved once.
      </p>
      <button className="tab-btn" onClick={onRetry} style={{ border: "1px solid var(--border-color)", padding: "8px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", color: "var(--text-main)" }}>
        Retry Loading Save File
      </button>
    </div>
  );
};
