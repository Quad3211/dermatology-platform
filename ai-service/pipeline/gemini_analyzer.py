import os
import json
import google.generativeai as genai
from pydantic import BaseModel, Field

# Ensure GEMINI_API_KEY is configured
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("[Gemini Analyzer] WARNING: GEMINI_API_KEY environment variable not set. Gemini integration will fail.")
else:
    genai.configure(api_key=api_key)

class SkinAnalysisOutput(BaseModel):
    risk_level: str = Field(description="Must be one of: LOW, MODERATE, HIGH, CRITICAL")
    confidence: float = Field(description="A float between 0.0 and 1.0 representing the AI's confidence.")
    severity_score: float = Field(description="A float between 0.0 and 10.0 representing the severity.")
    top_label: str = Field(description="The primary label. If disease, use medical term (e.g., 'melanoma', 'basal_cell_carcinoma', 'actinic_keratosis', 'benign_keratosis', 'dermatofibroma', 'vascular_lesion', 'squamous_cell_carcinoma', 'melanocytic_nevus'). If healthy/no visible disease, use 'healthy_skin'.")
    summary: str = Field(description="A text explanation. If a disease is detected, describe it and why it looks concerning. IF HEALTHY/NO DISEASE is visible, you MUST provide customized skincare tips based on the appearance of the skin (e.g., hydration, sun protection, routine advice).")


def analyze_skin_with_gemini(image_bytes: bytes) -> dict:
    """
    Takes raw image bytes, sends them to Gemini 2.5 Flash, 
    and returns a structured JSON result matching SkinAnalysisOutput.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = (
        "You are an expert dermatology AI assistant. Analyze the provided image of human skin. "
        "Your task is to either detect signs of skin disease OR provide general skincare tips if the skin appears healthy. "
        "If you detect a disease, classify it (e.g., melanoma, basal_cell_carcinoma, etc.), assign a risk level, "
        "severity score, and explain your findings in the summary. "
        "If you DO NOT detect any visible disease, classify it as 'healthy_skin', set risk to LOW, severity to 0, "
        "and YOU MUST use the 'summary' field to provide helpful, personalized skincare tips based on the skin type, "
        "texture, or context in the image (e.g., 'Your skin looks well hydrated. To maintain it, consider...'). "
        "Respond with a strict JSON object following the instructed schema."
    )

    try:
        response = model.generate_content(
            [
                {"mime_type": "image/jpeg", "data": image_bytes},
                prompt
            ],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=SkinAnalysisOutput,
            )
        )
        # Parse the JSON response
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"[Gemini Analyzer] Error during API call: {e}")
        raise e
