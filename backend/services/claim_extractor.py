"""
Stage 2: Claim Extraction & Entity Recognition Service
Normalizes noisy forwarded texts, extracts atomic factual claims, extracts named entities,
and formulates targeted search keywords.
"""

import re
from typing import List, Dict, Any

# Common viral forward / conversational noise prefixes
FORWARD_PATTERNS = [
    r"^forwarded as received:?",
    r"^forwarded many times:?",
    r"^fwd:?",
    r"^breaking news!*:?",
    r"^urgent notice!*:?",
    r"^must read!*:?",
    r"^share with everyone!*:?",
    r"^viral alert:?",
    r"^attention everyone:?"
]

def clean_forwarded_text(raw_text: str) -> str:
    """Removes viral preamble lines and conversational noise."""
    text = raw_text.strip()
    for pat in FORWARD_PATTERNS:
        text = re.sub(pat, "", text, flags=re.IGNORECASE).strip()
    # Normalize multiple whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text

def extract_entities_rule_based(text: str) -> Dict[str, List[str]]:
    """
    Lightweight, fast entity extraction for organizations, dates, locations, and proper nouns.
    Works independently of external NLP dependencies.
    """
    entities = {
        "organizations": [],
        "locations": [],
        "dates_or_numbers": [],
        "key_concepts": []
    }
    
    # Common organization patterns
    org_keywords = [
        "NASA", "ESA", "ISRO", "WHO", "World Health Organization", "CDC", "FDA", 
        "European Union", "EU", "AMA", "American Medical Association", "UN", "United Nations",
        "EPA", "Google", "IBM", "Apple", "Microsoft", "Reuters", "BBC"
    ]
    for org in org_keywords:
        if re.search(r"\b" + re.escape(org) + r"\b", text, re.IGNORECASE):
            entities["organizations"].append(org)
            
    # Dates and years
    years = re.findall(r"\b(19\d\d|20\d\d)\b", text)
    if years:
        entities["dates_or_numbers"].extend(list(set(years)))
        
    # Percentages and numbers
    numbers = re.findall(r"\b\d+(?:\.\d+)?%|\b\d+\s*(?:hours|days|years|km|percent)", text, re.IGNORECASE)
    if numbers:
        entities["dates_or_numbers"].extend(list(set(numbers)))
        
    # Locations
    location_keywords = [
        "India", "Antarctica", "European Union", "Europe", "United States", "US", 
        "Patagonia", "China", "Rome", "The Hague", "Moon", "Lunar", "Mars"
    ]
    for loc in location_keywords:
        if re.search(r"\b" + re.escape(loc) + r"\b", text, re.IGNORECASE):
            entities["locations"].append(loc)
            
    return entities

def extract_claim(raw_text: str) -> Dict[str, Any]:
    """
    Takes noisy text input or OCR output and distills it into an atomic, checkable claim,
    named entities, and search queries.
    """
    cleaned = clean_forwarded_text(raw_text)
    
    # If the user text is already concise and direct, canonical is the cleaned text
    # Otherwise, focus on the principal declarative sentence
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    if len(sentences) > 0 and len(sentences[0]) > 20:
        canonical_claim = sentences[0].strip()
    else:
        canonical_claim = cleaned
        
    entities = extract_entities_rule_based(canonical_claim)
    
    # Formulate search queries:
    # 1. Broad query (main keywords)
    # 2. Fact-check specific query ("claim text + fact check")
    stop_words = {
        "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
        "which", "this", "that", "these", "those", "then", "just", "so", "than",
        "such", "both", "through", "about", "for", "is", "of", "while", "during", "to"
    }
    tokens = re.findall(r"\b\w{3,}\b", canonical_claim.lower())
    filtered_keywords = [t for t in tokens if t not in stop_words][:8]
    
    return {
        "raw_text": raw_text,
        "cleaned_text": cleaned,
        "canonical_claim": canonical_claim,
        "entities": entities,
        "search_keywords": filtered_keywords,
        "search_query": " ".join(filtered_keywords),
        "is_valid_claim": len(canonical_claim) >= 10
    }
