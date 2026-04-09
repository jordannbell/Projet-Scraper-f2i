-- Script SQL à exécuter dans l'éditeur SQL de votre Dashboard Supabase

-- 1. Création de la table job_matches pour stocker les offres correspondantes
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_data JSONB NOT NULL, -- Stocke les détails de l'annonce (titre, entreprise, lien...)
    match_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('pending_validation', 'applied', 'rejected', 'failed')),
    generated_cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ajout des politiques RLS (Row Level Security)
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres matchs"
    ON public.job_matches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres matchs"
    ON public.job_matches FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Création de la table user_preferences (pour stocker les limites et critères)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    target_job_title TEXT,
    target_keywords TEXT,
    applications_sent_today INTEGER DEFAULT 0,
    last_application_date DATE
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent voir et modifier leurs préférences"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id);
