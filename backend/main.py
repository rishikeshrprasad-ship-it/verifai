"""
VerifAI (ASG-04) — Master FastAPI Backend
Modular 13-stage misinformation detection & evidence retrieval pipeline.
Every stage is exposed as an independently testable endpoint.
"""

import os
import uuid
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

# Import services
from services.ocr_service import preprocess_and_ocr, extract_text_from_image
from services.claim_extractor import extract_claim
from services.image_authenticity import analyze_image_authenticity
from services.evidence_retriever import retrieve_evidence, load_offline_database, retrieve_free_live_evidence
from services.relevance_gate import filter_evidence_by_relevance
from services.credibility_scorer import evaluate_source_credibility
from services.stance_detector import analyze_evidence_stance
from services.stylistic_classifier import evaluate_stylistic_credibility
from services.verdict_aggregator import aggregate_verdict
from services.explanation_generator import generate_editorial_explanation
from services.translation_service import detect_and_translate
from services.vision_service import classify_and_extract_visual_context
from utils.serializer import clean_for_json, SafeJSONResponse
from db.database import init_db, save_verification, get_recent_history
from routers.news_hub import router as news_router, briefing_router


# Initialize DB
init_db()


app = FastAPI(
    title="VerifAI — Misinformation Detection & Evidence Retrieval API",
    version="1.0.0",
    description="ASG-04 Master Build for FUSIONX 1.0 (AI for Social Good Track)",
    default_response_class=SafeJSONResponse
)

app.include_router(news_router)
app.include_router(briefing_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Request / Response Models -----------------
class TextVerifyRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    claim_text: str
    input_mode: Optional[str] = "editorial" # 'editorial' | 'whatsapp'

class ClaimExtractRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    text: str

class RelevanceRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    claim: str
    evidence_items: List[dict]
    threshold: Optional[float] = 0.40

class StanceRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    claim: str
    evidence_items: List[dict]

class StylisticRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    claim: str

class AggregateRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    valid_evidence: List[dict]
    stylistic_score: float
    image_authenticity_score: Optional[float] = None
    has_image: Optional[bool] = False

# ----------------- Health & Info Endpoints -----------------
@app.get("/api/health")
def health_check():
    return clean_for_json({
        "status": "healthy",
        "service": "VerifAI ASG-04 Engine",
        "pipeline_stages_available": 13,
        "offline_database_ready": True
    })

@app.get("/api/offline-claims")
def get_sample_claims():
    """Returns curated demo claims for one-click testing in the UI."""
    claims = load_offline_database()
    return [
        {
            "id": c["id"],
            "title": c["text"],
            "category": c.get("category", "General"),
            "ground_truth": c.get("ground_truth", "Verified True"),
            "keywords": c.get("keywords", [])
        }
        for c in claims
    ]

@app.get("/api/history")
def get_history():
    """Returns past verification checks for the dashboard table."""
    return get_recent_history()

# ----------------- All-India Press Matrix & Broadsheet Spread API -----------------
@app.get("/api/directory/india-press/spread")
def get_india_press_spread(
    paper_id: Optional[str] = "hindu",
    page: Optional[int] = 1,
    state: Optional[str] = "National",
    language: Optional[str] = "English"
):
    """
    Hydrates tactile physical broadsheet newspaper spreads for All-India Press Matrix.
    Supports multi-state, multi-language pages with authentic front-page leads,
    op-eds, business spreads, and regional metro pulses.
    """
    from datetime import datetime
    today_str = datetime.now().strftime("%A, %d %B %Y")
    
    # Newspaper directory registry
    registry = {
        "hindu": {
            "name": "The Hindu", "native_name": "The Hindu", "lang": "English", "state": "National", "theme": "blue-950",
            "motto": "India's National Newspaper since 1878", "price": "₹6.00", "vol": "Vol. 147 • No. 218",
            "pages": [
                {
                    "page": 1, "section": "Front Page Lead Fold",
                    "lead": {
                        "headline": "Supreme Court stays controversial digital broadcast guidelines pending comprehensive constitutional review",
                        "deck": "Five-judge constitutional bench flags potential chilling effect on independent digital newsrooms and demands revised statutory safeguards.",
                        "byline": "Legal Affairs Bureau • New Delhi",
                        "image_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
                        "image_caption": "The Supreme Court of India constitution bench presiding over the landmark digital media petition hearings.",
                        "body_columns": [
                            "In a significant judicial development for press freedom and digital media governance, a five-judge Constitution Bench of the Supreme Court of India on Friday ordered an interim stay on the enforcement of controversial digital broadcast regulation guidelines.",
                            "The bench observed that while administrative oversight of illegal content remains legitimate, statutory guidelines must strictly uphold Article 19(1)(a) speech protections and cannot impose prior restraint on independent newsrooms without explicit legislative sanction.",
                            "Senior counsel representing digital publishing alliances argued that arbitrary compliance notices had disrupted newsroom workflows. The Attorney General submitted that the government remains committed to constructive stakeholder consultation before issuing final operational standards."
                        ],
                        "verifiable_claim": "Supreme Court stays controversial digital broadcast regulation guidelines pending review"
                    },
                    "sidebar": [
                        {
                            "headline": "Monsoon revival fills major southern reservoirs to 88% capacity",
                            "category": "Climate & Agriculture",
                            "snippet": "Copious precipitation across Western Ghats catchments ensures full irrigation quotas for Tamil Nadu and Karnataka delta farmers.",
                            "verifiable_claim": "Monsoon revival fills southern reservoirs to 88% capacity"
                        },
                        {
                            "headline": "Core export sectors register 14.2% annual growth in quarterly trade report",
                            "category": "Economy",
                            "snippet": "Electronics, pharmaceuticals, and engineering goods drive record foreign trade receipts according to Commerce Ministry data.",
                            "verifiable_claim": "Core export sectors register 14.2% annual growth in quarterly trade report"
                        }
                    ],
                    "bottom_fold": {
                        "headline": "National Green Hydrogen Mission clears ₹8,500 crore viability gap subsidies",
                        "snippet": "Seven industrial consortiums receive official clearances for coastal electrolyser manufacturing hubs.",
                        "verifiable_claim": "National Green Hydrogen Mission clears ₹8,500 crore viability gap subsidies"
                    }
                },
                {
                    "page": 2, "section": "Nation & Strategic Affairs",
                    "lead": {
                        "headline": "ISRO advances timeline for next-generation heavy-lift launcher with cryogenic propulsion tests",
                        "deck": "Autonomous recovery protocols validated for booster stages aiming to slash orbital insertion costs.",
                        "byline": "Science Correspondent • Sriharikota",
                        "image_url": "https://images.unsplash.com/photo-1517976487541-b4f02e64627d?auto=format&fit=crop&w=1200&q=80",
                        "image_caption": "Cryogenic engine static test firing at the ISRO Propulsion Complex.",
                        "body_columns": [
                            "India's space research establishment has successfully completed a 450-second endurance hot-test of its next-generation heavy cryogenic engine, paving the way for orbital payload capabilities exceeding 10 tonnes into GTO.",
                            "The mission architecture incorporates advanced grid-fin guidance and reusable aerodynamic heat shields, which will permit controlled soft ocean landings for primary booster stages."
                        ],
                        "verifiable_claim": "ISRO advances timeline for heavy-lift launcher with cryogenic tests"
                    },
                    "sidebar": [
                        {
                            "headline": "Rural digital connectivity reaches 96% of gram panchayats under BharatNet-3",
                            "category": "Technology",
                            "snippet": "Over 2.1 lakh village councils now interconnected with high-speed optical fiber infrastructure.",
                            "verifiable_claim": "Rural digital connectivity reaches 96% of gram panchayats"
                        }
                    ],
                    "bottom_fold": {
                        "headline": "Archaeological Survey reveals 2,200-year-old maritime trade dock in coastal Odisha",
                        "snippet": "Excavations uncover Roman amphorae and terracotta coins dating back to the Kalinga-Mediterranean trade axis.",
                        "verifiable_claim": "Archaeological Survey reveals 2,200-year-old maritime trade dock in Odisha"
                    }
                }
            ]
        },
        "dainik_bhaskar": {
            "name": "Dainik Bhaskar", "native_name": "दैनिक भास्कर", "lang": "Hindi", "state": "Madhya Pradesh / Rajasthan", "theme": "orange-600",
            "motto": "सत्यमेव जयते • देश का सबसे बड़ा समाचार पत्र", "price": "₹5.00", "vol": "वर्ष 66 • अंक 142",
            "pages": [
                {
                    "page": 1, "section": "मुख्य पृष्ठ • राष्ट्रीय समाचार",
                    "lead": {
                        "headline": "दैनिक भास्कर: नई राष्ट्रीय कौशल नीति को मंजूरी, युवाओं के लिए 5 लाख पेड कॉर्पोरेट अप्रेंटिसशिप का रास्ता साफ",
                        "deck": "शीर्ष 500 भारतीय कंपनियों में 12 महीने के लाइव इंडस्ट्री प्रशिक्षण के साथ ₹5000 मासिक भत्ता अनिवार्य।",
                        "byline": "विशेष संवाददाता • नई दिल्ली",
                        "image_url": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80",
                        "image_caption": "युवा छात्र अत्याधुनिक इंडस्ट्रियल रोबोटिक्स और स्किल लैब में व्यावहारिक प्रशिक्षण प्राप्त करते हुए।",
                        "body_columns": [
                            "केंद्रीय मंत्रिमंडल ने देश के युवाओं के रोजगार कौशल को वैश्विक स्तर पर प्रतिस्पर्धी बनाने के लिए ऐतिहासिक नई राष्ट्रीय कौशल नीति को अंतिम मंजूरी दे दी है।",
                            "इस योजना के तहत टियर-2 और टियर-3 शहरों के सरकारी पॉलिटेक्निक और आईटीआई उत्तीर्ण छात्रों को ऑटोमोबाइल, इलेक्ट्रॉनिक्स, फिनटेक और फार्मास्यूटिकल सेक्टर की शीर्ष 500 कंपनियों में 12 महीने का ऑन-जॉब प्रशिक्षण मिलेगा।"
                        ],
                        "verifiable_claim": "नई राष्ट्रीय कौशल नीति को मंजूरी, युवाओं के लिए 5 लाख पेड कॉर्पोरेट अप्रेंटिसशिप"
                    },
                    "sidebar": [
                        {
                            "headline": "रेलवे का 'कवच 4.0' मिशन: 10,000 किमी ट्रैक पर ऑटोमैटिक ट्रेन प्रोटेक्शन शुरू",
                            "category": "इन्फ्रास्ट्रक्चर",
                            "snippet": "लोको पायलटों को कोहरे और खराब मौसम में भी सिग्नल की शत-प्रतिशत रियल-टाइम विजिबिलिटी मिलेगी।",
                            "verifiable_claim": "रेलवे का कवच 4.0 मिशन 10000 किमी ट्रैक पर शुरू"
                        }
                    ],
                    "bottom_fold": {
                        "headline": "उत्तर भारत के प्रमुख जलाशयों में 78% जलस्तर दर्ज, खरीफ फसलों की बंपर बुवाई",
                        "snippet": "गंगा, यमुना और चंबल बेसिन के बांधों में पिछले वर्ष से 12% अधिक जल संचयन से किसानों में उत्साह।",
                        "verifiable_claim": "उत्तर भारत के प्रमुख जलाशयों में 78% जलस्तर दर्ज"
                    }
                }
            ]
        },
        "dinamani": {
            "name": "Dinamani", "native_name": "தினமணி", "lang": "Tamil", "state": "Tamil Nadu", "theme": "emerald-800",
            "motto": "உண்மையே வெல்லும் • தினமணி நாளிதழ்", "price": "₹6.00", "vol": "மலர் 91 • இதழ் 48",
            "pages": [
                {
                    "page": 1, "section": "தலைப்புச் செய்திகள் • மாநிலம்",
                    "lead": {
                        "headline": "தினமணி: தமிழகத்தில் ₹28,000 கோடி புதிய தொழில் முதலீடுகளுக்கு அமைச்சரவை ஒப்புதல்; ஓசூர் மற்றும் தூத்துக்குடியில் புதிய தொழிற்பூங்காக்கள்",
                        "deck": "மின்னணு உற்பத்தி மற்றும் பசுமை ஹைட்ரஜன் துறைகளில் 45,000 பேருக்கு நேரடி வேலைவாய்ப்பு உறுதி.",
                        "byline": "தலைமை நிருபர் • சென்னை",
                        "image_url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
                        "image_caption": "தொழில்நுட்ப உற்பத்தி ஆலை மற்றும் ஸ்மார்ட் தொழில் பூங்கா கட்டமைப்பு.",
                        "body_columns": [
                            "தமிழகத்தில் தொழில் வளர்ச்சியை மேலும் துரிதப்படுத்தும் நோக்கில், ₹28,000 கோடி மதிப்பிலான புதிய தொழில் முதலீட்டுத் திட்டங்களுக்கு தமிழக அமைச்சரவை முறைப்படி ஒப்புதல் வழங்கியுள்ளது.",
                            "ஓசூரில் சர்வதேச எலக்ட்ரானிக்ஸ் உதிரிபாகங்கள் உற்பத்தி மண்டலமும், தூத்துக்குடியில் பசுமை ஹைட்ரஜன் மற்றும் துறைமுக ஏற்றுமதி உள்கட்டமைப்பு பூங்காவும் அமையவுள்ளன."
                        ],
                        "verifiable_claim": "தமிழகத்தில் ₹28,000 கோடி புதிய தொழில் முதலீடுகளுக்கு அமைச்சரவை ஒப்புதல்"
                    },
                    "sidebar": [
                        {
                            "headline": "காவிரி டெல்டா குறுவை பாசனத்திற்கு மேட்டூர் அணையிலிருந்து வினாடிக்கு 15,000 கனஅடி நீர் திறப்பு",
                            "category": "விவசாயம்",
                            "snippet": "12 டெல்டா மாவட்டங்களில் 4.5 லட்சம் ஏக்கர் விளைநிலங்கள் முழுமையாக பாசன வசதி பெறும்.",
                            "verifiable_claim": "காவிரி டெல்டா குறுவை பாசனத்திற்கு மேட்டூர் அணையிலிருந்து கூடுதல் நீர் திறப்பு"
                        }
                    ],
                    "bottom_fold": {
                        "headline": "சென்னை மெட்ரோ இரண்டாம் கட்டத்தில் பூந்தமல்லி - போரூர் வழித்தடத்தில் சோதனை ஓட்டம் தொடக்கம்",
                        "snippet": "தானியங்கி ஓட்டுநர் இல்லா அதிநவீன ரயில்கள் மூலம் போக்குவரத்து நெரிசல் குறையும்.",
                        "verifiable_claim": "சென்னை மெட்ரோ இரண்டாம் கட்டத்தில் பூந்தமல்லி போரூர் சோதனை ஓட்டம்"
                    }
                }
            ]
        }
    }
    
    selected_paper = registry.get(paper_id, registry["hindu"])
    page_idx = max(0, min(page - 1, len(selected_paper["pages"]) - 1))
    page_content = selected_paper["pages"][page_idx]
    
    return clean_for_json({
        "status": "success",
        "paper_id": paper_id,
        "paper_name": selected_paper["name"],
        "native_name": selected_paper["native_name"],
        "language": selected_paper["lang"],
        "state": selected_paper["state"],
        "theme_color": selected_paper["theme"],
        "motto": selected_paper["motto"],
        "price": selected_paper["price"],
        "volume_info": selected_paper["vol"],
        "dateline": f"{today_str} • {selected_paper['state']}",
        "current_page": page_idx + 1,
        "total_pages": len(selected_paper["pages"]),
        "section_name": page_content["section"],
        "lead_story": page_content["lead"],
        "sidebar_stories": page_content.get("sidebar", []),
        "bottom_fold": page_content.get("bottom_fold", {}),
        "editorial_quote": "Journalistic integrity is the bedrock of democratic accountability."
    })

# ----------------- Stage-by-Stage Independent Endpoints -----------------

@app.post("/api/pipeline/ocr")
@app.post("/api/pipeline/upload-image")
@app.post("/pipeline/upload-image")
@app.post("/pipeline/ocr")
@app.post("/api/upload-ocr")
@app.post("/api/upload-image")
async def run_ocr_stage(
    file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None)
):
    """Stage 1 & 2: OpenCV Preprocessing + Tesseract OCR chained to Claim Distillation."""
    upload = file or image_file or image
    if upload is None:
        raise HTTPException(status_code=400, detail="No image file provided in multipart payload (expected 'file' or 'image_file').")
        
    print("UPLOAD RECEIVED:", upload.filename, "CONTENT-TYPE:", upload.content_type)
    contents = await upload.read()
    ocr_res = await asyncio.to_thread(preprocess_and_ocr, contents)
    extracted_text = ocr_res.get("text") or ""
    
    # Stage 0.5: Multimodal Asset Type Classifier & Visual-to-Search Router
    vision_ctx = await asyncio.to_thread(classify_and_extract_visual_context, contents, extracted_text)
    ocr_res["visual_context"] = vision_ctx
    ocr_res["asset_type"] = vision_ctx.get("asset_type")
    ocr_res["asset_type_label"] = vision_ctx.get("asset_type_label")
    
    if extracted_text:
        trans = await asyncio.to_thread(detect_and_translate, extracted_text)
        claim_data = await asyncio.to_thread(extract_claim, trans.get("translated_text", extracted_text))
        
        # 2. Extract proper nouns and clean keywords (strip viral/conversational filler words)
        filler_words = {
            "shocked", "fans", "watch", "viral", "omg", "breaking", "alert", 
            "forwarded", "share", "must watch", "must see", "look", "video", 
            "photos", "unbelievable", "trending", "today", "now", "just", "in", 
            "this", "that", "the", "and", "a", "an", "is", "are", "was", "were"
        }
        proper_terms = []
        if claim_data.get("entities"):
            for k in ["organizations", "locations", "dates_or_numbers"]:
                for item in claim_data["entities"].get(k, []):
                    if item and str(item).lower() not in filler_words and str(item) not in proper_terms:
                        proper_terms.append(str(item))
                        
        for kw in claim_data.get("search_keywords", []):
            if kw.lower() not in filler_words and kw not in proper_terms:
                proper_terms.append(kw)
                
        clean_search_query = " ".join(proper_terms[:6]) if proper_terms else (vision_ctx.get("search_intent_query") or claim_data.get("canonical_claim", extracted_text)[:60])
        
        # 3. Trigger Zero-Key DuckDuckGo Free Live Search immediately
        live_hits = await asyncio.to_thread(retrieve_free_live_evidence, clean_search_query, 5)
        
        ocr_res["canonical_claim"] = claim_data.get("canonical_claim", extracted_text)
        ocr_res["extracted_claim_for_pipeline"] = claim_data.get("canonical_claim", extracted_text)
        ocr_res["parsed_headline_or_text"] = extracted_text
        ocr_res["search_keywords"] = claim_data.get("search_keywords", [])
        ocr_res["entities"] = claim_data.get("entities", {})
        ocr_res["translation"] = trans
        ocr_res["live_evidence_candidates"] = live_hits
        ocr_res["live_search_query"] = clean_search_query
        ocr_res["live_search_status"] = f"DuckDuckGo Free Search: {len(live_hits)} hit(s)"
    else:
        # Fallback to visual intent query when text is sparse
        fallback_query = vision_ctx.get("search_intent_query", "breaking news fact check")
        live_hits = await asyncio.to_thread(retrieve_free_live_evidence, fallback_query, 5)
        implied_claim = vision_ctx.get("implied_claim_summary", "Visual asset submitted for verification")
        
        ocr_res["canonical_claim"] = implied_claim
        ocr_res["extracted_claim_for_pipeline"] = implied_claim
        ocr_res["parsed_headline_or_text"] = implied_claim
        ocr_res["search_keywords"] = [vision_ctx.get("asset_type", "visual")]
        ocr_res["entities"] = {}
        ocr_res["live_evidence_candidates"] = live_hits
        ocr_res["live_search_query"] = fallback_query
        ocr_res["live_search_status"] = f"DuckDuckGo Free Search: {len(live_hits)} hit(s)"
        
    return clean_for_json(ocr_res)

@app.post("/api/pipeline/claim-extract")
async def run_claim_extraction_stage(req: ClaimExtractRequest):
    """Stage 2: Canonical Claim Distillation & Entity Extraction."""
    trans = await asyncio.to_thread(detect_and_translate, req.text)
    claim_data = await asyncio.to_thread(extract_claim, trans["translated_text"])
    claim_data["translation"] = trans
    return claim_data

@app.post("/api/pipeline/image-auth")
async def run_image_authenticity_stage(
    file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None)
):
    """Stage 3: Perceptual Hashing against known authentic/hoax registry."""
    upload = file or image_file or image
    if upload is None:
        raise HTTPException(status_code=400, detail="No image file provided in multipart payload.")
    contents = await upload.read()
    return await asyncio.to_thread(analyze_image_authenticity, contents)

@app.post("/api/pipeline/evidence-retrieve")
async def run_evidence_retrieval_stage(claim: str = Form(...)):
    """Stage 4: Parallel retrieval across Google Fact Check, Reddit, and offline JSON."""
    c_info = await asyncio.to_thread(extract_claim, claim)
    return await retrieve_evidence(c_info["canonical_claim"], c_info["search_query"], c_info["search_keywords"])

@app.post("/api/pipeline/relevance-gate")
async def run_relevance_gate_stage(req: RelevanceRequest):
    """Stage 5: sentence-transformers cosine similarity threshold filter."""
    return await asyncio.to_thread(filter_evidence_by_relevance, req.claim, req.evidence_items, req.threshold)

@app.get("/api/pipeline/credibility")
async def run_source_credibility_stage(domain: str):
    """Stage 6: Domain-trust dictionary lookup."""
    return await asyncio.to_thread(evaluate_source_credibility, domain)

@app.post("/api/pipeline/stance")
async def run_stance_stage(req: StanceRequest):
    """Stage 7: Stance classification on relevance-gated evidence."""
    return await asyncio.to_thread(analyze_evidence_stance, req.claim, req.evidence_items)

@app.post("/api/pipeline/stylistic")
async def run_stylistic_stage(req: StylisticRequest):
    """Stage 8: Joblib-persisted LIAR model evaluation."""
    return await asyncio.to_thread(evaluate_stylistic_credibility, req.claim)

@app.post("/api/pipeline/aggregate")
async def run_aggregation_stage(req: AggregateRequest):
    """Stage 9 & 10: Multi-signal weighted ensemble + insufficient evidence override."""
    return await asyncio.to_thread(
        aggregate_verdict,
        req.valid_evidence, 
        req.stylistic_score, 
        req.image_authenticity_score, 
        req.has_image
    )

# ----------------- MASTER END-TO-END PIPELINE ENDPOINT -----------------

@app.post("/api/verify")
async def verify_claim_master(
    claim_text: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    input_mode: Optional[str] = Form("editorial")
):
    """
    Executes the complete 13-stage pipeline in strict sequence:
    1. Input Handling (Text / Image / WhatsApp forward)
    2. OCR Preprocessing (if image)
    3. Claim Extraction & NER
    4. Image Authenticity pHash Check (if image)
    5. Parallel Evidence Retrieval (Google Fact Check + Reddit + Offline Fallback)
    6. Relevance Gate (sentence-transformers MiniLM, cosine similarity >= 0.40)
    7. Source Credibility Weighting (Domain trust dictionary)
    8. Stance Detection (MNLI stance: Supports / Contradicts / Neutral)
    9. Stylistic Credibility Score (LIAR dataset persisted classifier)
    10. Insufficient-Evidence Override Rule (< 2 valid sources -> Unverified)
    11. Verdict Aggregation (Weighted multi-signal ensemble)
    12. RAG Editorial Explanation Generation (with interactive [E1], [E2] citations)
    13. Persistent SQLite History & UI Output Payload
    """
    check_id = f"chk-{uuid.uuid4().hex[:8]}"
    
    raw_text = claim_text or ""
    image_analysis = None
    ocr_result = None
    effective_image = image_file or file or image
    has_image = effective_image is not None
    
    # --- STAGE 1 & 3: IMAGE PROCESSING (IF IMAGE PROVIDED) ---
    if has_image:
        image_bytes = await effective_image.read()
        image_analysis = await asyncio.to_thread(analyze_image_authenticity, image_bytes)
        ocr_result = await asyncio.to_thread(preprocess_and_ocr, image_bytes)
        vision_ctx = await asyncio.to_thread(classify_and_extract_visual_context, image_bytes, ocr_result.get("text", ""))
        
        if image_analysis is None:
            image_analysis = {}
        image_analysis["visual_context"] = vision_ctx
        image_analysis["asset_type"] = vision_ctx.get("asset_type")
        image_analysis["asset_type_label"] = vision_ctx.get("asset_type_label")
        
        # If user did not provide text or provided placeholder, rely on OCR text or implied claim
        placeholder_triggers = ["visual attachment analysis", "visual asset analysis", "image attached"]
        is_placeholder = any(p in raw_text.lower() for p in placeholder_triggers)
        
        if not raw_text.strip() or is_placeholder:
            raw_text = ocr_result.get("text") or vision_ctx.get("implied_claim_summary") or "Visual media verification"
            
    if not raw_text.strip():
        raw_text = "Visual asset analysis requiring cross-reference search."
        
    # --- STAGE 12 (PRE-PIPELINE): TRANSLATION & LANGUAGE DETECTION ---
    translation_info = await asyncio.to_thread(detect_and_translate, raw_text)
    working_text = translation_info["translated_text"]
    
    # --- STAGE 2: CLAIM & ENTITY EXTRACTION ---
    claim_info = await asyncio.to_thread(extract_claim, working_text)
    canonical_claim = claim_info["canonical_claim"]
    
    # --- STAGE 4: PARALLEL EVIDENCE RETRIEVAL ---
    retrieval_result = await retrieve_evidence(
        claim_text=canonical_claim,
        search_query=claim_info["search_query"],
        search_keywords=claim_info["search_keywords"],
        entities=claim_info.get("entities")
    )
    raw_evidence_items = retrieval_result["evidence_items"]
    
    # --- STAGE 5: RELEVANCE GATE (MUST RUN BEFORE STANCE DETECTION) ---
    relevance_result = await asyncio.to_thread(
        filter_evidence_by_relevance,
        canonical_claim,
        raw_evidence_items,
        0.40,
        claim_info.get("entities")
    )
    passed_evidence = relevance_result["valid_evidence"]
    
    # --- STAGE 6: SOURCE CREDIBILITY WEIGHTING ---
    for item in passed_evidence:
        cred = await asyncio.to_thread(evaluate_source_credibility, item.get("domain", ""))
        item["domain_trust"] = cred["trust_score"]
        item["trust_tier"] = cred["tier"]
        item["trust_category"] = cred["category"]
        item["trust_justification"] = cred["justification"]
        
    # --- STAGE 7: STANCE DETECTION (ON GATED EVIDENCE ONLY) ---
    annotated_evidence = await asyncio.to_thread(analyze_evidence_stance, canonical_claim, passed_evidence)
    
    # Assign citation tags [E1], [E2], etc.
    for idx, ev in enumerate(annotated_evidence, 1):
        ev["citation_tag"] = f"[E{idx}]"
        
    # --- STAGE 8: STYLISTIC CREDIBILITY SCORE (LIAR CLASSIFIER) ---
    stylistic_result = await asyncio.to_thread(evaluate_stylistic_credibility, canonical_claim)
    stylistic_score = stylistic_result["stylistic_credibility_score"]
    
    # --- STAGE 9 & 10: VERDICT AGGREGATION & INSUFFICIENT-EVIDENCE OVERRIDE ---
    img_score = image_analysis["authenticity_score"] if (has_image and image_analysis) else None
    verdict_result = await asyncio.to_thread(
        aggregate_verdict,
        annotated_evidence,
        stylistic_score,
        img_score,
        has_image,
        raw_evidence_items
    )
    
    # --- STAGE 11: EXPLANATION GENERATION ---
    explanation_result = await asyncio.to_thread(
        generate_editorial_explanation,
        canonical_claim,
        verdict_result,
        annotated_evidence,
        image_analysis,
        claim_info
    )
    
    # --- STAGE 13: PERSIST TO SQLITE DATABASE ---
    await asyncio.to_thread(
        save_verification,
        check_id,
        "whatsapp" if input_mode == "whatsapp" else ("image" if has_image else "text"),
        raw_text,
        canonical_claim,
        translation_info["detected_language"],
        verdict_result,
        explanation_result,
        annotated_evidence
    )
    
    # Build complete Bento Grid output payload
    payload = {
        "success": True,
        "check_id": check_id,
        "input_mode": input_mode,
        "claim": {
            "raw_input": raw_text,
            "canonical_claim": canonical_claim,
            "entities": claim_info["entities"],
            "search_keywords": claim_info["search_keywords"],
            "translation": translation_info
        },
        "image_forensics": image_analysis,
        "ocr_details": ocr_result,
        "verdict": verdict_result,
        "explanation": explanation_result,
        "evidence": {
            "total_retrieved": retrieval_result["total_retrieved"],
            "passed_relevance_gate": len(annotated_evidence),
            "rejected_by_relevance_gate": relevance_result["rejected_count"],
            "items": annotated_evidence,
            "rejected_items": relevance_result["rejected_evidence"],
            "used_offline_fallback": retrieval_result["used_offline_fallback"]
        },
        "stylistic_signals": stylistic_result,
        "pipeline_stages_completed": 13
    }
    return clean_for_json(payload)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
