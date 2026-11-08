"""
Stage 9 & 10: Verdict Aggregation & Insufficient-Evidence Override Service
Combines evidence stance, stylistic classifier score, and image authenticity score
using a documented, explainable weighted ensemble formula.
Applies the hard insufficient-evidence override rule (< 2 valid sources -> Unverified).
"""

from typing import List, Dict, Any, Optional

def compute_evidence_stance_score(valid_evidence: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes weighted stance score across all relevance-gated evidence pieces.
    Weight per item = domain_trust * relevance.
    Stance numerical values: Supports = 1.0, Neutral = 0.5, Contradicts = 0.0.
    """
    if not valid_evidence:
        return {
            "evidence_score": 0.5,
            "supports_count": 0,
            "contradicts_count": 0,
            "neutral_count": 0,
            "weighted_support_ratio": 0.5
        }
        
    total_weight = 0.0
    weighted_sum = 0.0
    supports_count = 0
    contradicts_count = 0
    neutral_count = 0
    
    for item in valid_evidence:
        stance = item.get("stance", "Neutral")
        trust = item.get("domain_trust", 0.6)
        relevance = item.get("computed_relevance", item.get("relevance_score", 0.7))
        
        weight = trust * relevance
        total_weight += weight
        
        if stance == "Supports":
            val = 1.0
            supports_count += 1
        elif stance == "Contradicts":
            val = 0.0
            contradicts_count += 1
        else: # Neutral
            val = 0.5
            neutral_count += 1
            
        weighted_sum += weight * val
        
    score = (weighted_sum / total_weight) if total_weight > 0 else 0.5
    
    return {
        "evidence_score": round(score, 3),
        "supports_count": supports_count,
        "contradicts_count": contradicts_count,
        "neutral_count": neutral_count,
        "total_weight": round(total_weight, 3),
        "weighted_support_ratio": round(score, 3)
    }

def aggregate_verdict(
    valid_evidence: List[Dict[str, Any]],
    stylistic_score: float,
    image_authenticity_score: Optional[float] = None,
    has_image: bool = False,
    all_retrieved_evidence: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Aggregates verdict using weighted multi-signal ensemble and applies
    the Insufficient-Evidence Override Rule with Breaking News Grace for live web search.
    
    Governing Principle:
    Evidence retrieval is the primary driver (50%).
    Stylistic and Image checks are supporting signals (30% and 20%).
    """
    evidence_meta = compute_evidence_stance_score(valid_evidence)
    s_evidence = evidence_meta["evidence_score"]
    s_style = max(0.0, min(1.0, stylistic_score))
    
    # Check if image signal is present
    if has_image and image_authenticity_score is not None:
        s_image = max(0.0, min(1.0, image_authenticity_score))
        weights = {"evidence": 0.50, "style": 0.30, "image": 0.20}
        ensemble_score = (
            (weights["evidence"] * s_evidence) +
            (weights["style"] * s_style) +
            (weights["image"] * s_image)
        )
    else:
        # Re-normalize for text-only input
        s_image = None
        weights = {"evidence": 0.65, "style": 0.35, "image": 0.0}
        ensemble_score = (
            (weights["evidence"] * s_evidence) +
            (weights["style"] * s_style)
        )
        
    raw_ensemble_score = round(ensemble_score, 3)
    
    # Grounding Guard: When all evidence contradicts the claim, enforce False / Fabricated ceiling
    if evidence_meta["contradicts_count"] > 0 and evidence_meta["supports_count"] == 0:
        raw_ensemble_score = min(0.18, round(s_evidence * 0.5 + s_style * 0.15, 3))
    elif evidence_meta["contradicts_count"] > evidence_meta["supports_count"]:
        raw_ensemble_score = min(0.38, raw_ensemble_score)
        
    # 5-Stop PolitiFact Truth-O-Meter Scale:
    # 0.80 - 1.00 -> Verified True (Deep Green)
    # 0.65 - 0.79 -> Mostly True (Light Green / Olive)
    # 0.45 - 0.64 -> Half True / Mixed (Amber)
    # 0.25 - 0.44 -> Mostly False (Orange-Red)
    # 0.00 - 0.24 -> False / Fabricated (Deep Red)
    if raw_ensemble_score >= 0.80:
        calculated_verdict = "Verified True"
        meter_zone = 5
        color_code = "#15803d" # Deep Emerald
    elif raw_ensemble_score >= 0.65:
        calculated_verdict = "Mostly True"
        meter_zone = 4
        color_code = "#65a30d" # Olive
    elif raw_ensemble_score >= 0.45:
        calculated_verdict = "Half True / Mixed"
        meter_zone = 3
        color_code = "#d97706" # Amber
    elif raw_ensemble_score >= 0.25:
        calculated_verdict = "Mostly False"
        meter_zone = 2
        color_code = "#ea580c" # Orange-Red
    else:
        calculated_verdict = "False / Fabricated"
        meter_zone = 1
        color_code = "#b91c1c" # Crimson Deep Red
        
    # --- RULE 8: INSUFFICIENT-EVIDENCE OVERRIDE & BREAKING NEWS GRACE ---
    has_live_search = any(
        item.get("is_live_web_search") or item.get("source_type") in ["web_search", "live_search", "breaking_news"]
        for item in valid_evidence
    )
    
    # Check candidates for breaking news context
    pool_to_check = all_retrieved_evidence if all_retrieved_evidence is not None else valid_evidence
    matching_web_snippets = [
        item for item in pool_to_check
        if (item.get("is_live_web_search") or item.get("source_type") in ["web_search", "live_search", "breaking_news"])
        and (
            item.get("computed_relevance", item.get("relevance_score", 0.0)) >= 0.32
            or (item.get("computed_relevance", item.get("relevance_score", 0.0)) >= 0.25 and item.get("domain_trust", 0.0) >= 0.75)
        )
    ]
    
    is_overridden = False
    is_soft_override = False
    override_reason = None
    final_verdict = calculated_verdict
    
    if len(valid_evidence) < 2:
        # Breaking News Grace Rule:
        # If web search returned >= 2 contextually matching snippets or 1 verified + 1 live snippet,
        # allow soft-confidence aggregation instead of forcing hard "Unverified (Insufficient Corroboration)".
        if len(matching_web_snippets) >= 2 or (len(valid_evidence) >= 1 and len(matching_web_snippets) >= 1):
            is_soft_override = True
            is_overridden = False
            has_live_search = True
            
            # Calibrate soft confidence for live breaking news (bounds 45% - 85%)
            if raw_ensemble_score >= 0.70:
                final_verdict = "Mostly True"
                meter_zone = 4
                color_code = "#65a30d"
            elif raw_ensemble_score >= 0.45:
                final_verdict = "Half True / Mixed"
                meter_zone = 3
                color_code = "#d97706"
            elif raw_ensemble_score >= 0.25:
                final_verdict = "Mostly False"
                meter_zone = 2
                color_code = "#ea580c"
            else:
                final_verdict = "False / Fabricated"
                meter_zone = 1
                color_code = "#b91c1c"
                
            override_reason = (
                f"Live Web Search Context Active: Corroborated with {len(matching_web_snippets)} real-time web source(s). "
                f"Soft-confidence aggregation enabled for active breaking news coverage."
            )
        else:
            is_overridden = True
            final_verdict = "Unverified"
            override_reason = (
                f"Insufficient Evidence Override Triggered: Only {len(valid_evidence)} valid evidence "
                f"piece(s) passed the relevance threshold (minimum required is 2). "
                f"Calculated mathematical score ({raw_ensemble_score}) overridden to protect against unsubstantiated calls."
            )
            meter_zone = 0
            color_code = "#64748b" # Neutral Slate
            
    return {
        "final_verdict": final_verdict,
        "calculated_verdict": calculated_verdict,
        "meter_zone": meter_zone,
        "meter_scale": ["Unverified", "False / Fabricated", "Mostly False", "Half True / Mixed", "Mostly True", "Verified True"],
        "color_code": color_code,
        "ensemble_score": raw_ensemble_score,
        "confidence_percentage": round(raw_ensemble_score * 100, 1),
        "insufficient_evidence_override": {
            "triggered": is_overridden,
            "soft_override": is_soft_override,
            "live_web_search_context": has_live_search or is_soft_override,
            "evidence_count": len(valid_evidence),
            "minimum_required": 2,
            "reason": override_reason
        },
        "formula_weights": weights,
        "component_scores": {
            "evidence_stance_score": s_evidence,
            "stylistic_classifier_score": s_style,
            "image_authenticity_score": s_image
        },
        "evidence_breakdown": {
            "supports": evidence_meta["supports_count"],
            "contradicts": evidence_meta["contradicts_count"],
            "neutral": evidence_meta["neutral_count"]
        }
    }
