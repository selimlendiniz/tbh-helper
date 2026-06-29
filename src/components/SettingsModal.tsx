import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/settings-modal.css";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLive: boolean;
  steamLoggedIn: boolean;
  onConnectSteam?: () => void;
  onDisconnectSteam?: () => void;
  onSelectFile: () => void;
  onReload: () => void;
  refreshInterval: number;
  onSetRefreshInterval: (minutes: number) => void;
  newItemAlertThreshold: number;
  onSetNewItemAlertThreshold: (val: number) => void;
  updateAvailable: any;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  onSetTelegramEnabled: (val: boolean) => void;
  onSetTelegramBotToken: (val: string) => void;
  onSetTelegramChatId: (val: string) => void;
  onSendTelegramTest: (msg: string) => Promise<void>;
  closeToTray: boolean;
  onSetCloseToTray: (val: boolean) => void;
  language: "en" | "tr";
  onSetLanguage: (lang: "en" | "tr") => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isLive,
  steamLoggedIn,
  onConnectSteam,
  onDisconnectSteam,
  onSelectFile,
  onReload,
  refreshInterval,
  onSetRefreshInterval,
  newItemAlertThreshold,
  onSetNewItemAlertThreshold,
  updateAvailable,
  telegramEnabled,
  telegramBotToken,
  telegramChatId,
  onSetTelegramEnabled,
  onSetTelegramBotToken,
  onSetTelegramChatId,
  onSendTelegramTest,
  closeToTray,
  onSetCloseToTray,
  language,
  onSetLanguage,
}) => {
  const { t } = useTranslation();
  const [appVersion, setAppVersion] = useState<string>("...");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then(setAppVersion)
      .catch(() => setAppVersion("0.0.4"));
  }, [isOpen]);

  const openRelease = async () => {
    if (!updateAvailable) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_in_browser", { url: updateAvailable.html_url });
    } catch {
      window.open(updateAvailable.html_url, "_blank");
    }
  };

  const startAutoUpdate = async () => {
    if (!updateAvailable) return;
    setError(null);
    const exeAsset = updateAvailable.assets?.find((asset: any) => asset.name.endsWith(".exe"));
    if (!exeAsset) {
      openRelease();
      return;
    }

    setDownloading(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("install_update", { url: exeAsset.browser_download_url });
    } catch (err) {
      console.error("Auto update failed:", err);
      setError("Auto update failed. Opening release page...");
      setDownloading(false);
      setTimeout(() => openRelease(), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="settings-header">
          <div className="settings-title-row">
            <span className="settings-icon">&#9881;</span>
            <h2 className="settings-title">{t("settingsTitle")}</h2>
          </div>
          <button className="settings-close-btn" onClick={onClose} aria-label={t("closeSettings")}>&#10005;</button>
        </div>

        {/* 2-column body */}
        <div className="settings-body settings-grid">

          {/* LEFT COLUMN */}
          <div className="settings-col">

            {/* Steam Market */}
            <section className="settings-section">
              <h3 className="settings-section-title">{t("steamMarketTitle")}</h3>
              <p className="settings-section-desc" dangerouslySetInnerHTML={{ __html: t("steamMarketDesc") }} />
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("connectionStatus")}</span>
                  <span className={`settings-badge ${steamLoggedIn ? "badge-success" : "badge-error"}`}>
                    <span className="badge-dot" />
                    {steamLoggedIn ? t("steamConnected") : t("steamDisconnected")}
                  </span>
                </div>
                <div className="settings-row-actions">
                  {steamLoggedIn ? (
                    <button className="settings-btn btn-danger" onClick={() => { onDisconnectSteam?.(); onClose(); }}>
                      {t("disconnectSteam")}
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <button className="settings-btn btn-primary" onClick={() => { onConnectSteam?.(); onClose(); }}>
                        &#128268; {t("connectSteam")}
                      </button>
                      <span className="settings-connect-warning">
                        &#9888; {t("connectSteamWarning")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="settings-divider" />

            {/* Auto Price Refresh */}
            <section className="settings-section">
              <h3 className="settings-section-title">{t("autoPriceRefreshTitle")}</h3>
              <p className="settings-section-desc">
                {t("autoPriceRefreshDesc")}
              </p>
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("refreshInterval")}</span>
                  <span className="settings-row-hint">{t("min10Minutes")}</span>
                </div>
                <div className="settings-row-actions">
                  <select
                    className="settings-interval-select"
                    value={refreshInterval}
                    onChange={(e) => onSetRefreshInterval(Number(e.target.value))}
                  >
                    <option value={10}>{t("every10Min")}</option>
                    <option value={15}>{t("every15Min")}</option>
                    <option value={30}>{t("every30Min")}</option>
                    <option value={60}>{t("every1Hour")}</option>
                    <option value={120}>{t("every2Hours")}</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="settings-divider" />

            {/* High-Value Item Alerts */}
            <section className="settings-section">
              <h3 className="settings-section-title">{t("highValueAlertsTitle")}</h3>
              <p className="settings-section-desc">
                {t("highValueAlertsDesc")}
              </p>
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("minPriceThreshold")}</span>
                  <span className="settings-row-hint">{t("minPriceThresholdHint")}</span>
                </div>
                <div className="settings-row-actions">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="settings-interval-select"
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      width: "120px",
                      textAlign: "right"
                    }}
                    value={newItemAlertThreshold}
                    onChange={(e) => onSetNewItemAlertThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>
            </section>

            <div className="settings-divider" />

            {/* Telegram Notifications */}
            <section className="settings-section">
              <h3 className="settings-section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📬 {t("telegramAlertsTitle")}</span>
              </h3>
              <p className="settings-section-desc">
                {t("telegramAlertsDesc")}
              </p>
              
              <div className="settings-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("enableTelegramAlerts")}</span>
                  <span className="settings-row-hint">{t("forwardAlertsHint")}</span>
                </div>
                <div className="settings-row-actions">
                  <input 
                    type="checkbox" 
                    checked={telegramEnabled} 
                    onChange={(e) => onSetTelegramEnabled(e.target.checked)} 
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981" }}
                  />
                </div>
              </div>

              {telegramEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-dark)", fontWeight: "bold" }}>{t("botToken")}</span>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789:ABCdef..." 
                      value={telegramBotToken} 
                      onChange={(e) => onSetTelegramBotToken(e.target.value.trim())} 
                      style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-dark)", fontWeight: "bold" }}>{t("chatId")}</span>
                    <input 
                      type="text" 
                      placeholder="e.g. 987654321" 
                      value={telegramChatId} 
                      onChange={(e) => onSetTelegramChatId(e.target.value.trim())} 
                      style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", width: "100%" }}
                    />
                  </div>
                  <button 
                    onClick={() => onSendTelegramTest("⚡ <b>TBH Helper Connection Test</b>\n\nTelegram notifications are now active and configured successfully!")}
                    disabled={!telegramBotToken || !telegramChatId}
                    style={{ 
                      background: (!telegramBotToken || !telegramChatId) ? "rgba(255,255,255,0.02)" : "rgba(16, 185, 129, 0.1)", 
                      border: (!telegramBotToken || !telegramChatId) ? "1px solid var(--border-color)" : "1px solid rgba(16, 185, 129, 0.3)", 
                      color: (!telegramBotToken || !telegramChatId) ? "var(--text-muted)" : "#10b981", 
                      padding: "8px", 
                      borderRadius: "6px", 
                      fontSize: "12px", 
                      fontWeight: "600", 
                      cursor: (!telegramBotToken || !telegramChatId) ? "not-allowed" : "pointer", 
                      transition: "all 0.15s ease", 
                      marginTop: "4px" 
                    }}
                  >
                    {t("testConnection")}
                  </button>
                  <span style={{ fontSize: "9px", color: "var(--text-dark)", lineHeight: "1.3" }} dangerouslySetInnerHTML={{ __html: t("telegramSetupHint") }} />
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <div className="settings-col">

            {/* Save File */}
            <section className="settings-section">
              <h3 className="settings-section-title">{t("saveFileTitle")}</h3>
              <p className="settings-section-desc">
                {t("saveFileDesc")}
              </p>
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("realTimeSync")}</span>
                  <span className={`settings-badge ${isLive ? "badge-success" : "badge-error"}`}>
                    <span className="badge-dot" />
                    {isLive ? t("active") : t("disconnected")}
                  </span>
                </div>
                <div className="settings-row-actions">
                  <button className="settings-btn btn-secondary" onClick={() => { onReload(); onClose(); }}>
                    &#8635; {t("manualReload")}
                  </button>
                </div>
              </div>
              <div className="settings-row" style={{ marginTop: "10px" }}>
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("customSaveFile")}</span>
                  <span className="settings-row-hint">{t("customSaveFileHint")}</span>
                </div>
                <div className="settings-row-actions">
                  <button className="settings-btn btn-secondary" onClick={() => { onSelectFile(); onClose(); }}>
                    &#128194; {t("selectSaveFile")}
                  </button>
                </div>
              </div>
            </section>

            <div className="settings-divider" />

            {/* Application Settings */}
            <section className="settings-section">
              <h3 className="settings-section-title">{t("appSettingsTitle")}</h3>
              <p className="settings-section-desc">
                {t("appSettingsDesc")}
              </p>
              <div className="settings-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("closeToTray")}</span>
                  <span className="settings-row-hint">{t("closeToTrayHint")}</span>
                </div>
                <div className="settings-row-actions">
                  <input
                    type="checkbox"
                    checked={closeToTray}
                    onChange={(e) => onSetCloseToTray(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#10b981" }}
                  />
                </div>
              </div>

              {/* Language Selector */}
              <div className="settings-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                <div className="settings-row-label">
                  <span className="settings-row-name">{t("languageLabel")}</span>
                  <span className="settings-row-hint">{t("languageHint")}</span>
                </div>
                <div className="settings-row-actions">
                  <select
                    className="modal-select"
                    value={language}
                    onChange={(e) => onSetLanguage(e.target.value as "en" | "tr")}
                    style={{ width: "120px" }}
                  >
                    <option value="en">English</option>
                    <option value="tr">Türkçe</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="settings-divider" />

            {/* About */}
            <section className="settings-section">
              <h3 className="settings-section-title">{t("aboutTitle")}</h3>
              <div className="settings-about-card">
                <div className="settings-about-logo">&#9889;</div>
                <div className="settings-about-info">
                  <span className="settings-about-name">TBH Helper</span>
                  <span className="settings-about-version">v{appVersion}</span>
                  <span className="settings-about-author">{t("by")} <strong>Selim Arda &#199;evik</strong></span>
                  <span className="settings-about-contact">
                    {t("supportSuggestions")}{" "}
                    <a href="mailto:selimardacevik@proton.me" className="settings-about-email">
                      selimardacevik@proton.me
                    </a>
                  </span>
                </div>
              </div>

              {updateAvailable && (
                <div className="settings-update-banner" style={{
                  marginTop: "12px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "bold", color: "#10b981" }}>
                    <span>🚀 {t("newVersionAlert", { version: updateAvailable.name || updateAvailable.tag_name })}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    {downloading ? t("downloadingUpdate") : error ? t("updateFailed") : t("updateReady")}
                  </p>
                  {!downloading && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={startAutoUpdate}
                        style={{
                          background: "#10b981",
                          border: "none",
                          color: "#fff",
                          borderRadius: "4px",
                          padding: "5px 10px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}
                      >
                        {t("updateNow")}
                      </button>
                      <button
                        onClick={openRelease}
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-muted)",
                          borderRadius: "4px",
                          padding: "4px 10px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        {t("seeWhatsNew")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="settings-divider" />

            {/* Privacy */}
            <section className="settings-section">
              <h3 className="settings-section-title">{t("privacyNetworkTitle")}</h3>
              <div className="settings-privacy-card">
                <div className="settings-privacy-row">
                  <span className="privacy-icon">&#127760;</span>
                  <div className="privacy-text">
                    <strong>{t("privacySteamTitle")}</strong>
                    <span>{t("privacySteamDesc")}</span>
                  </div>
                </div>
                <div className="settings-privacy-row">
                  <span className="privacy-icon">&#128025;</span>
                  <div className="privacy-text">
                    <strong>{t("privacyGithubTitle")}</strong>
                    <span>{t("privacyGithubDesc")}</span>
                  </div>
                </div>
                <div className="settings-privacy-notice" dangerouslySetInnerHTML={{ __html: t("privacyNotice") }} />
              </div>
            </section>

          </div>

        </div>
      </div>
    </div>
  );
};