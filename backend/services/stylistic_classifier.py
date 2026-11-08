"""
Stage 8: Stylistic Credibility Classifier Service
Loads the persisted LIAR benchmark model and exact fitted TfidfVectorizer (via joblib)
to evaluate linguistic and stylistic signals of truthfulness vs sensationalist fabrication.
"""

import os
import joblib
from typing import Dict, Any

_MODEL_BUNDLE = None

def load_persisted_liar_model():
    """Loads the joblib payload containing the fitted vectorizer and trained classifier."""
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is None:
        model_path = os.path.join(
            os.path.dirname(__file__), "..", "models", "liar_classifier.joblib"
        )
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Persisted model not found at {model_path}. Run train_liar_classifier.py first.")
        _MODEL_BUNDLE = joblib.load(model_path)
    return _MODEL_BUNDLE

def evaluate_stylistic_credibility(claim_text: str) -> Dict[str, Any]:
    """
    Evaluates stylistic credibility using the persisted TfidfVectorizer and LogisticRegression model.
    Returns:
      - stylistic_credibility_score: 0.0 (high sensationalist hoax style) to 1.0 (authoritative journalistic style)
      - predicted_label: 'true' | 'half-true' | 'false'
      - class_probabilities: probability breakdown
      - top_stylistic_features: key n-grams identified
      - model_metadata
    """
    bundle = load_persisted_liar_model()
    vectorizer = bundle["vectorizer"]
    classifier = bundle["classifier"]
    classes = bundle["classes"]
    
    # Vectorize input using EXACT same fitted TfidfVectorizer
    X_vec = vectorizer.transform([claim_text])
    
    probabilities = classifier.predict_proba(X_vec)[0]
    prob_dict = {cls_name: round(float(prob), 4) for cls_name, prob in zip(classes, probabilities)}
    
    # Calculate continuous stylistic score:
    # 'true' contributes 1.0, 'half-true' contributes 0.5, 'false' contributes 0.0
    p_true = prob_dict.get("true", 0.0)
    p_half = prob_dict.get("half-true", 0.0)
    p_false = prob_dict.get("false", 0.0)
    
    stylistic_score = (p_true * 1.0) + (p_half * 0.5) + (p_false * 0.0)
    stylistic_score = max(0.05, min(0.98, stylistic_score))
    
    # Extract top active n-grams for transparency
    feature_names = vectorizer.get_feature_names_out()
    non_zero_indices = X_vec.nonzero()[1]
    active_tokens = [feature_names[i] for i in non_zero_indices][:6]
    
    # Class with highest probability
    top_label = classes[probabilities.argmax()]
    
    return {
        "stylistic_credibility_score": round(float(stylistic_score), 3),
        "predicted_label": top_label,
        "class_probabilities": prob_dict,
        "active_stylistic_tokens": active_tokens,
        "model_info": {
            "benchmark": bundle.get("benchmark", "LIAR"),
            "vectorizer_vocabulary_size": bundle.get("feature_count", len(feature_names)),
            "model_version": bundle.get("version", "1.0.0")
        }
    }
