"""
Stages 5+6: Risk Probability Scoring + Severity Classification
Ensemble: CNN detection (60%) + ViT classification (40%).
In production: ViT fine-tuned on ISIC dermatology classes.
Dev: Deterministic stub.
"""
import os
import random
from dataclasses import dataclass

import torch

from .lesion_detector import DetectionResult


RISK_THRESHOLDS = {
    "LOW":      (0.00, 0.30),
    "MODERATE": (0.30, 0.55),
    "HIGH":     (0.55, 0.80),
    "CRITICAL": (0.80, 1.00),
}

DERMATOLOGY_CLASSES = [
    "melanoma",
    "melanocytic_nevus",
    "basal_cell_carcinoma",
    "actinic_keratosis",
    "benign_keratosis",
    "dermatofibroma",
    "vascular_lesion",
    "squamous_cell_carcinoma",
]

USE_REAL_MODEL = os.getenv("USE_REAL_MODELS", "false").lower() == "true"
MODEL_PATH     = os.getenv("MODEL_PATH", "./models/vit_base_isic2024.pt")

_vit_model = None


@dataclass
class RiskResult:
    risk_level:       str    # LOW | MODERATE | HIGH | CRITICAL
    confidence:       float  # 0.0 – 1.0 (ensemble probability)
    confidence_lower: float  # 95% CI lower bound
    confidence_upper: float  # 95% CI upper bound
    severity_score:   float  # 0.0 – 10.0 composite ABCDE
    top_label:        str    # Top dermatology class
    label_probs:      dict   # All class probabilities
    summary:          str    # Plain-English description (pre-safety-gate)


def score_risk(tensor_224: torch.Tensor, detection: DetectionResult) -> RiskResult:
    """
    Ensemble risk scoring:
      - CNN structural score (bounding box confidence + ABCDE) → weight 0.60
      - ViT classification → weight 0.40
    """
    cnn_score = _compute_cnn_score(detection)
    vit_label, vit_probs = _classify_with_vit(tensor_224)

    # ViT risk proxy: map class to risk probability
    vit_score = _class_to_risk_score(vit_label, vit_probs)

    # Ensemble
    ensemble_prob = round(cnn_score * 0.60 + vit_score * 0.40, 4)

    risk_level = _classify_risk(ensemble_prob)
    severity   = _compute_severity(detection)

    # 95% CI (simplified ±5% of confidence)
    ci_margin = max(0.05, 0.05 * ensemble_prob)

    return RiskResult(
        risk_level=risk_level,
        confidence=ensemble_prob,
        confidence_lower=round(max(0.0, ensemble_prob - ci_margin), 3),
        confidence_upper=round(min(1.0, ensemble_prob + ci_margin), 3),
        severity_score=severity,
        top_label=vit_label,
        label_probs=vit_probs,
        summary=_build_summary(risk_level, ensemble_prob, severity, vit_label, detection),
    )


def _compute_cnn_score(d: DetectionResult) -> float:
    """Weighted ABCDE structural score."""
    if not d.bounding_boxes:
        return 0.1
    score = (
        d.asymmetry_score   * 0.25 +
        d.border_score      * 0.25 +
        d.colour_variance   * 0.20 +
        min(d.lesion_area_ratio * 5, 1.0) * 0.15 +
        d.cnn_confidence    * 0.15
    )
    return round(min(score, 1.0), 4)


def _classify_with_vit(tensor: torch.Tensor):
    """ViT inference — stub returns deterministic values."""
    if USE_REAL_MODEL and _vit_model is not None:
        with torch.no_grad():
            logits = _vit_model(tensor)
            probs  = torch.softmax(logits, dim=1).squeeze().tolist()
        label_probs = dict(zip(DERMATOLOGY_CLASSES, [round(p, 4) for p in probs]))
        top_label   = max(label_probs, key=lambda k: label_probs[k])
        return top_label, label_probs

    # Stub: derive from tensor mean for reproducibility
    seed  = int(float(tensor.mean().item()) * 10000) % 10000
    rng   = random.Random(seed)
    probs = [rng.uniform(0.01, 0.3) for _ in DERMATOLOGY_CLASSES]
    total = sum(probs)
    probs = [round(p / total, 4) for p in probs]
    label_probs = dict(zip(DERMATOLOGY_CLASSES, probs))
    top_label   = max(label_probs, key=lambda k: label_probs[k])
    return top_label, label_probs


HIGH_RISK_CLASSES = {"melanoma", "basal_cell_carcinoma", "squamous_cell_carcinoma", "actinic_keratosis"}

def _class_to_risk_score(top_label: str, probs: dict) -> float:
    """Map ViT classification to a risk probability proxy."""
    high_risk_total = sum(probs.get(c, 0) for c in HIGH_RISK_CLASSES)
    return round(min(high_risk_total, 1.0), 4)


def _classify_risk(prob: float) -> str:
    for level, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= prob < hi:
            return level
    return "CRITICAL"


def _compute_severity(d: DetectionResult) -> float:
    score = (
        d.asymmetry_score  * 2.0 +
        d.border_score     * 2.0 +
        d.colour_variance  * 2.0 +
        min(d.lesion_area_ratio * 5, 1.0) * 2.0 +
        min(d.diameter_estimate / 20.0, 1.0) * 2.0
    )
    return round(min(score, 10.0), 1)


def _build_summary(risk_level: str, prob: float, severity: float, label: str, d: DetectionResult) -> str:
    features = []
    if d.asymmetry_score > 0.5: features.append("irregular shape")
    if d.border_score > 0.5:    features.append("uneven border")
    if d.colour_variance > 0.4: features.append("colour variation")
    if d.diameter_estimate > 6: features.append(f"estimated diameter {d.diameter_estimate:.0f}mm")

    feature_str = ", ".join(features) if features else "no major structural concerns"
    label_str   = label.replace("_", " ")

    return (
        f"Risk assessment: {risk_level} (confidence {prob:.0%}). "
        f"Pattern analysis suggests features consistent with {label_str}. "
        f"Detected features: {feature_str}. "
        f"Severity score: {severity}/10."
    )
