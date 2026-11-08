export interface Citation {
  tag: string;
  title?: string;
  source?: string;
  domain?: string;
  stance?: string;
  trust_score?: number;
}

export interface EvidenceItem {
  id: string;
  citation_tag?: string;
  source: string;
  domain: string;
  url: string;
  title: string;
  snippet: string;
  author?: string;
  source_type: string;
  published_date?: string;
  domain_trust: number;
  trust_tier?: string;
  trust_category?: string;
  trust_justification?: string;
  stance: 'Supports' | 'Contradicts' | 'Neutral';
  stance_confidence?: number;
  stance_method?: string;
  computed_relevance?: number;
  relevance_score?: number;
  is_live_web_search?: boolean;
}

export interface InsufficientEvidenceOverride {
  triggered: boolean;
  soft_override?: boolean;
  live_web_search_context?: boolean;
  evidence_count: number;
  minimum_required: number;
  reason: string | null;
}

export interface VerdictData {
  final_verdict: 'Verified True' | 'Mostly True' | 'Half True / Mixed' | 'Mostly False' | 'False / Fabricated' | 'Unverified';
  calculated_verdict: string;
  meter_zone: number;
  meter_scale: string[];
  color_code: string;
  ensemble_score: number;
  confidence_percentage: number;
  insufficient_evidence_override: InsufficientEvidenceOverride;
  formula_weights: {
    evidence: number;
    style: number;
    image: number;
  };
  component_scores: {
    evidence_stance_score: number;
    stylistic_classifier_score: number;
    image_authenticity_score: number | null;
  };
  evidence_breakdown: {
    supports: number;
    contradicts: number;
    neutral: number;
  };
}

export interface ImageForensics {
  is_valid_image: boolean;
  phash: string;
  dhash: string;
  ahash: string;
  image_dimensions?: string;
  closest_match: {
    matched_id: string;
    title: string;
    category: string;
    distance: number;
    notes: string;
  } | null;
  hamming_distance: number | null;
  status_label: string;
  authenticity_score: number;
  explanation: string;
}

export interface OCRDetails {
  success: boolean;
  text: string;
  confidence: number;
  is_empty_or_garbage: boolean;
  validation_message: string;
  metadata?: {
    original_width: number;
    original_height: number;
    estimated_skew_angle: number;
    preprocessed: boolean;
  };
}

export interface StylisticSignals {
  stylistic_credibility_score: number;
  predicted_label: string;
  class_probabilities: Record<string, number>;
  active_stylistic_tokens: string[];
  model_info: {
    benchmark: string;
    vectorizer_vocabulary_size: number;
    model_version: string;
  };
}

export interface ExplanationData {
  verdict_headline: string;
  executive_summary: string;
  editorial_body: string;
  citations: Citation[];
  key_takeaways: string[];
}

export interface VerificationResponse {
  success: boolean;
  check_id: string;
  input_mode: string;
  claim: {
    raw_input: string;
    canonical_claim: string;
    entities: {
      organizations: string[];
      locations: string[];
      dates_or_numbers: string[];
      key_concepts: string[];
    };
    search_keywords: string[];
    translation: {
      original_text: string;
      translated_text: string;
      detected_language: string;
      is_translated: boolean;
    };
  };
  image_forensics: ImageForensics | null;
  ocr_details: OCRDetails | null;
  verdict: VerdictData;
  explanation: ExplanationData;
  evidence: {
    total_retrieved: number;
    passed_relevance_gate: number;
    rejected_by_relevance_gate: number;
    items: EvidenceItem[];
    rejected_items: any[];
    used_offline_fallback: boolean;
  };
  stylistic_signals: StylisticSignals;
  pipeline_stages_completed: number;
}

export interface HistoryItem {
  id: string;
  input_type: string;
  claim: string;
  verdict: string;
  score: number;
  meter_zone: number;
  color_code: string;
  headline: string;
  summary: string;
  date: string;
  sources?: Array<{ name: string; url?: string; stance?: string }>;
}
