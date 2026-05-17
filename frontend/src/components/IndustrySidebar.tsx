"use client";

import { useState } from "react";
import { Industry } from "@/lib/api";

interface Props {
  industries: Industry[];
  selectedIndustry: string | null;
  onSelect: (industryId: string | null) => void;
}

export default function IndustrySidebar({ industries, selectedIndustry, onSelect }: Props) {
  const [expandedL1, setExpandedL1] = useState<string | null>(null);
  const [expandedL2, setExpandedL2] = useState<string | null>(null);

  const l1Industry = industries[0];
  if (!l1Industry) return null;

  return (
    <aside className="w-56 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-[var(--border-color)]">
        <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          产业分类
        </h2>
      </div>

      <div className="flex-1 py-1">
        <div
          className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors ${
            !selectedIndustry
              ? "bg-[var(--accent)]/15 text-[var(--accent)] border-l-2 border-[var(--accent)]"
              : "hover:bg-[var(--bg-card)] text-[var(--text-primary)] border-l-2 border-transparent"
          }`}
          onClick={() => {
            onSelect(null);
            setExpandedL1(null);
            setExpandedL2(null);
          }}
        >
          <span>{l1Industry.name}</span>
          <span className="text-xs text-[var(--text-secondary)]">全部</span>
        </div>

        {l1Industry.children?.map((l2) => (
          <div key={l2.id}>
            <div
              className={`px-3 py-1.5 cursor-pointer flex items-center justify-between text-sm transition-colors ${
                expandedL1 === l2.id
                  ? "bg-[var(--bg-card)]"
                  : "hover:bg-[var(--bg-card)]"
              }`}
              onClick={() => setExpandedL1(expandedL1 === l2.id ? null : l2.id)}
            >
              <span className="text-[var(--text-primary)] text-xs font-medium">
                {l2.name}
              </span>
              <span className="text-[var(--text-secondary)] text-xs">
                {expandedL1 === l2.id ? "▾" : "▸"}
              </span>
            </div>

            {expandedL1 === l2.id &&
              l2.children?.map((l3) => (
                <div
                  key={l3.id}
                  className={`pl-8 pr-3 py-1.5 cursor-pointer text-xs transition-colors ${
                    selectedIndustry === l3.id
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] border-l-2 border-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border-l-2 border-transparent"
                  }`}
                  onClick={() => onSelect(l3.id)}
                >
                  {l3.name}
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--border-color)]">
        <div className="text-xs text-[var(--text-secondary)]">
          {selectedIndustry
            ? `已筛选: ${findIndustryName(l1Industry, selectedIndustry)}`
            : "显示全部企业"}
        </div>
      </div>
    </aside>
  );
}

function findIndustryName(root: Industry, id: string): string {
  for (const l2 of root.children || []) {
    for (const l3 of l2.children || []) {
      if (l3.id === id) return `${l2.name} › ${l3.name}`;
    }
  }
  return id;
}

// Also export for use by GraphView
export { findIndustryName };
