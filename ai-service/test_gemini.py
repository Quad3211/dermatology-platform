import os
import io
from PIL import Image

# Read env local manually
with open('.env.local', 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            key, val = line.split('=', 1)
            os.environ[key] = val

from pipeline.gemini_analyzer import analyze_skin_with_gemini

def main():
    # Create a dummy image
    img = Image.new('RGB', (224, 224), color = 'pink')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    print("Testing Gemini Vision API with dummy skin image...")
    try:
        result = analyze_skin_with_gemini(img_bytes)
        print("Success! Gemini result:")
        print(result)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
