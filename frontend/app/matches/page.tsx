"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Ensure you have these env variables or replace them with your supabase client util
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Match {
    id: string;
    job_offer_id: string;
    job_data: any;
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
                fetchMatches(user.id);
            } else {
                setLoading(false);
            }
        };
        fetchUserAndMatches();
    }, []);

    const fetchMatches = async (uid: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/matches/?user_id=${uid}`);
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
            const res = await fetch(`http://localhost:8000/api/matches/${matchId}/approve?user_id=${userId}`, {
                method: "POST"
            });
            const data = await res.json();
            if (!res.ok) {
                alert(`Erreur: ${data.detail || "Quota atteint ou erreur système"}`);
                return;
            }
            alert("✅ Candidature approuvée et lancée en arrière-plan !");
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

    if (loading) return <div className="p-8 text-center">Chargement de vos matchs IA...</div>;
    if (!userId) return <div className="p-8 text-center text-red-500">Veuillez vous connecter pour voir vos matchs.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Vos Matchs d'Emploi
                </h1>
                <p className="text-gray-600 mt-2">
                    L'IA a évalué ces offres par rapport à votre profil. Approuvez-les pour déclencher la candidature automatique.
                    <span className="ml-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Auto-Apply Actif</span>
                </p>
                <div className="mt-2 text-sm text-gray-500">
                    Quota gratuit: 2 candidatures par jour. Pour débloquer l'illimité, passez à l'abonnement Premium.
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">{error}</div>}

            {matches.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-lg">Aucun nouveau match pour le moment.</p>
                    <p className="text-gray-400 mt-2">Assurez-vous que vos critères cibles sont bien renseignés dans votre profil.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {matches.map((match) => (
                        <div key={match.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 transition-all hover:shadow-md">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-semibold text-gray-900">{match.job_data?.titre || 'Offre inconnue'}</h2>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                                        {match.match_score}% Match
                                    </span>
                                </div>
                                <p className="text-gray-600 font-medium mb-4">{match.job_data?.entreprise_lieu}</p>

                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Lettre de motivation générée</h3>
                                    <textarea
                                        className="w-full h-32 p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        defaultValue={match.generated_cover_letter}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px] justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                <a
                                    href={match.job_data?.lien}
                                    target="_blank"
                                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center rounded-lg font-medium transition-colors"
                                >
                                    Consulter l'annonce
                                </a>
                                <button
                                    onClick={() => handleApprove(match.id)}
                                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    Approuver & Postuler
                                </button>
                                <button
                                    onClick={() => handleReject(match.id)}
                                    className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                                >
                                    Ignorer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
