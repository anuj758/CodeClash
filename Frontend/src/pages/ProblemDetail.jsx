import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosClient';

// Sub-component: Renders Code Blocks with interactive 'Load to Editor' state
function CodeBlock({ language, code, onCopyCode }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopyCode(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 rounded-xl border border-base-300 bg-base-300/90 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-base-200/90 text-xs font-mono text-base-content/70 border-b border-base-300">
                <span className="font-bold uppercase text-[10px] text-primary">{language || 'code'}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`font-semibold transition-all text-xs flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded border transition-colors ${
                        copied 
                            ? 'bg-success text-success-content border-success' 
                            : 'bg-base-100 hover:bg-base-200 text-base-content/80 border-base-300 hover:text-primary'
                    }`}
                >
                    {copied ? '✓ Loaded!' : '📋 Load to Editor'}
                </button>
            </div>
            <pre className="p-3.5 font-mono text-xs overflow-x-auto text-base-content whitespace-pre leading-snug">
                <code>{code}</code>
            </pre>
        </div>
    );
}

// Helper Component: Full Markdown Parser for AI Chat Responses
function FormatAiMessage({ text, onCopyCode }) {
    if (!text) return null;

    // Helper to render inline formatting: **bold**, *italic*, and `inline code`
    const renderInline = (str) => {
        const tokens = str.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g);
        return tokens.map((token, i) => {
            if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
                return <strong key={i} className="font-bold text-base-content">{token.slice(2, -2)}</strong>;
            }
            if (token.startsWith('*') && token.endsWith('*') && token.length > 2 && !token.startsWith('**')) {
                return <em key={i} className="italic text-base-content/90">{token.slice(1, -1)}</em>;
            }
            if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
                return (
                    <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-base-300 font-mono text-xs text-primary font-semibold border border-base-200">
                        {token.slice(1, -1)}
                    </code>
                );
            }
            return token;
        });
    };

    // Separate code blocks from regular Markdown text
    const blocks = text.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-3 text-sm leading-relaxed font-sans">
            {blocks.map((block, idx) => {
                if (!block) return null;

                // Code block handling
                if (block.startsWith('```') && block.endsWith('```')) {
                    const lines = block.slice(3, -3).trim().split('\n');
                    const language = lines[0].match(/^[a-zA-Z0-9_+-]+$/) ? lines[0] : '';
                    const codeSnippet = language ? lines.slice(1).join('\n') : lines.join('\n');

                    return <CodeBlock key={idx} language={language} code={codeSnippet} onCopyCode={onCopyCode} />;
                }

                // Text block handling (paragraphs, headings, lists)
                const paragraphs = block.split(/\n\n+/);
                return (
                    <div key={idx} className="space-y-2.5">
                        {paragraphs.map((p, pIdx) => {
                            const trimmed = p.trim();
                            if (!trimmed) return null;

                            // Headings
                            if (trimmed.startsWith('### ')) {
                                return <h4 key={pIdx} className="font-bold text-sm text-base-content mt-3 mb-1">{renderInline(trimmed.slice(4))}</h4>;
                            }
                            if (trimmed.startsWith('## ')) {
                                return <h3 key={pIdx} className="font-bold text-base text-base-content mt-3 mb-1">{renderInline(trimmed.slice(3))}</h3>;
                            }
                            if (trimmed.startsWith('# ')) {
                                return <h2 key={pIdx} className="font-bold text-lg text-primary mt-3 mb-1">{renderInline(trimmed.slice(2))}</h2>;
                            }

                            // Bullet or Numbered Lists
                            const lines = trimmed.split('\n');
                            const isList = lines.every(line => /^(\*|-|\d+\.)\s+/.test(line.trim()));

                            if (isList) {
                                const isNumbered = /^\d+\./.test(lines[0].trim());
                                const ListTag = isNumbered ? 'ol' : 'ul';
                                return (
                                    <ListTag key={pIdx} className={`pl-5 space-y-1 my-2 text-xs md:text-sm text-base-content/90 ${isNumbered ? 'list-decimal' : 'list-disc'}`}>
                                        {lines.map((line, lIdx) => {
                                            const content = line.trim().replace(/^(\*|-|\d+\.)\s+/, '');
                                            return <li key={lIdx}>{renderInline(content)}</li>;
                                        })}
                                    </ListTag>
                                );
                            }

                            // Paragraph with single line-break preservation
                            return (
                                <p key={pIdx} className="text-base-content/90 leading-relaxed text-xs md:text-sm">
                                    {lines.map((line, lIdx) => (
                                        <React.Fragment key={lIdx}>
                                            {renderInline(line)}
                                            {lIdx < lines.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </p>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export default function ProblemDetail() {
    const { problemNumber } = useParams();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Code Editor & Language State
    const [selectedLang, setSelectedLang] = useState(null);
    const [code, setCode] = useState('');

    // Execution & Navigation States
    const [activeTab, setActiveTab] = useState('description'); // 'description' | 'editorial' | 'submissions' | 'ai' | 'testcases' | 'result'
    const [customInputs, setCustomInputs] = useState([]);
    const [executing, setExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState(null);

    // Editorial State
    const [selectedEditorialLang, setSelectedEditorialLang] = useState({});

    // Like / Dislike Interaction State
    const [userInteraction, setUserInteraction] = useState('none');
    const [voteCooldown, setVoteCooldown] = useState(0);

    // Submissions History State
    const [userSubmissions, setUserSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    // AI Chat State
    const [aiMessages, setAiMessages] = useState([
        {
            sender: 'ai',
            text: "Hi! I'm your AI Coding Assistant. Ask me for a hint, edge cases to consider, or help optimizing your code!"
        }
    ]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages, aiLoading]);

    // Timer countdown for vote cooldown
    useEffect(() => {
        let timer;
        if (voteCooldown > 0) {
            timer = setInterval(() => {
                setVoteCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [voteCooldown]);

    // Fetch Problem & Initial Interaction State
    useEffect(() => {
        const fetchProblem = async () => {
            if (!problemNumber) return;

            setLoading(true);
            setError('');
            try {
                const cleanNum = String(problemNumber).trim();
                const [probRes, interactionRes] = await Promise.all([
                    axiosClient.get(`/problem/${cleanNum}`),
                    axiosClient.get(`/user/interaction/${cleanNum}`).catch(() => ({ data: { status: 'none' } }))
                ]);

                if (probRes.data?.success) {
                    const prob = probRes.data.problem;
                    setProblem(prob);

                    if (prob.supportedLanguages && prob.supportedLanguages.length > 0) {
                        const defaultL = prob.supportedLanguages[0];
                        setSelectedLang(defaultL);
                        setCode(defaultL.initialCode || '');
                    }

                    if (prob.visibleTestCases) {
                        setCustomInputs(prob.visibleTestCases.map((tc) => tc.input));
                    }

                    if (interactionRes.data?.status) {
                        setUserInteraction(interactionRes.data.status);
                    }
                } else {
                    setError('Problem not found.');
                }
            } catch (err) {
                console.error('Error loading problem details:', err);
                setError(err.response?.data?.message || 'Problem not found');
            } finally {
                setLoading(false);
            }
        };

        fetchProblem();
    }, [problemNumber]);

    // Fetch Submissions when Submissions tab is selected
    useEffect(() => {
        if (activeTab === 'submissions' && problemNumber) {
            fetchSubmissions();
        }
    }, [activeTab, problemNumber]);

    const fetchSubmissions = async () => {
        setSubmissionsLoading(true);
        try {
            const cleanNum = String(problemNumber).trim();
            const res = await axiosClient.get(`user/problem/${cleanNum}`);
            if (res.data?.success) {
                setUserSubmissions(res.data.submissions || []);
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const handleLanguageChange = (e) => {
        const langId = e.target.value;
        const targetLang = problem.supportedLanguages.find((l) => (l._id || l.languageId) === langId);
        if (targetLang) {
            setSelectedLang(targetLang);
            setCode(targetLang.initialCode || '');
        }
    };

    const handleVote = async (type) => {
        if (voteCooldown > 0) return;

        const cleanNum = String(problemNumber).trim();
        setVoteCooldown(5);

        try {
            const res = await axiosClient.post(`/user/interaction/${cleanNum}/${type}`);
            if (res.data?.success) {
                setUserInteraction(res.data.userStatus);
                setProblem((prev) => ({
                    ...prev,
                    likes: res.data.likes,
                    dislikes: res.data.dislikes
                }));
            }
        } catch (err) {
            console.error(`Failed to record ${type}:`, err);
        }
    };

    const handleSendAiMessage = async (e, customPrompt = null) => {
        if (e) e.preventDefault();
        const promptToSend = customPrompt || aiInput.trim();
        if (!promptToSend || aiLoading) return;

        if (!customPrompt) setAiInput('');
        setAiMessages((prev) => [...prev, { sender: 'user', text: promptToSend }]);
        setAiLoading(true);

        try {
            const payload = {
                problemNumber: Number(problemNumber),
                code,
                language: selectedLang?.name,
                query: promptToSend
            };

            const res = await axiosClient.post('/ai/chat', payload);

            if (res.data?.success && res.data?.reply) {
                setAiMessages((prev) => [...prev, { sender: 'ai', text: res.data.reply }]);
            } else {
                setAiMessages((prev) => [
                    ...prev,
                    { sender: 'ai', text: "I couldn't generate a response. Please try asking again." }
                ]);
            }
        } catch (err) {
            console.error('AI Chat frontend error:', err);
            setAiMessages((prev) => [
                ...prev,
                { sender: 'ai', text: "Unable to connect to AI Assistant. Please check server logs." }
            ]);
        } finally {
            setAiLoading(false);
        }
    };

    const handleCopyCodeToEditor = (snippet) => {
        setCode(snippet);
    };

    // --- DRY RUN CODE HANDLER ---
    const handleRunCode = async () => {
        if (!selectedLang) return;
        setExecuting(true);
        setActiveTab('result');
        setExecutionResult(null);

        try {
            const cleanNum = String(problemNumber).trim();
            const languageId = selectedLang._id || selectedLang.languageId;

            const payload = {
                languageId,
                code,
                testCases: customInputs
            };
            
            const res = await axiosClient.post(`/problem/run/${cleanNum}`, payload);
            setExecutionResult({ type: 'run', data: res.data?.result || res.data });
        } catch (err) {
            console.error('Run execution error:', err);
            setExecutionResult({
                type: 'error',
                message: err.response?.data?.message || 'Error executing code'
            });
        } finally {
            setExecuting(false);
        }
    };

    // --- FULL SUBMIT CODE HANDLER ---
    const handleSubmitCode = async () => {
        if (!selectedLang) return;
        setExecuting(true);
        setActiveTab('result');
        setExecutionResult(null);

        try {
            const cleanNum = String(problemNumber).trim();
            const languageId = selectedLang._id || selectedLang.languageId;

            const payload = {
                problemNumber: Number(cleanNum),
                languageId,
                code
            };

            const res = await axiosClient.post(`/problem/submit/${cleanNum}`, payload);
            setExecutionResult({ type: 'submit', data: res.data?.result || res.data });
            
            if (activeTab === 'submissions') fetchSubmissions();
        } catch (err) {
            console.error('Submission error:', err);
            setExecutionResult({
                type: 'error',
                message: err.response?.data?.message || 'Submission failed'
            });
        } finally {
            setExecuting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-base-300 font-sans fixed inset-0 z-50">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-base font-medium text-base-content/60">Loading problem workspace...</span>
            </div>
        );
    }

    if (error || !problem) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-base-300 font-sans fixed inset-0 z-50">
                <div className="alert alert-error max-w-md shadow-lg text-base">
                    <span>{error || 'Problem details could not be retrieved.'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-base-300 overflow-hidden font-sans fixed inset-0">
            {/* Top Workspace Navbar */}
            <div className="bg-base-100 border-b border-base-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xl text-primary">#{problem.problemNumber}</span>
                    <h2 className="font-bold text-base-content text-lg truncate max-w-xs sm:max-w-md">
                        {problem.title}
                    </h2>
                    {problem.isSolved && (
                        <span className="badge badge-success gap-1 font-semibold text-sm">✓ Solved</span>
                    )}
                </div>

                <div className="flex items-center gap-2.5">
                    <select
                        className="select select-sm select-bordered font-mono text-sm cursor-pointer focus:select-primary"
                        value={selectedLang?._id || selectedLang?.languageId || ''}
                        onChange={handleLanguageChange}
                    >
                        {problem.supportedLanguages?.map((lang) => (
                            <option key={lang._id || lang.languageId} value={lang._id || lang.languageId}>
                                {lang.name} ({lang.version})
                            </option>
                        ))}
                    </select>

                    <button
                        className="btn btn-sm bg-base-200 hover:bg-base-300 text-base-content border border-base-300 cursor-pointer text-sm font-semibold px-4 shadow-2xs transition-all"
                        onClick={handleRunCode}
                        disabled={executing}
                    >
                        {executing ? <span className="loading loading-spinner loading-xs"></span> : 'Run'}
                    </button>

                    <button
                        className="btn btn-sm bg-success hover:bg-success/90 text-success-content border-none cursor-pointer px-5 font-bold shadow-xs text-sm transition-all"
                        onClick={handleSubmitCode}
                        disabled={executing}
                    >
                        {executing ? <span className="loading loading-spinner loading-xs"></span> : 'Submit'}
                    </button>
                </div>
            </div>

            {/* Split IDE Body */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 overflow-hidden min-h-0">
                
                {/* Left Panel */}
                <div className="bg-base-100 rounded-xl border border-base-200 flex flex-col overflow-hidden shadow-xs min-h-0 h-full">
                    
                    {/* Navigation Tabs - Single Line */}
                    <div className="tabs tabs-boxed bg-base-200/50 p-1.5 m-2 shrink-0 flex flex-nowrap overflow-x-auto whitespace-nowrap gap-1.5 scrollbar-none">
                        <button
                            className={`tab shrink-0 cursor-pointer text-sm font-medium ${activeTab === 'description' ? 'tab-active font-bold' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>

                        {problem.editorial?.length > 0 && (
                            <button
                                className={`tab shrink-0 cursor-pointer text-sm font-medium ${activeTab === 'editorial' ? 'tab-active font-bold' : ''}`}
                                onClick={() => setActiveTab('editorial')}
                            >
                                Editorial ({problem.editorial.length})
                            </button>
                        )}

                        <button
                            className={`tab shrink-0 cursor-pointer text-sm font-medium ${activeTab === 'submissions' ? 'tab-active font-bold' : ''}`}
                            onClick={() => setActiveTab('submissions')}
                        >
                            Submissions
                        </button>

                        <button
                            className={`tab shrink-0 cursor-pointer text-sm font-medium gap-1 ${activeTab === 'ai' ? 'tab-active text-primary font-bold' : ''}`}
                            onClick={() => setActiveTab('ai')}
                        >
                            ✨ Ask AI
                        </button>

                        <button
                            className={`tab shrink-0 cursor-pointer text-sm font-medium ${activeTab === 'testcases' ? 'tab-active font-bold' : ''}`}
                            onClick={() => setActiveTab('testcases')}
                        >
                            Test Cases ({problem.visibleTestCases?.length || 0})
                        </button>

                        <button
                            className={`tab shrink-0 cursor-pointer text-sm font-medium ${activeTab === 'result' ? 'tab-active font-bold' : ''}`}
                            onClick={() => setActiveTab('result')}
                        >
                            Console Output
                        </button>
                    </div>

                    {/* Tab Content Area */}
                    <div className="flex-1 p-5 overflow-y-auto min-h-0 space-y-6 text-base">
                        
                        {/* TAB 1: Description */}
                        {activeTab === 'description' && (
                            <div className="space-y-6 flex flex-col min-h-full justify-between">
                                <div className="space-y-6">
                                    {/* 1. Problem Description */}
                                    <div className="prose max-w-none text-base-content/90 whitespace-pre-line leading-relaxed font-sans text-base">
                                        {problem.description}
                                    </div>

                                    {/* 2. Example Cards */}
                                    {problem.visibleTestCases?.length > 0 && (
                                        <div className="space-y-3 pt-2">
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-base-content/70">
                                                Examples
                                            </h4>
                                            {problem.visibleTestCases.map((tc, idx) => (
                                                <div key={tc._id || idx} className="bg-base-200/50 p-4 rounded-xl border border-base-200 font-mono text-sm space-y-2.5 shadow-xs">
                                                    <div>
                                                        <span className="text-base-content/50 font-semibold">Input: </span>
                                                        <span>{tc.input}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-base-content/50 font-semibold">Output: </span>
                                                        <span className="text-success font-bold">{tc.output}</span>
                                                    </div>
                                                    {tc.explanation && (
                                                        <div className="font-sans text-sm text-base-content/70 italic pt-1 border-t border-base-300/40">
                                                            Explanation: {tc.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 3. Constraints */}
                                    {problem.constraints && problem.constraints.length > 0 && (
                                        <div className="space-y-3 pt-2">
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-base-content/70">
                                                Constraints
                                            </h4>
                                            <ul className="list-disc pl-5 font-mono text-sm space-y-1.5 text-base-content/80">
                                                {problem.constraints.map((c, i) => (
                                                    <li key={i}>{c}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 4. Time & Memory Limits */}
                                    {problem.executionLimits && (
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="bg-base-200/40 p-4 rounded-xl border border-base-200 font-mono text-sm">
                                                <span className="text-base-content/50 block text-xs">Time Limit</span>
                                                <span className="font-bold text-base-content text-base">{problem.executionLimits.timeLimit}s</span>
                                            </div>
                                            <div className="bg-base-200/40 p-4 rounded-xl border border-base-200 font-mono text-sm">
                                                <span className="text-base-content/50 block text-xs">Memory Limit</span>
                                                <span className="font-bold text-base-content text-base">
                                                    {Math.round(problem.executionLimits.memoryLimit / 1024)} MB
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. Tags */}
                                    {problem.tags?.length > 0 && (
                                        <div className="space-y-3 pt-2">
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-base-content/70">
                                                Tags
                                            </h4>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {problem.tags.map((t) => (
                                                    <span key={t._id || t.name} className="badge badge-ghost font-mono text-sm py-3 px-3">
                                                        {t.name || t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 6. Submissions & Acceptance Stats */}
                                    <div className="bg-base-200/40 p-4 rounded-xl border border-base-200 space-y-3">
                                        <div className="grid grid-cols-2 gap-4 font-mono text-sm text-base-content/70">
                                            <div>
                                                <span className="text-base-content/50 block text-xs">Submissions</span>
                                                <span className="font-bold text-base-content text-base">{problem.totalSubmissions || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-base-content/50 block text-xs">Acceptance</span>
                                                <span className="font-bold text-success text-base">{problem.totalAccepted || 0}</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-base-200/60 pt-3 flex items-center justify-between text-sm">
                                            <span className="text-base-content/70 font-medium">Acceptance Rate</span>
                                            <span className="badge badge-neutral font-semibold font-mono text-sm">{problem.acceptanceRate}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback Bar at Bottom */}
                                <div className="pt-4 mt-6 border-t border-base-200 flex items-center justify-between shrink-0">
                                    <span className="text-sm text-base-content/70 font-medium">Was this problem helpful?</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className={`btn btn-sm gap-2 cursor-pointer ${userInteraction === 'liked' ? 'btn-success text-white' : 'btn-ghost hover:bg-success/10'}`}
                                            disabled={voteCooldown > 0}
                                            onClick={() => handleVote('like')}
                                        >
                                            👍 <span className="font-mono text-sm">{problem.likes || 0}</span>
                                        </button>

                                        <button
                                            className={`btn btn-sm gap-2 cursor-pointer ${userInteraction === 'disliked' ? 'btn-error text-white' : 'btn-ghost hover:bg-error/10'}`}
                                            disabled={voteCooldown > 0}
                                            onClick={() => handleVote('dislike')}
                                        >
                                            👎 <span className="font-mono text-sm">{problem.dislikes || 0}</span>
                                        </button>

                                        {voteCooldown > 0 && (
                                            <span className="text-xs font-mono text-base-content/40 pl-1">
                                                Wait {voteCooldown}s
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Multi-Approach Editorial */}
                        {activeTab === 'editorial' && problem.editorial?.length > 0 && (
                            <div className="space-y-6">
                                {problem.editorial.map((item, edIdx) => {
                                    const currentActiveLang = selectedEditorialLang[edIdx] || item.codeImplementations?.[0]?.languageId || '';

                                    return (
                                        <div key={edIdx} className="p-5 bg-base-200/40 rounded-2xl border border-base-200 space-y-4">
                                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                                <span>{item.title || `Approach #${edIdx + 1}`}</span>
                                            </h3>

                                            <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-line">
                                                {item.description}
                                            </p>

                                            {item.complexityAnalysis && (
                                                <div className="flex gap-6 p-3 rounded-xl bg-base-200 font-mono text-sm">
                                                    <div>
                                                        <span className="text-base-content/50">Time: </span>
                                                        <span className="text-primary font-bold">{item.complexityAnalysis.time}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-base-content/50">Space: </span>
                                                        <span className="text-secondary font-bold">{item.complexityAnalysis.space}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {item.codeImplementations?.length > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    <div className="flex gap-2 border-b border-base-200 pb-2">
                                                        {item.codeImplementations.map((impl) => {
                                                            const langObj = problem.supportedLanguages?.find((l) => (l._id || l.languageId) === impl.languageId);
                                                            return (
                                                                <button
                                                                    key={impl._id || impl.languageId}
                                                                    className={`btn btn-sm cursor-pointer ${currentActiveLang === impl.languageId ? 'btn-primary' : 'btn-ghost'}`}
                                                                    onClick={() => setSelectedEditorialLang({
                                                                        ...selectedEditorialLang,
                                                                        [edIdx]: impl.languageId
                                                                    })}
                                                                >
                                                                    {langObj?.name || 'Code'}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <pre className="bg-base-300 p-4 rounded-xl font-mono text-sm overflow-x-auto text-base-content/90 border border-base-200">
                                                        <code>
                                                            {item.codeImplementations.find((i) => i.languageId === currentActiveLang)?.code 
                                                                || item.codeImplementations[0]?.code}
                                                        </code>
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* TAB 3: Submissions History */}
                        {activeTab === 'submissions' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-base text-base-content">Your Submissions</h3>

                                {submissionsLoading ? (
                                    <div className="py-12 text-center space-y-2">
                                        <span className="loading loading-spinner text-primary loading-md"></span>
                                        <p className="text-xs text-base-content/60 font-mono">Loading past attempts...</p>
                                    </div>
                                ) : userSubmissions.length === 0 ? (
                                    <div className="text-center py-16 bg-base-200/40 rounded-xl border border-base-200 text-base-content/50 text-sm">
                                        No submissions found for this problem yet.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border border-base-200 rounded-xl shadow-xs">
                                        <table className="table table-zebra w-full text-xs">
                                            <thead>
                                                <tr className="bg-base-200/60 uppercase text-base-content/60 font-mono">
                                                    <th>Status</th>
                                                    <th>Language</th>
                                                    <th>Runtime</th>
                                                    <th>Memory</th>
                                                    <th>Submitted</th>
                                                    <th className="text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userSubmissions.map((sub) => {
                                                    const statusText = sub.status?.description || sub.status || 'Executed';
                                                    const isAccepted = statusText === 'Accepted';

                                                    return (
                                                        <tr key={sub._id} className="hover:bg-base-200/40">
                                                            <td>
                                                                <span className={`badge badge-sm font-semibold ${isAccepted ? 'badge-success' : 'badge-error'}`}>
                                                                    {statusText}
                                                                </span>
                                                            </td>
                                                            <td className="font-mono text-base-content/70">{sub.languageId?.name || sub.language || 'Compiler'}</td>
                                                            <td className="font-mono">{sub.time ?? 0}s</td>
                                                            <td className="font-mono">{sub.memory ?? 0} KB</td>
                                                            <td className="font-mono text-base-content/50">{new Date(sub.createdAt).toLocaleDateString()}</td>
                                                            <td className="text-right">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-ghost cursor-pointer font-mono"
                                                                    onClick={() => setCode(sub.code)}
                                                                >
                                                                    Load Code ↗
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: Ask AI Assistant with Upgraded Markdown Parser */}
                        {activeTab === 'ai' && (
                            <div className="flex flex-col h-full min-h-[400px]">
                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
                                    {aiMessages.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                                                msg.sender === 'user' 
                                                    ? 'bg-primary text-primary-content rounded-br-none' 
                                                    : 'bg-base-200 text-base-content rounded-bl-none border border-base-300 shadow-2xs'
                                            }`}>
                                                {msg.sender === 'ai' ? (
                                                    <FormatAiMessage text={msg.text} onCopyCode={handleCopyCodeToEditor} />
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {aiLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-base-200 p-4 rounded-2xl rounded-bl-none border border-base-300 flex items-center gap-2">
                                                <span className="loading loading-dots loading-xs text-primary"></span>
                                                <span className="text-sm text-base-content/60 font-mono">Gemini is analyzing...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <form onSubmit={handleSendAiMessage} className="mt-3 pt-3 border-t border-base-200 flex gap-2">
                                    <input
                                        type="text"
                                        className="input input-bordered flex-1 text-sm font-sans focus:input-primary"
                                        placeholder="Ask AI for hints, complexity, or edge cases..."
                                        value={aiInput}
                                        onChange={(e) => setAiInput(e.target.value)}
                                        disabled={aiLoading}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary cursor-pointer px-6 text-sm font-bold"
                                        disabled={aiLoading || !aiInput.trim()}
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* TAB 5: Test Cases */}
                        {activeTab === 'testcases' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-base text-base-content">Manage Test Cases</h3>
                                <div className="space-y-4">
                                    {customInputs.map((inputVal, idx) => (
                                        <div key={idx} className="space-y-1.5">
                                            <label className="text-xs font-mono text-base-content/70 block">Test Case #{idx + 1} Input:</label>
                                            <textarea
                                                className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                                rows={3}
                                                value={inputVal}
                                                onChange={(e) => {
                                                    const updated = [...customInputs];
                                                    updated[idx] = e.target.value;
                                                    setCustomInputs(updated);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 6: Formatted Execution Console Output */}
                        {activeTab === 'result' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-base text-base-content">Execution Console</h3>
                                {executing ? (
                                    <div className="py-16 text-center space-y-3">
                                        <span className="loading loading-spinner text-primary loading-lg"></span>
                                        <p className="text-sm text-base-content/60 font-mono">Executing code on Judge0 sandbox...</p>
                                    </div>
                                ) : !executionResult ? (
                                    <div className="text-center py-16 text-base-content/50 text-sm font-mono">
                                        Click "▶ Run" or "Submit" to see output results here.
                                    </div>
                                ) : executionResult.type === 'error' ? (
                                    <div className="alert alert-error text-sm font-mono">{executionResult.message}</div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Dry Run Output */}
                                        {executionResult.type === 'run' && Array.isArray(executionResult.data) && (
                                            <div className="space-y-3">
                                                <div className="font-bold text-base text-base-content flex items-center justify-between">
                                                    <span>Dry Run Results</span>
                                                    <span className="text-xs font-mono text-base-content/50">
                                                        {executionResult.data.length} Input Case(s)
                                                    </span>
                                                </div>

                                                {executionResult.data.map((res, i) => {
                                                    const statusDesc = res.status?.description || 'Executed';
                                                    const isSuccess = res.status?.id === 3;

                                                    return (
                                                        <div key={i} className="bg-base-200/60 p-4 rounded-xl font-mono text-xs space-y-2 border border-base-200 shadow-xs">
                                                            <div className="flex justify-between items-center border-b border-base-200/60 pb-2">
                                                                <span className="font-bold">Test Input #{i + 1}</span>
                                                                <span className={`badge badge-sm font-semibold ${isSuccess ? 'badge-ghost text-base-content/70' : 'badge-error'}`}>
                                                                    {isSuccess ? 'Executed' : statusDesc}
                                                                </span>
                                                            </div>

                                                            {res.input !== undefined && (
                                                                <div>
                                                                    <span className="text-base-content/50">Input:</span>
                                                                    <div className="bg-base-300 p-2 rounded mt-0.5 text-base-content/90 whitespace-pre-wrap">{res.input || '(empty)'}</div>
                                                                </div>
                                                            )}

                                                            {res.stdout ? (
                                                                <div>
                                                                    <span className="text-base-content/50">Output:</span>
                                                                    <div className="bg-base-300 p-2 rounded mt-0.5 text-info font-mono whitespace-pre-wrap">{res.stdout}</div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-base-content/40 italic">Stdout: (no output produced)</div>
                                                            )}

                                                            {res.stderr && (
                                                                <div className="text-error">
                                                                    <span className="text-base-content/50">Standard Error:</span>
                                                                    <div className="bg-error/10 border border-error/20 p-2 rounded mt-0.5 whitespace-pre-wrap">{res.stderr}</div>
                                                                </div>
                                                            )}

                                                            {res.compile_output && (
                                                                <div className="text-warning">
                                                                    <span className="text-base-content/50">Compilation Output:</span>
                                                                    <div className="bg-warning/10 border border-warning/20 p-2 rounded mt-0.5 whitespace-pre-wrap">{res.compile_output}</div>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="text-[10px] text-base-content/40 pt-1 border-t border-base-200 flex justify-between">
                                                                <span>Time: {res.time ?? '0'}s</span>
                                                                <span>Memory: {res.memory ?? '0'} KB</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Full Submit Output */}
                                        {executionResult.type === 'submit' && executionResult.data && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-base">Submission Evaluation</span>
                                                    <span className={`badge badge-lg font-bold ${executionResult.data.isAccepted ? 'badge-success' : 'badge-error'}`}>
                                                        {executionResult.data.status?.description || (executionResult.data.isAccepted ? 'Accepted' : 'Failed')}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-base-200/60 p-3 rounded-xl border border-base-200 text-center shadow-xs">
                                                    <div>
                                                        <div className="text-base-content/50 text-[10px]">Test Cases</div>
                                                        <div className="font-bold text-success mt-0.5">
                                                            {executionResult.data.acceptedTestCases ?? 0} / {executionResult.data.totalTestCases ?? 0}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/50 text-[10px]">Avg Time</div>
                                                        <div className="font-bold mt-0.5">{executionResult.data.time ?? '0'} s</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/50 text-[10px]">Peak Memory</div>
                                                        <div className="font-bold mt-0.5">{executionResult.data.memory ?? '0'} KB</div>
                                                    </div>
                                                </div>

                                                {executionResult.data.failedTestCase && (
                                                    <div className="bg-error/10 border border-error/20 p-3 rounded-xl font-mono text-xs space-y-2 text-error">
                                                        <div className="font-bold">First Failed Test Case:</div>
                                                        {executionResult.data.failedTestCase.input && <div>Input: {executionResult.data.failedTestCase.input}</div>}
                                                        {executionResult.data.failedTestCase.expected_output && <div>Expected: {executionResult.data.failedTestCase.expected_output}</div>}
                                                        {executionResult.data.failedTestCase.actual_output && <div>Actual Output: {executionResult.data.failedTestCase.actual_output}</div>}
                                                        {executionResult.data.failedTestCase.runTimeError && <div className="pt-1">Runtime Error: {executionResult.data.failedTestCase.runTimeError}</div>}
                                                        {executionResult.data.failedTestCase.compilationError && <div className="pt-1">Compilation Error: {executionResult.data.failedTestCase.compilationError}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* Right Panel: Code Editor */}
                <div className="bg-base-100 rounded-xl border border-base-200 flex flex-col overflow-hidden shadow-xs min-h-0 h-full">
                    <div className="bg-base-200/50 px-4 py-2.5 border-b border-base-200 flex items-center justify-between text-xs font-mono text-base-content/70">
                        <span className="text-sm font-semibold">Workspace Code Editor</span>
                        <span className="badge badge-sm badge-ghost font-mono text-xs">{selectedLang?.name || 'Compiler'}</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language={selectedLang?.monacoLanguage || selectedLang?.name?.toLowerCase() || 'cpp'}
                            theme="vs-dark"
                            value={code}
                            onChange={(newCode) => setCode(newCode || '')}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 4
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}