import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Industra API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"


def load_json(name: str):
    with open(DATA_DIR / f"{name}.json", "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/industries")
def get_industries():
    """Return the AI基建 industry hierarchy."""
    data = load_json("industries")
    return {"industries": data["industries"]}


def _flat_industries(node, parent_name=None):
    """Flatten industry tree into list with parent references."""
    result = []
    item = {
        "id": node["id"],
        "name": node["name"],
        "name_en": node.get("name_en", ""),
        "level": node["level"],
        "parent_name": parent_name,
    }
    result.append(item)
    for child in node.get("children", []):
        result.extend(_flat_industries(child, node["name"]))
    return result


@app.get("/api/industries/flat")
def get_industries_flat():
    """Return flattened industry list with parent references."""
    data = load_json("industries")
    result = []
    for ind in data["industries"]:
        result.extend(_flat_industries(ind))
    return {"industries": result}


@app.get("/api/companies")
def get_companies(
    industry_id: Optional[str] = None,
    province: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List companies with optional filters."""
    data = load_json("companies")
    companies = data["companies"]

    if industry_id:
        companies = [c for c in companies if c["industry_id"] == industry_id]
    if province:
        companies = [c for c in companies if c["province"] == province]
    if search:
        q = search.lower()
        companies = [
            c
            for c in companies
            if q in c["name"].lower()
            or q in c["short_name"].lower()
            or q in c["stock_code"]
            or q in c["main_business"].lower()
        ]

    total = len(companies)
    start = (page - 1) * page_size
    end = start + page_size

    return {
        "companies": companies[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@app.get("/api/companies/{stock_code}")
def get_company_detail(stock_code: str):
    """Get company detail with relationships."""
    companies_data = load_json("companies")
    relations_data = load_json("relations")
    industries_data = load_json("industries")

    company = next(
        (c for c in companies_data["companies"] if c["stock_code"] == stock_code), None
    )
    if not company:
        return {"error": "Company not found"}, 404

    company_code = company["stock_code"]
    company_lookup = {c["stock_code"]: c for c in companies_data["companies"]}

    upstream_raw = []
    downstream_raw = []
    competitors_raw = []

    for r in relations_data["relations"]:
        if r["type"] == "supplier" and r["to"] == company_code:
            upstream_raw.append(r)
        elif r["type"] == "supplier" and r["from"] == company_code:
            downstream_raw.append(r)
        elif r["type"] == "customer" and r["from"] == company_code:
            upstream_raw.append(r)
        elif r["type"] == "customer" and r["to"] == company_code:
            downstream_raw.append(r)
        elif r["type"] == "competitor":
            if r["from"] == company_code or r["to"] == company_code:
                competitors_raw.append(r)

    def build_rich(rels, code_field):
        out = []
        for r in rels:
            target_code = r[code_field]
            tgt = company_lookup.get(target_code)
            if tgt:
                out.append({"relation": r, "company": tgt})
        return out

    upstream_rich = build_rich(upstream_raw, "from")
    downstream_rich = build_rich(downstream_raw, "to")
    competitors_rich = []
    for r in competitors_raw:
        other = r["to"] if r["from"] == company_code else r["from"]
        tgt = company_lookup.get(other)
        if tgt:
            competitors_rich.append({"relation": r, "company": tgt})

    industry_info = None
    for l1 in industries_data["industries"]:
        for l2 in l1.get("children", []):
            for l3 in l2.get("children", []):
                if l3["id"] == company["industry_id"]:
                    industry_info = {
                        "l1": {"id": l1["id"], "name": l1["name"]},
                        "l2": {"id": l2["id"], "name": l2["name"]},
                        "l3": {"id": l3["id"], "name": l3["name"]},
                    }

    return {
        "company": company,
        "industry_info": industry_info,
        "upstream": upstream_rich,
        "downstream": downstream_rich,
        "competitors": competitors_rich,
    }


@app.get("/api/regions")
def get_regions():
    """Get regional industry summary."""
    companies = load_json("companies")["companies"]

    provinces = {}
    for c in companies:
        p = c["province"]
        if p not in provinces:
            provinces[p] = {
                "name": p,
                "count": 0,
                "market_cap_total": 0,
                "companies": [],
            }
        provinces[p]["count"] += 1
        provinces[p]["market_cap_total"] += c.get("market_cap", 0) or 0
        provinces[p]["companies"].append({
            "stock_code": c["stock_code"],
            "short_name": c["short_name"],
            "industry_id": c["industry_id"],
            "market_cap": c["market_cap"],
        })

    cities = {}
    for c in companies:
        key = f"{c['province']}-{c['city']}"
        if key not in cities:
            cities[key] = {
                "province": c["province"],
                "city": c["city"],
                "count": 0,
                "lat": c["lat"],
                "lng": c["lng"],
            }
        cities[key]["count"] += 1

    return {
        "provinces": list(provinces.values()),
        "cities": list(cities.values()),
    }


@app.get("/api/graph/company/{stock_code}")
def get_graph_data(stock_code: str, depth: int = Query(1, ge=1, le=3)):
    """Get graph data for a company with configurable depth."""
    companies = {c["stock_code"]: c for c in load_json("companies")["companies"]}
    relations = load_json("relations")["relations"]

    if stock_code not in companies:
        return {"error": "Company not found"}, 404

    nodes = {stock_code}
    edges = []
    frontier = {stock_code}

    for _ in range(depth):
        new_frontier = set()
        for r in relations:
            if r["from"] in frontier or r["to"] in frontier:
                edges.append(r)
                if r["from"] not in nodes:
                    nodes.add(r["from"])
                    new_frontier.add(r["from"])
                if r["to"] not in nodes:
                    nodes.add(r["to"])
                    new_frontier.add(r["to"])
        frontier = new_frontier

    graph_nodes = []
    for code in nodes:
        c = companies.get(code)
        if c:
            graph_nodes.append({
                "id": code,
                "name": c["short_name"],
                "full_name": c["name"],
                "stock_code": code,
                "industry_id": c["industry_id"],
                "province": c["province"],
                "city": c["city"],
                "market_cap": c["market_cap"],
            })

    return {"nodes": graph_nodes, "edges": edges}


@app.get("/api/stats")
def get_stats():
    """Get overview statistics."""
    companies = load_json("companies")["companies"]
    relations = load_json("relations")["relations"]
    industries = load_json("industries")["industries"]

    province_count = len(set(c["province"] for c in companies))
    total_market_cap = sum(c.get("market_cap", 0) or 0 for c in companies)

    leaf_industries = []
    for l1 in industries:
        for l2 in l1.get("children", []):
            for l3 in l2.get("children", []):
                leaf_industries.append(l3["id"])

    industry_dist = {}
    for c in companies:
        iid = c["industry_id"]
        industry_dist[iid] = industry_dist.get(iid, 0) + 1

    return {
        "total_companies": len(companies),
        "total_relations": len(relations),
        "total_provinces": province_count,
        "total_market_cap": total_market_cap,
        "industry_distribution": industry_dist,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
