"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { UploadCloud, CheckCircle, Zap, Bot, History, ExternalLink, MapPin, Briefcase, FileText, Loader2, Sparkles } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AutoApplyPage() {
    const router = useRouter();
    const { t } = useLanguage();

    // Preferences state
    const [targetTitle, setTargetTitle] = useState("");
    const [targetKeywords, setTargetKeywords] = useState("");
    const [cvSummary, setCvSummary] = useState("");
    const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
    const [publicCvUrl, setPublicCvUrl] = useState<string | null>(null);
    const [preferredTime, setPreferredTime] = useState("08:00");
    const [isRunningNow, setIsRunningNow] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            const uid = session.user.id;
            setUserId(uid);

            // Generate public URL for tracking
            const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(`${uid}/cv.pdf`);
            setPublicCvUrl(urlData.publicUrl);

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
            }

            // Application History
            const { data: matches } = await supabase
                .from("job_matches")
                .select("*")
                .eq("user_id", uid)
                .in("status", ["applied", "applied_successfully"])
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
        formData.append("user_id", userId);

        try {
            const res = await fetch("http://localhost:8000/api/profile/upload-cv", {
                method: "POST",
                body: formData
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
            const res = await fetch("http://localhost:8000/api/auto-apply/run-now", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId })
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

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Animated Ambient Background (ReactBits Inspired) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#0052FF]/20 rounded-full blur-[120px] opacity-60 mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] opacity-40 mix-blend-screen" style={{ animation: 'pulse 8s infinite alternate' }}></div>
            </div>

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">

                {/* Header Section (Glassmorphism & Glow) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 rounded-[2rem] relative bg-white/[0.02] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden group">
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
                    </div>

                    <div className="relative z-10 bg-black/40 border border-white/10 p-6 rounded-[1.5rem] flex items-center gap-6 shrink-0 shadow-2xl backdrop-blur-xl">
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
                        {/* CV Upload Card */}
                        <div className="bg-gradient-to-b from-[#111111] to-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
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
                                <div className={`relative z-10 p-4 rounded-xl text-sm font-medium mb-8 backdrop-blur-md border ${message.includes('Erreur') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                    <div className="flex items-center gap-3">
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {message}
                                    </div>
                                </div>
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
                                        type="time"
                                        value={preferredTime}
                                        onChange={(e) => setPreferredTime(e.target.value)}
                                        className="w-full bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#0052FF] focus:bg-[#0052FF]/10 focus:ring-4 focus:ring-[#0052FF]/20 transition-all shadow-inner"
                                    />
                                </div>

                                <button
                                    onClick={handleSavePreferences}
                                    disabled={loading}
                                    className="w-full py-4 relative overflow-hidden group bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-white mt-4 shadow-lg hover:shadow-xl hover:border-slate-400"
                                >
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></span>
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    {loading ? t('auto_apply.saving') : t('auto_apply.save_btn')}
                                </button>

                                <button
                                    onClick={handleRunNow}
                                    disabled={isRunningNow || loading}
                                    className="w-full py-4 mt-4 relative overflow-hidden group bg-gradient-to-r from-[#0052FF] to-violet-600 hover:opacity-90 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-white shadow-[0_0_20px_rgba(0,82,255,0.4)]"
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
                        <div className="bg-gradient-to-b from-[#111111] to-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-2xl h-full flex flex-col relative overflow-hidden">
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

                                        return (
                                            <div key={match.id} className="group bg-white/[0.04] border border-white/10 hover:border-[#0052FF]/40 hover:bg-[#0052FF]/[0.04] transition-all duration-300 rounded-[1.5rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md hover:shadow-[0_8px_30px_rgba(0,82,255,0.12)]">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-indigo-300 transition-colors">{job.titre || 'Poste non renseigné'}</h3>
                                                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                                                            <CheckCircle className="w-4 h-4" /> {t('auto_apply.sent')}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 font-medium">
                                                        <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 shadow-sm"><Briefcase className="w-4 h-4 text-slate-400" /> {job.entreprise_lieu?.split('-')[0] || job.entreprise || 'Entreprise'}</span>
                                                        <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 shadow-sm"><MapPin className="w-4 h-4 text-slate-400" /> {job.entreprise_lieu || 'Remote'}</span>
                                                    </div>

                                                    {/* Tracabilité du CV */}
                                                    {publicCvUrl && (
                                                        <div className="mt-4 flex items-center text-xs font-semibold text-slate-500">
                                                            <div className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
                                                                <FileText className="w-4 h-4 text-[#0052FF]/70" />
                                                                Transmis avec <a href={publicCvUrl} target="_blank" className="underline decoration-slate-700 underline-offset-4 hover:text-[#0052FF] transition-colors cursor-pointer">votre CV enregistré</a>
                                                            </div>
                                                        </div>
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
