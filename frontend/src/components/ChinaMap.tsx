"use client";

import { useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import { Company, RegionData } from "@/lib/api";

interface Props {
  companies: Company[];
  regions: RegionData | null;
  selectedProvince: string | null;
  onProvinceSelect: (province: string | null) => void;
}

export default function ChinaMap({ companies, regions, selectedProvince, onProvinceSelect }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const onProvinceSelectRef = useRef(onProvinceSelect);
  onProvinceSelectRef.current = onProvinceSelect;

  const initMap = useCallback(async () => {
    if (!chartRef.current || !regions) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
    }
    const chart = instanceRef.current;

    try {
      const resp = await fetch(
        "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
      );
      const geoJson = await resp.json();
      echarts.registerMap("china", geoJson);

      // Group companies by province
      const provinceGroups: Record<string, Company[]> = {};
      companies.forEach((c) => {
        if (!provinceGroups[c.province]) provinceGroups[c.province] = [];
        provinceGroups[c.province].push(c);
      });

      const provinceEntries = Object.entries(provinceGroups);
      const maxCount = Math.max(...provinceEntries.map(([, list]) => list.length), 1);

      const clusterData = provinceEntries.map(([province, list]) => {
        const isSelected = selectedProvince === province;
        const size = Math.max(16, 10 + (list.length / maxCount) * 26);
        const totalMarketCap = list.reduce((sum, c) => sum + (c.market_cap || 0), 0);

        return {
          name: province,
          symbolSize: isSelected ? size + 8 : size,
          itemStyle: {
            color: isSelected ? "rgba(0, 212, 170, 0.95)" : "rgba(0, 167, 255, 0.78)",
            shadowBlur: isSelected ? 28 : 10,
            shadowColor: isSelected ? "rgba(0, 212, 170, 0.6)" : "rgba(0, 167, 255, 0.25)",
            borderColor: isSelected ? "#fff" : "rgba(255,255,255,0.2)",
            borderWidth: isSelected ? 2.5 : 1,
          },
          label: {
            show: true,
            formatter: String(list.length),
            color: "#fff",
            fontSize: isSelected ? 13 : Math.max(10, 8 + (list.length / maxCount) * 4),
            fontWeight: "bold" as const,
          },
          emphasis: {
            scale: 1.35,
            label: { fontSize: 13 },
          },
          data: { province, count: list.length, marketCapTotal: totalMarketCap, companies: list },
        };
      });

      const cityHeatData = regions.cities
        .filter((c) => c.count >= 1)
        .map((c) => ({
          name: c.city,
          value: [c.lng, c.lat, c.count],
        }));

      const option: echarts.EChartsOption = {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          confine: true,
          extraCssText:
            "pointer-events:none;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.5);border-radius:8px;padding:10px 14px;background:rgba(15,25,45,0.95);border:1px solid rgba(255,255,255,0.1);",
          position: "top",
          formatter: (params: any) => {
            if (params.seriesName === "clusters") {
              const d = params.data.data;
              const industryCount: Record<string, number> = {};
              d.companies.forEach((c: Company) => {
                industryCount[c.industry_id] = (industryCount[c.industry_id] || 0) + 1;
              });
              const top3 = Object.entries(industryCount)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 3);

              return `
                <div style="color:#e2e8f0;font-size:14px;font-weight:600;margin-bottom:4px">${d.province}</div>
                <div style="color:#00d4aa;font-size:20px;font-weight:700;margin-bottom:6px">${d.count}<span style="color:#94a3b8;font-size:12px;font-weight:400"> 家企业</span></div>
                ${top3.map(([id, count]) => `<span style="color:#94a3b8;font-size:11px">${id} ×${count}</span>`).join("&nbsp;&nbsp;")}
              `;
            }
            if (params.seriesName === "heat") {
              return `<span style="color:#e2e8f0">${params.name}</span><br/><span style="color:#94a3b8;font-size:11px">${params.value[2]} 家企业</span>`;
            }
            return "";
          },
        },
        geo: {
          map: "china",
          roam: true,
          zoom: 1.25,
          center: [107, 35],
          scaleLimit: { min: 0.8, max: 6 },
          label: { show: false },
          itemStyle: {
            areaColor: "#141f2e",
            borderColor: "#2d5a87",
            borderWidth: 1,
          },
          emphasis: {
            label: { show: true, color: "#e2e8f0", fontSize: 12 },
            itemStyle: { areaColor: "#1e3450" },
          },
          regions: provinceEntries.map(([name, list]) => {
            const isSelected = selectedProvince === name;
            return {
              name,
              itemStyle: isSelected
                ? {
                    areaColor: "rgba(0, 212, 170, 0.4)",
                    borderColor: "#00d4aa",
                    borderWidth: 2,
                    shadowBlur: 24,
                    shadowColor: "rgba(0, 212, 170, 0.5)",
                  }
                : {
                    areaColor: `rgba(0, 212, 170, ${0.08 + (list.length / maxCount) * 0.35})`,
                  },
              emphasis: isSelected
                ? {
                    label: { show: true, color: "#fff", fontSize: 13, fontWeight: "bold" as const },
                    itemStyle: { areaColor: "rgba(0, 212, 170, 0.55)" },
                  }
                : undefined,
            };
          }),
        },
        visualMap: {
          show: false,
          min: 0,
          max: Math.max(...cityHeatData.map((c) => c.value[2]), 1),
          inRange: { color: ["rgba(0,212,170,0.08)", "rgba(0,212,170,0.45)"] },
        },
        series: [
          {
            name: "clusters",
            type: "scatter",
            coordinateSystem: "geo",
            data: clusterData,
            encode: { value: 2 },
            zlevel: 3,
          },
          {
            name: "heat",
            type: "heatmap",
            coordinateSystem: "geo",
            data: cityHeatData,
            emphasis: { disabled: true },
            zlevel: 1,
          },
        ],
      };

      chart.setOption(option, true);

      chart.off("click");
      chart.on("click", (params: any) => {
        // Click on scatter cluster point
        if (params.seriesName === "clusters" && params.data?.data) {
          const province = params.data.data.province as string;
          onProvinceSelectRef.current(province === selectedProvince ? null : province);
          return;
        }
        // Click on geo region (province polygon)
        if (params.componentType === "geo" && params.name) {
          const province = params.name as string;
          onProvinceSelectRef.current(province === selectedProvince ? null : province);
          return;
        }
        // Click on heatmap → ignore
        if (params.seriesName === "heat") {
          return;
        }
        // Click empty area → deselect
        onProvinceSelectRef.current(null);
      });
    } catch (e) {
      console.error("Failed to load China map:", e);
    }
  }, [companies, regions, selectedProvince]);

  useEffect(() => {
    initMap();

    const handleResize = () => instanceRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, [initMap]);

  return <div ref={chartRef} className="w-full h-full" />;
}
