"""
Stage 8: Explainability (XAI)
Generates GradCAM heatmaps and attention region maps.
Uploads heatmap to Supabase Storage.
Dev: Returns stub metadata.
"""
import io
import os
import uuid
from dataclasses import dataclass, field
from typing import List

import numpy as np
from PIL import Image
import torch

from .lesion_detector import DetectionResult


@dataclass
class AttentionRegion:
    x:      int
    y:      int
    width:  int
    height: int
    score:  float


@dataclass
class XAIResult:
    gradcam_url:       str | None
    attention_regions: List[AttentionRegion]
    top_features:      List[str]
    explanation:       str

    def to_dict(self) -> dict:
        return {
            "gradcamUrl":        self.gradcam_url,
            "attentionRegions":  [
                {"x": r.x, "y": r.y, "width": r.width, "height": r.height, "score": r.score}
                for r in self.attention_regions
            ],
            "topFeatures":       self.top_features,
            "explanation":       self.explanation,
        }


USE_REAL_MODEL = os.getenv("USE_REAL_MODELS", "false").lower() == "true"
XAI_BUCKET     = "xai-outputs"


def generate_xai(
    tensor_380:  torch.Tensor,
    pil_image:   Image.Image,
    detection:   DetectionResult,
    analysis_id: str,
) -> XAIResult:
    """
    Generates GradCAM overlay and attention regions.
    Uploads heatmap PNG to Supabase Storage.
    """
    if USE_REAL_MODEL:
        return _real_xai(tensor_380, pil_image, detection, analysis_id)
    return _stub_xai(pil_image, detection, analysis_id)


def _stub_xai(pil_image: Image.Image, detection: DetectionResult, analysis_id: str) -> XAIResult:
    """
    Stub: generates a simple heatmap highlight over the detected bounding box.
    Uploads it to Supabase Storage.
    """
    heatmap_url = _generate_stub_heatmap(pil_image, detection, analysis_id)

    # Derive features from ABCDE scores
    features = []
    if detection.asymmetry_score > 0.5:   features.append("asymmetry")
    if detection.border_score > 0.5:       features.append("irregular_border")
    if detection.colour_variance > 0.4:    features.append("uneven_pigmentation")
    if detection.diameter_estimate > 6:    features.append("large_diameter")
    if not features:                       features.append("no_major_features")

    explanation = (
        f"The highlighted region shows the area the model focused on. "
        f"Key features detected: {', '.join(features).replace('_', ' ')}. "
        f"Lesion area covers {detection.lesion_area_ratio:.0%} of the image."
    )

    regions = []
    if detection.bounding_boxes:
        bb = detection.bounding_boxes[0]
        regions.append(AttentionRegion(
            x=bb.x, y=bb.y, width=bb.width, height=bb.height, score=bb.confidence
        ))

    return XAIResult(
        gradcam_url=heatmap_url,
        attention_regions=regions,
        top_features=features[:3],
        explanation=explanation,
    )


def _generate_stub_heatmap(pil_image: Image.Image, detection: DetectionResult, analysis_id: str) -> str | None:
    """Creates a simple red-highlight overlay over the bounding box."""
    try:
        from services.supabase_client import get_supabase

        img = pil_image.copy().convert("RGBA")
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        overlay_np = np.array(overlay)

        if detection.bounding_boxes:
            bb = detection.bounding_boxes[0]
            # Draw semi-transparent red over the lesion region
            intensity = int(detection.cnn_confidence * 180)
            overlay_np[bb.y:bb.y+bb.height, bb.x:bb.x+bb.width] = [255, 0, 0, intensity]

        overlay_img = Image.fromarray(overlay_np, "RGBA")
        result = Image.alpha_composite(img, overlay_img).convert("RGB")

        buf = io.BytesIO()
        result.save(buf, format="PNG")
        buf.seek(0)

        path = f"gradcam/{analysis_id}.png"
        supabase = get_supabase()
        supabase.storage.from_(XAI_BUCKET).upload(
            path=path,
            file=buf.getvalue(),
            file_options={"content-type": "image/png"},
        )

        # Get signed URL (valid 7 days)
        url_res = supabase.storage.from_(XAI_BUCKET).create_signed_url(path, 604800)
        return url_res.get("signedURL") or url_res.get("signedUrl")

    except Exception as e:
        print(f"[XAI] Heatmap generation failed: {e}")
        return None


def _real_xai(tensor_380, pil_image, detection, analysis_id) -> XAIResult:
    """Placeholder for real GradCAM via pytorch-grad-cam library."""
    # TODO: Implement real GradCAM using:
    # from pytorch_grad_cam import GradCAM
    # from pytorch_grad_cam.utils.image import show_cam_on_image
    return _stub_xai(pil_image, detection, analysis_id)
