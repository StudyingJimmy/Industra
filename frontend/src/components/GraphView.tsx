"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as echarts from "echarts";
import { Company, getGraphData, GraphData } from "@/lib/api";

interface Props {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company) => void;
}

const industryColors: Record<string, string> = {
  gpu: "#ff6b6b",
  cpu: "#ee5a24",
  server: "#f0932b",
  chip_design: "#f9ca24",
  optical_module: "#6ab04c",
  optical_fiber: "#22a6b3",
  switch_router: "#7ed6df",
  connector: "#686de0",
  llm: "#e056a0",
  ai_app: "#be2edd",
  ai_data_service: "#c44569",
  data_center: "#4834d4",
  cooling: "#30336b",
  pcb: "#130f40",
  power: "#535c68",
  chassis: "#596275",
};

const relationLabel: Record<string, string> = {
  supplier: "供应",
  customer: "客户",
  competitor: "竞争",
};

const relationColor: Record<string, string> = {
  supplier: "#6ab04c",
  customer: "#f0932b",
  competitor: "#ff6b6b",
};

export default function GraphView({ companies, selectedCompany, onCompanySelect }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const [depth, setDepth] = useState(1);

  const loadGraph = useCallback(async (stockCode: string, d: number) => {
    try {
      const data = await getGraphData(stockCode, d);
      setGraphData(data);
      setFocusCode(stockCode);
    } catch (e) {
      console.error("Failed to load graph:", e);
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadGraph(selectedCompany.stock_code, depth);
    }
  }, [selectedCompany, depth, loadGraph]);

  useEffect(() => {
    if (!chartRef.current || !graphData) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
    }
    const chart = instanceRef.current;

    const categories = Array.from(
      new Set(graphData.nodes.map((n) => n.industry_id))
    ).map((id) => ({
      name: id,
      itemStyle: { color: industryColors[id] || "#00d4aa" },
    }));

    const nodes = graphData.nodes.map((n) => ({
      id: n.stock_code,
      name: n.name,
      symbolSize: n.stock_code === focusCode ? 36 : Math.max(12, Math.sqrt(n.market_cap || 100) / 12),
      category: n.industry_id,
      itemStyle: {
        borderColor: n.stock_code === focusCode ? "#fff" : "transparent",
        borderWidth: n.stock_code === focusCode ? 2 : 0,
        shadowBlur: n.stock_code === focusCode ? 20 : 0,
        shadowColor: industryColors[n.industry_id] || "#00d4aa",
      },
      data: n,
    }));

    const links = graphData.edges.map((e, i) => ({
      source: e.from,
      target: e.to,
      label: { show: true, formatter: relationLabel[e.type] || e.type, fontSize: 9, color: "#94a3b8" },
      lineStyle: {
        color: relationColor[e.type] || "#94a3b8",
        curveness: 0.2,
        width: 1,
      },
      data: e,
    }));

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.dataType === "node") {
            const n = params.data.data;
            return `
              <div style="padding:8px">
                <strong>${n.name}</strong> (${n.stock_code})<br/>
                <span style="font-size:12px;color:#94a3b8">${n.province} · ${n.city}</span><br/>
                <span style="font-size:12px">市值: ${n.market_cap}亿</span>
              </div>
            `;
          }
          if (params.dataType === "edge") {
            const e = params.data.data;
            return `${e.from} → ${e.to}<br/>${relationLabel[e.type]}: ${e.desc}`;
          }
          return "";
        },
      },
      legend: {
        data: categories.map((c) => c.name),
        bottom: 10,
        textStyle: { color: "#94a3b8", fontSize: 10 },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          categories,
          roam: true,
          draggable: true,
          force: {
            repulsion: 400,
            gravity: 0.08,
            edgeLength: [120, 240],
            layoutAnimation: true,
          },
          label: {
            show: true,
            position: "right",
            fontSize: 9,
            color: "#e2e8f0",
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: { width: 3 },
            label: { fontSize: 12, fontWeight: "bold" },
          },
          lineStyle: {
            opacity: 0.6,
          },
          scaleLimit: { min: 0.3, max: 4 },
        },
      ],
    };

    chart.setOption(option, true);

    chart.off("click");
    chart.on("click", (params: any) => {
      if (params.dataType === "node" && params.data?.data) {
        const nodeCompany = params.data.data;
        setFocusCode(nodeCompany.stock_code);
        onCompanySelect({
          id: nodeCompany.stock_code,
          stock_code: nodeCompany.stock_code,
          short_name: nodeCompany.name,
          name: nodeCompany.full_name,
          industry_id: nodeCompany.industry_id,
          province: nodeCompany.province,
          city: nodeCompany.city,
          market_cap: nodeCompany.market_cap,
          main_business: "",
          market: "",
          lat: 0,
          lng: 0,
          employee_count: 0,
          list_date: "",
        });
        loadGraph(nodeCompany.stock_code, depth);
      }
    });
  }, [graphData, focusCode, depth, onCompanySelect, loadGraph]);

  useEffect(() => {
    const handleResize = () => instanceRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      {!graphData && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-secondary)] text-sm">
          点击地图上的企业或搜索企业来查看产业链图谱
        </div>
      )}
      <div ref={chartRef} className="w-full h-full" />
      {graphData && (
        <div className="absolute top-3 right-3 flex gap-2">
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                depth === d
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              {d}跳关系
            </button>
          ))}
        </div>
      )}
      {graphData && (
        <div className="absolute bottom-3 left-3 text-xs text-[var(--text-secondary)]">
          节点: {graphData.nodes.length} · 边: {graphData.edges.length} · 可拖拽/缩放
        </div>
      )}
    </div>
  );
}
