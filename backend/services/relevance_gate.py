"""
Stage 5: Relevance Gate Service
Uses sentence-transformers (all-MiniLM-L6-v2) cosine similarity with threshold 0.40.
Filters out irrelevant or noisy evidence pieces BEFORE stance detection.
"""

import re
import numpy as np
from typing import List, Dict, Any

_EMBEDDING_MODEL = None

def get_embedding_model():
    """Lazy load SentenceTransformer model."""
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            _EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            print(f"[Relevance Gate] Warning: Could not initialize SentenceTransformer ({e}). Using TF-IDF fallback.")
            _EMBEDDING_MODEL = "fallback"
    return _EMBEDDING_MODEL

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))

def compute_similarity(claim_text: str, evidence_snippet: str) -> float:
    """Computes semantic similarity between claim and evidence snippet."""
    model = get_embedding_model()
    
    if model != "fallback" and model is not None:
        try:
            embeddings = model.encode([claim_text, evidence_snippet])
            sim = cosine_similarity(embeddings[0], embeddings[1])
            return max(0.0, min(1.0, sim))
        except Exception:
            pass
            
    # Fallback: high-precision token coverage & TF-IDF similarity
    def _normalize(t: str) -> str:
        t = re.sub(r"(\d+)([a-zA-Z]+)", r"\1 \2", t)
        t = re.sub(r"([a-zA-Z]+)(\d+)", r"\1 \2", t)
        return t.lower()

    norm_claim = _normalize(claim_text)
    norm_ev = _normalize(evidence_snippet)

    stop_words = {
        "the", "and", "for", "with", "that", "this", "from", "have", "has", 
        "been", "were", "what", "which", "into", "their", "about", "within",
        "had", "are", "was", "will", "would", "shall", "should"
    }
    claim_words = set(re.findall(r"\b\w{2,}\b", norm_claim)) - stop_words
    ev_words = set(re.findall(r"\b\w{2,}\b", norm_ev))
    if not claim_words or not ev_words:
        return 0.0
    inter = claim_words.intersection(ev_words)
    coverage = len(inter) / len(claim_words) if claim_words else 0.0

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity as sk_cosine
        vec = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
        tfidf = vec.fit_transform([norm_claim, norm_ev])
        sk_sim = float(sk_cosine(tfidf[0:1], tfidf[1:2])[0][0])
    except Exception:
        sk_sim = 0.0

    # Key anchor overlap weighting: matching 2+ key informational terms indicates strong topical relevance
    anchor_score = (len(inter) / max(2, len(claim_words) * 0.55)) if len(inter) >= 2 else coverage

    sim_val = max(sk_sim * 1.25, coverage * 0.95, anchor_score * 0.85)
    return min(1.0, max(0.0, sim_val))

def filter_evidence_by_relevance(
    claim_text: str, 
    evidence_items: List[Dict[str, Any]], 
    threshold: float = 0.40,
    claim_entities: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Evaluates each evidence item against the claim.
    Filters out items with similarity < threshold.
    For live web search snippets, relaxes floor to 0.32 or applies a hybrid entity overlap check.
    MUST be executed BEFORE Stance Detection.
    """
    passed_items = []
    rejected_items = []
    
    # Extract entity tokens from claim
    entity_tokens = set()
    if claim_entities:
        for key in ["organizations", "locations", "dates_or_numbers", "key_concepts"]:
            for item_val in claim_entities.get(key, []):
                for tok in str(item_val).lower().split():
                    if len(tok) > 2:
                        entity_tokens.add(tok)
                        
    claim_words = set(re.findall(r"\b\w{3,}\b", claim_text.lower()))
    
    for item in evidence_items:
        content_to_check = f"{item.get('title', '')} {item.get('snippet', '')}"
        sim_score = compute_similarity(claim_text, content_to_check)
        
        is_live_search = item.get("source_type") in ["web_search", "live_search", "breaking_news"] or item.get("is_live_web_search", False)
        
        # If item has an authoritatively annotated relevance score (e.g. from curated DB / ClaimReview), blend it
        if not is_live_search and item.get("relevance_score") is not None:
            sim_score = max(sim_score, float(item["relevance_score"]))
        
        # NLP Relevance Gate Rule: For live web search snippets, lower semantic floor from 0.40 to 0.32
        effective_threshold = 0.32 if is_live_search else threshold
        
        # Hybrid token/entity-overlap check (Rule 8 Soft-Grace):
        # If token intersection ratio >= 0.25 with claim keywords or named entities, pass relevance gate
        snippet_tokens = set(re.findall(r"\b\w{3,}\b", content_to_check.lower()))
        entity_overlap_ratio = 0.0
        passes_entity_overlap = False
        
        target_tokens = entity_tokens if entity_tokens else (claim_words - {"the", "and", "for", "with", "that", "this", "from", "have", "has", "about", "claim", "viral", "video", "photos", "alert", "news"})
        if is_live_search and target_tokens and snippet_tokens:
            overlap = target_tokens.intersection(snippet_tokens)
            entity_overlap_ratio = len(overlap) / max(1, len(target_tokens))
            if entity_overlap_ratio >= 0.25 and sim_score >= 0.18:
                passes_entity_overlap = True
        
        item_copy = dict(item)
        item_copy["computed_relevance"] = round(sim_score, 3)
        item_copy["entity_overlap_ratio"] = round(entity_overlap_ratio, 3)
        if is_live_search:
            item_copy["is_live_web_search"] = True
            
        if sim_score >= effective_threshold or passes_entity_overlap:
            passed_items.append(item_copy)
        else:
            rejected_items.append(item_copy)
            
    return {
        "threshold": threshold,
        "total_evaluated": len(evidence_items),
        "passed_count": len(passed_items),
        "rejected_count": len(rejected_items),
        "valid_evidence": passed_items,
        "rejected_evidence": rejected_items
    }
