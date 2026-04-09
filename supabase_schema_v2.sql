-- Exécutez ceci dans l'éditeur SQL de votre Dashboard Supabase pour mettre à jour la base de données.

-- Ajout des colonnes pour le Toggle Automatique (Bot) et le chemin du CV
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS auto_apply_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cv_storage_path TEXT;

-- Création d'un Storage Bucket public pour les CVs (facultatif si vous le créez manuellement)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de sécurité pour le bucket resumes
CREATE POLICY "Users can upload their own resume" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own resume" ON storage.objects
    FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read resumes" ON storage.objects
    FOR SELECT USING (bucket_id = 'resumes');
