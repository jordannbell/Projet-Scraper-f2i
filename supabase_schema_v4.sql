-- Script SQL V4 - Ajout de l'heure programmée pour l'auto-apply

-- Ajout de la colonne pour l'heure préférée d'exécution de la campagne
-- Format par défaut : 08:00 (Matin)
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS preferred_apply_time TIME WITHOUT TIME ZONE DEFAULT '08:00:00';
