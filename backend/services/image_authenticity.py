"""
Stage 3: Image Authenticity & Perceptual Hashing Service
Computes perceptual hashes (pHash, dHash, aHash) and compares them against
a populated reference image index of known verified and manipulated media.
"""

import os
import io
import json
from typing import Dict, Any, Optional
from PIL import Image
import imagehash

def load_reference_registry() -> list:
    registry_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "reference_images", "reference_hashes.json"
    )
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def analyze_image_authenticity(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyzes an image using perceptual hashing against known verified/hoax registries.
    Returns:
      - phash, dhash, ahash
      - closest_reference_match (if any)
      - hamming_distance
      - authenticity_status: 'verified_authentic' | 'known_hoax_or_manipulated' | 'unindexed_clean' | 'suspicious'
      - authenticity_score: 0.0 (debunked hoax) to 1.0 (verified authentic)
      - notes
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
        # Re-open because verify() consumes image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return {
            "is_valid_image": False,
            "error": f"Invalid image file: {str(e)}",
            "authenticity_score": 0.5,
            "status": "error"
        }
        
    phash_obj = imagehash.phash(img)
    dhash_obj = imagehash.dhash(img)
    ahash_obj = imagehash.average_hash(img)
    
    phash_str = str(phash_obj)
    dhash_str = str(dhash_obj)
    ahash_str = str(ahash_obj)
    
    reference_items = load_reference_registry()
    
    closest_item = None
    min_distance = 999
    
    for ref in reference_items:
        try:
            ref_phash = imagehash.hex_to_hash(ref["phash"])
            dist = phash_obj - ref_phash
            if dist < min_distance:
                min_distance = dist
                closest_item = ref
        except Exception:
            continue
            
    # Threshold for perceptual hash match in 64-bit hash is typically distance <= 12
    is_match = (closest_item is not None) and (min_distance <= 12)
    
    if is_match and closest_item is not None:
        status_code = closest_item.get("authenticity_status", "unknown")
        if status_code == "authentic":
            score = 0.95
            status_label = "Verified Authentic Media"
            explanation = f"Exact or near perceptual match with official archive record '{closest_item['title']}' (Hamming distance {min_distance})."
        elif status_code in ["debunked_hoax", "manipulated"]:
            score = 0.10
            status_label = "Known Manipulated / Hoax Visual"
            explanation = f"Image fingerprint matches known debunked hoax entry '{closest_item['title']}'. Evidence indicates visual manipulation."
        else: # recycled_out_of_context
            score = 0.30
            status_label = "Recycled / Out-of-Context Media"
            explanation = f"Image fingerprint matched historical media '{closest_item['title']}' recycled out of its original historical context."
            
        matched_data = {
            "matched_id": closest_item["id"],
            "title": closest_item["title"],
            "category": closest_item["category"],
            "distance": min_distance,
            "notes": closest_item.get("notes", "")
        }
    else:
        # No known match in the registry: unindexed image
        # Assess image resolution and standard variance
        w, h = img.size
        score = 0.70  # Neutral baseline for original user uploads
        status_label = "Unindexed Media (No Known Hoax Match)"
        explanation = f"Image hash {phash_str} does not match any flagged manipulated visual in the reference index. Treated as unflagged original."
        matched_data = None
        
    return {
        "is_valid_image": True,
        "phash": phash_str,
        "dhash": dhash_str,
        "ahash": ahash_str,
        "image_dimensions": f"{img.size[0]}x{img.size[1]}",
        "closest_match": matched_data,
        "hamming_distance": min_distance if is_match else None,
        "status_label": status_label,
        "authenticity_score": round(score, 2),
        "explanation": explanation
    }
