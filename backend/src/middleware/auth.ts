import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index.js";

// Supabase client for JWT verification only (anon key is fine for getUser)
const verifyClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

/**
 * JWT verification middleware.
 * Reads Bearer token from Authorization header, validates via Supabase,
 * and attaches user info to req.
 */
export async function verifyJWT(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authorization header missing or malformed.",
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const {
    data: { user },
    error,
  } = await verifyClient.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "JWT token is invalid or expired.",
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const authedReq = req as AuthenticatedRequest;
  authedReq.userId = user.id;
  authedReq.userEmail = user.email ?? "";
  authedReq.role =
    (user.user_metadata?.role as AuthenticatedRequest["role"]) ?? "patient";

  next();
}
