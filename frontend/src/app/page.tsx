"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ChinaMap from "@/components/ChinaMap";
import IndustrySidebar from "@/components/IndustrySidebar";
import CompanyListPanel from "@/components/CompanyListPanel";
import GraphView from "@/components/GraphView";
import SearchBar from "@/components/SearchBar";
import { Company, Industry, getIndustries, getCompanies, getRegions, RegionData } from "@/lib/api";

type ViewMode = "map" | "graph";

export default function Home() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [regions, setRegions] = useState<RegionData | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [loading, setLoading] = useState(true);

  // Initial data load
  useEffect(() => {
    async function load() {
      try {
        const [ind, comp, reg] = await Promise.all([
          getIndustries(),
          getCompanies({ page_size: 200 }),
          getRegions(),
        ]);
        setIndustries(ind);
        setAllCompanies(comp.companies);
        setRegions(reg);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Refetch companies when industry filter changes
  useEffect(() => {
    let cancelled = false;
    async function fetchCompanies() {
      try {
        const result = await getCompanies({
          industry_id: selectedIndustry || undefined,
          page_size: 200,
        });
        if (!cancelled) setAllCompanies(result.companies);
      } catch (e) {
        console.error(e);
      }
    }
    fetchCompanies();
    return () => { cancelled = true; };
  }, [selectedIndustry]);

  // Industry toggle: click same → unlock, click different → lock
  const handleIndustrySelect = useCallback((industryId: string | null) => {
    setSelectedIndustry((prev) => (prev === industryId ? null : industryId));
  }, []);

  // Province toggle: click same → unlock, click different → lock
  const handleProvinceSelect = useCallback((province: string | null) => {
    setSelectedProvince((prev) => (prev === province ? null : province));
  }, []);

  // Search: clear filters, expand target company
  const handleSearchSelect = useCallback((company: Company) => {
    setSelectedIndustry(null);
    setSelectedProvince(null);
    setExpandedCode(company.stock_code);
    setViewMode("map");
  }, []);

  // Expand company in list
  const handleExpand = useCallback((stockCode: string | null) => {
    setExpandedCode(stockCode);
  }, []);

  // Jump to graph view for a company
  const handleShowGraph = useCallback((company: Company) => {
    setSelectedCompany(company);
    setViewMode("graph");
  }, []);

  // Clear individual filter
  const handleClearIndustry = useCallback(() => setSelectedIndustry(null), []);
  const handleClearProvince = useCallback(() => setSelectedProvince(null), []);
  const handleClearAll = useCallback(() => {
    setSelectedIndustry(null);
    setSelectedProvince(null);
    setExpandedCode(null);
  }, []);

  // Client-side province filter
  const filteredCompanies = useMemo(() => {
    if (!selectedProvince) return allCompanies;
    return allCompanies.filter((c) => c.province === selectedProvince);
  }, [allCompanies, selectedProvince]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--accent)" }}>
            Industra
          </h1>
          <p className="text-[var(--text-secondary)]">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-12 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-4 shrink-0 z-10">
        <h1 className="text-lg font-bold mr-6" style={{ color: "var(--accent)" }}>
          Industra
        </h1>
        <span className="text-xs text-[var(--text-secondary)] mr-4">AI基建 · 产业地图</span>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === "map"
                ? "bg-[var(--accent)] text-black"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            地图视图
          </button>
          <button
            onClick={() => setViewMode("graph")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === "graph"
                ? "bg-[var(--accent)] text-black"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            图谱视图
          </button>
        </div>
        <div className="flex-1" />
        <SearchBar onSelect={handleSearchSelect} />
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Industry sidebar */}
        <IndustrySidebar
          industries={industries}
          selectedIndustry={selectedIndustry}
          onSelect={handleIndustrySelect}
        />

        {/* Center: Map or Graph */}
        <main className="flex-1 relative">
          {viewMode === "map" ? (
            <ChinaMap
              companies={allCompanies}
              regions={regions}
              selectedProvince={selectedProvince}
              onProvinceSelect={handleProvinceSelect}
            />
          ) : (
            <GraphView
              companies={allCompanies}
              selectedCompany={selectedCompany}
              onCompanySelect={handleShowGraph}
            />
          )}
        </main>

        {/* Right: Company list panel */}
        {viewMode === "map" && (
          <CompanyListPanel
            companies={filteredCompanies}
            selectedIndustry={selectedIndustry}
            selectedProvince={selectedProvince}
            expandedCode={expandedCode}
            onExpand={handleExpand}
            onShowGraph={handleShowGraph}
            onClearIndustry={handleClearIndustry}
            onClearProvince={handleClearProvince}
            onClearAll={handleClearAll}
          />
        )}
      </div>
    </div>
  );
}
