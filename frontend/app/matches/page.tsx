"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { apiFetch } from "@/utils/api";
import StatusMessage from "@/components/ui/StatusMessage";

interface Match {
    id: string;
    job_offer_id: string;
    job_data: {
        titre?: string;
        entreprise_lieu?: string;
        lien?: string;
    };
    match_score: number;
    generated_cover_letter: string;
    status: string;
}

export default function MatchesDashboard() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserAndMatches = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchMatches();
            } else {
                setLoading(false);
            }
        };
        fetchUserAndMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const res = await apiFetch("/api/matches/", { requireAuth: true });
            if (!res.ok) throw new Error("Failed to fetch matches");
            const data = await res.json();
            setMatches(data.matches || []);
        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des offres correspondantes.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (matchId: string) => {
        if (!userId) return;
        try {
            const res = await apiFetch(`/api/matches/${matchId}/approve`, {
                method: "POST",
                requireAuth: true
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Erreur: ${data.detail || "Quota atteint ou erreur système"}`);
                return;
            }
            alert("✅ Demande en file : traitement en arrière-plan. Vérifiez le journal Auto-apply pour le résultat réel.");
            setMatches(prev => prev.filter(m => m.id !== matchId));
        } catch (err) {
            console.error(err);
            alert("Erreur réseau");
        }
    };

    const handleReject = async (matchId: string) => {
        // En vrai: update supabase status to rejected
        const { error } = await supabase.from('job_matches').update({ status: 'rejected' }).eq('id', matchId);
        if (!error) {
            setMatches(prev => prev.filter(m => m.id !== matchId));
        }
    };

    if (loading) return <div className="app-shell p-8 pt-28 text-center text-slate-300">Chargement de vos matchs IA...</div>;
    if (!userId) return <div className="app-shell p-8 pt-28 text-center text-red-300">Veuillez vous connecter pour voir vos matchs.</div>;

    return (
        <div className="app-shell min-h-screen p-4 pt-24 md:p-8 md:pt-24">
            <div className="mx-auto max-w-6xl">
            <div className="mb-8">
                <h1 className="premium-title bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">
                    Vos Matchs d&apos;Emploi
                </h1>
                <p className="premium-subtitle mt-2">
                    L&apos;IA a évalué ces offres par rapport à votre profil. Après approbation, la demande est mise en file : le robot tente une soumission réelle lorsque le site le permet ; sinon le statut passera a « manuel requis » ou « echec ».
                </p>
                <div className="mt-2 text-sm text-slate-400">
                    Quota gratuit : 2 candidatures réussies par jour (comptées après succès automatique). Complétez prénom, nom, consentement et CV sur la page Auto-apply avant d&apos;approuver.
                </div>
            </div>

            {error && <StatusMessage type="error" className="mb-6">{error}</StatusMessage>}

            {matches.length === 0 ? (
                <div className="premium-card p-12 text-center">
                    <p className="text-lg text-slate-300">Aucun nouveau match pour le moment.</p>
                    <p className="mt-2 text-slate-400">Assurez-vous que vos critères cibles sont bien renseignés dans votre profil.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {matches.map((match) => (
                        <div key={match.id} className="premium-card flex flex-col gap-6 p-6 transition-all md:flex-row">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-semibold text-slate-100">{match.job_data?.titre || 'Offre inconnue'}</h2>
                                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-300">
                                        {match.match_score}% Match
                                    </span>
                                </div>
                                <p className="mb-4 font-medium text-slate-300">{match.job_data?.entreprise_lieu}</p>

                                <div className="mb-4 rounded-lg border border-slate-500/25 bg-slate-900/60 p-4">
                                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Lettre de motivation générée</h3>
                                    <textarea
                                        className="h-32 w-full resize-none rounded-lg border border-slate-500/25 bg-slate-950 p-3 text-sm text-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40"
                                        defaultValue={match.generated_cover_letter}
                                    />
                                </div>
                            </div>

                            <div className="flex min-w-[200px] flex-col justify-center gap-3 border-t border-slate-600/20 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                                <a
                                    href={match.job_data?.lien}
                                    target="_blank"
                                    className="btn-secondary w-full px-4 py-2 text-center"
                                >
                                    Consulter l&apos;annonce
                                </a>
                                <button
                                    onClick={() => handleApprove(match.id)}
                                    className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-2"
                                >
                                    Approuver & Postuler
                                </button>
                                <button
                                    onClick={() => handleReject(match.id)}
                                    className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-medium text-red-300 transition-colors hover:bg-red-500/20"
                                >
                                    Ignorer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </div>
    );
}
