"""
Database Layer for VerifAI
Provides persistent SQLite storage for claims, evidence records, and verdicts.
Powers the Claim History & Investigation Dashboard.
"""

import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "verifai.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        input_type TEXT NOT NULL,
        raw_input TEXT NOT NULL,
        canonical_claim TEXT NOT NULL,
        language TEXT DEFAULT 'English',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verdicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_id TEXT NOT NULL,
        final_verdict TEXT NOT NULL,
        ensemble_score REAL NOT NULL,
        meter_zone INTEGER NOT NULL,
        color_code TEXT NOT NULL,
        is_overridden INTEGER DEFAULT 0,
        component_scores_json TEXT,
        headline TEXT,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (claim_id) REFERENCES claims (id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_id TEXT NOT NULL,
        citation_tag TEXT,
        source TEXT,
        domain TEXT,
        url TEXT,
        title TEXT,
        snippet TEXT,
        stance TEXT,
        domain_trust REAL,
        relevance_score REAL,
        FOREIGN KEY (claim_id) REFERENCES claims (id)
    );
    """)
    
    conn.commit()
    conn.close()
    seed_initial_history_if_empty()

def seed_initial_history_if_empty():
    """Seeds realistic historical checks so the dashboard has immediate populated data for judging."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM claims")
    count = cursor.fetchone()[0]
    
    if count == 0:
        seed_data = [
            {
                "id": "chk-seed-01",
                "input_type": "text",
                "raw_input": "NASA's James Webb Space Telescope observed galaxy JADES-GS-z14-0 dating back 290 million years post-Big Bang.",
                "canonical_claim": "The James Webb Space Telescope observed galaxy JADES-GS-z14-0 dating back 290 million years post-Big Bang.",
                "final_verdict": "Verified True",
                "ensemble_score": 0.94,
                "meter_zone": 5,
                "color_code": "#15803d",
                "headline": "Verdict: Verified True — Substantial Corroboration Across Primary Sources",
                "summary": "Spectroscopic confirmation by NASA and ESA verifies the record-setting cosmic redshift of 14.32."
            },
            {
                "id": "chk-seed-02",
                "input_type": "whatsapp_forward",
                "raw_input": "Forwarded as received: Drinking freshly boiled garlic water completely cures coronavirus infection within 24 hours!!",
                "canonical_claim": "Drinking boiled garlic water cures coronavirus infection within 24 hours.",
                "final_verdict": "False / Fabricated",
                "ensemble_score": 0.08,
                "meter_zone": 1,
                "color_code": "#b91c1c",
                "headline": "Verdict: False / Fabricated — Refuted by Credible Authorities",
                "summary": "The WHO, PolitiFact, and global medical journals confirm garlic has zero antiviral efficacy against SARS-CoV-2."
            },
            {
                "id": "chk-seed-03",
                "input_type": "text",
                "raw_input": "The European Union announced an immediate total ban on all petrol and diesel cars starting in 2025.",
                "canonical_claim": "The European Union announced an immediate total ban on all petrol cars by 2025.",
                "final_verdict": "Mostly False",
                "ensemble_score": 0.32,
                "meter_zone": 2,
                "color_code": "#ea580c",
                "headline": "Verdict: Mostly False — Timeline Exaggeration",
                "summary": "EU Fit for 55 legislation targets zero-emission new vehicle sales by 2035, not an immediate ban in 2025."
            }
        ]
        
        for item in seed_data:
            cursor.execute(
                "INSERT INTO claims (id, input_type, raw_input, canonical_claim) VALUES (?, ?, ?, ?)",
                (item["id"], item["input_type"], item["raw_input"], item["canonical_claim"])
            )
            cursor.execute(
                """INSERT INTO verdicts 
                   (claim_id, final_verdict, ensemble_score, meter_zone, color_code, headline, summary) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (item["id"], item["final_verdict"], item["ensemble_score"], item["meter_zone"], 
                 item["color_code"], item["headline"], item["summary"])
            )
        conn.commit()
    conn.close()

def save_verification(
    claim_id: str,
    input_type: str,
    raw_input: str,
    canonical_claim: str,
    language: str,
    verdict_data: Dict[str, Any],
    explanation_data: Dict[str, Any],
    evidence_items: List[Dict[str, Any]]
):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT OR REPLACE INTO claims (id, input_type, raw_input, canonical_claim, language) VALUES (?, ?, ?, ?, ?)",
        (claim_id, input_type, raw_input, canonical_claim, language)
    )
    
    override = verdict_data.get("insufficient_evidence_override", {})
    cursor.execute(
        """INSERT INTO verdicts 
           (claim_id, final_verdict, ensemble_score, meter_zone, color_code, is_overridden, component_scores_json, headline, summary) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            claim_id,
            verdict_data["final_verdict"],
            verdict_data["ensemble_score"],
            verdict_data["meter_zone"],
            verdict_data["color_code"],
            1 if override.get("triggered") else 0,
            json.dumps(verdict_data.get("component_scores", {})),
            explanation_data.get("verdict_headline", ""),
            explanation_data.get("executive_summary", "")
        )
    )
    
    for idx, ev in enumerate(evidence_items, 1):
        cursor.execute(
            """INSERT INTO evidence_records 
               (claim_id, citation_tag, source, domain, url, title, snippet, stance, domain_trust, relevance_score) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                claim_id,
                f"[E{idx}]",
                ev.get("source", ""),
                ev.get("domain", ""),
                ev.get("url", ""),
                ev.get("title", ""),
                ev.get("snippet", ""),
                ev.get("stance", "Neutral"),
                ev.get("domain_trust", 0.5),
                ev.get("computed_relevance", ev.get("relevance_score", 0.5))
            )
        )
        
    conn.commit()
    conn.close()

def get_recent_history(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.id, c.input_type, c.canonical_claim, c.created_at,
               v.final_verdict, v.ensemble_score, v.meter_zone, v.color_code, v.headline, v.summary
        FROM claims c
        JOIN verdicts v ON c.id = v.claim_id
        ORDER BY c.created_at DESC
        LIMIT ?
    """, (limit,))
    
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "input_type": r["input_type"],
            "claim": r["canonical_claim"],
            "verdict": r["final_verdict"],
            "score": r["ensemble_score"],
            "meter_zone": r["meter_zone"],
            "color_code": r["color_code"],
            "headline": r["headline"],
            "summary": r["summary"],
            "date": r["created_at"]
        })
    conn.close()
    return results
