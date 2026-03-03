"""Storage client utilities — downloads images from signed URLs."""
import httpx


def download_image(url: str, timeout: int = 15) -> bytes:
    """
    Downloads an image from a signed Supabase Storage URL.
    Raises httpx.HTTPError on failure.
    """
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        response = client.get(url)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        raise ValueError(f"Expected image content-type, got: {content_type}")

    return response.content
