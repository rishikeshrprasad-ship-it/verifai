"""
Comprehensive Verification Test Suite for VerifAI (ASG-04)
Tests benchmark claims, real-time live search expansion, and insufficient evidence safety guardrails.
"""

import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import traceback
from services.claim_extractor import extract_claim
from services.evidence_retriever import retrieve_evidence
from services.relevance_gate import filter_evidence_by_relevance
from services.credibility_scorer import evaluate_source_credibility
from services.stance_detector import analyze_evidence_stance
from services.stylistic_classifier import evaluate_stylistic_credibility
from services.verdict_aggregator import aggregate_verdict
from services.explanation_generator import generate_editorial_explanation

async def run_pipeline_test(claim_text: str):
    print(f"\n==================================================")
    print(f"Testing Claim: \"{claim_text}\"")
    print(f"==================================================")
    
    # 1. Claim & Entity Extraction
    claim_info = extract_claim(claim_text)
    canonical = claim_info["canonical_claim"]
    print(f"[Stage 2] Canonical Claim: {canonical}")
    print(f"[Stage 2] Keywords: {claim_info['search_keywords']}")
    
    # 2. Parallel Evidence Retrieval
    retrieval = await retrieve_evidence(
        claim_text=canonical,
        search_query=claim_info["search_query"],
        search_keywords=claim_info["search_keywords"],
        entities=claim_info.get("entities")
    )
    raw_ev = retrieval["evidence_items"]
    print(f"[Stage 4] Retrieved: {retrieval['total_retrieved']} items (Live: {retrieval['used_live_web_search']}, Offline: {retrieval['used_offline_fallback']})")
    
    # 3. Relevance Gate
    relevance = filter_evidence_by_relevance(canonical, raw_ev, 0.40, claim_info.get("entities"))
    passed_ev = relevance["valid_evidence"]
    print(f"[Stage 5] Passed Relevance: {len(passed_ev)} / {len(raw_ev)}")
    for ev in passed_ev:
        print(f"   -> [{ev.get('source', 'Src')}] {ev.get('title', '')[:50]} (Rel: {ev.get('computed_relevance')}, Live: {ev.get('is_live_web_search', False)})")
        
    # 4. Credibility & Stance
    for item in passed_ev:
        cred = evaluate_source_credibility(item.get("domain", ""))
        item["domain_trust"] = cred["trust_score"]
        item["trust_tier"] = cred["tier"]
        
    annotated_ev = analyze_evidence_stance(canonical, passed_ev)
    for idx, ev in enumerate(annotated_ev, 1):
        ev["citation_tag"] = f"[E{idx}]"
        
    # 5. Stylistic Classifier
    stylistic = evaluate_stylistic_credibility(canonical)
    style_score = stylistic["stylistic_credibility_score"]
    
    # 6. Ensemble Aggregation
    verdict = aggregate_verdict(
        valid_evidence=annotated_ev,
        stylistic_score=style_score,
        image_authenticity_score=None,
        has_image=False,
        all_retrieved_evidence=raw_ev
    )
    
    # 7. Explanation
    explanation = generate_editorial_explanation(
        claim_text=canonical,
        verdict_data=verdict,
        valid_evidence=annotated_ev,
        image_data=None
    )
    
    print(f"[Verdict] Final: {verdict['final_verdict']} | Score: {verdict['ensemble_score']} | Zone: {verdict['meter_zone']}/5")
    print(f"[Verdict] Override: {verdict['insufficient_evidence_override']}")
    print(f"[Headline] {explanation['verdict_headline']}")
    return verdict

async def main():
    test_cases = [
        "The James Webb Space Telescope has discovered the oldest known galaxy in the universe, dating back to 290 million years after the Big Bang.",
        "Drinking a bowl of freshly boiled garlic water cures coronavirus infection within 24 hours.",
        "The European Union has announced an immediate, total ban on all petrol and diesel cars starting in 2025.",
        "Google's Sycamore quantum processor performed in 200 seconds a computation that would take the world's fastest classical supercomputer 10,000 years.",
        "An obscure private radio station in Patagonia received continuous alien radio transmissions every Thursday during 1942.",
        "DeepSeek releases open source AI reasoning model"
    ]
    
    for case in test_cases:
        try:
            await run_pipeline_test(case)
        except Exception as e:
            print(f"Error on claim '{case}': {e}")
            traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
