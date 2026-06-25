import React from "react";
import { ParsedSave } from "../types";
import "../styles/stats-grid.css";

interface StatsGridProps {
  parsedSave: ParsedSave | null;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ parsedSave }) => {
  return (
    <section className="stats-grid fade-in">
      <div className="stat-card">
        <span className="stat-label">Total Stash Value</span>
        <span className="stat-value gold">
          ${parsedSave ? parsedSave.totalStashValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
        </span>
        <span className="stat-desc">Steam Community Market Value</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Stashed Items</span>
        <span className="stat-value">{parsedSave ? parsedSave.totalItems : 0}</span>
        <span className="stat-desc">Total quantity in bag & stash</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Character level</span>
        <span className="stat-value">LVL {parsedSave ? parsedSave.level : 1}</span>
        <span className="stat-desc">Cube Level</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Steam App ID</span>
        <span className="stat-value" style={{ fontSize: "20px" }}>3678970</span>
        <span className="stat-desc">Task Bar Hero ID</span>
      </div>
    </section>
  );
};
