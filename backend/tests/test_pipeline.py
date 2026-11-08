"""
Comprehensive Pipeline Test Suite for VerifAI (ASG-04)
Tests all core features and checklist items:
1. Vectorizer persistence and inference consistency
2. Relevance gate execution & threshold filtering
3. Stance detection on gated evidence
4. Insufficient-evidence override rule
5. Multi-signal ensemble formula calculation
6. Image authenticity perceptual hashing
7. OCR error handling on empty/garbage input
8. Offline fallback dataset retrieval
9. End-to-end master verification flow
"""

import sys
import os
import unittest
import asyncio

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.stylistic_classifier import evaluate_stylistic_credibility, load_persisted_liar_model
from services.relevance_gate import filter_evidence_by_relevance
from services.stance_detector import analyze_evidence_stance
from services.verdict_aggregator import aggregate_verdict
from services.image_authenticity import analyze_image_authenticity
from services.ocr_service import preprocess_and_ocr, extract_text_from_image
from services.evidence_retriever import retrieve_evidence
from services.explanation_generator import generate_editorial_explanation

class TestVerifAIPipeline(unittest.TestCase):
    
    def test_01_vectorizer_persistence(self):
        """Checklist Item: Vectorizer persistence verified — same fitted TfidfVectorizer used."""
        bundle = load_persisted_liar_model()
        self.assertIn("vectorizer", bundle)
        self.assertIn("classifier", bundle)
        self.assertTrue(hasattr(bundle["vectorizer"], "transform"))
        
        # Test evaluation on true and fake statements
        res_true = evaluate_stylistic_credibility("The James Webb Space Telescope observed galaxy JADES-GS-z14-0.")
        res_fake = evaluate_stylistic_credibility("Drinking boiled garlic water cures coronavirus in 24 hours.")
        
        self.assertGreater(res_true["stylistic_credibility_score"], res_fake["stylistic_credibility_score"])
        print("[PASS] Test 1: Vectorizer persistence verified and functional.")

    def test_02_relevance_gate_before_stance(self):
        """Checklist Item: Relevance gate (5) confirmed to filter out noise before stance."""
        claim = "NASA observed the oldest galaxy 290 million years post-Big Bang."
        evidence_items = [
            {"title": "Webb telescope spots earliest known galaxy", "snippet": "Spectroscopic confirmation of JADES-GS-z14-0 dating to 290M years."},
            {"title": "Best chocolate chip cookie recipe", "snippet": "Bake cookies at 375 degrees with brown sugar and vanilla butter."}
        ]
        
        gated = filter_evidence_by_relevance(claim, evidence_items, threshold=0.40)
        self.assertEqual(gated["passed_count"], 1)
        self.assertEqual(gated["rejected_count"], 1)
        self.assertIn("earliest known galaxy", gated["valid_evidence"][0]["title"])
        print("[PASS] Test 2: Relevance gate correctly filters irrelevant items.")

    def test_03_insufficient_evidence_override(self):
        """Checklist Item: Insufficient-evidence rule (10) tested — confirm it overrides score."""
        # 1 single evidence item that claims "Supports"
        sparse_evidence = [
            {"title": "Single blog post", "snippet": "Alien signals detected", "stance": "Supports", "domain_trust": 0.3, "relevance_score": 0.8}
        ]
        # Even with high stylistic score 0.95
        res = aggregate_verdict(valid_evidence=sparse_evidence, stylistic_score=0.95, has_image=False)
        self.assertEqual(res["final_verdict"], "Unverified")
        self.assertTrue(res["insufficient_evidence_override"]["triggered"])
        self.assertEqual(res["meter_zone"], 0)
        print("[PASS] Test 3: Insufficient-evidence rule successfully overrides ensemble to 'Unverified'.")

    def test_04_ensemble_formula_math(self):
        """Checklist Item: Ensemble weights (12) documented and justified."""
        # Provide 2 solid supporting evidence pieces
        solid_evidence = [
            {"stance": "Supports", "domain_trust": 1.0, "computed_relevance": 0.9},
            {"stance": "Supports", "domain_trust": 0.98, "computed_relevance": 0.9}
        ]
        res = aggregate_verdict(
            valid_evidence=solid_evidence, 
            stylistic_score=0.90, 
            image_authenticity_score=0.95, 
            has_image=True
        )
        # Expected: 0.5 * 1.0 + 0.3 * 0.90 + 0.2 * 0.95 = 0.5 + 0.27 + 0.19 = 0.96
        self.assertAlmostEqual(res["ensemble_score"], 0.96, delta=0.03)
        self.assertEqual(res["final_verdict"], "Verified True")
        self.assertEqual(res["meter_zone"], 5)
        print("[PASS] Test 4: Weighted ensemble formula accurately verified.")

    def test_05_image_authenticity_phash(self):
        """Checklist Item: Image hash reference set populated and verified."""
        ref_path = os.path.join(os.path.dirname(__file__), "..", "data", "reference_images", "boiled_garlic_cure_hoax.png")
        if os.path.exists(ref_path):
            with open(ref_path, "rb") as f:
                img_bytes = f.read()
            res = analyze_image_authenticity(img_bytes)
            self.assertTrue(res["is_valid_image"])
            self.assertIsNotNone(res["closest_match"])
            self.assertEqual(res["status_label"], "Known Manipulated / Hoax Visual")
            self.assertLessEqual(res["authenticity_score"], 0.20)
            print("[PASS] Test 5: Image perceptual hashing identifies known hoax image.")

    def test_06_ocr_empty_garbage_handling(self):
        """Checklist Item: OCR multi-pass resilience & smart layout fallback verified (zero-crash)."""
        from PIL import Image
        import io
        # Create pure white blank image
        blank_img = Image.new("RGB", (100, 100), color=(255, 255, 255))
        buf = io.BytesIO()
        blank_img.save(buf, format="PNG")
        res = preprocess_and_ocr(buf.getvalue())
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "Visual Fallback Active")
        self.assertEqual(res["text"], "Visual attachment analysis: cross-referencing visual metadata and regional news feeds.")
        self.assertEqual(res["confidence"], 40.0)
        self.assertTrue(res["fallback_triggered"])
        print("[PASS] Test 6: OCR resilient fallback gracefully handles empty/noise visual media with zero crash.")

    def test_07_offline_fallback_retrieval(self):
        """Checklist Item: Offline fallback dataset tested end-to-end."""
        res = asyncio.run(
            retrieve_evidence(
                claim_text="Chandrayaan-3 Moon landing lunar south pole",
                search_query="chandrayaan south pole",
                search_keywords=["chandrayaan", "moon", "south"]
            )
        )
        self.assertGreater(res["total_retrieved"], 0)
        self.assertTrue(any("isro" in item.get("domain", "").lower() for item in res["evidence_items"]))
        print("[PASS] Test 7: Offline fallback dataset successfully retrieves corroborating records.")

    def test_08_evidence_citations_linking(self):
        """Checklist Item: Every verdict visibly traces back to cited evidence ([E1], [E2])."""
        sample_ev = [
            {"source": "NASA", "title": "Discovery", "snippet": "Found oldest galaxy", "stance": "Supports", "domain_trust": 1.0},
            {"source": "Reuters", "title": "Report", "snippet": "Astronomers confirm", "stance": "Supports", "domain_trust": 0.98}
        ]
        v_data = {
            "final_verdict": "Verified True",
            "ensemble_score": 0.94,
            "confidence_percentage": 94.0,
            "meter_zone": 5,
            "insufficient_evidence_override": {"triggered": False}
        }
        exp = generate_editorial_explanation("Galaxy discovered", v_data, sample_ev)
        self.assertIn("[E1]", exp["editorial_body"])
        self.assertIn("[E2]", exp["editorial_body"])
        self.assertEqual(len(exp["citations"]), 2)
        print("[PASS] Test 8: Editorial explanation links interactive [E1], [E2] citation tags.")

    def test_09_multimodal_vision_asset_classifier(self):
        """Checklist Item: Multimodal asset classifier & visual-to-search router."""
        from services.vision_service import classify_and_extract_visual_context
        from PIL import Image
        import io
        
        # Test 1: News screenshot simulation
        img_news = Image.new("RGB", (800, 1200), color=(240, 240, 240))
        buf_news = io.BytesIO()
        img_news.save(buf_news, format="PNG")
        res_news = classify_and_extract_visual_context(buf_news.getvalue(), "BREAKING NEWS: Reuters reports new scientific discovery")
        self.assertIn(res_news["asset_type"], ["screenshot_news", "infographic", "meme_humor", "raw_photo"])
        self.assertEqual(res_news["asset_type"], "screenshot_news")
        self.assertIn("fact check", res_news["search_intent_query"])
        
        # Test 2: Meme simulation
        res_meme = classify_and_extract_visual_context(buf_news.getvalue(), "POV: when you drink boiled garlic water for 24 hours")
        self.assertEqual(res_meme["asset_type"], "meme_humor")
        self.assertIn("parody", res_meme["search_intent_query"])
        print("[PASS] Test 9: Multimodal visual asset classifier & search router validated.")

    def test_10_json_serializer_guardrail(self):
        """Checklist Item: Universal NumPy / Pydantic JSON serialization sanitization."""
        import json
        import numpy as np
        from utils.serializer import clean_for_json
        
        mixed_data = {
            "float32": np.float32(0.987654),
            "float64": np.float64(1.234567),
            "int64": np.int64(42),
            "ndarray": np.array([1.1, 2.2, 3.3], dtype=np.float32),
            "bool_": np.bool_(True),
            "nested": {
                "nan": float("nan"),
                "inf": float("inf"),
                "list": [np.int32(10), np.float64(20.5)]
            }
        }
        
        sanitized = clean_for_json(mixed_data)
        serialized = json.dumps(sanitized)
        deserialized = json.loads(serialized)
        
        self.assertEqual(deserialized["int64"], 42)
        self.assertTrue(deserialized["bool_"])
        self.assertEqual(deserialized["ndarray"], [1.1, 2.2, 3.3])
        self.assertIsNone(deserialized["nested"]["nan"])
        self.assertIsNone(deserialized["nested"]["inf"])
        self.assertEqual(deserialized["nested"]["list"], [10, 20.5])
        print("[PASS] Test 10: Universal JSON serializer guardrail handles complex NumPy types cleanly.")

    def test_11_live_rag_grounded_contradiction_detection(self):
        """Checklist Item: Real-Time Live RAG / Web-Grounded Fact-Check Pipeline (ASG-04)."""
        claim = "Thalapathy Vijay became Prime Minister of India"
        evidence_items = [
            {
                "title": "Hindustan Times: TVK MLA sparks prime minister pitch row",
                "snippet": "Narendra Modi is the current Prime Minister of India. Actor Vijay leads Tamilaga Vettri Kazhagam (TVK) in Tamil Nadu politics.",
                "source": "Hindustan Times",
                "domain": "hindustantimes.com",
                "domain_trust": 0.92,
                "relevance_score": 0.85,
                "is_live_web_search": True
            }
        ]
        gated = filter_evidence_by_relevance(claim, evidence_items, threshold=0.40)
        self.assertGreaterEqual(gated["passed_count"], 1)
        
        annotated = analyze_evidence_stance(claim, gated["valid_evidence"])
        self.assertEqual(annotated[0]["stance"], "Contradicts")
        
        style = evaluate_stylistic_credibility(claim)
        verdict = aggregate_verdict(annotated, style["stylistic_credibility_score"], None, False, evidence_items)
        self.assertEqual(verdict["final_verdict"], "False / Fabricated")
        self.assertLessEqual(verdict["ensemble_score"], 0.25)
        self.assertEqual(verdict["meter_zone"], 1)
        print("[PASS] Test 11: Real-Time Live RAG grounded contradiction detection accurately flags absurd claims as False / Fabricated.")

if __name__ == "__main__":
    unittest.main()
