import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ParsedSave, TbhItem } from "../types";
import { GRADE_COLORS } from "../constants";
import materialEffectsRaw from "../constants/material_effects.json";
// @ts-ignore
import tbhDataRaw from "../tbh_data.json";
import "../styles/materials.css";

const materialEffects = materialEffectsRaw as any[];
const tbhData = tbhDataRaw as any;

interface MaterialEffectsPanelProps {
  parsedSave: ParsedSave | null;
  onMouseEnter: (item: TbhItem, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

const STAT_TRANSLATIONS: Record<string, string> = {
  "Fire Damage Percent": "Ateş Hasarı Yüzdesi",
  "Fire Resistance": "Ateş Direnci",
  "Attack Damage": "Saldırı Hasarı",
  "Cold Damage Percent": "Soğuk Hasarı Yüzdesi",
  "Armor": "Zırh",
  "Critical Chance": "Kritik Şansı",
  "Lightning Damage Percent": "Yıldırım Hasarı Yüzdesi",
  "Cast Speed": "Büyü Hızı",
  "Attack Speed": "Saldırı Hızı",
  "Damage Absorption": "Hasar Emilimi",
  "Movement Speed": "Hareket Hızı",
  "Physical Damage Percent": "Fiziksel Hasar Yüzdesi",
  "Max HP": "Maks HP",
  "Cooldown Reduction": "Bekleme Süresi Azaltma",
  "Cold Resistance": "Soğuk Direnci",
  "Block Chance": "Engelleme Şansı",
  "Area Of Effect": "Etki Alanı",
  "Lightning Resistance": "Yıldırım Direnci",
  "Add Hp Per Kill": "Öldürme Başı Can",
  "Add HP Per Hit": "İsabet Başı Can",
  "Critical Damage": "Kritik Hasarı",
  "XP Gain": "TP Artışı",
  "Gold Gain": "Altın Artışı",
  "Magic Damage": "Büyü Hasarı",
  "Evasion": "Kaçınma",
  "Item Find": "Eşya Bulma Şansı",
  "Increased Attack Damage": "Arttırılmış Saldırı Hasarı",
  "Skill Level": "Yetenek Seviyesi",
  "Accuracy": "İsabet",
  "Increased Magic Damage": "Arttırılmış Büyü Hasarı",
  "Damage Reduction": "Hasar Azaltma",
  "All Elemental Resistance": "Tüm Element Dirençleri",
  "Mana Regen": "Mana Yenileme",
  "Add Mp Per Hit": "İsabet Başı Mana",
  "Add Mp Per Kill": "Öldürme Başı Mana",
  "Chaos Resistance": "Kaos Direnci",
  "Chaos Damage Percent": "Kaos Hasarı Yüzdesi",
  "Increased Critical Damage": "Arttırılmış Kritik Hasarı",
  "Increased Cooldown Reduction": "Arttırılmış Bekleme Süresi Azaltma",
  "Basic Attack Requirement Reduction": "Temel Saldırı Gereksinimi Azaltma",
  "Increased All Hero Attack Damage": "Tüm Kahramanların Saldırı Hasarı Artışı",
  "Increased All Hero Armor": "Tüm Kahramanların Zırhı Artışı",
  "Increased All Hero Attack Speed": "Tüm Kahramanların Saldırı Hızı Artışı",
  "Increased All Hero Movement Speed": "Tüm Kahramanların Hareket Hızı Artışı",
  "Gold From Stage Boss Kill": "Aşama Bossundan Gelen Altın",
  "Gold From Act Boss Kill": "Bölüm Bossundan Gelen Altın",
  "Gold From Normal Monster Kill": "Normal Canavarlardan Gelen Altın",
  "Exp From Stage Boss Kill": "Aşama Bossundan Gelen TP",
  "Exp From Act Boss Kill": "Bölüm Bossundan Gelen TP",
  "Exp From Normal Monster Kill": "Normal Canavarlardan Gelen TP",
  "Increased Gold From Cube Alchemy": "Arttırılmış Küp Simyası Altını",
  "Increased Cube Exp": "Arttırılmış Küp Deneyimi",
  "Block Amount": "Engelleme Miktarı",
  "HP Regen": "Can Yenileme",
  "Double Hit Chance": "Çift Vuruş Şansı",
  "Double Magic Chance": "Çift Büyü Şansı",
  "Chaos Damage Addition": "Kaos Hasarı İlavesi",
  "Fire Damage Addition": "Ateş Hasarı İlavesi",
  "Cold Damage Addition": "Soğuk Hasarı İlavesi",
  "Lightning Damage Addition": "Yıldırım Hasarı İlavesi",
  "Phys. Damage Addition": "Fiziksel Hasar İlavesi",
  "Mag. Damage Addition": "Büyüsel Hasar İlavesi"
};

export const MaterialEffectsPanel: React.FC<MaterialEffectsPanelProps> = ({
  parsedSave,
  onMouseEnter,
  onMouseMove,
  onMouseLeave
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute Owned counts from Save File
  const possessedMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!parsedSave) return map;

    const allItems = [
      ...(parsedSave.inventory || []),
      ...(parsedSave.stash || []),
      ...(parsedSave.tradingStash || [])
    ];

    allItems.forEach(item => {
      if (item.isMaterial) {
        const key = item.itemKey;
        const currentCount = map.get(key) || 0;
        map.set(key, currentCount + item.quantity);
      }
    });
    return map;
  }, [parsedSave]);

  // Extract all unique stat names across materials for filters
  const uniqueStats = useMemo(() => {
    const statsSet = new Set<string>();
    materialEffects.forEach(mat => {
      if (mat.slots) {
        Object.values(mat.slots).forEach((slot: any) => {
          if (slot.stats) {
            slot.stats.forEach((st: any) => {
              statsSet.add(st.name);
            });
          }
        });
      }
    });
    return Array.from(statsSet).sort((a, b) => {
      const nameA = STAT_TRANSLATIONS[a] && currentLang === "tr" ? STAT_TRANSLATIONS[a] : a;
      const nameB = STAT_TRANSLATIONS[b] && currentLang === "tr" ? STAT_TRANSLATIONS[b] : b;
      return nameA.localeCompare(nameB);
    });
  }, [currentLang]);

  // Helper to translate stat names
  const translateStat = (statName: string): string => {
    if (currentLang === "tr" && STAT_TRANSLATIONS[statName]) {
      return STAT_TRANSLATIONS[statName];
    }
    return statName;
  };

  // Helper to translate card properties / labels
  const translateSlotName = (slotName: string): string => {
    const lower = slotName.toLowerCase();
    if (lower === "weapon" || lower === "slotweapon") return t("slotWeapon");
    if (lower === "armor" || lower === "slotarmor") return t("slotArmor");
    if (lower === "accessory" || lower === "slotaccessory") return t("slotAccessory");
    if (lower === "all slots" || lower === "all" || lower === "slotall") return t("slotAll");
    return slotName;
  };

  // Construct TbhItem for GameTooltip hover
  const makeTooltipItem = (mat: any): TbhItem => {
    const qty = possessedMap.get(mat.id) || 0;
    const props = tbhData.properties[mat.id] || {};
    const iconUrl = tbhData.icons[props.s] || mat.icon;

    return {
      uniqueId: `mat-${mat.id}`,
      itemKey: mat.id,
      lookupKey: mat.id,
      name: mat.name,
      grade: mat.grade,
      gradeColor: GRADE_COLORS[mat.grade] || "#9ca3af",
      level: null,
      gearType: null,
      isMaterial: true,
      iconUrl: iconUrl,
      quantity: qty,
      marketHashName: mat.name,
      price: null,
      totalValue: null,
      isChaotic: false,
      isBlocked: false,
      slot: 0
    };
  };

  // Filter logic
  const filteredMaterials = useMemo(() => {
    return materialEffects.filter(mat => {
      // 1. Search Query (Check Name & Translated Name)
      const matchesSearch =
        mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (currentLang === "tr" &&
          mat.name_tr &&
          mat.name_tr.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Type Filter (Decoration, Engraving, Inscription)
      const matchesType =
        selectedType === "all" ||
        mat.type.toLowerCase() === selectedType.toLowerCase();

      // 3. Stat Filter (All selected stats must be present in at least one of the item slots)
      let matchesStats = true;
      if (selectedStats.length > 0) {
        // Collect all stat names this material can grant across all compatible slots
        const materialStatNames = new Set<string>();
        Object.values(mat.slots).forEach((slot: any) => {
          if (slot.stats) {
            slot.stats.forEach((st: any) => {
              materialStatNames.add(st.name);
            });
          }
        });

        // Check if material has ALL selected stats
        matchesStats = selectedStats.every(st => materialStatNames.has(st));
      }

      return matchesSearch && matchesType && matchesStats;
    });
  }, [searchQuery, selectedType, selectedStats, currentLang]);

  // Toggle stat selection in filter dropdown
  const toggleStatFilter = (statName: string) => {
    if (selectedStats.includes(statName)) {
      setSelectedStats(selectedStats.filter(s => s !== statName));
    } else {
      setSelectedStats([...selectedStats, statName]);
    }
  };

  return (
    <div className="materials-panel fade-in">
      {/* Header */}
      <div className="materials-header">
        <div className="materials-title-row">
          <h2 className="materials-title">{t("materialsTab")}</h2>
          <span className="materials-count-badge">
            {t("totalMaterials", { count: filteredMaterials.length })}
          </span>
        </div>
        <p className="materials-subtitle">{t("materialEffectsSub")}</p>
      </div>

      {/* Filters */}
      <div className="materials-filters">
        <div className="filters-top-row">
          <div className="materials-search-wrapper">
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="materials-search-input"
            />
          </div>

          {/* Stats Multiselect Dropdown */}
          <div className={`stats-dropdown-container ${dropdownOpen ? "open" : ""}`} ref={dropdownRef}>
            <div
              className={`stats-dropdown-trigger ${selectedStats.length > 0 ? "active" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span>
                {t("statsLabel")}{" "}
                {selectedStats.length > 0 && (
                  <span className="selected-stats-count">{selectedStats.length}</span>
                )}
              </span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {dropdownOpen && (
              <div className="stats-dropdown-menu">
                {uniqueStats.map(statName => {
                  const isChecked = selectedStats.includes(statName);
                  return (
                    <div
                      key={statName}
                      className={`stats-dropdown-item ${isChecked ? "checked" : ""}`}
                      onClick={() => toggleStatFilter(statName)}
                    >
                      <div className="checkbox-indicator">{isChecked ? "✓" : ""}</div>
                      <span>{translateStat(statName)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Stat Tags */}
        {selectedStats.length > 0 && (
          <div className="selected-stat-tags">
            {selectedStats.map(statName => (
              <span key={statName} className="stat-tag">
                {translateStat(statName)}
                <button className="stat-tag-remove" onClick={() => toggleStatFilter(statName)}>
                  ×
                </button>
              </span>
            ))}
            <button className="clear-stats-btn" onClick={() => setSelectedStats([])}>
              {currentLang === "tr" ? "Temizle" : "Clear All"}
            </button>
          </div>
        )}

        <div className="filters-bottom-row">
          {/* Type Filter Buttons */}
          <div className="filter-group">
            <span className="filter-label">{t("typeLabel")}</span>
            <div className="tag-filters">
              <button
                className={`tag-filter-btn ${selectedType === "all" ? "active" : ""}`}
                onClick={() => setSelectedType("all")}
              >
                {t("showAll")}
              </button>
              <button
                className={`tag-filter-btn ${selectedType === "decoration" ? "active" : ""}`}
                onClick={() => setSelectedType("decoration")}
              >
                {currentLang === "tr" ? "Süsleme (Decoration)" : "Decoration"}
              </button>
              <button
                className={`tag-filter-btn ${selectedType === "engraving" ? "active" : ""}`}
                onClick={() => setSelectedType("engraving")}
              >
                {currentLang === "tr" ? "Oyma (Engraving)" : "Engraving"}
              </button>
              <button
                className={`tag-filter-btn ${selectedType === "inscription" ? "active" : ""}`}
                onClick={() => setSelectedType("inscription")}
              >
                {currentLang === "tr" ? "Yazıt (Inscription)" : "Inscription"}
              </button>
          </div>
        </div>
      </div>
    </div>

      {/* Materials List */}
      <div className="materials-grid-container">
        {filteredMaterials.length === 0 ? (
          <div className="materials-empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">
              {currentLang === "tr" ? "Eşleşen Malzeme Bulunamadı" : "No Matching Materials"}
            </div>
            <p className="empty-state-desc">
              {currentLang === "tr"
                ? "Filtre kriterlerinizi değiştirmeyi veya arama teriminizi sıfırlamayı deneyin."
                : "Try adjusting your filter criteria or clearing your search term."}
            </p>
          </div>
        ) : (
          <div className="materials-grid">
            {filteredMaterials.map(mat => {
              const ownedCount = possessedMap.get(mat.id) || 0;
              const hasOwned = ownedCount > 0;
              const gradeColor = GRADE_COLORS[mat.grade] || "#9ca3af";
              
              const props = tbhData.properties[mat.id] || {};
              const iconUrl = tbhData.icons[props.s] || mat.icon;

              const tooltipItem = makeTooltipItem(mat);

              return (
                <div
                  key={mat.id}
                  className="material-card"
                  style={{ "--rarity-color": gradeColor } as React.CSSProperties}
                >
                  {/* Card Header Row */}
                  <div className="material-header-row">
                    <div
                      className="material-icon-wrapper"
                      onMouseEnter={e => onMouseEnter(tooltipItem, e)}
                      onMouseMove={onMouseMove}
                      onMouseLeave={onMouseLeave}
                      style={{ cursor: "help" }}
                    >
                      <img src={iconUrl} alt={mat.name} className="material-icon-img" />
                    </div>

                    <div className="material-name-col">
                      <span className="material-card-name">
                        {currentLang === "tr" && mat.name_tr ? mat.name_tr : mat.name}
                      </span>
                      <div className="material-meta-row">
                        <span className="material-grade-tag">{mat.grade}</span>
                        <span className="material-type-tag">
                          {currentLang === "tr" && mat.type === "Decoration"
                            ? "Süsleme"
                            : currentLang === "tr" && mat.type === "Engraving"
                            ? "Oyma"
                            : currentLang === "tr" && mat.type === "Inscription"
                            ? "Yazıt"
                            : mat.type}
                        </span>
                      </div>
                    </div>

                    <span className={`material-owned-tag ${hasOwned ? "has-owned" : ""}`}>
                      {t("ownedCount", { count: ownedCount })}
                    </span>
                  </div>

                  {/* Compatible Slots list */}
                  <div className="material-slots-container">
                    {Object.entries(mat.slots).map(([slotKey, slotData]: [string, any]) => (
                      <div key={slotKey} className="material-slot-block">
                        <div className="slot-block-header">
                          <span className="slot-block-title">{translateSlotName(slotKey)}</span>
                          {slotData.rollChance && (
                            <span className="slot-block-chance" title={t("rollChancePerStat")}>
                              {slotData.rollChance} {t("each")}
                            </span>
                          )}
                        </div>
                        {slotData.stats.map((st: any, idx: number) => (
                          <div key={idx} className="material-stat-item">
                            <span className="material-stat-name-label">{translateStat(st.name)}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="material-stat-value-label">{st.value}</span>
                              {st.tier && (
                                <span className="material-stat-tier-label">{st.tier}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
