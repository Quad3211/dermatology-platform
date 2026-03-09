"""
Stage 3: Image preprocessing.
Resizes, normalizes, and enhances images before model inference.
"""
import io
from typing import Tuple

import cv2
import numpy as np
from PIL import Image


# ImageNet normalization constants
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def preprocess_image(
    image_bytes: bytes,
) -> Tuple[np.ndarray, np.ndarray, Image.Image]:
    """
    Returns:
        tensor_224: NCHW float32 array [1, 3, 224, 224] for ViT.
        tensor_380: NCHW float32 array [1, 3, 380, 380] for EfficientNet.
        pil_image: original PIL image (for explainability overlays).
    """
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Improve local contrast in lesion areas.
    pil_image = _apply_clahe(pil_image)

    tensor_224 = _to_normalized_tensor(pil_image, 224)
    tensor_380 = _to_normalized_tensor(pil_image, 380)
    return tensor_224, tensor_380, pil_image


def _to_normalized_tensor(pil_image: Image.Image, size: int) -> np.ndarray:
    """
    Builds an NCHW float32 array normalized with ImageNet stats.
    Works in dev/stub mode without requiring torch/torchvision.
    """
    resized = pil_image.resize((size, size), Image.Resampling.BILINEAR)
    arr = np.asarray(resized).astype(np.float32) / 255.0  # HWC
    arr = (arr - np.array(IMAGENET_MEAN, dtype=np.float32)) / np.array(
        IMAGENET_STD,
        dtype=np.float32,
    )
    arr = np.transpose(arr, (2, 0, 1))  # CHW
    return np.expand_dims(arr, axis=0)  # NCHW


def _apply_clahe(pil_image: Image.Image) -> Image.Image:
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization)
    to the L channel (LAB color space) for better lesion visibility.
    """
    img_np = np.array(pil_image)
    img_lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    img_lab[:, :, 0] = clahe.apply(img_lab[:, :, 0])

    img_rgb = cv2.cvtColor(img_lab, cv2.COLOR_LAB2RGB)
    return Image.fromarray(img_rgb)
