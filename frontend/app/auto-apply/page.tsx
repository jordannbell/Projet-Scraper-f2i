"use client";

import { useEffect, useState, useRef } from "react";
import { UploadCloud, CheckCircle, Zap, Bot, History, ExternalLink, MapPin, Briefcase, FileText, Loader2, Sparkles, AlertTriangle, XCircle, Clock } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from "@/utils/supabase/client";
import { apiFetch } from "@/utils/api";
import StatusMessage from "@/components/ui/StatusMessage";

const CONSENT_VERSION = "2026-04-09";

interface HistoryMatch {
    id: string;
    created_at: string;
    status: string;
    match_score: number;
    apply_error?: string | null;
    job_data?: {
        titre?: string;
        entreprise?: string;
        entreprise_lieu?: string;
        lien?: string;
        url?: string;
    };
}

export default function AutoApplyPage() {
    const router = useRouter();
    const { t } = useLanguage();

    // Preferences state
    const [targetTitle, setTargetTitle] = useState("");
    const [targetKeywords, setTargetKeywords] = useState("");
    const [cvSummary, setCvSummary] = useState("");
    const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
    const [cvDownloadUrl, setCvDownloadUrl] = useState<string | null>(null);
    const [preferredTime, setPreferredTime] = useState("08:00");
    const [isRunningNow, setIsRunningNow] = useState(false);

    const [applicantFirstName, setApplicantFirstName] = useState("");
    const [applicantLastName, setApplicantLastName] = useState("");
    const [applicantPhone, setApplicantPhone] = useState("");
    const [applicantCity, setApplicantCity] = useState("");
    const [applicantLinkedin, setApplicantLinkedin] = useState("");
    const [hasConsent, setHasConsent] = useState(false);
    const [hwLogin, setHwLogin] = useState("");
    const [hwPassword, setHwPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [history, setHistory] = useState<HistoryMatch[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            const uid = session.user.id;
            setUserId(uid);

            // Generate a short-lived signed URL for CV traceability
            const { data: signedData } = await supabase.storage
                .from("resumes")
                .createSignedUrl(`${uid}/cv.pdf`, 60 * 60);
            setCvDownloadUrl(signedData?.signedUrl || null);

            // Preferences
            const { data: prefs } = await supabase
                .from("user_preferences")
                .select("*")
                .eq("user_id", uid)
                .single();

            if (prefs) {
                setTargetTitle(prefs.target_job_title || "");
                setTargetKeywords(prefs.target_keywords || "");
                setCvSummary(prefs.cv_summary || "");
                setAutoApplyEnabled(prefs.auto_apply_enabled || false);
                setPreferredTime(prefs.preferred_apply_time ? prefs.preferred_apply_time.substring(0, 5) : "08:00");
                setApplicantFirstName(prefs.applicant_first_name || "");
                setApplicantLastName(prefs.applicant_last_name || "");
                setApplicantPhone(prefs.applicant_phone || "");
                setApplicantCity(prefs.applicant_city || "");
                setApplicantLinkedin(prefs.applicant_linkedin_url || "");
                setHasConsent(!!prefs.auto_apply_consent_at);
            }

            // Application History
            const { data: matches } = await supabase
                .from("job_matches")
                .select("*")
                .eq("user_id", uid)
                .in("status", ["applied", "needs_manual", "failed", "queued", "applying"])
                .order("created_at", { ascending: false });

            if (matches) {
                setHistory(matches);
            }
        };
        fetchData();
    }, [router]);

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
                setCvSummary(data.cv_summary || "");
                setMessage("✅ CV analysé avec succès ! Vos critères et votre résumé ont été générés.");

                // Backup CV in Storage
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
                    target_keywords: targetKeywords,
                    preferred_apply_time: preferredTime + ":00"
                });

            if (error) throw error;
            setMessage("Vos préférences de candidature ont été enregistrées.");
        } catch (err) {
            console.error(err);
            setMessage("Erreur lors de l'enregistrement.");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(""), 5000);
        }
    };

    const toggleAutoApply = async () => {
        if (!userId) return;
        const newState = !autoApplyEnabled;
        setAutoApplyEnabled(newState);

        await supabase
            .from("user_preferences")
            .upsert({ user_id: userId, auto_apply_enabled: newState });
    };

    const handleRunNow = async () => {
        if (!userId) return;
        setIsRunningNow(true);
        setMessage(t('auto_apply.running_now_msg'));
        try {
            const res = await apiFetch("/api/auto-apply/run-now", {
                method: "POST",
                body: JSON.stringify({}),
                requireAuth: true
            });
            if (res.ok) {
                setMessage(t('auto_apply.run_success'));
            } else {
                setMessage(t('auto_apply.run_error'));
            }
        } catch (err) {
            console.error(err);
            setMessage(t('auto_apply.run_error'));
        } finally {
            setTimeout(() => { setIsRunningNow(false); setMessage(""); }, 5000);
        }
    };

    const handleSaveApplicant = async () => {
        if (!userId) return;
        setLoading(true);
        setMessage("");
        try {
            const res = await apiFetch("/api/profile/applicant", {
                method: "PATCH",
                body: JSON.stringify({
                    applicant_first_name: applicantFirstName,
                    applicant_last_name: applicantLastName,
                    applicant_phone: applicantPhone || undefined,
                    applicant_city: applicantCity || undefined,
                    applicant_linkedin_url: applicantLinkedin || undefined,
                }),
                requireAuth: true,
            });
            const data = await res.json().catch(() => ({}));
            setMessage(res.ok ? "Profil candidat enregistré." : (data.detail || "Erreur profil"));
        } catch {
            setMessage("Erreur réseau (profil).");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(""), 4000);
        }
    };

    const handleConsent = async () => {
        if (!userId) return;
        setLoading(true);
        setMessage("");
        try {
            const res = await apiFetch("/api/profile/auto-apply-consent", {
                method: "POST",
                body: JSON.stringify({ version: CONSENT_VERSION }),
                requireAuth: true,
            });
            if (res.ok) {
                setHasConsent(true);
                setMessage(t("auto_apply.consent_ok"));
            } else {
                const data = await res.json().catch(() => ({}));
                setMessage(data.detail || "Erreur consentement");
            }
        } catch {
            setMessage("Erreur réseau (consentement).");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(""), 4000);
        }
    };

    const handleHwCredential = async () => {
        if (!userId || !hwLogin.trim() || !hwPassword) return;
        setLoading(true);
        setMessage("");
        try {
            const res = await apiFetch("/api/profile/platform-credential", {
                method: "POST",
                body: JSON.stringify({
                    platform: "hellowork",
                    login: hwLogin.trim(),
                    password: hwPassword,
                }),
                requireAuth: true,
            });
            const data = await res.json().catch(() => ({}));
            setMessage(res.ok ? "Identifiants HelloWork enregistrés (chiffrés)." : (data.detail || "Erreur identifiants"));
            if (res.ok) setHwPassword("");
        } catch {
            setMessage("Erreur réseau (identifiants).");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(""), 5000);
        }
    };

    return (
        <div className="app-shell relative min-h-screen overflow-hidden px-4 pb-12 pt-24 font-sans text-white sm:px-6 lg:px-8">
            {/* Animated Ambient Background (ReactBits Inspired) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#0052FF]/20 rounded-full blur-[120px] opacity-60 mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] opacity-40 mix-blend-screen" style={{ animation: 'pulse 8s infinite alternate' }}></div>
            </div>

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">

                {/* Header Section (Glassmorphism & Glow) */}
                <div className="premium-card group relative flex flex-col justify-between gap-8 overflow-hidden rounded-[2rem] p-10 lg:flex-row lg:items-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0052FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-in-out"></div>

                    <div className="relative z-10 flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0052FF]/10 border border-[#0052FF]/20 mb-6 text-[#0052FF] text-sm font-semibold tracking-wide">
                            <Bot className="w-4 h-4" /> PILOTE AUTOMATIQUE
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight">
                            {t('auto_apply.title')}
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                            {t('auto_apply.desc')}
                        </p>
                        <div className="mt-4 flex gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-100/90 text-sm leading-relaxed max-w-2xl">
                            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                            <span>{t('auto_apply.legal_disclaimer')}</span>
                        </div>
                    </div>

                    <div className="premium-card relative z-10 flex shrink-0 items-center gap-6 rounded-[1.5rem] p-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('auto_apply.bot_status')}</span>
                            <span className={`text-xl font-black flex items-center gap-3 ${autoApplyEnabled ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-slate-500'}`}>
                                {autoApplyEnabled ? (
                                    <><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span> {t('auto_apply.active')}</>
                                ) : (
                                    <><span className="w-3 h-3 rounded-full bg-slate-500 shadow-inner block"></span> {t('auto_apply.paused')}</>
                                )}
                            </span>
                        </div>
                        <button
                            onClick={toggleAutoApply}
                            className={`ml-2 relative inline-flex h-10 w-[72px] items-center rounded-full transition-all duration-500 ease-spring ${autoApplyEnabled ? 'bg-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : 'bg-slate-800 border border-slate-700'}`}
                        >
                            <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-500 ease-spring ${autoApplyEnabled ? 'translate-x-[36px]' : 'translate-x-[4px]'} shadow-lg`} />
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Settings Panel (Left - 5 cols) */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="premium-card space-y-6 rounded-[2rem] p-8">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#0052FF]" /> {t("auto_apply.applicant_title")}
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t("auto_apply.applicant_first")}</label>
                                    <input suppressHydrationWarning value={applicantFirstName} onChange={(e) => setApplicantFirstName(e.target.value)} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t("auto_apply.applicant_last")}</label>
                                    <input suppressHydrationWarning value={applicantLastName} onChange={(e) => setApplicantLastName(e.target.value)} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t("auto_apply.applicant_phone")}</label>
                                    <input suppressHydrationWarning value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t("auto_apply.applicant_city")}</label>
                                    <input suppressHydrationWarning value={applicantCity} onChange={(e) => setApplicantCity(e.target.value)} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t("auto_apply.applicant_linkedin")}</label>
                                <input suppressHydrationWarning value={applicantLinkedin} onChange={(e) => setApplicantLinkedin(e.target.value)} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                            </div>
                            <button type="button" onClick={handleSaveApplicant} disabled={loading} className="btn-secondary w-full py-3 font-bold">
                                {t("auto_apply.save_applicant")}
                            </button>

                            <div className="border-t border-white/10 pt-6 space-y-3">
                                <h3 className="text-sm font-bold text-white">{t("auto_apply.consent_title")}</h3>
                                <p className="text-sm text-slate-400">{t("auto_apply.consent_text")}</p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button type="button" onClick={handleConsent} disabled={loading} className="btn-primary px-5 py-3 font-bold">
                                        {t("auto_apply.consent_btn")}
                                    </button>
                                    {hasConsent && <span className="text-xs text-emerald-400 font-semibold">OK</span>}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6 space-y-3">
                                <h3 className="text-sm font-bold text-white">{t("auto_apply.platform_title")}</h3>
                                <p className="text-xs text-slate-500">{t("auto_apply.platform_desc")}</p>
                                <input suppressHydrationWarning value={hwLogin} onChange={(e) => setHwLogin(e.target.value)} placeholder={t("auto_apply.platform_login")} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" autoComplete="username" />
                                <input suppressHydrationWarning type="password" value={hwPassword} onChange={(e) => setHwPassword(e.target.value)} placeholder={t("auto_apply.platform_password")} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" autoComplete="current-password" />
                                <button type="button" onClick={handleHwCredential} disabled={loading} className="btn-secondary w-full py-3 font-bold">
                                    {t("auto_apply.platform_save")}
                                </button>
                            </div>
                        </div>

                        {/* CV Upload Card */}
                        <div className="premium-card group relative overflow-hidden rounded-[2rem] p-8 transition-all hover:border-slate-400/35">
                            <div className="absolute inset-0 bg-[#0052FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 relative z-10">
                                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                    <Zap className="w-5 h-5" />
                                </span>
                                {t('auto_apply.ai_title')}
                            </h2>

                            <div
                                className="relative z-10 border-2 border-dashed border-[#0052FF]/30 hover:border-[#0052FF]/70 bg-gradient-to-b from-[#0052FF]/[0.02] to-transparent rounded-2xl p-8 text-center transition-all cursor-pointer mb-8 group/upload hover:shadow-[0_0_30px_rgba(0,82,255,0.1)]"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="bg-[#0052FF]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 group-hover/upload:bg-[#0052FF]/20 transition-all duration-300">
                                    <UploadCloud className="w-8 h-8 text-[#0052FF]" />
                                </div>
                                <h3 className="text-base font-bold text-white mb-2">{t('auto_apply.upload_title')}</h3>
                                <p className="text-sm text-slate-400">{t('auto_apply.upload_desc')}</p>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
                            </div>

                            {message && (
                                <StatusMessage type={message.includes("Erreur") ? "error" : "success"} className="relative z-10 mb-8">
                                    <div className="flex items-center gap-3">
                                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {message}
                                    </div>
                                </StatusMessage>
                            )}

                            {/* CV Summary AI Box (ReactBits style) */}
                            {cvSummary && (
                                <div className="relative z-10 mb-8 mt-2 p-[2px] rounded-2xl bg-gradient-to-br from-[#0052FF]/40 via-violet-500/40 to-transparent">
                                    <div className="bg-[#0a0a0a] rounded-[14px] p-5 h-full relative overflow-hidden text-sm text-slate-300 leading-relaxed font-medium">
                                        <div className="flex items-center gap-2 mb-3 text-[#0052FF] font-bold text-xs uppercase tracking-wider">
                                            <Sparkles className="w-4 h-4" /> Résumé IA du Profil
                                        </div>
                                        <p className="opacity-90">{cvSummary}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6 relative z-10">
                                <div className="group/input">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 group-focus-within/input:text-[#0052FF] transition-colors">{t('auto_apply.target_job')}</label>
                                    <input
                                        suppressHydrationWarning
                                        type="text"
                                        value={targetTitle}
                                        onChange={(e) => setTargetTitle(e.target.value)}
                                        className="w-full bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#0052FF] focus:bg-[#0052FF]/10 focus:ring-4 focus:ring-[#0052FF]/20 transition-all shadow-inner"
                                        placeholder={t('auto_apply.target_placeholder')}
                                    />
                                </div>

                                <div className="group/input">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 group-focus-within/input:text-[#0052FF] transition-colors">{t('auto_apply.target_keywords')}</label>
                                    <textarea
                                        suppressHydrationWarning
                                        value={targetKeywords}
                                        onChange={(e) => setTargetKeywords(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#0052FF] focus:bg-[#0052FF]/10 focus:ring-4 focus:ring-[#0052FF]/20 transition-all resize-none shadow-inner leading-relaxed"
                                        placeholder={t('auto_apply.keywords_placeholder')}
                                    />
                                </div>

                                <div className="group/input">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 group-focus-within/input:text-[#0052FF] transition-colors">{t('auto_apply.schedule_title')}</label>
                                    <input
                                        suppressHydrationWarning
                                        type="time"
                                        value={preferredTime}
                                        onChange={(e) => setPreferredTime(e.target.value)}
                                        className="w-full bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#0052FF] focus:bg-[#0052FF]/10 focus:ring-4 focus:ring-[#0052FF]/20 transition-all shadow-inner"
                                    />
                                </div>

                                <button
                                    onClick={handleSavePreferences}
                                    disabled={loading}
                                    className="btn-secondary group relative mt-4 flex w-full items-center justify-center gap-3 overflow-hidden py-4 font-bold shadow-lg transition-all hover:border-slate-400 hover:shadow-xl"
                                >
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></span>
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    {loading ? t('auto_apply.saving') : t('auto_apply.save_btn')}
                                </button>

                                <button
                                    onClick={handleRunNow}
                                    disabled={isRunningNow || loading}
                                    className="btn-primary group relative mt-4 flex w-full items-center justify-center gap-3 overflow-hidden py-4 font-bold shadow-[0_0_20px_rgba(0,82,255,0.4)]"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-spring"></div>
                                    {isRunningNow ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : <Bot className="w-5 h-5 relative z-10" />}
                                    <span className="relative z-10">{isRunningNow ? t('auto_apply.running_now') : t('auto_apply.run_now')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Application Log Panel (Right - 7 cols) */}
                    <div className="lg:col-span-7">
                        <div className="premium-card relative flex h-full flex-col overflow-hidden rounded-[2rem] p-8">
                            <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-[#0052FF]/5 to-transparent pointer-events-none"></div>

                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 relative z-10 border-b border-white/10 pb-6">
                                <span className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                                    <History className="w-5 h-5" />
                                </span>
                                {t('auto_apply.history_title')}
                            </h2>

                            {history.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-8 relative z-10">
                                    <div className="w-24 h-24 bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                        <Briefcase className="w-10 h-10 text-slate-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">{t('auto_apply.no_history_title')}</h3>
                                    <p className="text-slate-400 text-base max-w-md leading-relaxed">
                                        {t('auto_apply.no_history_desc')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                    {history.map((match) => {
                                        const job = match.job_data || {};
                                        const dateStr = new Date(match.created_at).toLocaleDateString(t('auto_apply.sent') === 'Sent' ? 'en-US' : 'fr-FR', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        });
                                        const st = match.status as string;
                                        let statusLabel = t("auto_apply.status_applied");
                                        let StatusIcon = CheckCircle;
                                        let statusClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
                                        if (st === "failed") {
                                            statusLabel = t("auto_apply.status_failed");
                                            StatusIcon = XCircle;
                                            statusClass = "bg-red-500/15 text-red-300 border-red-500/30";
                                        } else if (st === "needs_manual") {
                                            statusLabel = t("auto_apply.status_manual");
                                            StatusIcon = AlertTriangle;
                                            statusClass = "bg-amber-500/15 text-amber-200 border-amber-500/30";
                                        } else if (st === "queued" || st === "applying") {
                                            statusLabel = st === "queued" ? t("auto_apply.status_queued") : t("auto_apply.status_applying");
                                            StatusIcon = Clock;
                                            statusClass = "bg-slate-500/15 text-slate-300 border-slate-500/30";
                                        }

                                        return (
                                            <div key={match.id} className="group bg-white/[0.04] border border-white/10 hover:border-[#0052FF]/40 hover:bg-[#0052FF]/[0.04] transition-all duration-300 rounded-[1.5rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md hover:shadow-[0_8px_30px_rgba(0,82,255,0.12)]">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                                                        <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-indigo-300 transition-colors">{job.titre || 'Poste non renseigné'}</h3>
                                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${statusClass}`}>
                                                            <StatusIcon className="w-4 h-4" /> {statusLabel}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 font-medium">
                                                        <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 shadow-sm"><Briefcase className="w-4 h-4 text-slate-400" /> {job.entreprise_lieu?.split('-')[0] || job.entreprise || 'Entreprise'}</span>
                                                        <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 shadow-sm"><MapPin className="w-4 h-4 text-slate-400" /> {job.entreprise_lieu || 'Remote'}</span>
                                                    </div>

                                                    {/* Tracabilité du CV */}
                                                    {cvDownloadUrl && st === "applied" && (
                                                        <div className="mt-4 flex items-center text-xs font-semibold text-slate-500">
                                                            <div className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
                                                                <FileText className="w-4 h-4 text-[#0052FF]/70" />
                                                                CV utilisé : <a href={cvDownloadUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-700 underline-offset-4 hover:text-[#0052FF] transition-colors cursor-pointer">fichier enregistré</a> — vérifiez sur le site recruteur.
                                                            </div>
                                                        </div>
                                                    )}
                                                    {match.apply_error && (st === "failed" || st === "needs_manual") && (
                                                        <p className="mt-2 text-xs text-slate-500 max-w-xl">{match.apply_error}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-6 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('auto_apply.match_score')}</div>
                                                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-violet-500 drop-shadow-lg">{match.match_score}%</div>
                                                    </div>
                                                    <div className="w-px h-12 bg-white/10 hidden sm:block mx-1"></div>
                                                    <div className="text-right flex flex-col justify-between h-12">
                                                        <div className="text-xs font-medium text-slate-500">{dateStr}</div>
                                                        <a href={job.url || job.lien || '#'} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0052FF] hover:text-indigo-400 transition-colors flex items-center justify-end gap-1.5">
                                                            {t('auto_apply.view_offer')} <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Custom Tailwind CSS definition inline for spring animations - typically kept in globals.css but applied here to guarantee function */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .ease-spring { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}} />
        </div>
    );
}
