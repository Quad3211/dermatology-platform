"""
Stage 3: Image Preprocessing
Resizes, normalises, and enhances images before model inference.
"""
import io
from typing import Tuple

import numpy as np
from PIL import Image
import cv2
import torch
import torchvision.transforms as T


# ImageNet normalisation constants
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# Transform for ViT (224×224)
transform_224 = T.Compose([
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# Transform for EfficientNet (380×380)
transform_380 = T.Compose([
    T.Resize((380, 380)),
    T.ToTensor(),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def preprocess_image(
    image_bytes: bytes,
) -> Tuple[torch.Tensor, torch.Tensor, Image.Image]:
    """
    Returns:
        tensor_224: Batch tensor [1, 3, 224, 224] for ViT
        tensor_380: Batch tensor [1, 3, 380, 380] for EfficientNet
        pil_image:  Original PIL image (for GradCAM overlay)
    """
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Apply CLAHE enhancement (improves lesion contrast)
    pil_image = _apply_clahe(pil_image)

    tensor_224 = transform_224(pil_image).unsqueeze(0)  # [1, 3, 224, 224]
    tensor_380 = transform_380(pil_image).unsqueeze(0)  # [1, 3, 380, 380]

    return tensor_224, tensor_380, pil_image


def _apply_clahe(pil_image: Image.Image) -> Image.Image:
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization)
    to the L channel (LAB colour space) for better lesion visibility.
    """
    img_np  = np.array(pil_image)
    img_lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    img_lab[:, :, 0] = clahe.apply(img_lab[:, :, 0])

    img_rgb = cv2.cvtColor(img_lab, cv2.COLOR_LAB2RGB)
    return Image.fromarray(img_rgb)
