import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../utils/axiosClient';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('problems'); // 'problems' | 'add-problem' | 'batch-upload' | 'tags-languages' | 'users'

    // Status / Feedback State
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // --- PROBLEMS LIST & PAGINATION STATE ---
    const [problemsList, setProblemsList] = useState([]);
    const [searchNum, setSearchNum] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProblems, setTotalProblems] = useState(0);

    // --- TAGS & LANGUAGES METADATA STATE ---
    const [tagsList, setTagsList] = useState([]);
    const [languagesList, setLanguagesList] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [newLangJudge0Id, setNewLangJudge0Id] = useState('');
    const [newLangTemplate, setNewLangTemplate] = useState('');

    // --- SINGLE PROBLEM FORM STATE (Create & Edit) ---
    const [isEditing, setIsEditing] = useState(false);
    const [editProblemNumber, setEditProblemNumber] = useState(null);
    const [problemForm, setProblemForm] = useState({
        title: '',
        description: '',
        difficulty: 'easy',
        tags: [],
        constraints: '',
        timeLimit: 1,
        memoryLimit: 262144,
        visibleTestCases: [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        referenceSolution: [{ languageId: '', code: '' }],
        editorial: [
            {
                title: '',
                description: '',
                timeComplexity: 'O(N)',
                spaceComplexity: 'O(1)',
                codeImplementations: [{ languageId: '', code: '' }]
            }
        ]
    });

    // --- BATCH PROBLEMS STATE ---
    const [batchJson, setBatchJson] = useState('');

    // --- USER ROLE STATE ---
    const [userForm, setUserForm] = useState({ emailId: '', username: '' });

    const showFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    };

    // 1. Fetch Paginated Problems List
    const fetchProblems = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (searchNum.trim()) {
                params.title = searchNum.trim();
            }

            const res = await axiosClient.get('/problem/', { params });
            if (res.data?.success) {
                setProblemsList(res.data.problems || []);
                setTotalPages(res.data.totalPages || 1);
                setTotalProblems(res.data.totalProblems || 0);
            }
        } catch (err) {
            showFeedback('error', 'Failed to load problems list.');
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchNum]);

    // 2. Fetch Tags & Languages Metadata
    const fetchMetadata = useCallback(async () => {
        try {
            const [tagsRes, langsRes] = await Promise.all([
                axiosClient.get('/tags').catch(() => axiosClient.get('/meta/tags')),
                axiosClient.get('/languages').catch(() => axiosClient.get('/meta/languages'))
            ]);

            if (tagsRes.data?.allTags) setTagsList(tagsRes.data.allTags);
            else if (tagsRes.data?.tags) setTagsList(tagsRes.data.tags);

            if (langsRes.data?.allLanguages) setLanguagesList(langsRes.data.allLanguages);
            else if (langsRes.data?.languages) setLanguagesList(langsRes.data.languages);
        } catch (err) {
            console.error('Error fetching metadata:', err);
        }
    }, []);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    // --- HANDLER: Fetch Problem Details for Edit ---
    const handleEditClick = async (num) => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/admin/problems/${num}`);
            if (res.data?.success) {
                const prob = res.data.problem;
                setIsEditing(true);
                setEditProblemNumber(prob.problemNumber);

                const mappedEditorial = prob.editorial?.length > 0
                    ? prob.editorial.map((item) => ({
                        title: item.title || '',
                        description: item.description || '',
                        timeComplexity: item.complexityAnalysis?.time || 'O(N)',
                        spaceComplexity: item.complexityAnalysis?.space || 'O(1)',
                        codeImplementations: item.codeImplementations?.length > 0
                            ? item.codeImplementations.map((impl) => ({
                                languageId: impl.languageId?._id || impl.languageId || '',
                                code: impl.code || ''
                            }))
                            : [{ languageId: '', code: '' }]
                    }))
                    : [{
                        title: '',
                        description: '',
                        timeComplexity: 'O(N)',
                        spaceComplexity: 'O(1)',
                        codeImplementations: [{ languageId: '', code: '' }]
                    }];

                const mappedTagIds = prob.tags?.map((t) => t._id || t) || [];

                setProblemForm({
                    title: prob.title || '',
                    description: prob.description || '',
                    difficulty: prob.difficulty || 'easy',
                    tags: mappedTagIds,
                    constraints: prob.constraints?.join('\n') || '',
                    timeLimit: prob.executionLimits?.timeLimit || 1,
                    memoryLimit: prob.executionLimits?.memoryLimit || 262144,
                    visibleTestCases: prob.visibleTestCases?.length > 0
                        ? prob.visibleTestCases
                        : [{ input: '', output: '', explanation: '' }],
                    hiddenTestCases: prob.hiddenTestCases?.length > 0
                        ? prob.hiddenTestCases
                        : [{ input: '', output: '' }],
                    referenceSolution: prob.referenceSolution?.length > 0
                        ? prob.referenceSolution.map((ref) => ({
                            languageId: ref.languageId?._id || ref.languageId || '',
                            code: ref.code || ''
                        }))
                        : [{ languageId: '', code: '' }],
                    editorial: mappedEditorial
                });

                setActiveTab('add-problem');
            }
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Failed to fetch problem details.');
        } finally {
            setLoading(false);
        }
    };

    const handleTagToggle = (tagId) => {
        setProblemForm((prev) => {
            const exists = prev.tags.includes(tagId);
            return {
                ...prev,
                tags: exists ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId]
            };
        });
    };

    const handleSaveProblem = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formattedEditorial = problemForm.editorial
            .filter((e) => e.title.trim() !== '')
            .map((e) => ({
                title: e.title,
                description: e.description,
                complexityAnalysis: {
                    time: e.timeComplexity,
                    space: e.spaceComplexity
                },
                codeImplementations: e.codeImplementations.filter((c) => c.languageId && c.code)
            }));

        const payload = {
            title: problemForm.title,
            description: problemForm.description,
            difficulty: problemForm.difficulty,
            tags: problemForm.tags,
            constraints: problemForm.constraints.split('\n').map((c) => c.trim()).filter(Boolean),
            executionLimits: {
                timeLimit: Number(problemForm.timeLimit),
                memoryLimit: Number(problemForm.memoryLimit)
            },
            visibleTestCases: problemForm.visibleTestCases,
            hiddenTestCases: problemForm.hiddenTestCases,
            referenceSolution: problemForm.referenceSolution.filter((r) => r.languageId && r.code),
            editorial: formattedEditorial
        };

        try {
            if (isEditing) {
                const res = await axiosClient.put(`/admin/problems/${editProblemNumber}`, payload);
                showFeedback('success', res.data?.message || 'Problem updated successfully!');
            } else {
                const res = await axiosClient.post('/admin/problems', payload);
                showFeedback('success', res.data?.message || 'Problem created successfully!');
            }

            resetProblemForm();
            fetchProblems();
            setActiveTab('problems');
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Failed to save problem.');
        } finally {
            setLoading(false);
        }
    };

    const resetProblemForm = () => {
        setIsEditing(false);
        setEditProblemNumber(null);
        setProblemForm({
            title: '',
            description: '',
            difficulty: 'easy',
            tags: [],
            constraints: '',
            timeLimit: 1,
            memoryLimit: 262144,
            visibleTestCases: [{ input: '', output: '', explanation: '' }],
            hiddenTestCases: [{ input: '', output: '' }],
            referenceSolution: [{ languageId: '', code: '' }],
            editorial: [
                {
                    title: '',
                    description: '',
                    timeComplexity: 'O(N)',
                    spaceComplexity: 'O(1)',
                    codeImplementations: [{ languageId: '', code: '' }]
                }
            ]
        });
    };

    const handleDeleteProblem = async (problemNumber) => {
        if (!window.confirm(`Are you sure you want to delete problem #${problemNumber}?`)) return;

        try {
            const res = await axiosClient.delete(`/admin/problems/${problemNumber}`, {
                data: { problemNumber }
            });
            showFeedback('success', res.data?.message || 'Problem deleted.');
            fetchProblems();
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Failed to delete problem.');
        }
    };

    const handleBatchUpload = async (e) => {
        e.preventDefault();
        try {
            const parsedArray = JSON.parse(batchJson);
            if (!Array.isArray(parsedArray)) {
                showFeedback('error', 'Payload must be a JSON array of problem objects.');
                return;
            }

            setLoading(true);
            const res = await axiosClient.post('/admin/problems/batch', { problems: parsedArray });
            showFeedback('success', res.data?.message || 'Batch creation completed!');
            setBatchJson('');
            fetchProblems();
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Invalid JSON or batch failure.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        try {
            await axiosClient.post('/admin/tags', { name: newTagName.trim() });
            showFeedback('success', `Tag "${newTagName}" added.`);
            setNewTagName('');
            fetchMetadata();
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Failed to add tag.');
        }
    };

    const handleDeleteTag = async (id) => {
        try {
            await axiosClient.delete('/admin/tags', { data: { _id: id } });
            showFeedback('success', 'Tag deleted.');
            fetchMetadata();
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Cannot delete tag.');
        }
    };

    const handleAddLanguage = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/admin/languages', {
                judge0LanguageId: Number(newLangJudge0Id),
                defaultTemplate: newLangTemplate
            });
            showFeedback('success', 'Language added successfully.');
            setNewLangJudge0Id('');
            setNewLangTemplate('');
            fetchMetadata();
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Failed to add language.');
        }
    };

    const handleDeleteLanguage = async (id) => {
        try {
            await axiosClient.delete('/admin/languages', { data: { _id: id } });
            showFeedback('success', 'Language deleted.');
            fetchMetadata();
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Cannot delete language.');
        }
    };

    const handleUserRoleChange = async (action) => {
        if (!userForm.emailId || !userForm.username) {
            showFeedback('error', 'Please enter both Email and Username.');
            return;
        }

        try {
            const endpoint = action === 'promote' ? '/admin/promote' : '/admin/demote';
            const res = await axiosClient.put(endpoint, userForm);
            showFeedback('success', res.data?.message || 'User role updated.');
            setUserForm({ emailId: '', username: '' });
        } catch (err) {
            showFeedback('error', err.response?.data?.message || 'Action failed.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 font-sans">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-base-200 pb-5">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-base-content flex items-center gap-2">
                        🛡️ Admin Control Center
                    </h1>
                    <p className="text-base text-base-content/70 mt-1.5 leading-relaxed">
                        Manage problems, hidden test cases, multi-approach editorials, tags, and compilers.
                    </p>
                </div>
            </div>

            {/* Global Alert */}
            {feedback.message && (
                <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'} shadow-xs text-base py-3`}>
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Navigation Tabs - Larger Text Size & Padding */}
            <div className="tabs tabs-boxed bg-base-200/60 p-2 rounded-xl border border-base-200 flex flex-nowrap overflow-x-auto whitespace-nowrap gap-2 scrollbar-none">
                <button
                    className={`tab shrink-0 cursor-pointer text-base font-medium px-4 py-2 ${activeTab === 'problems' ? 'tab-active font-bold' : ''}`}
                    onClick={() => setActiveTab('problems')}
                >
                    Problems List ({totalProblems})
                </button>
                <button
                    className={`tab shrink-0 cursor-pointer text-base font-medium px-4 py-2 ${activeTab === 'add-problem' ? 'tab-active font-bold' : ''}`}
                    onClick={() => {
                        resetProblemForm();
                        setActiveTab('add-problem');
                    }}
                >
                    {isEditing ? '✏️ Edit Problem' : '➕ Create Problem'}
                </button>
                <button
                    className={`tab shrink-0 cursor-pointer text-base font-medium px-4 py-2 ${activeTab === 'batch-upload' ? 'tab-active font-bold' : ''}`}
                    onClick={() => setActiveTab('batch-upload')}
                >
                    📦 Batch Upload
                </button>
                <button
                    className={`tab shrink-0 cursor-pointer text-base font-medium px-4 py-2 ${activeTab === 'tags-languages' ? 'tab-active font-bold' : ''}`}
                    onClick={() => setActiveTab('tags-languages')}
                >
                    🏷️ Tags & Languages ({languagesList.length})
                </button>
                <button
                    className={`tab shrink-0 cursor-pointer text-base font-medium px-4 py-2 ${activeTab === 'users' ? 'tab-active font-bold' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 User Roles
                </button>
            </div>

            {/* TAB 1: Problems List with Dynamic Search & Pagination */}
            {activeTab === 'problems' && (
                <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs">
                        <div className="flex items-center gap-3 flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search title or keyword..."
                                className="input input-bordered input-md w-full text-base focus:input-primary"
                                value={searchNum}
                                onChange={(e) => {
                                    setSearchNum(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            <select
                                className="select select-bordered select-md text-sm font-mono cursor-pointer focus:select-primary"
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                <option value={15}>15 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>

                            <button
                                className="btn btn-md btn-primary cursor-pointer font-bold shadow-xs text-base px-5"
                                onClick={() => {
                                    resetProblemForm();
                                    setActiveTab('add-problem');
                                }}
                            >
                                ➕ New Problem
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center space-y-3 bg-base-100 rounded-2xl border border-base-200">
                            <span className="loading loading-spinner text-primary loading-lg"></span>
                            <p className="text-base font-medium text-base-content/60 font-mono">Fetching problem database...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-200 shadow-xs">
                            <table className="table w-full text-sm md:text-base">
                                <thead>
                                    <tr className="uppercase text-base-content/70 font-mono text-xs md:text-sm bg-base-200/50 border-b border-base-200">
                                        <th className="py-3.5">#</th>
                                        <th className="py-3.5">Title</th>
                                        <th className="py-3.5">Difficulty</th>
                                        <th className="py-3.5">Tags</th>
                                        <th className="py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {problemsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-base-content/50 font-mono text-base">
                                                No problems match your search criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        problemsList.map((p) => (
                                            <tr key={p.problemNumber} className="hover:bg-base-200/40 transition-colors">
                                                <td className="font-mono font-bold text-base text-primary">#{p.problemNumber}</td>
                                                <td className="font-semibold text-base text-base-content">{p.title}</td>
                                                <td>
                                                    <span className={`badge badge-md uppercase text-xs font-bold py-2.5 px-3 ${
                                                        p.difficulty === 'hard' ? 'badge-error' :
                                                        p.difficulty === 'medium' ? 'badge-warning' : 'badge-success'
                                                    }`}>
                                                        {p.difficulty}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.tags?.map((t, i) => (
                                                            <span key={i} className="badge badge-ghost badge-sm text-xs font-mono py-2 px-2.5">
                                                                {t.name || t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="text-right space-x-2">
                                                    <button
                                                        className="btn btn-sm btn-outline btn-info cursor-pointer font-mono font-semibold"
                                                        onClick={() => handleEditClick(p.problemNumber)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline btn-error cursor-pointer font-mono font-semibold"
                                                        onClick={() => handleDeleteProblem(p.problemNumber)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                            <span className="text-sm font-mono text-base-content/70">
                                Page <span className="font-bold text-base-content">{page}</span> of <span className="font-bold text-base-content">{totalPages}</span> ({totalProblems} Total Problems)
                            </span>

                            <div className="join border border-base-300 bg-base-100 rounded-xl shadow-xs">
                                <button
                                    className="join-item btn btn-md btn-ghost font-mono text-sm cursor-pointer"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                >
                                    « Prev
                                </button>
                                
                                <button className="join-item btn btn-md btn-ghost font-mono text-sm cursor-default font-bold">
                                    {page}
                                </button>

                                <button
                                    className="join-item btn btn-md btn-ghost font-mono text-sm cursor-pointer"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                >
                                    Next »
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Create / Edit Problem Form */}
            {activeTab === 'add-problem' && (
                <form onSubmit={handleSaveProblem} className="bg-base-100 p-6 md:p-8 rounded-2xl border border-base-200 shadow-xs space-y-7">
                    <h2 className="text-2xl font-bold text-base-content border-b border-base-200 pb-3">
                        {isEditing ? `Edit Problem #${editProblemNumber}` : 'Create New Problem'}
                    </h2>

                    {/* Basic Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-base-content/80">Title</label>
                            <input
                                type="text"
                                required
                                className="input input-bordered w-full text-base focus:input-primary"
                                value={problemForm.title}
                                onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-base-content/80">Difficulty</label>
                            <select
                                className="select select-bordered w-full text-base cursor-pointer focus:select-primary"
                                value={problemForm.difficulty}
                                onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-base-content/80">Description</label>
                        <textarea
                            rows={6}
                            required
                            className="textarea textarea-bordered w-full text-base font-sans focus:textarea-primary leading-relaxed"
                            value={problemForm.description}
                            onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                        />
                    </div>

                    {/* Tag Selection UI */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-base-content/80 flex items-center justify-between">
                            <span>Select Tags</span>
                            <span className="text-xs text-base-content/60 font-mono">
                                {problemForm.tags.length} Selected
                            </span>
                        </label>

                        {tagsList.length === 0 ? (
                            <p className="text-sm text-base-content/40 italic">No tags found in database. Add tags in the "Tags & Languages" tab.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2.5 p-4 bg-base-200/50 rounded-xl border border-base-200 max-h-44 overflow-y-auto">
                                {tagsList.map((tag) => {
                                    const isSelected = problemForm.tags.includes(tag._id);
                                    return (
                                        <button
                                            key={tag._id}
                                            type="button"
                                            onClick={() => handleTagToggle(tag._id)}
                                            className={`badge badge-lg cursor-pointer transition-all gap-1.5 text-xs md:text-sm font-mono py-3.5 px-3.5 ${
                                                isSelected ? 'badge-primary font-bold shadow-xs' : 'badge-ghost hover:bg-base-200'
                                            }`}
                                        >
                                            {isSelected ? '✓' : '+'} {tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-base-content/80">Constraints (one per line)</label>
                        <textarea
                            rows={3}
                            className="textarea textarea-bordered w-full text-sm font-mono focus:textarea-primary"
                            value={problemForm.constraints}
                            onChange={(e) => setProblemForm({ ...problemForm, constraints: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-base-content/80">Time Limit (seconds)</label>
                            <input
                                type="number"
                                required
                                className="input input-bordered w-full text-base font-mono focus:input-primary"
                                value={problemForm.timeLimit}
                                onChange={(e) => setProblemForm({ ...problemForm, timeLimit: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-base-content/80">Memory Limit (KB)</label>
                            <input
                                type="number"
                                required
                                className="input input-bordered w-full text-base font-mono focus:input-primary"
                                value={problemForm.memoryLimit}
                                onChange={(e) => setProblemForm({ ...problemForm, memoryLimit: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Reference Solutions Section */}
                    <div className="space-y-4 pt-4 border-t border-base-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base text-info flex items-center gap-2">
                                💻 Reference Solution / Starter Templates
                            </h3>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline btn-info cursor-pointer font-mono"
                                onClick={() => setProblemForm({
                                    ...problemForm,
                                    referenceSolution: [...problemForm.referenceSolution, { languageId: '', code: '' }]
                                })}
                            >
                                ➕ Add Language Code
                            </button>
                        </div>

                        {problemForm.referenceSolution.map((ref, idx) => (
                            <div key={idx} className="p-4 bg-info/5 rounded-xl space-y-3 border border-info/20 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <select
                                        className="select select-bordered select-sm text-sm font-mono cursor-pointer"
                                        value={ref.languageId}
                                        onChange={(e) => {
                                            const updated = [...problemForm.referenceSolution];
                                            updated[idx].languageId = e.target.value;
                                            setProblemForm({ ...problemForm, referenceSolution: updated });
                                        }}
                                    >
                                        <option value="">Select Language ({languagesList.length} Available)</option>
                                        {languagesList.map((lang) => (
                                            <option key={lang._id} value={lang._id}>
                                                {lang.name} ({lang.version})
                                            </option>
                                        ))}
                                    </select>

                                    {problemForm.referenceSolution.length > 1 && (
                                        <button
                                            type="button"
                                            className="text-error font-bold text-sm cursor-pointer font-mono"
                                            onClick={() => {
                                                const updated = problemForm.referenceSolution.filter((_, i) => i !== idx);
                                                setProblemForm({ ...problemForm, referenceSolution: updated });
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <textarea
                                    rows={5}
                                    placeholder="Paste reference code or template here..."
                                    className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                    value={ref.code}
                                    onChange={(e) => {
                                        const updated = [...problemForm.referenceSolution];
                                        updated[idx].code = e.target.value;
                                        setProblemForm({ ...problemForm, referenceSolution: updated });
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Visible Test Cases */}
                    <div className="space-y-4 pt-4 border-t border-base-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base text-base-content">Visible Test Cases (Shown to User)</h3>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline cursor-pointer font-mono"
                                onClick={() => setProblemForm({
                                    ...problemForm,
                                    visibleTestCases: [...problemForm.visibleTestCases, { input: '', output: '', explanation: '' }]
                                })}
                            >
                                ➕ Add Visible Case
                            </button>
                        </div>

                        {problemForm.visibleTestCases.map((tc, idx) => (
                            <div key={idx} className="p-4 bg-base-200/50 rounded-xl space-y-3 border border-base-200 relative shadow-xs">
                                <div className="flex justify-between items-center text-sm font-semibold font-mono text-base-content/70">
                                    <span>Case #{idx + 1}</span>
                                    {problemForm.visibleTestCases.length > 1 && (
                                        <button
                                            type="button"
                                            className="text-error font-bold cursor-pointer"
                                            onClick={() => {
                                                const updated = problemForm.visibleTestCases.filter((_, i) => i !== idx);
                                                setProblemForm({ ...problemForm, visibleTestCases: updated });
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <textarea
                                        rows={3}
                                        placeholder="Input"
                                        className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                        value={tc.input}
                                        onChange={(e) => {
                                            const updated = [...problemForm.visibleTestCases];
                                            updated[idx].input = e.target.value;
                                            setProblemForm({ ...problemForm, visibleTestCases: updated });
                                        }}
                                    />
                                    <textarea
                                        rows={3}
                                        placeholder="Expected Output"
                                        className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                        value={tc.output}
                                        onChange={(e) => {
                                            const updated = [...problemForm.visibleTestCases];
                                            updated[idx].output = e.target.value;
                                            setProblemForm({ ...problemForm, visibleTestCases: updated });
                                        }}
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Explanation (Optional)"
                                    className="input input-bordered input-md w-full text-sm focus:input-primary"
                                    value={tc.explanation || ''}
                                    onChange={(e) => {
                                        const updated = [...problemForm.visibleTestCases];
                                        updated[idx].explanation = e.target.value;
                                        setProblemForm({ ...problemForm, visibleTestCases: updated });
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Hidden Test Cases */}
                    <div className="space-y-4 pt-4 border-t border-base-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base text-warning">🔒 Hidden Test Cases (Used for Judge Evaluation)</h3>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline btn-warning cursor-pointer font-mono"
                                onClick={() => setProblemForm({
                                    ...problemForm,
                                    hiddenTestCases: [...problemForm.hiddenTestCases, { input: '', output: '' }]
                                })}
                            >
                                ➕ Add Hidden Case
                            </button>
                        </div>

                        {problemForm.hiddenTestCases.map((tc, idx) => (
                            <div key={idx} className="p-4 bg-warning/5 rounded-xl space-y-3 border border-warning/20 shadow-xs">
                                <div className="flex justify-between items-center text-sm font-semibold font-mono text-warning">
                                    <span>Hidden Case #{idx + 1}</span>
                                    {problemForm.hiddenTestCases.length > 1 && (
                                        <button
                                            type="button"
                                            className="text-error font-bold cursor-pointer"
                                            onClick={() => {
                                                const updated = problemForm.hiddenTestCases.filter((_, i) => i !== idx);
                                                setProblemForm({ ...problemForm, hiddenTestCases: updated });
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <textarea
                                        rows={3}
                                        placeholder="Hidden Input"
                                        className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                        value={tc.input}
                                        onChange={(e) => {
                                            const updated = [...problemForm.hiddenTestCases];
                                            updated[idx].input = e.target.value;
                                            setProblemForm({ ...problemForm, hiddenTestCases: updated });
                                        }}
                                    />
                                    <textarea
                                        rows={3}
                                        placeholder="Hidden Expected Output"
                                        className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                        value={tc.output}
                                        onChange={(e) => {
                                            const updated = [...problemForm.hiddenTestCases];
                                            updated[idx].output = e.target.value;
                                            setProblemForm({ ...problemForm, hiddenTestCases: updated });
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Editorial Section */}
                    <div className="space-y-5 pt-4 border-t border-base-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base text-primary">📖 Editorial & Approaches Array</h3>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline btn-primary cursor-pointer font-mono"
                                onClick={() => setProblemForm({
                                    ...problemForm,
                                    editorial: [
                                        ...problemForm.editorial,
                                        {
                                            title: '',
                                            description: '',
                                            timeComplexity: 'O(N)',
                                            spaceComplexity: 'O(1)',
                                            codeImplementations: [{ languageId: '', code: '' }]
                                        }
                                    ]
                                })}
                            >
                                ➕ Add Solution Approach
                            </button>
                        </div>

                        {problemForm.editorial.map((approach, edIdx) => (
                            <div key={edIdx} className="p-5 bg-primary/5 rounded-2xl border border-primary/20 space-y-4 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm uppercase font-mono text-primary">
                                        Approach #{edIdx + 1}
                                    </span>
                                    {problemForm.editorial.length > 1 && (
                                        <button
                                            type="button"
                                            className="text-error font-bold text-sm cursor-pointer font-mono"
                                            onClick={() => {
                                                const updated = problemForm.editorial.filter((_, i) => i !== edIdx);
                                                setProblemForm({ ...problemForm, editorial: updated });
                                            }}
                                        >
                                            Delete Approach
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Approach Title (e.g. Approach 1: Two Pointers)"
                                        className="input input-bordered input-md w-full text-sm focus:input-primary"
                                        value={approach.title}
                                        onChange={(e) => {
                                            const updated = [...problemForm.editorial];
                                            updated[edIdx].title = e.target.value;
                                            setProblemForm({ ...problemForm, editorial: updated });
                                        }}
                                    />
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Time Complexity (e.g. O(N))"
                                            className="input input-bordered input-md flex-1 text-sm font-mono focus:input-primary"
                                            value={approach.timeComplexity}
                                            onChange={(e) => {
                                                const updated = [...problemForm.editorial];
                                                updated[edIdx].timeComplexity = e.target.value;
                                                setProblemForm({ ...problemForm, editorial: updated });
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Space Complexity (e.g. O(1))"
                                            className="input input-bordered input-md flex-1 text-sm font-mono focus:input-primary"
                                            value={approach.spaceComplexity}
                                            onChange={(e) => {
                                                const updated = [...problemForm.editorial];
                                                updated[edIdx].spaceComplexity = e.target.value;
                                                setProblemForm({ ...problemForm, editorial: updated });
                                            }}
                                        />
                                    </div>
                                </div>

                                <textarea
                                    rows={4}
                                    placeholder="Detailed solution explanation for this approach..."
                                    className="textarea textarea-bordered w-full text-sm font-sans focus:textarea-primary leading-relaxed"
                                    value={approach.description}
                                    onChange={(e) => {
                                        const updated = [...problemForm.editorial];
                                        updated[edIdx].description = e.target.value;
                                        setProblemForm({ ...problemForm, editorial: updated });
                                    }}
                                />

                                {/* Code implementations */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-base-content/80">
                                            Code Implementations
                                        </label>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline cursor-pointer font-mono"
                                            onClick={() => {
                                                const updated = [...problemForm.editorial];
                                                updated[edIdx].codeImplementations.push({ languageId: '', code: '' });
                                                setProblemForm({ ...problemForm, editorial: updated });
                                            }}
                                        >
                                            ➕ Add Code Implementation
                                        </button>
                                    </div>

                                    {approach.codeImplementations.map((impl, implIdx) => (
                                        <div key={implIdx} className="p-4 bg-base-100 rounded-xl space-y-3 border border-base-200 shadow-2xs">
                                            <div className="flex justify-between items-center">
                                                <select
                                                    className="select select-bordered select-sm text-sm font-mono cursor-pointer"
                                                    value={impl.languageId}
                                                    onChange={(e) => {
                                                        const updated = [...problemForm.editorial];
                                                        updated[edIdx].codeImplementations[implIdx].languageId = e.target.value;
                                                        setProblemForm({ ...problemForm, editorial: updated });
                                                    }}
                                                >
                                                    <option value="">Select Language ({languagesList.length} Available)</option>
                                                    {languagesList.map((lang) => (
                                                        <option key={lang._id} value={lang._id}>
                                                            {lang.name} ({lang.version})
                                                        </option>
                                                    ))}
                                                </select>

                                                {approach.codeImplementations.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="text-error font-bold text-sm cursor-pointer font-mono"
                                                        onClick={() => {
                                                            const updated = [...problemForm.editorial];
                                                            updated[edIdx].codeImplementations = updated[edIdx].codeImplementations.filter((_, i) => i !== implIdx);
                                                            setProblemForm({ ...problemForm, editorial: updated });
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <textarea
                                                rows={5}
                                                placeholder="Paste solution code..."
                                                className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                                value={impl.code}
                                                onChange={(e) => {
                                                    const updated = [...problemForm.editorial];
                                                    updated[edIdx].codeImplementations[implIdx].code = e.target.value;
                                                    setProblemForm({ ...problemForm, editorial: updated });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Submit Actions */}
                    <div className="flex justify-end gap-4 pt-5 border-t border-base-200">
                        <button
                            type="button"
                            className="btn btn-ghost cursor-pointer text-base font-semibold"
                            onClick={() => {
                                resetProblemForm();
                                setActiveTab('problems');
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary px-8 cursor-pointer font-bold shadow-xs text-base" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : isEditing ? 'Update Problem' : 'Create Problem'}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 3: Batch Upload */}
            {activeTab === 'batch-upload' && (
                <form onSubmit={handleBatchUpload} className="bg-base-100 p-6 md:p-8 rounded-2xl border border-base-200 shadow-xs space-y-5">
                    <h2 className="text-2xl font-bold text-base-content">Batch Upload Problems (JSON)</h2>
                    <p className="text-sm text-base-content/70">
                        Paste a valid JSON array of problem objects to create multiple problems concurrently.
                    </p>

                    <textarea
                        rows={14}
                        required
                        placeholder={`[\n  {\n    "title": "Two Sum",\n    "description": "...",\n    "difficulty": "easy",\n    "tags": ["<tag_id_1>", "<tag_id_2>"],\n    "visibleTestCases": [...],\n    "hiddenTestCases": [...]\n  }\n]`}
                        className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                        value={batchJson}
                        onChange={(e) => setBatchJson(e.target.value)}
                    />

                    <div className="flex justify-end">
                        <button type="submit" className="btn btn-primary cursor-pointer font-bold shadow-xs text-base px-8" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : 'Submit Batch'}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 4: Tags & Languages Management */}
            {activeTab === 'tags-languages' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Tags */}
                    <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs space-y-5">
                        <h3 className="font-bold text-xl text-base-content">Manage Tags</h3>
                        
                        <form onSubmit={handleAddTag} className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Tag name (e.g. Dynamic Programming)"
                                className="input input-bordered input-md flex-1 text-sm focus:input-primary"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                            />
                            <button type="submit" className="btn btn-md btn-primary cursor-pointer font-bold shadow-xs px-5">Add Tag</button>
                        </form>

                        <div className="flex flex-wrap gap-2.5 pt-2">
                            {tagsList.map((tag) => (
                                <span key={tag._id} className="badge badge-neutral gap-2.5 py-3.5 px-4 text-sm font-mono">
                                    {tag.name}
                                    <button
                                        type="button"
                                        className="text-error font-bold text-sm cursor-pointer hover:scale-125 transition-transform"
                                        title="Delete tag"
                                        onClick={() => handleDeleteTag(tag._id)}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs space-y-5">
                        <h3 className="font-bold text-xl text-base-content">Manage Compiler Languages</h3>

                        <form onSubmit={handleAddLanguage} className="space-y-4">
                            <input
                                type="number"
                                placeholder="Judge0 Language ID (e.g. 54 for C++)"
                                className="input input-bordered input-md w-full text-sm font-mono focus:input-primary"
                                value={newLangJudge0Id}
                                onChange={(e) => setNewLangJudge0Id(e.target.value)}
                            />
                            <textarea
                                rows={4}
                                placeholder="Default Starter Code Template..."
                                className="textarea textarea-bordered w-full font-mono text-sm focus:textarea-primary"
                                value={newLangTemplate}
                                onChange={(e) => setNewLangTemplate(e.target.value)}
                            />
                            <button type="submit" className="btn btn-md btn-primary w-full cursor-pointer font-bold shadow-xs text-base">
                                Add Judge0 Language
                            </button>
                        </form>

                        <div className="space-y-3 pt-2">
                            {languagesList.map((lang) => (
                                <div key={lang._id} className="flex justify-between items-center bg-base-200/50 p-3 rounded-xl text-sm font-mono border border-base-200">
                                    <div>
                                        <span className="font-bold text-base-content">{lang.name}</span> ({lang.version}) — ID: {lang.judge0LanguageId}
                                    </div>
                                    <button
                                        className="btn btn-xs btn-ghost text-error cursor-pointer hover:bg-error/10 font-mono text-xs"
                                        onClick={() => handleDeleteLanguage(lang._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* TAB 5: User Roles */}
            {activeTab === 'users' && (
                <div className="bg-base-100 p-6 md:p-8 rounded-2xl border border-base-200 shadow-xs max-w-xl mx-auto space-y-5">
                    <h2 className="text-2xl font-bold text-base-content">Admin Role Management</h2>
                    <p className="text-sm text-base-content/70">
                        Promote standard users to admins or demote active admins.
                    </p>

                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="Target User Email"
                            className="input input-bordered input-md w-full text-base focus:input-primary"
                            value={userForm.emailId}
                            onChange={(e) => setUserForm({ ...userForm, emailId: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Target Username"
                            className="input input-bordered input-md w-full text-base focus:input-primary"
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4 pt-3">
                        <button
                            className="btn btn-primary flex-1 cursor-pointer font-bold shadow-xs text-base"
                            onClick={() => handleUserRoleChange('promote')}
                        >
                            Promote to Admin
                        </button>
                        <button
                            className="btn btn-outline btn-error flex-1 cursor-pointer font-bold text-base"
                            onClick={() => handleUserRoleChange('demote')}
                        >
                            Demote to User
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}