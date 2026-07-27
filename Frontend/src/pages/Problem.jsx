import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import axiosClient from '../utils/axiosClient';

export default function Problemset() {
    const [problems, setProblems] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination & Raw Filter States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProblems, setTotalProblems] = useState(0);

    const [searchTitle, setSearchTitle] = useState('');
    const [searchProblemNumber, setSearchProblemNumber] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedTag, setSelectedTag] = useState('');

    // Debounced Text Inputs State
    const [debouncedFilters, setDebouncedFilters] = useState({
        title: '',
        problemNumber: ''
    });

    // 1. Fetch All Tags Metadata
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await axiosClient.get('/tags').catch(() => axiosClient.get('/meta/tags'));
                if (res.data?.allTags) setAllTags(res.data.allTags);
                else if (res.data?.tags) setAllTags(res.data.tags);
            } catch (err) {
                console.error('Error fetching tags metadata:', err);
            }
        };
        fetchTags();
    }, []);

    // 2. Debounce Effect for Text Inputs (400ms delay)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters({
                title: searchTitle.trim(),
                problemNumber: searchProblemNumber.trim()
            });
        }, 400);

        return () => clearTimeout(handler);
    }, [searchTitle, searchProblemNumber]);

    // 3. Fetch Problems when page, dropdowns, or DEBOUNCED filters change
    const fetchProblems = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page,
                limit: 15
            };

            if (debouncedFilters.title) params.title = debouncedFilters.title;
            if (debouncedFilters.problemNumber) params.problemNumber = debouncedFilters.problemNumber;
            if (selectedDifficulty) params.difficulty = selectedDifficulty;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedTag) params.tags = selectedTag;

            const res = await axiosClient.get('/problem/', { params });

            if (res.data?.success) {
                setProblems(res.data.problems || []);
                setTotalPages(res.data.totalPages || 1);
                setTotalProblems(res.data.totalProblems || 0);
            }
        } catch (err) {
            console.error('Error fetching problems:', err);
            setError(err.response?.data?.message || 'Failed to load problem list');
        } finally {
            setLoading(false);
        }
    }, [page, debouncedFilters, selectedDifficulty, selectedStatus, selectedTag]);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setPage(1);
        setDebouncedFilters({
            title: searchTitle.trim(),
            problemNumber: searchProblemNumber.trim()
        });
    };

    const handleResetFilters = () => {
        setSearchTitle('');
        setSearchProblemNumber('');
        setSelectedDifficulty('');
        setSelectedStatus('');
        setSelectedTag('');
        setDebouncedFilters({ title: '', problemNumber: '' });
        setPage(1);
    };

    const handleQuickTagClick = (tagName) => {
        if (selectedTag.toLowerCase() === tagName.toLowerCase()) {
            setSelectedTag('');
        } else {
            setSelectedTag(tagName);
        }
        setPage(1);
    };

    const getDifficultyBadge = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner':
                return <span className="badge badge-info badge-md font-semibold py-2.5 px-3.5 text-xs">Beginner</span>;
            case 'easy':
                return <span className="badge badge-success badge-md font-semibold py-2.5 px-3.5 text-xs">Easy</span>;
            case 'medium':
                return <span className="badge badge-warning badge-md font-semibold py-2.5 px-3.5 text-xs">Medium</span>;
            case 'hard':
                return <span className="badge badge-error badge-md font-semibold py-2.5 px-3.5 text-xs">Hard</span>;
            default:
                return <span className="badge badge-ghost badge-md text-xs">{difficulty}</span>;
        }
    };

    const solvedCount = problems.filter((p) => p.isSolved).length;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-base-100 via-base-100 to-primary/5 rounded-3xl p-6 md:p-8 border border-base-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                            ⚡ CodeClash Arena
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
                            Problem Set
                        </h1>
                        <p className="text-base md:text-lg text-base-content/70 leading-relaxed">
                            Challenge yourself with curated algorithmic problems. Hone your data structure skills and prepare for top technical interviews.
                        </p>
                    </div>

                    {/* Stats Widget */}
                    <div className="stats bg-base-200/65 backdrop-blur border border-base-300 shadow-sm rounded-2xl shrink-0">
                        <div className="stat px-5 py-3">
                            <div className="stat-title text-xs font-medium">Total Problems</div>
                            <div className="stat-value text-primary text-2xl font-semibold">{totalProblems}</div>
                        </div>
                        <div className="stat px-5 py-3 border-l border-base-300">
                            <div className="stat-title text-xs font-medium">Page Solved</div>
                            <div className="stat-value text-success text-2xl font-semibold">
                                {solvedCount} <span className="text-xs text-base-content/40 font-normal">/ {problems.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm space-y-4">
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        
                        {/* Search Title */}
                        <div className="lg:col-span-2 relative">
                            <input
                                type="text"
                                placeholder="Search title or keyword..."
                                className="input input-bordered w-full text-sm pl-10 focus:input-primary transition-all"
                                value={searchTitle}
                                onChange={(e) => {
                                    setSearchTitle(e.target.value);
                                    setPage(1);
                                }}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-3.5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Search Problem Number */}
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="Prob # (e.g. 1)"
                                className="input input-bordered w-full text-sm focus:input-primary"
                                value={searchProblemNumber}
                                onChange={(e) => {
                                    setSearchProblemNumber(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* Difficulty Filter */}
                        <select
                            className="select select-bordered w-full text-sm cursor-pointer focus:select-primary"
                            value={selectedDifficulty}
                            onChange={(e) => { setSelectedDifficulty(e.target.value); setPage(1); }}
                        >
                            <option value="">All Difficulties</option>
                            <option value="beginner">Beginner</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            className="select select-bordered w-full text-sm cursor-pointer focus:select-primary"
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                        >
                            <option value="">All Statuses</option>
                            <option value="solved">Solved</option>
                            <option value="attempted">Attempted</option>
                            <option value="unsolved">Unsolved</option>
                        </select>

                        {/* Dynamic Tags Select Dropdown */}
                        <select
                            className="select select-bordered w-full text-sm cursor-pointer focus:select-primary"
                            value={selectedTag}
                            onChange={(e) => {
                                setSelectedTag(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Tags ({allTags.length})</option>
                            {allTags.map((tag) => (
                                <option key={tag._id || tag.name} value={tag.name}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Tag Chips & Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-base-200">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-base-content/60">
                            <span className="font-semibold text-xs text-base-content/40 mr-1">Available Tags:</span>
                            {allTags.slice(0, 10).map((tag) => {
                                const tagName = tag.name || tag;
                                const isSelected = selectedTag.toLowerCase() === tagName.toLowerCase();

                                return (
                                    <button
                                        key={tag._id || tagName}
                                        type="button"
                                        onClick={() => handleQuickTagClick(tagName)}
                                        className={`badge badge-sm cursor-pointer transition-all py-2.5 px-3 ${
                                            isSelected ? 'badge-primary font-bold shadow-sm' : 'badge-ghost hover:bg-base-200'
                                        }`}
                                    >
                                        {tagName}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            {(searchTitle || searchProblemNumber || selectedDifficulty || selectedStatus || selectedTag) && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content cursor-pointer"
                                    onClick={handleResetFilters}
                                >
                                    Clear Filters ✕
                                </button>
                            )}
                            <button type="submit" className="btn btn-primary btn-sm px-6 font-semibold shadow-sm cursor-pointer">
                                Search
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Main Problems Cards Container */}
            {loading ? (
                <div className="min-h-[40vh] bg-base-100 rounded-2xl border border-base-200 flex flex-col items-center justify-center gap-3 p-8">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <span className="text-sm font-medium text-base-content/60">Fetching algorithm challenge set...</span>
                </div>
            ) : error ? (
                <div className="alert alert-error shadow-sm rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                </div>
            ) : problems.length === 0 ? (
                <div className="text-center py-16 bg-base-100 rounded-2xl border border-base-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-base-200 text-base-content/40 flex items-center justify-center mx-auto text-xl font-bold">
                        🔍
                    </div>
                    <p className="text-base font-bold text-base-content">No problems found</p>
                    <p className="text-xs text-base-content/50 max-w-sm mx-auto">
                        We couldn't find any problem matching your search criteria. Try clearing filters or using different keywords.
                    </p>
                    <button onClick={handleResetFilters} className="btn btn-outline btn-sm mt-2 cursor-pointer">
                        Reset Search Filters
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {problems.map((prob) => {
                        const accRate = prob.totalSubmissions > 0
                            ? ((prob.totalAccepted / prob.totalSubmissions) * 100).toFixed(1)
                            : '0.0';

                        return (
                            <div 
                                key={prob.problemNumber} 
                                className="bg-base-100 hover:bg-base-200/30 transition-all rounded-2xl border border-base-200 p-5 shadow-sm space-y-4"
                            >
                                {/* Top Row: Number, Title | Difficulty | Acceptance Rate */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    
                                    {/* Number & Title */}
                                    <div className="flex items-center gap-3">
                                        {/* Optional Solved Status Indicator inside Number badge */}
                                        <div className="flex items-center gap-2">
                                            {prob.isSolved ? (
                                                <div className="tooltip" data-tip="Solved">
                                                    <div className="w-6 h-6 rounded-full bg-success/20 text-success inline-flex items-center justify-center font-bold text-xs">
                                                        ✓
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-base-200 text-base-content/20 inline-flex items-center justify-center text-xs font-semibold">
                                                    -
                                                </div>
                                            )}
                                            <span className="text-sm font-semibold text-base-content/50">
                                                #{prob.problemNumber}
                                            </span>
                                        </div>

                                        <Link
                                            to={`/problem/${prob.problemNumber}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-lg font-bold text-base-content hover:text-primary transition-colors hover:underline"
                                        >
                                            {prob.title}
                                        </Link>
                                    </div>

                                    {/* Difficulty & Acceptance */}
                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                        <div>{getDifficultyBadge(prob.difficulty)}</div>
                                        <div className="text-right">
                                            <div className="text-xs text-base-content/50 font-medium">Acceptance</div>
                                            <div className="text-sm font-semibold text-base-content/80">{accRate}%</div>
                                        </div>
                                    </div>

                                </div>

                                {/* Bottom Row: Tags */}
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-base-200/60">
                                    {prob.tags?.map((t, idx) => (
                                        <span 
                                            key={idx} 
                                            className="badge badge-ghost text-xs py-2.5 px-3 text-base-content/80 font-medium hover:bg-base-200 cursor-pointer"
                                            onClick={() => {
                                                setSelectedTag(t.name || t);
                                                setPage(1);
                                            }}
                                        >
                                            {t.name || t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <span className="text-xs text-base-content/60">
                        Showing page <span className="font-bold text-base-content">{page}</span> of <span className="font-bold text-base-content">{totalPages}</span>
                    </span>

                    <div className="join border border-base-300 bg-base-100 rounded-xl shadow-sm">
                        <button
                            className="join-item btn btn-sm btn-ghost cursor-pointer"
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        >
                            « Prev
                        </button>
                        
                        <button className="join-item btn btn-sm btn-ghost text-xs cursor-default">
                            {page}
                        </button>

                        <button
                            className="join-item btn btn-sm btn-ghost cursor-pointer"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        >
                            Next »
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}