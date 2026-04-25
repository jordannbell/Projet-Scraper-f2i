-- Run this in Supabase SQL editor to update schema safely.

-- Add columns for auto-apply toggle and CV path.
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS auto_apply_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cv_storage_path TEXT;

-- Create a PRIVATE storage bucket for resumes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the resumes bucket.
CREATE POLICY "Users can upload their own resume" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'resumes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own resume" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'resumes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can read their own resume" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'resumes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
