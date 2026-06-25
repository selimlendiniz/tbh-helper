import { useState } from "react";
import { useSaveData } from "./hooks/useSaveData";
import { GameTooltip, useTooltip } from "./components/GameTooltip";
import { Header } from "./components/Header";
import { TabNavigation } from "./components/TabNavigation";
import { ItemsGrid } from "./components/ItemsGrid";
import { MarketExplorer } from "./components/MarketExplorer";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { EquippedPanel } from "./components/EquippedPanel";
import { LoadingState, NoSaveState } from "./components/EmptyState";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { UpdateBanner } from "./components/UpdateBanner";
import { TbhItem } from "./types";
import "./App.css";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const pricePage = params.get("price_page");
  const priceData = params.get("price_data");

  if (priceData && pricePage !== null) {
    const pageNum = parseInt(pricePage);
    const emitEvent = async () => {
      try {
        const { emit } = await import("@tauri-apps/api/event");
        await emit("steam_price_data", { page: pageNum, data: priceData });
      } catch (err) {
        console.error("Failed to emit steam_price_data:", err);
      }
    };
    emitEvent();

    return (
      <div style={{
        padding: "40px",
        background: "#121212",
        color: "#ff8000",
        fontFamily: "sans-serif",
        textAlign: "center",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "16px"
      }}>
        <div className="loading-spinner" style={{ width: "32px", height: "32px", borderWidth: "3px", borderTopColor: "#ff8000", margin: 0 }} />
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Steam Market Sync</h3>
        <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
          Transferring page {pageNum / 10 + 1} data...
        </p>
      </div>
    );
  }

  const [selectedDetailItem, setSelectedDetailItem] = useState<TbhItem | null>(null);
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    gradeFilter,
    setGradeFilter,
    sortBy,
    setSortBy,
    statusMessage,
    isLive,
    loading,
    parsedSave,
    currentTabItems,
    marketExplorerItems,
    analyticsData,
    loadSaveFile,
    selectManualSaveFile,
    loadingPrices,
    refreshPrices,
    steamRateLimited,
    steamLoggedIn,
    connectSteam,
    disconnectSteam,
    stopFetching,
  } = useSaveData();

  const {
    hoveredItem,
    tooltipPos,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  } = useTooltip();

  const renderMainContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (!parsedSave && activeTab !== "market") {
      return <NoSaveState onRetry={loadSaveFile} />;
    }

    if (activeTab === "market") {
      return (
        <MarketExplorer
          items={marketExplorerItems}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={(item) => setSelectedDetailItem(item as any)}
        />
      );
    }

    if (activeTab === "analytics" && analyticsData && parsedSave) {
      return (
        <AnalyticsPanel
          analyticsData={analyticsData}
          parsedSave={parsedSave}
        />
      );
    }

    if (activeTab === "equipped" && parsedSave) {
      return (
        <EquippedPanel
          parsedSave={parsedSave}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      );
    }

    return (
      <ItemsGrid
        items={currentTabItems}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={setSelectedDetailItem}
      />
    );
  };

  return (
    <div className="dashboard-container">
      <Header
        statusMessage={statusMessage}
        isLive={isLive}
        onReload={loadSaveFile}
        onSelectFile={selectManualSaveFile}
        loadingPrices={loadingPrices}
        onRefreshPrices={refreshPrices}
        onStopPrices={stopFetching}
        steamRateLimited={steamRateLimited}
        totalStashValue={parsedSave?.totalStashValue}
        steamLoggedIn={steamLoggedIn}
        onConnectSteam={connectSteam}
        onDisconnectSteam={disconnectSteam}
      />

      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        gradeFilter={gradeFilter}
        setGradeFilter={setGradeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <main style={{ flexGrow: 1 }} className="fade-in">
        {renderMainContent()}
      </main>

      <GameTooltip
        hoveredItem={hoveredItem}
        tooltipPos={tooltipPos}
        activeTab={activeTab}
      />

      <ItemDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
      />

      <UpdateBanner />
    </div>
  );
}
