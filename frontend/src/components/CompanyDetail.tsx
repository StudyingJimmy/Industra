"use client";

import { useEffect, useState } from "react";
import { Company, CompanyDetail as CompanyDetailType, getCompanyDetail } from "@/lib/api";

interface Props {
  company: Company;
  onClose: () => void;
  onShowGraph: (company: Company) => void;
}

export default function CompanyDetail({ company, onClose, onShowGraph }: Props) {
  const [detail, setDetail] = useState<CompanyDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCompanyDetail(company.stock_code)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [company.stock_code]);

  return (
    <aside className="w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between sticky top-0 bg-[var(--bg-secondary)] z-10">
        <h2 className="text-sm font-semibold">{company.short_name}</h2>
        <button
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-white w-6 h-6 flex items-center justify-center rounded text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-3 space-y-4">
        <div>
          <div className="text-xs text-[var(--text-secondary)]">{company.stock_code} · {company.market}</div>
          <p className="text-xs mt-1 leading-relaxed text-[var(--text-secondary)]">
            {company.main_business}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[var(--bg-card)] p-2 rounded">
            <div className="text-[var(--text-secondary)]">市值</div>
            <div className="text-[var(--accent)] font-semibold">{company.market_cap}亿</div>
          </div>
          <div className="bg-[var(--bg-card)] p-2 rounded">
            <div className="text-[var(--text-secondary)]">员工</div>
            <div className="text-white font-semibold">{company.employee_count?.toLocaleString()}</div>
          </div>
          <div className="bg-[var(--bg-card)] p-2 rounded">
            <div className="text-[var(--text-secondary)]">省份</div>
            <div className="text-white font-semibold">{company.province}</div>
          </div>
          <div className="bg-[var(--bg-card)] p-2 rounded">
            <div className="text-[var(--text-secondary)]">城市</div>
            <div className="text-white font-semibold">{company.city}</div>
          </div>
        </div>

        {detail?.industry_info && (
          <div className="bg-[var(--bg-card)] p-2 rounded text-xs">
            <div className="text-[var(--text-secondary)] mb-1">产业归属</div>
            <div className="text-white">
              {detail.industry_info.l1.name} › {detail.industry_info.l2.name} ›{" "}
              <span className="text-[var(--accent)]">{detail.industry_info.l3.name}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-xs text-[var(--text-secondary)] text-center py-4">加载关系数据...</div>
        ) : (
          <>
            {detail && detail.upstream.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                  上游供应商 ({detail.upstream.length})
                </div>
                <div className="space-y-1">
                  {detail.upstream.slice(0, 6).map((item, i) => (
                    <div
                      key={i}
                      className="bg-[var(--bg-card)] p-2 rounded text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="text-white">{item.company.short_name}</span>
                        <span className="text-[var(--text-secondary)] ml-1">
                          ({item.company.stock_code})
                        </span>
                      </div>
                      <span className="text-[var(--text-secondary)] text-[10px]">
                        {item.relation.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail && detail.downstream.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                  下游客户 ({detail.downstream.length})
                </div>
                <div className="space-y-1">
                  {detail.downstream.slice(0, 6).map((item, i) => (
                    <div
                      key={i}
                      className="bg-[var(--bg-card)] p-2 rounded text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="text-white">{item.company.short_name}</span>
                        <span className="text-[var(--text-secondary)] ml-1">
                          ({item.company.stock_code})
                        </span>
                      </div>
                      <span className="text-[var(--text-secondary)] text-[10px]">
                        {item.relation.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail && detail.competitors.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                  竞争对手 ({detail.competitors.length})
                </div>
                <div className="space-y-1">
                  {detail.competitors.slice(0, 5).map((item, i) => (
                    <div
                      key={i}
                      className="bg-[var(--bg-card)] p-2 rounded text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="text-[#ff6b6b]">{item.company.short_name}</span>
                        <span className="text-[var(--text-secondary)] ml-1">
                          ({item.company.stock_code})
                        </span>
                      </div>
                      <span className="text-[var(--text-secondary)] text-[10px]">
                        {item.relation.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => onShowGraph(company)}
          className="w-full py-2 text-xs rounded transition-colors"
          style={{
            background: "var(--accent)",
            color: "#000",
            fontWeight: 600,
          }}
        >
          查看产业链图谱
        </button>
      </div>
    </aside>
  );
}
