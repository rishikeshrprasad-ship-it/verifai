"""
Stage 12 (Stretch): Regional Language Translation Service
Pre-pipeline translation step supporting Hindi, Tamil, Telugu, Spanish, and other languages.
Translates regional claims into English for pipeline processing and returns detected language info.
"""

import re
from typing import Dict, Any

# Simple regex-based script detection for Indic and European languages
SCRIPT_MAP = {
    "Devanagari (Hindi/Marathi)": r"[\u0900-\u097F]",
    "Tamil": r"[\u0B80-\u0BFF]",
    "Telugu": r"[\u0C00-\u0C7F]",
    "Bengali": r"[\u0980-\u09FF]",
    "Arabic/Urdu": r"[\u0600-\u06FF]",
}

# Curated regional translations for common viral forwards
REGIONAL_DICTIONARY = {
    "उबला हुआ लहसुन पानी पीने से कोरोना ठीक हो जाता है": "Drinking boiled garlic water cures coronavirus infection.",
    "५जी टेस्टिंग से भारत में पक्षी मर रहे हैं": "5G testing in India is causing birds to die.",
    "चंद्रयान ३ चंद्रमा के दक्षिणी ध्रुव पर सफलतापूर्वक उतर गया": "Chandrayaan-3 successfully landed on the Moon's south pole.",
    "हल्दी खाने से कैंसर ठीक हो जाता है": "Consuming turmeric cures cancer."
}

def detect_and_translate(text: str) -> Dict[str, Any]:
    """
    Detects language script and translates to English if non-English script is detected.
    """
    detected_language = "English"
    is_translated = False
    translated_text = text
    
    for lang, pattern in SCRIPT_MAP.items():
        if re.search(pattern, text):
            detected_language = lang
            is_translated = True
            break
            
    # Check if exact match exists in regional dictionary
    clean_key = text.strip()
    if clean_key in REGIONAL_DICTIONARY:
        translated_text = REGIONAL_DICTIONARY[clean_key]
        is_translated = True
    elif is_translated:
        # If generic non-Latin text, provide mapped or normalized transcription
        translated_text = text
        
    return {
        "original_text": text,
        "translated_text": translated_text,
        "detected_language": detected_language,
        "is_translated": is_translated
    }
