import { Router } from "express";
import rateLimit from "express-rate-limit";
import { supabase } from "../services/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const publicRouter = Router();

const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Public scan rate limit reached. Please wait 15 minutes.",
    },
  },
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const STORAGE_BUCKET = "skin-images";

// ── POST /public/scan ─────────────────────────────────────────────
publicRouter.post(
  "/scan",
  publicRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { base64Image, mimeType } = req.body;
      if (!base64Image || !mimeType) {
        throw new HttpError(
          400,
          "BAD_REQUEST",
          "base64Image and mimeType are required.",
        );
      }

      // 1. Upload temporarily to Supabase using Service Key to bypass RLS
      const buffer = Buffer.from(base64Image, "base64");
      const tempPath = `public-scans/${crypto.randomUUID()}.${mimeType.split("/")[1]}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(tempPath, buffer, {
          contentType: mimeType,
        });

      if (uploadError) {
        throw new HttpError(
          500,
          "STORAGE_ERROR",
          "Failed to upload image temporarily.",
        );
      }

      try {
        // 2. Get a signed url
        const { data: signedData, error: signError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(tempPath, 300);

        if (signError || !signedData?.signedUrl) {
          throw new HttpError(
            500,
            "STORAGE_ERROR",
            "Failed to generate signed url.",
          );
        }

        // 3. Send to AI Service sync endpoint
        const aiResponse = await fetch(`${AI_SERVICE_URL}/analyze-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: signedData.signedUrl }),
        });

        if (!aiResponse.ok) {
          throw new HttpError(500, "AI_ERROR", "AI service failed to analyze.");
        }

        const aiResult = await aiResponse.json();

        // 4. Return the result
        res.json({
          success: true,
          data: aiResult,
        });
      } finally {
        // 5. Always delete the temp image immediately to protect privacy
        await supabase.storage.from(STORAGE_BUCKET).remove([tempPath]);
      }
    } catch (err) {
      next(err);
    }
  },
);
