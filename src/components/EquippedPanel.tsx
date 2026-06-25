import React from "react";
import { TbhItem, ParsedSave } from "../types";
import { HERO_CLASS_NAMES, HERO_COLORS } from "../constants";
import "../styles/equipped.css";

interface EquippedPanelProps {
  parsedSave: ParsedSave;
  onMouseEnter: (item: TbhItem, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

const renderHeroSprite = (heroKey: number) => {
  switch (heroKey) {
    case 101: // Warrior
      return (
        <svg viewBox="0 0 16 16" className="hero-sprite-svg">
          <rect x="5" y="1" width="6" height="7" fill="#90a4ae" />
          <rect x="4" y="4" width="8" height="3" fill="#78909c" />
          <rect x="7" y="0" width="2" height="2" fill="#e53935" />
          <rect x="5" y="5" width="6" height="1" fill="#263238" />
          <rect x="4" y="8" width="8" height="7" fill="#90a4ae" />
          <rect x="6" y="9" width="4" height="4" fill="#ffb300" />
          <rect x="1" y="9" width="3" height="4" fill="#37474f" />
          <rect x="2" y="8" width="1" height="6" fill="#78909c" />
          <rect x="13" y="5" width="1" height="8" fill="#cfd8dc" />
          <rect x="12" y="11" width="3" height="1" fill="#8d6e63" />
        </svg>
      );
    case 201: // Ranger
      return (
        <svg viewBox="0 0 16 16" className="hero-sprite-svg">
          <rect x="5" y="2" width="6" height="3" fill="#ffd54f" />
          <rect x="4" y="3" width="8" height="4" fill="#ffca28" />
          <rect x="3" y="5" width="2" height="5" fill="#ffb300" />
          <rect x="11" y="5" width="2" height="5" fill="#ffb300" />
          <rect x="5" y="5" width="6" height="4" fill="#ffe0b2" />
          <rect x="6" y="6" width="1" height="1" fill="#00c853" />
          <rect x="9" y="6" width="1" height="1" fill="#00c853" />
          <rect x="5" y="9" width="6" height="5" fill="#4caf50" />
          <rect x="4" y="10" width="1" height="3" fill="#388e3c" />
          <rect x="11" y="10" width="1" height="3" fill="#388e3c" />
          <rect x="2" y="6" width="1" height="7" fill="#8d6e63" />
          <rect x="3" y="5" width="1" height="1" fill="#8d6e63" />
          <rect x="3" y="13" width="1" height="1" fill="#8d6e63" />
          <rect x="3" y="6" width="1" height="7" fill="#e0e0e0" opacity="0.5" />
        </svg>
      );
    case 301: // Sorcerer
      return (
        <svg viewBox="0 0 16 16" className="hero-sprite-svg">
          <rect x="7" y="0" width="2" height="2" fill="#5e35b1" />
          <rect x="6" y="2" width="4" height="2" fill="#5e35b1" />
          <rect x="5" y="4" width="6" height="1" fill="#ffb300" />
          <rect x="3" y="5" width="10" height="1" fill="#4527a0" />
          <rect x="5" y="6" width="6" height="3" fill="#ffe0b2" />
          <rect x="6" y="7" width="1" height="1" fill="#1565c0" />
          <rect x="9" y="7" width="1" height="1" fill="#1565c0" />
          <rect x="5" y="9" width="6" height="2" fill="#e0e0e0" />
          <rect x="5" y="10" width="6" height="5" fill="#5e35b1" />
          <rect x="12" y="4" width="1" height="11" fill="#795548" />
          <rect x="11" y="3" width="3" height="1" fill="#ffd54f" />
          <rect x="12" y="2" width="1" height="1" fill="#00e5ff" />
        </svg>
      );
    case 401: // Priest
      return (
        <svg viewBox="0 0 16 16" className="hero-sprite-svg">
          <rect x="5" y="1" width="6" height="2" fill="#ffffff" />
          <rect x="4" y="3" width="8" height="5" fill="#ffffff" />
          <rect x="3" y="4" width="1" height="6" fill="#3f51b5" />
          <rect x="12" y="4" width="1" height="6" fill="#3f51b5" />
          <rect x="7" y="3" width="2" height="3" fill="#ffb300" />
          <rect x="6" y="4" width="4" height="1" fill="#ffb300" />
          <rect x="5" y="5" width="6" height="3" fill="#ffe0b2" />
          <rect x="6" y="6" width="1" height="1" fill="#3f51b5" />
          <rect x="9" y="6" width="1" height="1" fill="#3f51b5" />
          <rect x="4" y="9" width="8" height="6" fill="#ffffff" />
          <rect x="6" y="9" width="4" height="6" fill="#3f51b5" />
          <rect x="2" y="5" width="1" height="10" fill="#ffca28" />
          <rect x="1" y="4" width="3" height="1" fill="#ffca28" />
          <rect x="2" y="3" width="1" height="3" fill="#ffca28" />
        </svg>
      );
    case 501: // Rogue
      return (
        <svg viewBox="0 0 16 16" className="hero-sprite-svg">
          <rect x="5" y="2" width="6" height="7" fill="#37474f" />
          <rect x="4" y="3" width="8" height="5" fill="#263238" />
          <rect x="5" y="5" width="6" height="3" fill="#1a1a1a" />
          <rect x="6" y="6" width="1" height="1" fill="#ff1744" />
          <rect x="9" y="6" width="1" height="1" fill="#ff1744" />
          <rect x="4" y="9" width="8" height="6" fill="#263238" />
          <rect x="2" y="10" width="1" height="4" fill="#cfd8dc" />
          <rect x="2" y="14" width="1" height="1" fill="#8d6e63" />
        </svg>
      );
    case 601: // Warlock
      return (
        <svg viewBox="0 0 16 16" className="hero-sprite-svg">
          <rect x="5" y="2" width="6" height="7" fill="#4a148c" />
          <rect x="4" y="3" width="8" height="5" fill="#311b92" />
          <rect x="3" y="1" width="1" height="3" fill="#4a148c" />
          <rect x="12" y="1" width="1" height="3" fill="#4a148c" />
          <rect x="5" y="5" width="6" height="3" fill="#1a1a1a" />
          <rect x="6" y="6" width="1" height="1" fill="#e040fb" />
          <rect x="9" y="6" width="1" height="1" fill="#e040fb" />
          <rect x="4" y="9" width="8" height="6" fill="#311b92" />
          <rect x="13" y="4" width="1" height="11" fill="#5d4037" />
          <rect x="12" y="3" width="3" height="2" fill="#eceff1" />
        </svg>
      );
    default:
      return null;
  }
};

export const EquippedPanel: React.FC<EquippedPanelProps> = ({ parsedSave, onMouseEnter, onMouseMove, onMouseLeave }) => {
  const leftSlots = [
    { label: "MAIN WEAPON", index: 0 },
    { label: "OFF-HAND WEAPON", index: 1 },
    { label: "HELMET", index: 2 },
    { label: "ARMOR", index: 3 },
    { label: "GLOVES", index: 4 },
    { label: "BOOTS", index: 5 }
  ];
  
  const rightSlots = [
    { label: "NECKLACE", index: 6 },
    { label: "EARRING", index: 7 },
    { label: "RING", index: 8 },
    { label: "BRACELET", index: 9 }
  ];

  const renderSlot = (slotDef: { label: string, index: number }, heroItems: TbhItem[], itemIds: any[]) => {
    const itemUniqueId = String(itemIds[slotDef.index]);
    const item = heroItems.find((it: any) => it.uniqueId === itemUniqueId);
    
    if (item) {
      return (
        <div key={slotDef.index} className="equipped-slot-container">
          <span className="equipped-slot-label">{slotDef.label}</span>
          <div 
            className="equipped-slot-box item-card-equipped" 
            style={{ "--rarity-color": item.gradeColor } as any}
            onMouseEnter={(e) => onMouseEnter(item, e)}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            <span className="equipped-slot-price">
              {item.totalValue ? `$${item.totalValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : ""}
            </span>
            <div className="equipped-slot-icon-wrapper">
              {item.iconUrl ? (
                <img src={item.iconUrl} alt={item.name} className="equipped-slot-icon-img" />
              ) : (
                <span className="equipped-slot-icon-fallback">◆</span>
              )}
            </div>
            {item.level && (
              <span className="equipped-slot-level">{item.level}</span>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div key={slotDef.index} className="equipped-slot-container">
          <span className="equipped-slot-label">{slotDef.label}</span>
          <div className="equipped-slot-box empty">
            <span className="equipped-slot-empty-icon">✕</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="equipped-characters-section">
      <h2 className="equipped-title">
        {Object.values(parsedSave.equippedByHero).filter((list: any) => list.length > 0).length} Heroes Equipped
      </h2>
      <div className="equipped-grid">
        {parsedSave.heroSaveDatas
          .filter((hero: any) => hero.IsUnLock)
          .map((hero: any) => {
            const heroKey = hero.heroKey;
            const heroName = HERO_CLASS_NAMES[heroKey] || `Hero #${heroKey}`;
            const heroLevel = hero.HeroLevel || 1;
            const itemIds = hero.equippedItemIds || [];
            const heroItems = parsedSave.equippedByHero[heroKey] || [];
            const heroEqValue = heroItems.reduce((acc: number, item: any) => acc + (item.totalValue || 0), 0);
            const themeColor = HERO_COLORS[heroKey] || "#ffffff";
            
            return (
              <div key={heroKey} className="hero-equipment-card" style={{ "--hero-theme": themeColor } as any}>
                <div className="hero-card-header">
                  <div className="hero-header-left">
                    <span className="hero-class-title" style={{ color: themeColor }}>{heroName}</span>
                    <span className="hero-level-subtitle">Lv.{heroLevel}</span>
                  </div>
                  <div className="hero-header-right">
                    <span className="eq-val-label">EQUIPMENT VALUE</span>
                    <span className="eq-val-price">${heroEqValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                  </div>
                </div>
                
                <div className="hero-card-content">
                  <div className="hero-slots-left">
                    {leftSlots.map((s) => renderSlot(s, heroItems, itemIds))}
                  </div>
                  <div className="hero-sprite-container">
                    {renderHeroSprite(heroKey)}
                  </div>
                  <div className="hero-slots-right">
                    {rightSlots.map((s) => renderSlot(s, heroItems, itemIds))}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
