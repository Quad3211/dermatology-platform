"""
Stages 5+6: Risk probability scoring + severity classification.
Ensemble: CNN detection (60%) + ViT classification (40%).
In development, deterministic stub logic is used by default.
"""
import os
import random
import re
from dataclasses import dataclass
from typing import Any, Optional

import numpy as np
from PIL import Image

from .lesion_detector import DetectionResult


RISK_THRESHOLDS = {
    "LOW": (0.00, 0.30),
    "MODERATE": (0.30, 0.55),
    "HIGH": (0.55, 0.80),
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
MODEL_PATH = os.getenv("MODEL_PATH", "./models/vit_base_isic2024.pt")
USE_HF_MODEL = os.getenv("USE_HF_MODEL", "false").lower() == "true"
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "HotJellyBean/skin-disease-classifier")
HF_TOKEN = os.getenv("HF_TOKEN")

_vit_model = None
_hf_model = None
_hf_processor = None
_hf_torch = None
_hf_model_failed = False


@dataclass
class RiskResult:
    risk_level: str
    confidence: float
    confidence_lower: float
    confidence_upper: float
    severity_score: float
    top_label: str
    label_probs: dict
    summary: str


def score_risk(
    tensor_224: Any,
    detection: DetectionResult,
    pil_image: Optional[Image.Image] = None,
) -> RiskResult:
    """
    Ensemble risk scoring:
    - CNN structural score (bounding box confidence + ABCDE): weight 0.60
    - ViT classification proxy: weight 0.40
    """
    cnn_score = _compute_cnn_score(detection)
    vit_label, vit_probs = _classify_with_vit(tensor_224, pil_image)

    vit_score = _class_to_risk_score(vit_label, vit_probs)
    ensemble_prob = round(cnn_score * 0.60 + vit_score * 0.40, 4)
    risk_level = _classify_risk(ensemble_prob)
    severity = _compute_severity(detection)

    # Simplified 95% CI (+/-5% of confidence, minimum +/-0.05).
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
        d.asymmetry_score * 0.25
        + d.border_score * 0.25
        + d.colour_variance * 0.20
        + min(d.lesion_area_ratio * 5, 1.0) * 0.15
        + d.cnn_confidence * 0.15
    )
    return round(min(score, 1.0), 4)


def _classify_with_vit(tensor: Any, pil_image: Optional[Image.Image]):
    """ViT inference. Falls back to deterministic stub output."""
    hf_result = _classify_with_hf(pil_image)
    if hf_result is not None:
        return hf_result

    if USE_REAL_MODEL and _vit_model is not None:
        try:
            import torch

            model_input = _to_torch_batch(tensor, torch)
            with torch.no_grad():
                logits = _vit_model(model_input)
                probs = torch.softmax(logits, dim=1).squeeze().tolist()
            label_probs = dict(zip(DERMATOLOGY_CLASSES, [round(float(p), 4) for p in probs]))
            top_label = max(label_probs, key=lambda k: label_probs[k])
            return top_label, label_probs
        except Exception as exc:
            print(f"[Risk Scorer] WARNING: real model inference failed ({exc}). Falling back.")

    # Stub: derive from tensor mean for reproducibility.
    seed = int(_tensor_mean(tensor) * 10000) % 10000
    rng = random.Random(seed)
    probs = [rng.uniform(0.01, 0.3) for _ in DERMATOLOGY_CLASSES]
    total = sum(probs)
    probs = [round(p / total, 4) for p in probs]
    label_probs = dict(zip(DERMATOLOGY_CLASSES, probs))
    top_label = max(label_probs, key=lambda k: label_probs[k])
    return top_label, label_probs


def _tensor_mean(tensor: Any) -> float:
    """
    Computes mean across torch/numpy-like tensors.
    Keeps stub mode independent from torch.
    """
    try:
        return float(tensor.mean().item())
    except Exception:
        arr = np.asarray(tensor, dtype=np.float32)
        return float(arr.mean())


def _to_torch_batch(tensor_like: Any, torch_module: Any):
    """
    Ensures model input is a float32 NCHW torch tensor.
    Allows stub preprocessors to pass numpy arrays without breaking real-mode inference.
    """
    if isinstance(tensor_like, torch_module.Tensor):
        out = tensor_like
    else:
        arr = np.asarray(tensor_like, dtype=np.float32)
        out = torch_module.from_numpy(arr)

    if out.ndim == 3:
        out = out.unsqueeze(0)
    return out.float()


HIGH_RISK_CLASSES = {
    "melanoma",
    "basal_cell_carcinoma",
    "squamous_cell_carcinoma",
    "actinic_keratosis",
}


def _classify_with_hf(pil_image: Optional[Image.Image]):
    """
    Loads a Hugging Face classifier and returns (top_label, label_probs).
    Falls back to stub/model paths on any load/inference error.
    """
    if not USE_HF_MODEL or pil_image is None:
        return None

    global _hf_model, _hf_processor, _hf_torch, _hf_model_failed
    if _hf_model_failed:
        return None

    if _hf_model is None or _hf_processor is None or _hf_torch is None:
        try:
            import torch
            from transformers import AutoImageProcessor, AutoModelForImageClassification

            kwargs = {"token": HF_TOKEN} if HF_TOKEN else {}
            _hf_processor = AutoImageProcessor.from_pretrained(HF_MODEL_ID, **kwargs)
            _hf_model = AutoModelForImageClassification.from_pretrained(HF_MODEL_ID, **kwargs)
            _hf_model.eval()
            _hf_torch = torch
            print(f"[Risk Scorer] Loaded Hugging Face model: {HF_MODEL_ID}")
        except Exception as exc:
            _hf_model_failed = True
            print(f"[Risk Scorer] WARNING: Could not load HF model ({exc}). Falling back.")
            return None

    try:
        with _hf_torch.no_grad():
            inputs = _hf_processor(images=pil_image, return_tensors="pt")
            logits = _hf_model(**inputs).logits.squeeze(0)
            probs = _hf_torch.softmax(logits, dim=0).tolist()

        id2label = getattr(_hf_model.config, "id2label", {}) or {}
        raw_probs = {}
        for idx, p in enumerate(probs):
            raw_label = str(id2label.get(idx, f"class_{idx}"))
            canonical = _canonical_label(raw_label)
            if canonical in DERMATOLOGY_CLASSES:
                raw_probs[canonical] = raw_probs.get(canonical, 0.0) + float(p)

        if not raw_probs:
            return None

        total = sum(raw_probs.values())
        label_probs = {
            c: round(raw_probs.get(c, 0.0) / total, 4) for c in DERMATOLOGY_CLASSES
        }
        top_label = max(label_probs, key=label_probs.get)
        return top_label, label_probs
    except Exception as exc:
        print(f"[Risk Scorer] WARNING: HF inference failed ({exc}). Falling back.")
        return None


_LABEL_ALIASES = {
    "actinic_keratosis": "actinic_keratosis",
    "akiec": "actinic_keratosis",
    "basal_cell_carcinoma": "basal_cell_carcinoma",
    "bcc": "basal_cell_carcinoma",
    "benign_keratosis": "benign_keratosis",
    "bkl": "benign_keratosis",
    "dermatofibroma": "dermatofibroma",
    "df": "dermatofibroma",
    "melanoma": "melanoma",
    "melanocytic_nevus": "melanocytic_nevus",
    "nv": "melanocytic_nevus",
    "nevus": "melanocytic_nevus",
    "naevus": "melanocytic_nevus",
    "squamous_cell_carcinoma": "squamous_cell_carcinoma",
    "scc": "squamous_cell_carcinoma",
    "vascular_lesion": "vascular_lesion",
    "vasc": "vascular_lesion",
}


def _canonical_label(label: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
    if normalized in _LABEL_ALIASES:
        return _LABEL_ALIASES[normalized]

    if "melanoma" in normalized:
        return "melanoma"
    if "squamous" in normalized and "carcinoma" in normalized:
        return "squamous_cell_carcinoma"
    if "basal" in normalized and "carcinoma" in normalized:
        return "basal_cell_carcinoma"
    if "actinic" in normalized and "keratosis" in normalized:
        return "actinic_keratosis"
    if "keratosis" in normalized:
        return "benign_keratosis"
    if "nevus" in normalized or "naevus" in normalized:
        return "melanocytic_nevus"
    if "dermatofibroma" in normalized:
        return "dermatofibroma"
    if "vascular" in normalized:
        return "vascular_lesion"
    return normalized


def _class_to_risk_score(top_label: str, probs: dict) -> float:
    """Map ViT classification to a risk probability proxy."""
    _ = top_label
    high_risk_total = sum(probs.get(c, 0) for c in HIGH_RISK_CLASSES)
    return round(min(high_risk_total, 1.0), 4)


def _classify_risk(prob: float) -> str:
    for level, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= prob < hi:
            return level
    return "CRITICAL"


def _compute_severity(d: DetectionResult) -> float:
    score = (
        d.asymmetry_score * 2.0
        + d.border_score * 2.0
        + d.colour_variance * 2.0
        + min(d.lesion_area_ratio * 5, 1.0) * 2.0
        + min(d.diameter_estimate / 20.0, 1.0) * 2.0
    )
    return round(min(score, 10.0), 1)


def _build_summary(
    risk_level: str,
    prob: float,
    severity: float,
    label: str,
    d: DetectionResult,
) -> str:
    features = []
    if d.asymmetry_score > 0.5:
        features.append("irregular shape")
    if d.border_score > 0.5:
        features.append("uneven border")
    if d.colour_variance > 0.4:
        features.append("colour variation")
    if d.diameter_estimate > 6:
        features.append(f"estimated diameter {d.diameter_estimate:.0f}mm")

    feature_str = ", ".join(features) if features else "no major structural concerns"
    label_str = label.replace("_", " ")

    return (
        f"Risk assessment: {risk_level} (confidence {prob:.0%}). "
        f"Pattern analysis suggests features consistent with {label_str}. "
        f"Detected features: {feature_str}. "
        f"Severity score: {severity}/10."
    )
