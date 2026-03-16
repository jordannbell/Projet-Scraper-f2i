'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/utils/supabase/client';
import { Search, MapPin, ArrowRight, Bookmark, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface Job {
    id: string;
    titre: string;
    entreprise: string;
    entreprise_lieu?: string;
    score: number;
    skills_found: string[];
    url: string;
}

export default function Dashboard() {
    const { t } = useLanguage();
    const [keyword, setKeyword] = useState('Product Designer');
    const [pages] = useState(2);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Job[] | null>(null);
    const [status, setStatus] = useState('');

    // Core filters state
    const [skills, setSkills] = useState('python, sql, power bi, anglais, data visualization');
    const [contractTypes, setContractTypes] = useState<string[]>(['Full-time']);
    const [datePosted, setDatePosted] = useState('Last 7 days');
    const [sortBy, setSortBy] = useState('Relevance');

    const clearFilters = () => {
        setSkills('');
        setContractTypes([]);
        setDatePosted('Any time');
        setKeyword('');
        setSortBy('Relevance');
    };

    // Auth and presentation state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsLoggedIn(true);
            }
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleContractType = (type: string) => {
        if (contractTypes.includes(type)) {
            setContractTypes(contractTypes.filter(t => t !== type));
        } else {
            setContractTypes([...contractTypes, type]);
        }
    };

    const handleSearch = async () => {
        if (!isLoggedIn) {
            setShowRegisterPrompt(true);
            setLoading(true);
            setStatus(t('dashboard.status_demo') || 'Connecting to demo...');

            setTimeout(() => {
                setResults([
                    {
                        id: 'mock-1',
                        titre: 'Senior Product Designer',
                        entreprise: 'TechCorp',
                        entreprise_lieu: 'San Francisco, CA',
                        score: 92,
                        skills_found: ['INDEED', 'FULL-TIME', 'REMOTE FRIENDLY'],
                        url: '/login'
                    },
                    {
                        id: 'mock-2',
                        titre: 'UX Research Specialist',
                        entreprise: 'DesignStudio',
                        entreprise_lieu: 'Remote',
                        score: 85,
                        skills_found: ['LINKEDIN', 'CONTRACT'],
                        url: '/login'
                    },
                    {
                        id: 'mock-3',
                        titre: 'Lead Interface Architect',
                        entreprise: 'GlobalSystems',
                        entreprise_lieu: 'Palo Alto, CA',
                        score: 88,
                        skills_found: ['GLASSDOOR', 'FULL-TIME'],
                        url: '/login'
                    },
                    {
                        id: 'mock-4',
                        titre: 'UI/UX Designer',
                        entreprise: 'CreativeFlow',
                        entreprise_lieu: 'San Jose, CA',
                        score: 78,
                        skills_found: ['INDEED', 'FULL-TIME'],
                        url: '/login'
                    }
                ]);
                setLoading(false);
                setStatus('');
            }, 1000);
            return;
        }

        setLoading(true);
        setStatus(t('dashboard.status_connecting') || 'Connecting to scrapers...');
        setResults(null);

        try {
            const searchRes = await fetch('http://127.0.0.1:8000/api/jobs/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, max_pages: pages }),
            });

            if (!searchRes.ok) throw new Error(t('dashboard.status_error_scrape') || 'Error fetching jobs');
            const searchData = await searchRes.json();

            if (searchData.count === 0) {
                setStatus(t('dashboard.status_no_offer') || 'No offers found.');
                setLoading(false);
                return;
            }

            setStatus((t('dashboard.status_analyzing') || 'Analyzing {count} offers').replace('{count}', searchData.count.toString()));

            const userSkills = skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            const bodyPayload = userSkills.length > 0 ? { skills: userSkills, jobs: searchData.jobs } : { skills: ['design'], jobs: searchData.jobs };

            const recRes = await fetch('http://127.0.0.1:8000/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
            });

            if (!recRes.ok) throw new Error(t('dashboard.status_error_rec') || 'Recommendation error');
            const recData = await recRes.json();

            setResults(recData);
            setStatus('');

        } catch (error) {
            console.error(error);
            setStatus(t('dashboard.status_error_general') || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const contractOptions = ['Full-time', 'Part-time', 'Contract', 'Remote'];

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
            {/* Modal */}
            {showRegisterPrompt && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
                    <div className="bg-[#111111] border border-white/10 p-8 rounded-2xl shadow-xl max-w-lg w-full text-center transform transition-all">
                        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">{t('dashboard.modal_title') || 'Create an Account'}</h2>
                        <p className="text-slate-400 mb-8 text-lg">
                            {t('dashboard.modal_desc1') || 'To apply, you need to be registered.'} <span className="font-bold text-[#0052FF]">{t('dashboard.modal_desc2') || 'Register now'}</span> {t('dashboard.modal_desc3') || 'to access full features.'}
                        </p>
                        <div className="flex flex-col gap-4">
                            <Link href="/register" className="bg-[#0052FF] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#0040DD] transition-all transform hover:-translate-y-0.5">
                                {t('dashboard.modal_btn_register') || 'Create Account'}
                            </Link>
                            <button
                                onClick={() => setShowRegisterPrompt(false)}
                                className="text-slate-500 hover:text-white font-medium py-2 transition-colors"
                            >
                                {t('dashboard.modal_btn_close') || 'Maybe later'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area Container that holds both sidebar and right grid */}
            <div className="flex w-full max-w-[1600px] mx-auto pt-20 h-full"> {/* pt-20 to push below the navbar */}
                {/* Sidebar */}
                <aside className="w-64 lg:w-72 flex-shrink-0 flex flex-col p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] border-r border-white/5 h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-slate-300" />
                            <h2 className="text-lg font-bold text-white">Filters</h2>
                        </div>
                        <button onClick={clearFilters} className="text-sm font-medium text-slate-500 hover:text-white transition-colors">
                            Clear all
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Skills Input */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Vos atouts clés (Compétences)</h3>
                                <div className="group relative">
                                    <svg className="w-4 h-4 text-slate-500 hover:text-white cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-xs text-slate-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-center z-10 pointer-events-none">
                                        Séparez vos compétences par des virgules.
                                    </div>
                                </div>
                            </div>
                            <textarea
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                className="w-full bg-[#111111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#0052FF] focus:bg-[#161616] transition-colors min-h-[140px] resize-y placeholder:text-slate-600"
                                placeholder="python, sql, power bi..."
                            />
                        </div>

                        {/* Contract Type */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Contract Type</h3>
                            <div className="flex flex-wrap gap-2">
                                {contractOptions.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleContractType(opt)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${contractTypes.includes(opt)
                                            ? 'bg-[#0052FF] text-white'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Posted */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Date Posted</h3>
                            <div className="relative">
                                <select
                                    value={datePosted}
                                    onChange={(e) => setDatePosted(e.target.value)}
                                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-[#0052FF] transition-colors"
                                >
                                    <option value="Any time">Any time</option>
                                    <option value="Last 24 hours">Last 24 hours</option>
                                    <option value="Last 7 days">Last 7 days</option>
                                    <option value="Last 30 days">Last 30 days</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Job Alerts */}
                        <div className="mt-8 bg-[#111111] border border-[#0052FF]/20 bg-gradient-to-br from-[#111111] to-[#0052FF]/5 rounded-2xl p-5 relative overflow-hidden">
                            <h3 className="text-sm font-semibold text-[#0052FF] mb-2 relative z-10">Job Alerts</h3>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed relative z-10">
                                Get notified about new jobs matching these filters.
                            </p>
                            <button className="w-full py-2.5 bg-[#0052FF] hover:bg-[#0040DD] text-white text-sm font-medium rounded-lg transition-colors relative z-10">
                                Create Alert
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar p-6 lg:p-8 h-full">
                    {/* Top Bar Area */}
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-2xl lg:text-[28px] font-bold text-white mb-1">
                                {keyword ? `${keyword} Jobs` : 'All Jobs'}
                            </h1>
                            <p className="text-slate-400 text-sm">
                                {results ? `Showing ${results.length} results` : 'Showing 1,284 results'} in France
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 max-w-2xl justify-end">
                            {/* Combined Search Bar */}
                            <div className="flex flex-1 sm:max-w-[480px] bg-[#111111] rounded-full border border-white/10 focus-within:border-slate-500 focus-within:bg-[#161616] transition-all overflow-hidden h-12">
                                <div className="flex flex-1 items-center px-4 relative">
                                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Job title, keywords"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        className="w-full bg-transparent border-none text-sm text-white px-4 focus:outline-none focus:ring-0 placeholder:text-slate-500 h-full"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-12 h-12 flex items-center justify-center bg-[#0052FF] hover:bg-[#0040DD] text-white flex-shrink-0 transition-colors"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm text-slate-400">Sort by:</span>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-transparent border-none py-2 pl-2 pr-6 text-sm text-white font-medium focus:outline-none focus:ring-0 cursor-pointer"
                                    >
                                        <option className="bg-[#111111]" value="Relevance">Relevance</option>
                                        <option className="bg-[#111111]" value="Date">Date</option>
                                        <option className="bg-[#111111]" value="Salary (High to Low)">Salary (High to Low)</option>
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 rounded-xl text-sm font-medium animate-pulse bg-white/5 text-slate-300 border border-white/10">
                            {status}
                        </div>
                    )}

                    {(!results && !loading) && (
                        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-[#111111]/50 mb-8 min-h-[300px]">
                            <h3 className="text-xl font-semibold text-white mb-2">Ready to explore?</h3>
                            <p className="text-slate-400 text-center max-w-sm text-sm">
                                Use the search bar above to look for your ideal job opportunity in our system.
                            </p>
                            <button onClick={handleSearch} className="mt-6 border border-white/20 px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
                                Search now
                            </button>
                        </div>
                    )}

                    {loading && !results && (
                        <div className="flex justify-center items-center flex-1 min-h-[400px]">
                            <div className="w-8 h-8 border-3 border-white/10 border-t-[#0052FF] rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Job Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6 pb-8">
                        {results && results.map((job, idx) => (
                            <div key={idx} className="bg-[#111111] rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all group flex flex-col h-full hover:bg-[#141414]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-4 text-white font-bold text-xl overflow-hidden shrink-0">
                                        {job.entreprise.charAt(0)}
                                    </div>
                                    <button className="text-slate-500 hover:text-[#0052FF] transition-colors p-1">
                                        <Bookmark className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-[17px] font-bold text-white group-hover:text-[#0052FF] transition-colors line-clamp-1 mb-1">
                                        {job.titre}
                                    </h3>
                                    <div className="text-slate-400 text-[15px] mb-3">
                                        {job.entreprise}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {job.entreprise_lieu || 'Remote'}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-slate-300">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            {idx % 2 === 0 ? '$120k - $160k' : '$90k - $110k'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6 mt-auto pt-2">
                                    {job.skills_found.slice(0, 3).map((skill, sIdx) => {
                                        const colorClasses = [
                                            'bg-[#0052FF]/10 text-[#0052FF]',
                                            'bg-slate-100 text-slate-800',
                                            'bg-emerald-500/10 text-emerald-400'
                                        ];
                                        return (
                                            <span key={sIdx} className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colorClasses[sIdx % colorClasses.length]}`}>
                                                {skill}
                                            </span>
                                        );
                                    })}
                                </div>

                                <a href={job.url || job.lien || '#'} target="_blank" rel="noopener noreferrer" className="block text-center w-full bg-[#0052FF] hover:bg-[#0040DD] text-white font-semibold py-3.5 rounded-xl transition-colors mt-auto text-[15px]">
                                    Apply Now
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Pagination (visible if results exist) */}
                    {results && (
                        <div className="mt-8 pb-12 flex items-center justify-center gap-2">
                            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                                <span className="sr-only">Previous</span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[#0052FF] text-white flex items-center justify-center font-medium shadow-lg shadow-[#0052FF]/20">1</button>
                            <button className="w-10 h-10 rounded-full hover:bg-white/5 text-slate-300 flex items-center justify-center font-medium transition-colors cursor-pointer">2</button>
                            <button className="w-10 h-10 rounded-full hover:bg-white/5 text-slate-300 flex items-center justify-center font-medium transition-colors cursor-pointer">3</button>
                            <span className="w-10 h-10 flex items-center justify-center text-slate-500">...</span>
                            <button className="w-10 h-10 rounded-full hover:bg-white/5 text-slate-300 flex items-center justify-center font-medium transition-colors cursor-pointer">12</button>
                            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                                <span className="sr-only">Next</span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
