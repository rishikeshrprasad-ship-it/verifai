"""
Stage 0.5: Multimodal Asset Type Classifier & Visual-to-Search Router (ASG-04 FUSIONX 1.0)
Classifies uploaded visual assets into:
- screenshot_news (News Mastheads, Social Media Screenshots, Breaking Chyrons)
- meme_humor (Viral Memes, Parody Formats, Split Panels, Impact Quotes)
- infographic (Charts, Statistical Diagrams, Comparative Overviews)
- raw_photo (Field Captures, Unprocessed Photos, Direct Camera Shots)

Extracts visual layout characteristics and synthesizes high-precision search intent queries for DuckDuckGo.
"""

import re
import cv2
import numpy as np
from typing import Dict, Any, List, Optional

# Keyword lexicons for classification heuristics
NEWS_KEYWORDS = [
    "breaking", "live updates", "reuters", "bbc", "cnn", "ap news", "times",
    "the guardian", "official statement", "press release", "news alert",
    "report", "spokesperson", "retweet", "rt @", "verified", "headline",
    "minister", "president", "police", "court", "investigation"
]

MEME_KEYWORDS = [
    "when you", "pov:", "nobody:", "me trying to", "caption this", "bruh",
    "mfw", "my face when", "bottom text", "top text", "literally me",
    "bro really", "wait for it", "tag a friend", "relatable", "mood"
]

INFOGRAPHIC_KEYWORDS = [
    "source:", "data:", "chart", "percent", "infographic", "figure", "table",
    "statistics", "survey", "growth", "annual report", "index", "ranking",
    "comparison", "million", "billion", "rate"
]

def classify_and_extract_visual_context(
    image_bytes: bytes,
    ocr_text: str = ""
) -> Dict[str, Any]:
    """
    Multimodal Asset Classifier & Search Intent Constructor:
    1. Evaluates image dimensions, edge density, color variance, and layout regions.
    2. Combines CV layout features with OCR semantic tokens.
    3. Categorizes asset into screenshot_news | meme_humor | infographic | raw_photo.
    4. Generates a targeted search intent query for live web investigation.
    """
    cleaned_ocr = (ocr_text or "").strip()
    text_lower = cleaned_ocr.lower()
    
    # Defaults
    aspect_ratio = 1.0
    edge_density = 0.05
    color_saturation_mean = 50.0
    val_std = 40.0
    has_top_banner = False
    has_bottom_caption = False
    is_valid_image = False
    
    if image_bytes and isinstance(image_bytes, (bytes, bytearray)):
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is not None and img.size > 0:
                is_valid_image = True
                h, w = img.shape[:2]
                aspect_ratio = round(float(w) / max(1.0, float(h)), 3)
                
                # Grayscale for edge analysis
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                edges = cv2.Canny(gray, 50, 150)
                edge_density = round(float(np.count_nonzero(edges)) / max(1.0, float(h * w)), 4)
                
                # HSV for color saturation and lighting distribution
                hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
                color_saturation_mean = round(float(np.mean(hsv[:, :, 1])), 2)
                val_std = round(float(np.std(hsv[:, :, 2])), 2)
                
                # Check top banner & bottom chyron edge concentrations
                if h > 60:
                    top_edges = np.count_nonzero(edges[0:int(h * 0.25), :])
                    bot_edges = np.count_nonzero(edges[int(h * 0.75):h, :])
                    area_quarter = (h * 0.25) * w
                    if area_quarter > 0:
                        has_top_banner = (top_edges / area_quarter) > 0.08
                        has_bottom_caption = (bot_edges / area_quarter) > 0.08
        except Exception:
            pass

    # Score categories
    news_score = 0.0
    meme_score = 0.0
    infographic_score = 0.0
    photo_score = 0.0
    
    # 1. OCR Keyword signals
    for kw in NEWS_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
            news_score += 1.5
            
    for kw in MEME_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
            meme_score += 2.0
            
    for kw in INFOGRAPHIC_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
            infographic_score += 1.5

    # 2. Computer Vision Layout signals
    word_count = len(re.findall(r"\b\w+\b", cleaned_ocr))
    
    if word_count > 15:
        if has_top_banner:
            news_score += 1.5
        if edge_density > 0.10:
            infographic_score += 1.0
        else:
            news_score += 0.8
    elif word_count > 0:
        if has_top_banner or has_bottom_caption:
            meme_score += 1.2
        if color_saturation_mean > 60:
            meme_score += 0.8
    else:
        # Zero or minimal text
        photo_score += 2.0
        if color_saturation_mean > 40 and edge_density < 0.08:
            photo_score += 1.5

    # Aspect ratio heuristics
    if aspect_ratio < 0.75: # Tall vertical screenshot or mobile social post
        news_score += 0.8
        infographic_score += 0.5
    elif 0.9 <= aspect_ratio <= 1.1: # Square (often Instagram / Meme format)
        meme_score += 0.8
    elif aspect_ratio > 1.6: # Wide landscape (often news video frame or chyron)
        news_score += 0.6
        photo_score += 0.4

    # Determine winning category
    scores = {
        "screenshot_news": news_score,
        "meme_humor": meme_score,
        "infographic": infographic_score,
        "raw_photo": photo_score
    }
    
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] == 0.0:
        # Default based on text presence
        best_cat = "screenshot_news" if word_count > 5 else "raw_photo"

    category_labels = {
        "screenshot_news": "News Masthead / Social Screenshot",
        "meme_humor": "Viral Meme / Parody Visual",
        "infographic": "Statistical Infographic / Chart",
        "raw_photo": "Raw Photographic Evidence / Field Capture"
    }

    # Extract core subject / entities for search
    stop_words = {"this", "that", "with", "from", "have", "been", "were", "will", "what", "when", "where", "about"}
    tokens = [t for t in re.findall(r"\b[A-Za-z0-9-]+\b", cleaned_ocr) if len(t) > 2 and t.lower() not in stop_words]
    subject_entity = " ".join(tokens[:5]) if tokens else "visual documentation"

    # Construct search intent query based on category
    if best_cat == "screenshot_news":
        search_intent_query = f"{subject_entity} news report fact check"
        implied_claim = f"News report screenshot asserting: {cleaned_ocr[:120]}" if cleaned_ocr else "Breaking news report screenshot"
    elif best_cat == "meme_humor":
        search_intent_query = f"{subject_entity} viral claim parody fact check"
        implied_claim = f"Viral meme/parody graphic claiming: {cleaned_ocr[:120]}" if cleaned_ocr else "Viral social meme assertion"
    elif best_cat == "infographic":
        search_intent_query = f"{subject_entity} official statistics data"
        implied_claim = f"Statistical infographic presenting data on: {cleaned_ocr[:120]}" if cleaned_ocr else "Statistical data visualization"
    else: # raw_photo
        search_intent_query = f"{subject_entity} original photograph context" if tokens else "photo authenticity verification"
        implied_claim = f"Photographic evidence submitted regarding: {cleaned_ocr[:120]}" if cleaned_ocr else "Uncaptioned photographic visual media"

    return {
        "asset_type": best_cat,
        "asset_type_label": category_labels[best_cat],
        "confidence": round(min(0.95, 0.60 + (scores[best_cat] * 0.08)), 2),
        "visual_characteristics": {
            "aspect_ratio": aspect_ratio,
            "edge_density": edge_density,
            "color_saturation_mean": color_saturation_mean,
            "value_std": val_std,
            "has_top_banner": has_top_banner,
            "has_bottom_caption": has_bottom_caption,
            "word_count": word_count
        },
        "search_intent_query": search_intent_query.strip(),
        "implied_claim_summary": implied_claim,
        "is_valid_image": is_valid_image
    }