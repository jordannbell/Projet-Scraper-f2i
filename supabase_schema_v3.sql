-- Mettre à jour la table user_preferences pour inclure le résumé du CV
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS cv_summary TEXT;

-- Mettre à jour les politiques RLS pour autoriser l'update de `cv_summary` (les politiques existantes devraient suffire si elles ciblent l'update général)
-- RAF sur les politiques RLS, celles du fichier V2 couvrent déjà toute la table user_preferences.
