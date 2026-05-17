const API_BASE = "http://localhost:8000/api";

async function fetchAPI(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Industry {
  id: string;
  name: string;
  name_en: string;
  level: number;
  description?: string;
  children?: Industry[];
}

export interface Company {
  id: string;
  name: string;
  short_name: string;
  stock_code: string;
  market: string;
  industry_id: string;
  province: string;
  city: string;
  lat: number;
  lng: number;
  main_business: string;
  market_cap: number;
  employee_count: number;
  list_date: string;
}

export interface Relation {
  from: string;
  to: string;
  type: "supplier" | "customer" | "competitor" | "investment" | "partner";
  desc: string;
  subtype: "upstream" | "downstream" | "competitor";
}

export interface EnrichedRelation {
  relation: Relation;
  company: Company;
}

export interface CompanyDetail {
  company: Company;
  industry_info: {
    l1: { id: string; name: string };
    l2: { id: string; name: string };
    l3: { id: string; name: string };
  } | null;
  upstream: EnrichedRelation[];
  downstream: EnrichedRelation[];
  competitors: EnrichedRelation[];
}

export interface RegionData {
  provinces: {
    name: string;
    count: number;
    market_cap_total: number;
    companies: { stock_code: string; short_name: string; industry_id: string; market_cap: number }[];
  }[];
  cities: {
    province: string;
    city: string;
    count: number;
    lat: number;
    lng: number;
  }[];
}

export interface GraphData {
  nodes: {
    id: string;
    name: string;
    full_name: string;
    stock_code: string;
    industry_id: string;
    province: string;
    city: string;
    market_cap: number;
  }[];
  edges: Relation[];
}

export async function getIndustries(): Promise<Industry[]> {
  const data = await fetchAPI("/industries");
  return data.industries;
}

export async function getCompanies(params?: {
  industry_id?: string;
  province?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{ companies: Company[]; total: number; page: number }> {
  const searchParams = new URLSearchParams();
  if (params?.industry_id) searchParams.set("industry_id", params.industry_id);
  if (params?.province) searchParams.set("province", params.province);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.page_size) searchParams.set("page_size", String(params.page_size));
  const qs = searchParams.toString();
  return fetchAPI(`/companies${qs ? `?${qs}` : ""}`);
}

export async function getCompanyDetail(stockCode: string): Promise<CompanyDetail> {
  return fetchAPI(`/companies/${stockCode}`);
}

export async function getRegions(): Promise<RegionData> {
  return fetchAPI("/regions");
}

export async function getGraphData(stockCode: string, depth = 1): Promise<GraphData> {
  return fetchAPI(`/graph/company/${stockCode}?depth=${depth}`);
}

export function getIndustryMap() {
  const map: Record<string, string> = {};
  const subIndustries: Record<string, string> = {};

  return { map, subIndustries };
}
