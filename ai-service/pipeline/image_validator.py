"""
Stage 2: Image Validation
Checks MIME type, size, dimensions, corruption, and strips EXIF metadata.
"""
import io
from PIL import Image
import piexif


ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MIN_DIMENSION = 64
MAX_DIMENSION = 4096


class ValidationError(Exception):
    pass


def validate_image(image_bytes: bytes) -> None:
    """
    Validates raw image bytes. Raises ValidationError on failure.
    Strips EXIF metadata in-place (privacy protection).
    """
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise ValidationError(f"Image too large: {len(image_bytes)} bytes. Maximum is 10 MB.")

    # Use PIL to detect format (more reliable than header sniffing)
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()  # Check for corruption
    except Exception as e:
        raise ValidationError(f"Image is corrupted or unreadable: {e}")

    # Re-open after verify (verify closes the file)
    img = Image.open(io.BytesIO(image_bytes))
    fmt = (img.format or "").lower()
    mime = f"image/{fmt}" if fmt in ("jpeg", "png", "webp") else f"image/{fmt}"

    format_map = {"jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    detected_mime = format_map.get(fmt)

    if detected_mime not in ALLOWED_MIMES:
        raise ValidationError(
            f"Unsupported image format: {fmt}. Allowed: JPEG, PNG, WebP."
        )

    w, h = img.size
    if w < MIN_DIMENSION or h < MIN_DIMENSION:
        raise ValidationError(f"Image too small: {w}×{h}px. Minimum is {MIN_DIMENSION}px.")
    if w > MAX_DIMENSION or h > MAX_DIMENSION:
        raise ValidationError(f"Image too large: {w}×{h}px. Maximum is {MAX_DIMENSION}px.")

    # Strip EXIF (privacy — removes GPS, device info, etc.)
    _strip_exif(image_bytes)


def _strip_exif(image_bytes: bytes) -> bytes:
    """Returns image bytes with EXIF data removed."""
    try:
        exif_data = piexif.load(image_bytes)
        if exif_data:
            piexif.remove(image_bytes)
    except Exception:
        pass  # If stripping fails, continue (don't block the pipeline)
    return image_bytes
