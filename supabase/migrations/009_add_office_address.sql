-- ============================================================
-- Migration 009: Add office_address to profiles
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS office_address TEXT;
