import { Router } from "express";
import rateLimit from "express-rate-limit";
import { supabase } from "../services/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { Request, Response, NextFunction } from "express";
import { analyzeSkinWithGemini } from "../services/geminiService.js";

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

      // Call our local Gemini service directly
      const aiResult = await analyzeSkinWithGemini(base64Image, mimeType);

      // Return the result
      res.json({
        success: true,
        data: {
          risk_level: aiResult.risk_level,
          confidence: Math.round(aiResult.confidence * 1000) / 1000,
          severity_score: Math.round(aiResult.severity_score * 10) / 10,
          summary: aiResult.summary,
          top_label: aiResult.top_label,
          bounding_box: aiResult.bounding_box || null,
          // Sync scans typically have flags for referral and emergency
          referral_required: ["MODERATE", "HIGH", "CRITICAL"].includes(
            aiResult.risk_level,
          ),
          emergency_flag: aiResult.risk_level === "CRITICAL",
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
