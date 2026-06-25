import { useState, useRef, useLayoutEffect } from "react";
import { TbhItem } from "../types";
import { getClassRestriction, getSlotLimits, getInherentStats, getInherentOptions, formatEnchantOrSlot, getTierColor } from "../utils";
import { GRADE_MAP, GRADE_COLORS } from "../constants";
import "../styles/tooltip.css";

// @ts-ignore
import tbhDataRaw from "../tbh_data.json";

const tbhData: any = tbhDataRaw;

interface GameTooltipProps {
  hoveredItem: TbhItem | null;
  tooltipPos: { x: number; y: number };
  activeTab: string;
}

export const GameTooltip: React.FC<GameTooltipProps> = ({ hoveredItem, tooltipPos, activeTab }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: -9999, y: -9999 });

  useLayoutEffect(() => {
    if (!hoveredItem || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const height = rect.height;
    const width = rect.width || 310;

    let x = tooltipPos.x + 15;
    let y = tooltipPos.y + 15;

    if (x + width > window.innerWidth) {
      x = tooltipPos.x - width - 10;
    }
    if (y + height > window.innerHeight) {
      y = tooltipPos.y - height - 10;
    }

    if (x < 10) x = 10;
    if (y < 10) y = 10;

    setCoords({ x, y });
  }, [tooltipPos.x, tooltipPos.y, hoveredItem]);

  if (!hoveredItem) return null;

  const props = tbhData.properties[hoveredItem.lookupKey] || {};
  const gearType = hoveredItem.gearType || props.t || null;
  const level = hoveredItem.level || props.l || null;
  const grade = hoveredItem.grade || GRADE_MAP[props.g] || "Common";
  const gradeColor = hoveredItem.gradeColor || GRADE_COLORS[grade] || GRADE_COLORS.Unknown;

  const activeEnchants = hoveredItem.enchantData
    ? hoveredItem.enchantData.filter((e: any) => e.StatType > 0 && e.Value > 0)
    : [];

  const limits = getSlotLimits(grade, gearType);
  const hasSlots = limits.decoration > 0 || limits.engraving > 0 || limits.inscription > 0;

  let decList: any[] = [];
  let engList: any[] = [];
  let insList: any[] = [];
  let remainingEnchants: any[] = [];

  if (limits.decoration > 0 || limits.engraving > 0 || limits.inscription > 0) {
    let activeIdx = 0;
    
    for (let i = 0; i < limits.decoration; i++) {
      if (activeIdx < activeEnchants.length) {
        decList.push(activeEnchants[activeIdx++]);
      }
    }
    for (let i = 0; i < limits.engraving; i++) {
      if (activeIdx < activeEnchants.length) {
        engList.push(activeEnchants[activeIdx++]);
      }
    }
    for (let i = 0; i < limits.inscription; i++) {
      if (activeIdx < activeEnchants.length) {
        insList.push(activeEnchants[activeIdx++]);
      }
    }
    while (activeIdx < activeEnchants.length) {
      remainingEnchants.push(activeEnchants[activeIdx++]);
    }
  } else {
    remainingEnchants = activeEnchants;
  }

  const inherentStats = getInherentStats(gearType, level, grade);
  const inherentOptions = getInherentOptions(gearType, level, grade);
  const hasInherentOptions = inherentOptions.length > 0;

  const classRestriction = getClassRestriction(gearType);
  const isMaterial = hoveredItem.isMaterial || props.tp === "MATERIAL";
  
  const isTradeable = hoveredItem.itemKey?.endsWith("900") || hoveredItem.location === "Market" || activeTab === "market";

  return (
    <div 
      ref={containerRef}
      className="game-tooltip-container" 
      style={{ 
        top: coords.y, 
        left: coords.x,
        opacity: coords.x === -9999 ? 0 : 1,
        border: `2px solid #8f7961`,
        outline: `1px solid #000`,
      }}
    >
      {/* Header Box */}
      <div className="game-tooltip-header">
        <div className="game-tooltip-title" style={{ color: gradeColor }}>
          {hoveredItem.name}
        </div>
      </div>

      {/* Icon & Basic Stats Row */}
      <div className="game-tooltip-body">
        <div className="game-tooltip-icon-container" style={{ borderColor: gradeColor }}>
          {hoveredItem.iconUrl ? (
            <img src={hoveredItem.iconUrl} alt={hoveredItem.name} className="game-tooltip-icon-img" />
          ) : (
            <span className="game-tooltip-icon-fallback">◆</span>
          )}
        </div>
        <div className="game-tooltip-main-details">
          <div className="game-tooltip-grade" style={{ color: gradeColor }}>
            {grade} Grade
          </div>
          {inherentStats.map((stat, idx) => (
            <div key={idx} className="game-tooltip-stat-row">
              <span className="stat-label">{stat.name}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Inherent Options Section */}
      {hasInherentOptions && (
        <>
          <div className="game-tooltip-divider" />
          <div className="game-tooltip-section">
            <div className="game-section-title">Inherent Stats</div>
            {inherentOptions.map((opt, idx) => (
              <div key={idx} className="game-tooltip-option-row">
                <span className="game-bullet">[-]</span>
                <span className="game-option-text">{opt}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Slots Section */}
      {hasSlots && (
        <>
          <div className="game-tooltip-divider" />
          <div className="game-tooltip-section">
            {limits.decoration > 0 && (
              <div className="game-slot-group">
                <div className="game-slot-title dec">
                  <span className="game-slot-icon dec">✜</span> Decoration Slot
                </div>
                {Array.from({ length: limits.decoration }).map((_, i) => {
                  const filledItem = decList[i];
                  return (
                    <div key={`dec-${i}`} className="game-tooltip-option-row">
                      {filledItem ? (
                        <>
                          <span className="game-tier-badge" style={{ backgroundColor: getTierColor(filledItem.Tier) }}>
                            T{filledItem.Tier}
                          </span>
                          <span className="game-slot-text filled">
                            {formatEnchantOrSlot(filledItem)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="game-bullet">[-]</span>
                          <span className="game-slot-text empty">Empty Slot (Can Decorate)</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {limits.engraving > 0 && (
              <div className="game-slot-group">
                <div className="game-slot-title eng">
                  <span className="game-slot-icon eng">⛨</span> Engraving Slot
                </div>
                {Array.from({ length: limits.engraving }).map((_, i) => {
                  const filledItem = engList[i];
                  return (
                    <div key={`eng-${i}`} className="game-tooltip-option-row">
                      {filledItem ? (
                        <>
                          <span className="game-tier-badge" style={{ backgroundColor: getTierColor(filledItem.Tier) }}>
                            T{filledItem.Tier}
                          </span>
                          <span className="game-slot-text filled">
                            {formatEnchantOrSlot(filledItem)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="game-bullet">[-]</span>
                          <span className="game-slot-text empty">Empty Slot (Can Engrave)</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {limits.inscription > 0 && (
              <div className="game-slot-group">
                <div className="game-slot-title ins">
                  <span className="game-slot-icon ins">📜</span> Inscription Slot
                </div>
                {Array.from({ length: limits.inscription }).map((_, i) => {
                  const filledItem = insList[i];
                  return (
                    <div key={`ins-${i}`} className="game-tooltip-option-row">
                      {filledItem ? (
                        <>
                          <span className="game-tier-badge" style={{ backgroundColor: getTierColor(filledItem.Tier) }}>
                            T{filledItem.Tier}
                          </span>
                          <span className="game-slot-text filled">
                            {formatEnchantOrSlot(filledItem)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="game-bullet">[-]</span>
                          <span className="game-slot-text empty">Empty Slot (Can Inscribe)</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Enchants Section */}
      {remainingEnchants.length > 0 && (
        <>
          <div className="game-tooltip-divider" />
          <div className="game-tooltip-section">
            <div className="game-section-title">Enchants</div>
            {remainingEnchants.map((ench: any, idx: number) => (
              <div key={idx} className="game-tooltip-option-row">
                <span className="game-bullet">[-]</span>
                <span className="game-enchant-text">
                  {formatEnchantOrSlot(ench)}
                  {ench.Tier > 0 && <span className="game-tier-tag"> (T{ench.Tier})</span>}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer info: Tradable & Class limit */}
      <div className="game-tooltip-divider" />
      <div className="game-tooltip-footer-row">
        <span className="game-tradable">{isTradeable ? "Tradable" : "Untradable"}</span>
        {!isMaterial && (
          <span className="game-class-limit" style={{ color: classRestriction.color }}>
            {classRestriction.text}
          </span>
        )}
      </div>

      {/* Footer info: Price & Req level */}
      <div className="game-tooltip-footer-row second-row">
        <div className="game-price">
          <span className="game-coin-icon" />
          <span className="game-price-val">
            {hoveredItem.price !== null && hoveredItem.price !== undefined
              ? `$${hoveredItem.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
              : "Price not found"}
          </span>
        </div>
        {level && (
          <span className="game-req-level">Requires Lv.{level}</span>
        )}
      </div>
    </div>
  );
};

// Hook for tooltip mouse event handlers
export function useTooltip() {
  const [hoveredItem, setHoveredItem] = useState<TbhItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseEnter = (item: TbhItem, e: React.MouseEvent) => {
    setHoveredItem(item);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return {
    hoveredItem,
    tooltipPos,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave
  };
}
