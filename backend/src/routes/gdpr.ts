/**
 * GDPR Routes — Admin only
 * Right to Erasure (Art. 17) + Data Export (Art. 20)
 */
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { supabase } from "../services/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { auditLog } from "../middleware/auditLogger.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type { Request, Response, NextFunction } from "express";

export const gdprRouter = Router();

// ── DELETE /gdpr/users/:userId — Right to Erasure (Art. 17) ──
gdprRouter.delete(
  "/users/:userId",
  verifyJWT,
  requireRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = req as AuthenticatedRequest;
      const userId = String(req.params.userId);

      // 1. Get all uploads → delete storage objects
      const { data: uploads } = await supabase
        .from("uploads")
        .select("id, storage_path")
        .eq("user_id", userId);

      if (uploads && uploads.length > 0) {
        const paths = uploads.map(
          (u: { id: string; storage_path: string }) => u.storage_path,
        );
        await supabase.storage.from("skin-images").remove(paths);
      }

      // 2. Delete auth user (cascades to profiles, uploads, analysis, consultations via FK)
      const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
      if (authErr) throw new HttpError(500, "ERASURE_FAILED", authErr.message);

      // 3. Audit log (retained per legal obligation — not deleted with user)
      await auditLog("gdpr.erasure", {
        userId: admin.userId,
        resourceType: "user",
        resourceId: userId,
        metadata: {
          storageObjectsDeleted: uploads?.length ?? 0,
          requestedBy: admin.userId,
          gdprArticle: "17",
        },
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] ?? ""),
      });

      res.json({ message: "User data erased successfully.", userId });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /gdpr/users/:userId/export — Data Export (Art. 20) ───
gdprRouter.get(
  "/users/:userId/export",
  verifyJWT,
  requireRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = req as AuthenticatedRequest;
      const userId = String(req.params.userId);

      // Fetch uploads first so we can join analysis by upload_id
      const { data: uploads } = await supabase
        .from("uploads")
        .select("id, filename, mime_type, body_part, status, created_at")
        .eq("user_id", userId);

      const uploadIds = (uploads ?? []).map((u: { id: string }) => u.id);

      const [profileRes, analysisRes, consultationsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        uploadIds.length > 0
          ? supabase
              .from("analysis_results")
              .select(
                "id, status, risk_level, confidence, summary, referral_required, emergency_flag, created_at",
              )
              .in("upload_id", uploadIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from("consultations")
          .select(
            "id, status, urgency, patient_notes, preferred_date, created_at",
          )
          .eq("patient_id", userId),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        gdprArticle: "20",
        data: {
          profile: profileRes.data,
          uploads: uploads ?? [],
          analysis: analysisRes.data ?? [],
          consultations: consultationsRes.data ?? [],
        },
      };

      await auditLog("gdpr.export", {
        userId: admin.userId,
        resourceType: "user",
        resourceId: userId,
        metadata: { gdprArticle: "20", requestedBy: admin.userId },
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] ?? ""),
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="user-export-${userId}.json"`,
      );
      res.json(exportPayload);
    } catch (err) {
      next(err);
    }
  },
);
