"use client";

import { useEffect, useRef } from "react";
import { Company } from "@/lib/api";

const industryNames: Record<string, string> = {
  gpu: "GPU", cpu: "CPU", server: "服务器", chip_design: "芯片设计",
  optical_module: "光模块", optical_fiber: "光纤光缆", switch_router: "交换机/路由",
  connector: "连接器", llm: "大模型", ai_app: "AI应用", ai_data_service: "AI数据服务",
  data_center: "数据中心", cooling: "液冷散热", pcb: "PCB", power: "电源", chassis: "机柜",
};

interface Props {
  companies: Company[];
  selectedIndustry: string | null;
  selectedProvince: string | null;
  expandedCode: string | null;
  onExpand: (stockCode: string | null) => void;
  onShowGraph: (company: Company) => void;
  onClearIndustry: () => void;
  onClearProvince: () => void;
  onClearAll: () => void;
}

export default function CompanyListPanel({
  companies,
  selectedIndustry,
  selectedProvince,
  expandedCode,
  onExpand,
  onShowGraph,
  onClearIndustry,
  onClearProvince,
  onClearAll,
}: Props) {
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expandedCode && expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expandedCode]);

  const hasFilters = selectedIndustry || selectedProvince;

  return (
    <aside className="w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-secondary)] z-10 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            筛选结果
            <span className="text-[var(--text-secondary)] font-normal ml-1 text-xs">
              {companies.length}家
            </span>
          </h2>
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="text-[10px] text-[var(--text-secondary)] hover:text-white transition-colors px-2 py-0.5 rounded border border-[var(--border-color)]"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* Active filter tags */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5">
            {selectedIndustry && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--accent)]/15 text-[var(--accent)] px-2 py-0.5 rounded-full">
                {industryNames[selectedIndustry] || selectedIndustry}
                <button onClick={onClearIndustry} className="hover:text-white ml-0.5">
                  ×
                </button>
              </span>
            )}
            {selectedProvince && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                {selectedProvince}
                <button onClick={onClearProvince} className="hover:text-white ml-0.5">
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Company list */}
      <div className="flex-1">
        {companies.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
            暂无匹配企业
          </div>
        ) : (
          companies.map((c) => {
            const isExpanded = expandedCode === c.stock_code;
            return (
              <div
                key={c.stock_code}
                id={`company-${c.stock_code}`}
                ref={isExpanded ? expandedRef : undefined}
                className="border-b border-[var(--border-color)]"
              >
                {/* Collapsed row */}
                <button
                  onClick={() => onExpand(isExpanded ? null : c.stock_code)}
                  className="w-full px-3 py-2.5 text-left hover:bg-[var(--bg-card)] transition-colors flex items-center gap-2 group"
                >
                  <span className="text-[10px] text-[var(--text-secondary)] w-4 shrink-0">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white group-hover:text-[var(--accent)] transition-colors truncate">
                        {c.short_name}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                        {c.stock_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--text-secondary)] truncate">
                        {c.main_business}
                      </span>
                      <span className="text-[10px] text-[var(--accent)] shrink-0">
                        {c.market_cap}亿
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[var(--bg-card)] p-2 rounded">
                        <div className="text-[var(--text-secondary)] text-[10px]">所在地</div>
                        <div className="text-white mt-0.5">
                          {c.province} · {c.city}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-card)] p-2 rounded">
                        <div className="text-[var(--text-secondary)] text-[10px]">上市日期</div>
                        <div className="text-white mt-0.5">{c.list_date || "-"}</div>
                      </div>
                      <div className="bg-[var(--bg-card)] p-2 rounded">
                        <div className="text-[var(--text-secondary)] text-[10px]">市值</div>
                        <div className="text-[var(--accent)] mt-0.5 font-semibold">
                          {c.market_cap}亿
                        </div>
                      </div>
                      <div className="bg-[var(--bg-card)] p-2 rounded">
                        <div className="text-[var(--text-secondary)] text-[10px]">员工</div>
                        <div className="text-white mt-0.5">
                          {c.employee_count?.toLocaleString() || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2 rounded text-xs">
                      <div className="text-[var(--text-secondary)] text-[10px] mb-1">
                        主营业务
                      </div>
                      <p className="text-[#e2e8f0] leading-relaxed">{c.main_business}</p>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2 rounded text-xs">
                      <div className="text-[var(--text-secondary)] text-[10px] mb-1">
                        产业标签
                      </div>
                      <span className="text-[var(--accent)]">
                        {industryNames[c.industry_id] || c.industry_id}
                      </span>
                    </div>

                    <button
                      onClick={() => onShowGraph(c)}
                      className="w-full py-2 text-xs rounded font-semibold transition-colors"
                      style={{
                        background: "var(--accent)",
                        color: "#000",
                      }}
                    >
                      查看产业链图谱 →
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
