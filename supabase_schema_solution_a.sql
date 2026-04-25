-- Solution A : statuts job_matches, file d'attente, profil candidat, consentement, identifiants chiffrés, colonnes de traçabilité.
-- À exécuter dans l'éditeur SQL Supabase (après les scripts v2–v4 existants).

-- ---------------------------------------------------------------------------
-- 1) job_matches : nouveaux statuts + métadonnées d'application
-- ---------------------------------------------------------------------------
ALTER TABLE public.job_matches
  ADD COLUMN IF NOT EXISTS apply_error TEXT,
  ADD COLUMN IF NOT EXISTS apply_handler_used TEXT,
  ADD COLUMN IF NOT EXISTS apply_screenshot_path TEXT,
  ADD COLUMN IF NOT EXISTS apply_finished_at TIMESTAMPTZ;

ALTER TABLE public.job_matches DROP CONSTRAINT IF EXISTS job_matches_status_check;

ALTER TABLE public.job_matches ADD CONSTRAINT job_matches_status_check CHECK (
  status IN (
    'pending_validation',
    'queued',
    'applying',
    'applied',
    'rejected',
    'failed',
    'needs_manual'
  )
);

-- ---------------------------------------------------------------------------
-- 2) user_preferences : profil candidat + consentement auto-apply
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS applicant_first_name TEXT,
  ADD COLUMN IF NOT EXISTS applicant_last_name TEXT,
  ADD COLUMN IF NOT EXISTS applicant_phone TEXT,
  ADD COLUMN IF NOT EXISTS applicant_city TEXT,
  ADD COLUMN IF NOT EXISTS applicant_linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS auto_apply_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_apply_consent_version TEXT;

-- ---------------------------------------------------------------------------
-- 3) File d'attente worker (accès uniquement service_role côté backend)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.apply_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.job_matches (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'dead')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_apply_queue_pending ON public.apply_queue (created_at)
  WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS uq_apply_queue_active_match_user
  ON public.apply_queue (match_id, user_id)
  WHERE status IN ('pending', 'processing');

ALTER TABLE public.apply_queue ENABLE ROW LEVEL SECURITY;

-- Aucune policy : les clients JWT ne voient pas la file ; le backend utilise service_role.

-- ---------------------------------------------------------------------------
-- 4) Identifiants plateforme (chiffrés côté app — payload Fernet)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_platform_credentials (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  credential_encrypted TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, platform)
);

ALTER TABLE public.user_platform_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own platform credentials"
  ON public.user_platform_credentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5) Bucket captures d'échec (privé ; uploads via service_role)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('apply_screenshots', 'apply_screenshots', false)
ON CONFLICT (id) DO NOTHING;
