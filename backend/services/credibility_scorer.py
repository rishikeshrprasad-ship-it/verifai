"""
Stage 6: Source Credibility Weighting Service
Provides a transparent, explainable rule-based domain-trust dictionary.
Classifies sources into distinct trust tiers and supplies justification.
"""

from urllib.parse import urlparse
from typing import Dict, Any

# Static Domain Trust Dictionary
DOMAIN_TRUST_MAP = {
    # Tier 1: International agencies, Wire services, Top Fact-Checkers, Scientific Journals (0.95 - 1.00)
    "who.int": {"trust": 1.0, "tier": "Tier 1: Global Health Authority", "category": "Official Organization"},
    "nasa.gov": {"trust": 1.0, "tier": "Tier 1: Space & Atmospheric Agency", "category": "Government Research"},
    "isro.gov.in": {"trust": 1.0, "tier": "Tier 1: Space Exploration Agency", "category": "Government Research"},
    "unep.org": {"trust": 1.0, "tier": "Tier 1: UN Environmental Body", "category": "Official Organization"},
    "nature.com": {"trust": 0.99, "tier": "Tier 1: Premier Peer-Reviewed Journal", "category": "Academic / Scientific"},
    "epa.gov": {"trust": 0.99, "tier": "Tier 1: Environmental Protection Agency", "category": "Government Regulatory"},
    "europarl.europa.eu": {"trust": 0.99, "tier": "Tier 1: European Parliamentary Body", "category": "Official Governance"},
    "reuters.com": {"trust": 0.98, "tier": "Tier 1: Global Wire Service", "category": "Primary Wire Service"},
    "apnews.com": {"trust": 0.98, "tier": "Tier 1: Global Wire Service", "category": "Primary Wire Service"},
    "politifact.com": {"trust": 0.97, "tier": "Tier 1: Certified Fact-Checker (IFCN)", "category": "Fact Checking Desk"},
    "snopes.com": {"trust": 0.96, "tier": "Tier 1: Certified Fact-Checker (IFCN)", "category": "Fact Checking Desk"},
    "factcheck.afp.com": {"trust": 0.97, "tier": "Tier 1: Certified Wire Fact-Checker", "category": "Fact Checking Desk"},
    "fullfact.org": {"trust": 0.96, "tier": "Tier 1: Independent Fact-Checking Charity", "category": "Fact Checking Desk"},
    "pib.gov.in": {"trust": 0.96, "tier": "Tier 1: Official National Press Bureau", "category": "Government Information"},
    "cancerresearchuk.org": {"trust": 0.98, "tier": "Tier 1: National Oncology Research Institute", "category": "Medical Research"},
    "hopkinsmedicine.org": {"trust": 0.99, "tier": "Tier 1: Leading Academic Medical Center", "category": "Medical Research"},
    "mayoclinic.org": {"trust": 0.98, "tier": "Tier 1: Leading Academic Medical Center", "category": "Medical Research"},
    "hsph.harvard.edu": {"trust": 0.97, "tier": "Tier 1: Academic School of Public Health", "category": "Academic Research"},
    "ama-assn.org": {"trust": 0.98, "tier": "Tier 1: Medical Professional Association", "category": "Professional Association"},

    # Tier 2: Mainstream Editorial News & Public Broadcasters (0.85 - 0.94)
    "bbc.com": {"trust": 0.94, "tier": "Tier 2: Public Broadcaster", "category": "Mainstream Editorial"},
    "bbc.co.uk": {"trust": 0.94, "tier": "Tier 2: Public Broadcaster", "category": "Mainstream Editorial"},
    "theguardian.com": {"trust": 0.92, "tier": "Tier 2: National Broadcaster / Press", "category": "Mainstream Editorial"},
    "thehindu.com": {"trust": 0.93, "tier": "Tier 2: National Press of Record", "category": "Mainstream Editorial"},
    "nytimes.com": {"trust": 0.92, "tier": "Tier 2: National Press of Record", "category": "Mainstream Editorial"},
    "washingtonpost.com": {"trust": 0.91, "tier": "Tier 2: National Press of Record", "category": "Mainstream Editorial"},
    "wsj.com": {"trust": 0.93, "tier": "Tier 2: Financial & Investigative Press", "category": "Mainstream Editorial"},
    "boomlive.in": {"trust": 0.94, "tier": "Tier 2: Certified Regional Fact-Checker", "category": "Fact Checking Desk"},

    # Tier 3: Specialized Journals & Technology Press (0.70 - 0.84)
    "quantamagazine.org": {"trust": 0.92, "tier": "Tier 3: Specialized Science Journalism", "category": "Science Journalism"},
    "livescience.com": {"trust": 0.90, "tier": "Tier 3: Popular Science Publishing", "category": "Science Journalism"},
    "ibm.com": {"trust": 0.88, "tier": "Tier 3: Corporate Enterprise Research", "category": "Industry Whitepaper"},
    "theverge.com": {"trust": 0.82, "tier": "Tier 3: Tech & Culture Journalism", "category": "Technology Journalism"},
    "wired.com": {"trust": 0.84, "tier": "Tier 3: Tech & Culture Journalism", "category": "Technology Journalism"},

    # Tier 4: Social Media, User Discussions, Unverified Portals (0.25 - 0.45)
    "reddit.com": {"trust": 0.45, "tier": "Tier 4: Social Discussion & Community Forum", "category": "User Generated Content"},
    "twitter.com": {"trust": 0.35, "tier": "Tier 4: Microblogging Social Platform", "category": "User Generated Content"},
    "x.com": {"trust": 0.35, "tier": "Tier 4: Microblogging Social Platform", "category": "User Generated Content"},
    "facebook.com": {"trust": 0.30, "tier": "Tier 4: Social Network Platform", "category": "User Generated Content"},
    "mysterychronicles-blog.net": {"trust": 0.25, "tier": "Tier 4: Unverified Personal Blog", "category": "Unverified Self-Published"}
}

def clean_domain(url_or_domain: str) -> str:
    """Extracts raw domain name from URL or plain domain string."""
    if not url_or_domain:
        return ""
    if "://" in url_or_domain:
        domain = urlparse(url_or_domain).netloc
    else:
        domain = url_or_domain
    domain = domain.lower().replace("www.", "").strip()
    return domain

def evaluate_source_credibility(domain_or_url: str) -> Dict[str, Any]:
    """
    Evaluates trust rating and transparency justification for a given source domain.
    """
    domain = clean_domain(domain_or_url)
    
    if domain in DOMAIN_TRUST_MAP:
        entry = DOMAIN_TRUST_MAP[domain]
        return {
            "domain": domain,
            "trust_score": entry["trust"],
            "tier": entry["tier"],
            "category": entry["category"],
            "justification": f"Explicitly listed in verified domain registry ({entry['tier']})."
        }
        
    # Heuristic matching for government, academic, or unknown domains
    if domain.endswith(".gov") or domain.endswith(".gov.in") or domain.endswith(".mil"):
        return {
            "domain": domain,
            "trust_score": 0.95,
            "tier": "Tier 1: Government TLD (.gov)",
            "category": "Official Government Agency",
            "justification": "Verified authoritative government domain extension."
        }
    elif domain.endswith(".edu") or domain.endswith(".ac.uk") or domain.endswith(".edu.in"):
        return {
            "domain": domain,
            "trust_score": 0.90,
            "tier": "Tier 1: Educational / Academic TLD (.edu)",
            "category": "Accredited Academic Institution",
            "justification": "Accredited higher-education university institution."
        }
        
    # Default unindexed web source
    return {
        "domain": domain,
        "trust_score": 0.55,
        "tier": "Tier 3: Standard Web Domain (Unindexed)",
        "category": "General Web Source",
        "justification": "Standard web domain without dedicated institutional fact-checking record."
    }
