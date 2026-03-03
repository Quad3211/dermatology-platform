import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { supabase } from "../services/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { Request, Response, NextFunction } from "express";

export const auditRouter = Router();

// ── GET /audit — admin only ───────────────────────────────────
auditRouter.get(
  "/",
  verifyJWT,
  requireRole("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(String(req.query.page ?? "1"), 10);
      const limit = Math.min(
        parseInt(String(req.query.limit ?? "50"), 10),
        200,
      );
      const event = req.query.event as string | undefined;
      const userId = req.query.userId as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (event) query = query.eq("event", event);
      if (userId) query = query.eq("user_id", userId);
      if (from) query = query.gte("timestamp", from);
      if (to) query = query.lte("timestamp", to);

      const { data, count, error } = await query;
      if (error)
        throw new HttpError(500, "DB_ERROR", "Failed to fetch audit logs.");

      res.json({
        data: data ?? [],
        pagination: { page, limit, total: count ?? 0 },
      });
    } catch (err) {
      next(err);
    }
  },
);
