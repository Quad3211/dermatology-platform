"""
Stage 9: Medical Safety Gate
IMMUTABLE rules that cannot be overridden by config, API params, or DB flags.
This is the last stage before writing results to the database.
"""
import re
from dataclasses import dataclass

# ── HARDCODED CONSTANTS — DO NOT MODIFY WITHOUT MEDICAL REVIEW ──

MANDATORY_DISCLAIMER = (
    "THIS IS A RISK TRIAGE RESULT — NOT A MEDICAL DIAGNOSIS. "
    "This tool is a decision-support aid only. "
    "Always consult a qualified, registered dermatologist. "
    "In an emergency, call 999 (UK) or 911 (US) immediately."
)

# Banned diagnostic phrases — must never appear in patient-facing output
BANNED_PHRASES = [
    r"you have\b",
    r"you are diagnosed",
    r"this is cancer",
    r"this is melanoma",
    r"\bmalignant\b",
    r"diagnosed with",
    r"confirms cancer",
    r"is cancerous",
    r"you have melanoma",
    r"you have skin cancer",
    r"confirmed (malignancy|diagnosis)",
]

# Risk levels requiring mandatory referral
REFERRAL_REQUIRED_LEVELS = {"HIGH", "CRITICAL"}

# Risk levels triggering emergency alert
EMERGENCY_LEVELS = {"CRITICAL"}

# ── Safety gate result ─────────────────────────────────────────

@dataclass
class SafetyResult:
    summary:          str
    disclaimer:       str
    referral_required: bool
    emergency_flag:   bool
    warning_issued:   bool   # True if banned phrase was found and stripped


def apply_safety_gate(
    raw_summary: str,
    risk_level: str,
    confidence: float,
) -> SafetyResult:
    """
    Applies all medical safety rules to AI output.

    This function is the final gate before any result reaches the patient.
    It is non-configurable and non-bypassable.

    Rules applied:
    1. Strip any banned diagnostic phrases (replace with [redacted])
    2. Append mandatory disclaimer to summary
    3. Set referral_required for HIGH or CRITICAL risk
    4. Set emergency_flag for CRITICAL risk
    5. Validate confidence is in [0, 1]
    """
    # Rule 0: Validate inputs
    if not isinstance(confidence, (int, float)) or not (0 <= confidence <= 1):
        raise ValueError(f"[SAFETY GATE] Invalid confidence: {confidence}")

    if risk_level not in ("LOW", "MODERATE", "HIGH", "CRITICAL"):
        raise ValueError(f"[SAFETY GATE] Invalid risk_level: {risk_level}")

    # Rule 1: Strip banned phrases
    clean_summary, warning_issued = _strip_banned_phrases(raw_summary)

    if warning_issued:
        print(f"[SAFETY GATE] ⚠️  Banned diagnostic phrase detected and stripped in summary.")

    # Rule 2: Inject disclaimer
    safe_summary = f"{clean_summary}\n\n{MANDATORY_DISCLAIMER}"

    # Rule 3: Referral flag
    referral_required = risk_level in REFERRAL_REQUIRED_LEVELS

    # Rule 4: Emergency flag
    emergency_flag = risk_level in EMERGENCY_LEVELS

    if emergency_flag:
        print(f"[SAFETY GATE] 🚨 CRITICAL risk — emergency flag set.")

    return SafetyResult(
        summary=safe_summary,
        disclaimer=MANDATORY_DISCLAIMER,
        referral_required=referral_required,
        emergency_flag=emergency_flag,
        warning_issued=warning_issued,
    )


def _strip_banned_phrases(text: str):
    """
    Searches for banned diagnostic phrases case-insensitively.
    Returns (cleaned_text, warning_issued).
    """
    warning_issued = False
    for pattern in BANNED_PHRASES:
        compiled = re.compile(pattern, re.IGNORECASE)
        if compiled.search(text):
            text = compiled.sub("[redacted]", text)
            warning_issued = True
    return text, warning_issued


def get_risk_guidance(risk_level: str) -> dict:
    """Returns structured patient guidance by risk level."""
    guidance = {
        "LOW": {
            "title":   "Low Risk Detected",
            "message": "No significant concern detected at this time. Continue regular skin self-checks and annual skin screenings.",
            "action":  "self_monitor",
            "urgency": "ROUTINE",
        },
        "MODERATE": {
            "title":   "Moderate Risk Detected",
            "message": "Some features suggest a visit to your GP or a dermatologist within the next 4 weeks.",
            "action":  "book_gp",
            "urgency": "SOON",
        },
        "HIGH": {
            "title":   "High Risk Detected — Doctor Review Required",
            "message": "Significant features detected. A doctor consultation has been requested. Please book an appointment as soon as possible.",
            "action":  "book_specialist",
            "urgency": "HIGH",
        },
        "CRITICAL": {
            "title":   "CRITICAL Risk — Seek Immediate Medical Attention",
            "message": "CRITICAL risk detected. Please seek urgent medical attention. Do not delay. Call 999 (UK) or 911 (US) if in doubt.",
            "action":  "emergency",
            "urgency": "CRITICAL",
            "emergency_numbers": ["999", "111", "911"],
        },
    }
    return guidance.get(risk_level, guidance["LOW"])
