"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle, Zap } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { apiFetch } from "@/utils/api";

export default function AutoApplySettingsPanel() {
    const [targetTitle, setTargetTitle] = useState("");
    const [targetKeywords, setTargetKeywords] = useState("");
    const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchPreferences = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Also create the bucket if it doesn't exist? (Ideally done manually in dashboard)

                const { data } = await supabase
                    .from("user_preferences")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();
                if (data) {
                    setTargetTitle(data.target_job_title || "");
                    setTargetKeywords(data.target_keywords || "");
                    setAutoApplyEnabled(data.auto_apply_enabled || false);
                }
            }
        };
        fetchPreferences();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !userId) return;

        const file = e.target.files[0];
        if (file.type !== "application/pdf") {
            setMessage("Veuillez uploader un fichier PDF.");
            return;
        }

        setLoading(true);
        setMessage("L'IA Gemini analyse votre CV en cours...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await apiFetch("/api/profile/upload-cv", {
                method: "POST",
                body: formData,
                requireAuth: true
            });

            const data = await res.json();

            if (res.ok && data.status === "success") {
                setTargetTitle(data.extracted_title || "");
                setTargetKeywords(data.extracted_keywords || "");
                setMessage("✅ CV analysé avec succès ! Vos critères ont été détectés et sauvegardés.");

                // Upload to Supabase Storage Bucket 'resumes'
                const { error } = await supabase.storage.from("resumes").upload(`${userId}/cv.pdf`, file, { upsert: true });
                if (error && error.message !== "The resource already exists") {
                    console.error("Storage upload error:", error);
                } else {
                    await supabase.from("user_preferences").upsert({
                        user_id: userId,
                        cv_storage_path: `${userId}/cv.pdf`,
                    });
                }
            } else {
                setMessage(`Erreur: ${data.detail || "Impossible d'analyser le CV"}`);
            }
        } catch (error) {
            console.error(error);
            setMessage("Erreur réseau lors de l'envoi du CV.");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSavePreferences = async () => {
        if (!userId) return;
        setLoading(true);
        setMessage("");
        try {
            const { error } = await supabase
                .from("user_preferences")
                .upsert({
                    user_id: userId,
                    target_job_title: targetTitle,
                    target_keywords: targetKeywords
                });

            if (error) throw error;
            setMessage("Vos préférences de candidature ont été enregistrées.");
        } catch (err) {
            console.error(err);
            setMessage("Erreur lors de l'enregistrement.");
        } finally {
            setLoading(false);
        }
    };

    const toggleAutoApply = async () => {
        if (!userId) return;
        const newState = !autoApplyEnabled;
        setAutoApplyEnabled(newState);

        // Save flag immediately
        await supabase
            .from("user_preferences")
            .upsert({ user_id: userId, auto_apply_enabled: newState });
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <Zap className="text-yellow-400" /> Auto-Apply Bot
                    </h2>
                    <p className="text-slate-400 mt-1">Laissez l&apos;IA tenter des candidatures lorsque le site le permet.</p>
                    <p className="text-slate-500 text-sm mt-2">
                        Renseignez prénom, nom, consentement et options sur la page{" "}
                        <Link href="/auto-apply" className="text-blue-400 hover:underline">Auto-apply</Link>
                        {" "}avant d&apos;activer le pilote.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-300">
                        {autoApplyEnabled ? "Bot Activé" : "Désactivé"}
                    </span>
                    <button
                        onClick={toggleAutoApply}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoApplyEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoApplyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* File Upload Zone */}
                <div
                    className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-200">Uploader votre CV (.pdf)</h3>
                    <p className="text-slate-500 text-sm mt-1">L'IA Gemini l'analysera pour en extraire votre Titre et Compétences cibles automatiquement.</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="application/pdf"
                        className="hidden"
                    />
                </div>

                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${message.includes('Erreur') ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                        {message}
                    </div>
                )}

                {/* AI Extracted Fields */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2">Vos Critères Cibles (Générés par IA)</h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Poste visé</label>
                        <input
                            type="text"
                            value={targetTitle}
                            onChange={(e) => setTargetTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Compétences clés détectées</label>
                        <textarea
                            value={targetKeywords}
                            onChange={(e) => setTargetKeywords(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                        onClick={handleSavePreferences}
                        disabled={loading}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Sauvegarder les modifications
                    </button>
                </div>
            </div>
        </div>
    );
}
