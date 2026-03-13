-- ============================================================
-- Migration 010: Allow patients to view doctor profiles
-- Needed so patients can see available doctors when booking
-- ============================================================

CREATE POLICY "profiles_patients_view_doctors"
    ON public.profiles FOR SELECT
    USING (
        -- Allow any authenticated user to view doctor profiles
        role = 'doctor'
        AND auth.uid() IS NOT NULL
    );
