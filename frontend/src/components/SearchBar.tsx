"use client";

import { useState, useRef, useEffect } from "react";
import { Company, getCompanies } from "@/lib/api";

interface Props {
  onSelect: (company: Company) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await getCompanies({ search: query, page_size: 8 });
        setResults(data.companies);
        setOpen(true);
      } catch (e) {
        console.error(e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-64">
      <input
        ref={inputRef}
        type="text"
        placeholder="搜索公司/代码..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full px-3 py-1.5 text-xs bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded shadow-lg max-h-64 overflow-y-auto z-50">
          {results.map((c) => (
            <div
              key={c.stock_code}
              className="px-3 py-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
              onClick={() => {
                onSelect(c);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="text-xs text-white">
                {c.short_name}
                <span className="text-[var(--text-secondary)] ml-1">({c.stock_code})</span>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 truncate">
                {c.main_business}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
