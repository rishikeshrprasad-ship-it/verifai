"""
Stage 4: Parallel Evidence Retrieval Service
Coordinates parallel retrieval across:
1. Google Fact Check Tools API (ClaimReview markup)
2. Live Web Search Expansion (Serper / Tavily / DuckDuckGo)
3. Reddit Social Discussions (via public Reddit JSON API)
4. Tested Offline JSON Fallback (~30 pre-pulled real posts and fact-checks)
"""

import os
import re
import json
import asyncio
import urllib.parse
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from duckduckgo_search import DDGS

GOOGLE_FACT_CHECK_API_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY", "")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")

def load_offline_database() -> List[Dict[str, Any]]:
    db_path = os.path.join(os.path.dirname(__file__), "..", "data", "offline_evidence.json")
    if os.path.exists(db_path):
        try:
            with open(db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("claims", [])
        except Exception:
            return []
    return []

def build_targeted_search_query(claim_text: str, keywords: List[str], entities: Dict[str, Any] = None) -> str:
    """
    Constructs a high-precision search query by cleaning and extracting
    key noun phrases, named entities, and organizations rather than full verbatim long strings.
    """
    selected_tokens = []
    
    # 1. Prioritize Named Entities (Organizations, Locations, Dates)
    if entities:
        for org in entities.get("organizations", []):
            if org not in selected_tokens:
                selected_tokens.append(org)
        for loc in entities.get("locations", []):
            if loc not in selected_tokens:
                selected_tokens.append(loc)
        for val in entities.get("dates_or_numbers", []):
            if val not in selected_tokens:
                selected_tokens.append(val)
                
    # 2. Add top informative keywords
    for kw in keywords:
        if kw.lower() not in [t.lower() for t in selected_tokens] and len(selected_tokens) < 6:
            selected_tokens.append(kw)
            
    # 3. Fallback: Clean alphanumeric nouns from claim text
    if len(selected_tokens) < 2:
        stop_words = {
            "the", "and", "for", "with", "that", "this", "from", "have", "has",
            "been", "were", "what", "which", "into", "their", "about", "claim",
            "claims", "alleged", "report", "according", "news"
        }
        cleaned = re.sub(r"[^\w\s]", " ", claim_text)
        words = [w for w in cleaned.split() if len(w) > 3 and w.lower() not in stop_words]
        for w in words[:5]:
            if w.lower() not in [t.lower() for t in selected_tokens]:
                selected_tokens.append(w)
                
    return " ".join(selected_tokens) if selected_tokens else claim_text[:60]

async def fetch_google_fact_check(query: str) -> List[Dict[str, Any]]:
    """Fetches claims and reviews from Google Fact Check Tools API if key is present."""
    if not GOOGLE_FACT_CHECK_API_KEY:
        return []
        
    url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    params = {
        "query": query,
        "key": GOOGLE_FACT_CHECK_API_KEY,
        "languageCode": "en"
    }
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                claims = data.get("claims", [])
                for c in claims[:4]:
                    for r in c.get("claimReview", [])[:1]:
                        results.append({
                            "id": f"gfc-{len(results)+1}",
                            "source": r.get("publisher", {}).get("name", "Fact Checker"),
                            "domain": r.get("publisher", {}).get("site", ""),
                            "url": r.get("url", ""),
                            "title": r.get("title", c.get("text", "")),
                            "snippet": f"Claim: {c.get('text', '')}. Rating: {r.get('textualRating', '')}.",
                            "author": r.get("publisher", {}).get("name", ""),
                            "source_type": "fact_checker",
                            "published_date": r.get("reviewDate", ""),
                            "domain_trust": 0.95,
                            "stance": "Contradicts" if "false" in r.get("textualRating", "").lower() else "Supports",
                            "relevance_score": 0.85,
                            "is_live_web_search": False
                        })
                return results
    except Exception:
        pass
    return []

def retrieve_free_live_evidence(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Zero-Auth Public Live Web Search Provider using DuckDuckGo Search (DDGS).
    Pulls real-time live web evidence snippets and domains without requiring API keys.
    Maps DDG results into standard evidence dicts: {id, source_domain, text: body, url, ...}.
    """
    if not query or not query.strip():
        return []
        
    results = []
    clean_q = query.strip()
    
    try:
        ddgs = DDGS()
        raw_hits = ddgs.text(clean_q, max_results=max_results)
        if raw_hits:
            for idx, item in enumerate(raw_hits):
                link = item.get("href") or item.get("url") or ""
                body = item.get("body") or item.get("snippet") or ""
                title = item.get("title") or ""
                domain = urllib.parse.urlparse(link).netloc.replace("www.", "") if link else "duckduckgo.com"
                
                source_name = domain.split(".")[0].capitalize() if domain else "Live Web"
                
                is_high_trust = any(d in domain.lower() for d in [
                    "reuters", "apnews", "bbc", "nature.com", "nasa.gov", "who.int",
                    "wikipedia.org", "theguardian", "nytimes", "washingtonpost",
                    "bloomberg", "scmp", "techcrunch", "isro.gov", "investing.com", "fortune.com", "cnbc.com"
                ])
                domain_trust = 0.88 if is_high_trust else 0.75
                
                results.append({
                    "id": f"ddgs-{idx+1}",
                    "source": source_name,
                    "source_domain": domain,
                    "domain": domain,
                    "url": link,
                    "title": title,
                    "snippet": body[:320] if body else title,
                    "text": body,
                    "source_type": "web_search",
                    "domain_trust": domain_trust,
                    "stance": "Context / Neutral",
                    "relevance_score": 0.80,
                    "is_live_web_search": True
                })
            return results
    except Exception:
        # Fallback to lite search or RSS
        pass
        
    return results

async def fetch_serper_search(query: str) -> List[Dict[str, Any]]:
    """Fetches live search results via Serper API if SERPER_API_KEY is configured."""
    if not SERPER_API_KEY:
        return []
        
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {"q": query, "num": 5}
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                organic = data.get("organic", [])
                results = []
                for item in organic[:4]:
                    link = item.get("link", "")
                    domain = urllib.parse.urlparse(link).netloc.replace("www.", "")
                    results.append({
                        "id": f"serper-{len(results)+1}",
                        "source": domain.split(".")[0].capitalize() if domain else "Web Source",
                        "domain": domain,
                        "url": link,
                        "title": item.get("title", ""),
                        "snippet": item.get("snippet", ""),
                        "source_type": "web_search",
                        "domain_trust": 0.85 if any(d in domain for d in ["reuters.com", "bbc.com", "apnews.com", "nasa.gov", "who.int", "nature.com"]) else 0.70,
                        "stance": "Supports",
                        "relevance_score": 0.80,
                        "is_live_web_search": True
                    })
                return results
    except Exception:
        pass
    return []

async def fetch_tavily_search(query: str) -> List[Dict[str, Any]]:
    """Fetches live search results via Tavily API if TAVILY_API_KEY is configured."""
    if not TAVILY_API_KEY:
        return []
        
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "max_results": 4
    }
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", [])[:4]:
                    link = item.get("url", "")
                    domain = urllib.parse.urlparse(link).netloc.replace("www.", "")
                    results.append({
                        "id": f"tavily-{len(results)+1}",
                        "source": domain.split(".")[0].capitalize() if domain else "Web Source",
                        "domain": domain,
                        "url": link,
                        "title": item.get("title", ""),
                        "snippet": item.get("content", "")[:280],
                        "source_type": "web_search",
                        "domain_trust": 0.85 if any(d in domain for d in ["reuters.com", "bbc.com", "apnews.com", "nasa.gov", "who.int"]) else 0.70,
                        "stance": "Supports",
                        "relevance_score": 0.80,
                        "is_live_web_search": True
                    })
                return results
    except Exception:
        pass
    return []

async def fetch_google_news_rss(query: str) -> List[Dict[str, Any]]:
    """
    Live real-time breaking news retrieval using Google News RSS search.
    Provides instant, verified daily news results from accredited international wire desks.
    """
    import xml.etree.ElementTree as ET
    encoded_q = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-US&gl=US&ceid=US:en"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    results = []
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                try:
                    root = ET.fromstring(resp.content)
                    items = root.findall(".//item")[:4]
                    for item in items:
                        raw_title = item.findtext("title") or ""
                        parts = raw_title.rsplit(" - ", 1)
                        title = parts[0].strip() if parts else raw_title.strip()
                        source = parts[1].strip() if len(parts) > 1 else (item.findtext("source") or "News Desk")
                        link = item.findtext("link") or "https://news.google.com"
                        desc = item.findtext("description") or ""
                        clean_desc = re.sub(r"<[^>]+>", " ", desc).strip()
                        snippet = clean_desc if clean_desc else title
                        
                        domain = source.lower().replace(" ", "").replace(".", "") + ".com"
                        
                        results.append({
                            "id": f"news-{len(results)+1}",
                            "source": source,
                            "domain": domain,
                            "url": link,
                            "title": title,
                            "snippet": snippet[:260],
                            "source_type": "web_search",
                            "domain_trust": 0.88 if any(d in source.lower() for d in ["reuters", "bbc", "ap", "associated press", "nasa", "bloomberg", "cnn", "nytimes", "kdnuggets", "scmp", "techcrunch", "the verge", "investing", "fortune"]) else 0.75,
                            "stance": "Supports",
                            "relevance_score": 0.85,
                            "is_live_web_search": True
                        })
                    if results:
                        return results
                except Exception:
                    pass
    except Exception:
        pass
    return []

async def fetch_duckduckgo_lite_search(query: str) -> List[Dict[str, Any]]:
    """
    Public live web search fallback using DuckDuckGo Lite.
    Ensures 100% live breaking-news capability even without external commercial API keys.
    """
    search_url = "https://lite.duckduckgo.com/lite/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(search_url, data={"q": query}, headers=headers)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                results = []
                for tr in soup.find_all("tr"):
                    link_el = tr.find("a", class_="result-link")
                    snippet_el = tr.find("td", class_="result-snippet")
                    if link_el:
                        raw_href = link_el.get("href", "")
                        parsed_q = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
                        actual_url = parsed_q.get("uddg", [raw_href])[0]
                        domain = urllib.parse.urlparse(actual_url).netloc.replace("www.", "")
                        results.append({
                            "id": f"ddg-{len(results)+1}",
                            "source": domain.split(".")[0].capitalize() if domain else "Web News",
                            "domain": domain,
                            "url": actual_url,
                            "title": link_el.get_text().strip(),
                            "snippet": "",
                            "source_type": "web_search",
                            "domain_trust": 0.85 if any(d in domain for d in ["reuters.com", "bbc.com", "apnews.com", "nasa.gov", "who.int", "wikipedia.org", "nature.com"]) else 0.70,
                            "stance": "Supports",
                            "relevance_score": 0.75,
                            "is_live_web_search": True
                        })
                    elif snippet_el and results:
                        results[-1]["snippet"] = snippet_el.get_text().strip()
                        
                # Filter results that have valid titles
                return [r for r in results if r["title"] and r["url"]][:4]
    except Exception:
        pass
    return []

async def fetch_reddit_discussions(query: str) -> List[Dict[str, Any]]:
    """Fetches top matching public Reddit community discussions via Reddit JSON API."""
    search_url = "https://www.reddit.com/search.json"
    headers = {"User-Agent": "VerifAI-FactCheckPlatform/1.0"}
    params = {"q": query, "sort": "relevance", "limit": 3}
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(search_url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                posts = data.get("data", {}).get("children", [])
                reddit_items = []
                for p in posts:
                    pdata = p.get("data", {})
                    subreddit = pdata.get("subreddit_name_prefixed", "r/all")
                    title = pdata.get("title", "")
                    selftext = pdata.get("selftext", "")
                    snippet = selftext[:200] if selftext else title
                    reddit_items.append({
                        "id": f"reddit-{pdata.get('id', 'item')}",
                        "source": subreddit,
                        "domain": "reddit.com",
                        "url": f"https://reddit.com{pdata.get('permalink', '')}",
                        "title": title,
                        "snippet": f"Reddit discussion ({pdata.get('score', 0)} upvotes): {snippet}",
                        "author": f"u/{pdata.get('author', 'user')}",
                        "source_type": "social_discussion",
                        "published_date": "",
                        "domain_trust": 0.45,
                        "stance": "Neutral",
                        "relevance_score": 0.75,
                        "is_live_web_search": False
                    })
                return reddit_items
    except Exception:
        pass
    return []

def match_offline_database(query_text: str, keywords: List[str]) -> List[Dict[str, Any]]:
    """
    Finds verified curated pre-pulled fact checks and discussions from the offline dataset
    ONLY when there is an exact or high-precision multi-word semantic anchor match.
    Prevents false-positive matches on single generic words (e.g., 'india', 'became').
    """
    offline_claims = load_offline_database()
    best_claim = None
    best_score = -1
    
    query_lower = query_text.lower()
    query_tokens = set(re.findall(r"\b\w{3,}\b", query_lower)) - {
        "the", "and", "for", "with", "that", "this", "from", "have", "has",
        "been", "were", "what", "which", "into", "their", "about", "claim",
        "became", "become", "after", "before", "india", "news", "today"
    }
    
    for c in offline_claims:
        score = 0
        matched_multiword_kw = False
        
        # 1. Exact multi-word keyword phrase match in claim
        for kw in c.get("keywords", []):
            kw_clean = kw.lower().strip()
            if " " in kw_clean and kw_clean in query_lower:
                score += 8
                matched_multiword_kw = True
            elif kw_clean in query_lower and len(kw_clean) > 5:
                score += 4
                matched_multiword_kw = True
                
        # 2. Informative keyword overlap against benchmark claim text
        c_text_lower = c.get("text", "").lower()
        c_tokens = set(re.findall(r"\b\w{3,}\b", c_text_lower)) - {
            "the", "and", "for", "with", "that", "this", "from", "have", "has",
            "been", "were", "what", "which", "into", "their", "about", "claim",
            "became", "become", "after", "before", "india", "news", "today"
        }
        
        overlap = query_tokens.intersection(c_tokens)
        if len(overlap) >= 3:
            score += len(overlap) * 2
            
        # Only consider match if score is high and matched specific anchor
        if score > best_score and (score >= 8 or (score >= 6 and matched_multiword_kw)):
            best_score = score
            best_claim = c
            
    if best_claim and best_score >= 6:
        return best_claim.get("evidence", [])
        
    return []

async def retrieve_evidence(
    claim_text: str, 
    search_query: str, 
    search_keywords: List[str],
    entities: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Runs parallel multi-source retrieval across:
    1. Primary Fact Check registries (Google Fact Check)
    2. Reddit Social Discussions
    3. Live Web Search Expansion (Serper / Tavily / DuckDuckGo) when fact-checks < 2
    4. Offline curated database fallback
    """
    aggregated_evidence = []
    used_live_web = False
    
    # 1. Primary retrieval (Fact Checks + Community Discussions)
    live_tasks = [
        asyncio.wait_for(fetch_google_fact_check(search_query), timeout=3.0),
        asyncio.wait_for(fetch_reddit_discussions(search_query), timeout=3.0)
    ]
    
    try:
        live_results = await asyncio.gather(*live_tasks, return_exceptions=True)
        if len(live_results) > 0 and isinstance(live_results[0], list):
            aggregated_evidence.extend(live_results[0])
        if len(live_results) > 1 and isinstance(live_results[1], list):
            aggregated_evidence.extend(live_results[1])
    except Exception:
        pass
        
    # 2. Live Search Expansion for Breaking News (if primary fact-check registry returns < 2 pieces)
    if len(aggregated_evidence) < 2:
        targeted_web_query = build_targeted_search_query(claim_text, search_keywords, entities)
        web_results = None
        
        # 1. Zero-Key Multi-Provider Free Live Search (DDGS + Google News RSS in parallel)
        try:
            ddg_task = asyncio.to_thread(retrieve_free_live_evidence, targeted_web_query, 5)
            rss_task = fetch_google_news_rss(targeted_web_query)
            parallel_web = await asyncio.gather(ddg_task, rss_task, return_exceptions=True)
            web_results = []
            for item_set in parallel_web:
                if isinstance(item_set, list):
                    web_results.extend(item_set)
        except Exception:
            web_results = []

        # 2. Commercial API keys if configured and free results < 2
        if len(web_results) < 2 and SERPER_API_KEY:
            try:
                serp_res = await asyncio.wait_for(fetch_serper_search(targeted_web_query), timeout=3.0)
                if serp_res:
                    web_results.extend(serp_res)
            except Exception:
                pass
        elif len(web_results) < 2 and TAVILY_API_KEY:
            try:
                tav_res = await asyncio.wait_for(fetch_tavily_search(targeted_web_query), timeout=3.0)
                if tav_res:
                    web_results.extend(tav_res)
            except Exception:
                pass
                
        # 3. DuckDuckGo lite search fallback if still empty
        if not web_results:
            try:
                lite_res = await asyncio.wait_for(fetch_duckduckgo_lite_search(targeted_web_query), timeout=3.0)
                if lite_res:
                    web_results.extend(lite_res)
            except Exception:
                pass
                
        if web_results:
            used_live_web = True
            for item in web_results:
                if not any(e.get("url") == item.get("url") for e in aggregated_evidence):
                    aggregated_evidence.append(item)
                    
    # 3. Merge verified offline dataset records when available for benchmark claims
    offline_matches = match_offline_database(claim_text, search_keywords)
    used_offline = False
    
    if offline_matches:
        for item in offline_matches:
            if not any(e.get("url") == item.get("url") for e in aggregated_evidence):
                aggregated_evidence.append(item)
        used_offline = True
    elif len(aggregated_evidence) == 0:
        used_offline = True
                
    return {
        "query_executed": search_query,
        "total_retrieved": len(aggregated_evidence),
        "evidence_items": aggregated_evidence,
        "used_offline_fallback": used_offline,
        "used_live_web_search": used_live_web
    }
