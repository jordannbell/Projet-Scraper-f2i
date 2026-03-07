'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Job {
    id: string;
    titre: string;
    entreprise: string;
    entreprise_lieu?: string; // from scraper
    score: number;
    skills_found: string[];
    url: string;
}

export default function Dashboard() {
    const { t } = useLanguage();
    const [keyword, setKeyword] = useState('Data Analyst');
    const [pages, setPages] = useState(2);
    const [skills, setSkills] = useState('python, sql, power bi, anglais, data visualization');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Job[] | null>(null);
    const [status, setStatus] = useState('');

    // Auth and presentation state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

    useEffect(() => {
        // Simple check to see if user might be logged in. In a real app, use AuthContext.
        const token = localStorage.getItem('supabase.auth.token') || localStorage.getItem('sb-access-token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleSearch = async () => {
        if (!isLoggedIn) {
            setShowRegisterPrompt(true);
            setLoading(true);
            setStatus(t('dashboard.status_demo'));

            // Simulate network delay for fake data
            setTimeout(() => {
                setResults([
                    {
                        id: 'mock-1',
                        titre: 'Data Analyst (Résultat Démo)',
                        entreprise: 'TechCorp Solutions',
                        entreprise_lieu: 'Paris (Hybride)',
                        score: 92,
                        skills_found: ['python', 'sql', 'power bi'],
                        url: '/register'
                    },
                    {
                        id: 'mock-2',
                        titre: 'Consultant Business Intelligence (Démo)',
                        entreprise: 'Data & Co',
                        entreprise_lieu: 'Lyon',
                        score: 85,
                        skills_found: ['sql', 'data visualization', 'anglais'],
                        url: '/register'
                    },
                    {
                        id: 'mock-3',
                        titre: 'Analyste de données Junior (Démo)',
                        entreprise: 'Startup NextGen',
                        entreprise_lieu: 'Remote',
                        score: 78,
                        skills_found: ['python', 'anglais'],
                        url: '/register'
                    }
                ]);
                setLoading(false);
                setStatus('');
            }, 1500);
            return;
        }

        setLoading(true);
        setStatus(t('dashboard.status_connecting'));
        setResults(null);

        try {
            // 1. Search Jobs
            const searchRes = await fetch('http://127.0.0.1:8000/api/jobs/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, max_pages: pages }),
            });

            if (!searchRes.ok) throw new Error(t('dashboard.status_error_scrape'));
            const searchData = await searchRes.json();

            if (searchData.count === 0) {
                setStatus(t('dashboard.status_no_offer'));
                setLoading(false);
                return;
            }

            setStatus(t('dashboard.status_analyzing').replace('{count}', searchData.count.toString()));

            // 2. Recommend
            const userSkills = skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            const recRes = await fetch('http://127.0.0.1:8000/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skills: userSkills,
                    jobs: searchData.jobs
                }),
            });

            if (!recRes.ok) throw new Error(t('dashboard.status_error_rec'));
            const recData = await recRes.json();

            setResults(recData);
            setStatus('');

        } catch (error) {
            console.error(error);
            setStatus(t('dashboard.status_error_general'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans relative">

            {/* Modal de demande d'inscription */}
            {showRegisterPrompt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center transform transition-all">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('dashboard.modal_title')}</h2>
                        <p className="text-slate-600 mb-8 text-lg">
                            {t('dashboard.modal_desc1')} <span className="font-bold text-indigo-600">{t('dashboard.modal_desc2')}</span>
                            {t('dashboard.modal_desc3')}
                        </p>
                        <div className="flex flex-col gap-4">
                            <Link href="/register" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-indigo-300 transition-all transform hover:scale-[1.02]">
                                {t('dashboard.modal_btn_register')}
                            </Link>
                            <button
                                onClick={() => setShowRegisterPrompt(false)}
                                className="text-slate-500 hover:text-slate-800 font-medium py-2 transition-colors"
                            >
                                {t('dashboard.modal_btn_close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col p-6 overflow-y-auto z-10">
                <h2 className="text-xl font-bold text-indigo-600 mb-8 flex items-center tracking-tight">
                    Seekra
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('dashboard.target_label')}</label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('dashboard.volume_label').replace('{pages}', pages.toString())}
                        </label>
                        <input
                            type="range"
                            min="1" max="5"
                            value={pages}
                            onChange={(e) => setPages(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t('dashboard.skills_label')}</label>
                        <textarea
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[120px] text-sm"
                            placeholder={t('dashboard.skills_placeholder')}
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-95
                    ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-300'}
                `}
                    >
                        {loading ? t('dashboard.loading') : t('dashboard.search_button')}
                    </button>

                    {status && (
                        <div className={`p-3 rounded-lg text-sm font-medium animate-pulse
                    ${status.includes('erreur') || status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-indigo-50 text-indigo-700'}
                `}>
                            {status}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto bg-slate-50 relative z-0 pt-20"> {/* pt-20 added for the new floating navbar */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
                    <p className="text-slate-500">{t('dashboard.subtitle')}</p>
                </header>

                {!results && !loading && (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-300 rounded-2xl bg-white/50">

                        <h3 className="text-xl font-semibold text-slate-500">{t('dashboard.idle_title')}</h3>
                        <p className="text-slate-400 max-w-md text-center mt-2">
                            {t('dashboard.idle_desc')}
                        </p>
                    </div>
                )}

                <div className="grid gap-6">
                    {results && results.map((job, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {job.titre}
                                    </h3>
                                    <div className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                                        <span>{job.entreprise || job.entreprise_lieu}</span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold border
                            ${job.score > 70 ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                        `}>
                                    {Math.round(job.score)}{t('dashboard.match')}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {job.skills_found.slice(0, 8).map((skill, sIdx) => (
                                    <span key={sIdx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                                        {skill}
                                    </span>
                                ))}
                                {job.skills_found.length > 8 && (
                                    <span className="bg-slate-50 text-slate-400 px-2 py-1 rounded text-xs font-semibold">
                                        +{job.skills_found.length - 8}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 font-bold text-sm hover:underline flex items-center"
                                >
                                    {t('dashboard.view_offer')}
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
