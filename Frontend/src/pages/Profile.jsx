import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';

export default function UserProfile() {
    const { username } = useParams();
    const currentUser = useSelector((state) => state.auth?.user);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- RECENT SUBMISSIONS STATE ---
    const [recentSubmissions, setRecentSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(true);

    // --- SUBMISSION DETAIL MODAL STATE ---
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // --- EDIT PROFILE MODAL STATE ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

    // 1. Fetch User Profile
    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const targetUser = username || currentUser?.username || 'king';
            const res = await axiosClient.get(`user/profile/${targetUser}`);

            if (res.data?.success) {
                setProfile(res.data.profile);
                setEditBio(res.data.profile.bio || '');
            } else {
                setError('Failed to load user profile.');
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
            setError(err.response?.data?.message || 'User profile not found.');
        } finally {
            setLoading(false);
        }
    }, [username, currentUser?.username]);

    // 2. Fetch Recent Submissions for User
    const fetchRecentSubmissions = useCallback(async (targetUsername) => {
        setSubmissionsLoading(true);
        try {
            const res = await axiosClient.get(`user/recent/${targetUsername}?limit=10`);
            if (res.data?.success) {
                setRecentSubmissions(res.data.submissions || []);
            }
        } catch (err) {
            console.error('Error fetching recent submissions:', err);
        } finally {
            setSubmissionsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        if (profile?.username) {
            fetchRecentSubmissions(profile.username);
        }
    }, [profile?.username, fetchRecentSubmissions]);

    // Handler to inspect a specific submission in detail
    const handleViewSubmission = async (submissionId) => {
        setDetailLoading(true);
        try {
            const res = await axiosClient.get(`user/detail/${submissionId}`);
            if (res.data?.success) {
                setSelectedSubmission(res.data.submission);
            }
        } catch (err) {
            console.error('Failed to load submission details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setUpdateMessage({ type: '', text: '' });

        try {
            await axiosClient.put('user/profile/bio', { bio: editBio });

            if (selectedFile) {
                const formData = new FormData();
                formData.append('image', selectedFile);
                await axiosClient.put('user/profile/picture', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditModalOpen(false);
            setSelectedFile(null);
            setPreviewUrl('');
            
            fetchProfile();
        } catch (err) {
            setUpdateMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to update profile.'
            });
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (statusDesc) => {
        switch (statusDesc) {
            case 'Accepted':
                return <span className="badge badge-success badge-sm font-semibold px-2.5 py-2">Accepted</span>;
            case 'Wrong Answer':
                return <span className="badge badge-error badge-sm font-semibold px-2.5 py-2">Wrong Answer</span>;
            case 'Time Limit Exceeded':
                return <span className="badge badge-warning badge-sm font-semibold px-2.5 py-2">TLE</span>;
            case 'Compilation Error':
                return <span className="badge badge-warning badge-outline badge-sm font-semibold px-2.5 py-2">Compile Error</span>;
            default:
                return <span className="badge badge-ghost badge-sm px-2.5 py-2">{statusDesc || 'Evaluated'}</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-sm text-base-content/60 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="alert alert-error max-w-md shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error || 'Unable to retrieve user details.'}</span>
                </div>
            </div>
        );
    }

    const { name, username: userHandle, bio, rank, profileImage, stats } = profile;
    const { difficultyCount, totalProblemSolved, totalSubmissions, totalAccepted, rankScore } = stats;

    const isOwnProfile = !username || currentUser?.username === userHandle;

    const acceptanceRate = totalSubmissions > 0 
        ? ((totalAccepted / totalSubmissions) * 100).toFixed(1) 
        : '0.0';

    const initials = name
        ? name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : userHandle.substring(0, 2).toUpperCase();

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            
            {/* Top Banner & Header Card */}
            <div className="card bg-base-100 border border-base-200/80 shadow-sm overflow-hidden rounded-3xl">
                <div className="h-36 bg-gradient-to-r from-primary/15 via-secondary/10 to-base-200 w-full relative">
                    <div className="absolute inset-0 bg-radial-gradient from-transparent to-base-100/20" />
                </div>
                
                <div className="card-body pt-0 relative px-6 pb-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 gap-4">
                        
                        {/* Avatar & Basic Info */}
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
                            <div className="avatar placeholder relative group">
                                <div className="w-28 h-28 rounded-3xl ring-4 ring-base-100 bg-neutral text-neutral-content shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                                    {profileImage?.url ? (
                                        <img src={profileImage.url} alt={name} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-3xl font-extrabold tracking-wider">{initials}</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 mb-1">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight">{name}</h1>
                                <p className="text-sm text-base-content/60 font-mono font-medium">@{userHandle}</p>
                            </div>
                        </div>

                        {/* Actions & Rank Badge */}
                        <div className="flex items-center justify-center gap-3">
                            {isOwnProfile && (
                                <button
                                    className="btn btn-sm btn-outline btn-primary gap-1.5 rounded-xl px-4 font-semibold cursor-pointer shadow-xs hover:shadow-md transition-all"
                                    onClick={() => {
                                        setEditBio(bio || '');
                                        setIsEditModalOpen(true);
                                    }}
                                >
                                    <span>✏️</span> Edit Profile
                                </button>
                            )}

                            <div className="flex items-center gap-2.5 bg-base-200/70 px-4 py-2 rounded-2xl border border-base-300/60 shadow-xs">
                                <span className="text-xs font-bold uppercase text-base-content/50 tracking-wider">Global Rank</span>
                                <span className="badge badge-primary font-extrabold text-sm px-2.5 py-2">#{rank}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    {bio ? (
                        <p className="mt-5 text-sm text-base-content/80 max-w-3xl whitespace-pre-line leading-relaxed font-normal bg-base-200/40 p-4 rounded-2xl border border-base-200/60">{bio}</p>
                    ) : (
                        <p className="mt-4 text-xs italic text-base-content/40 pl-1">No bio provided yet. Click 'Edit Profile' to share a bit about yourself!</p>
                    )}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat bg-base-100 border border-base-200/80 rounded-3xl shadow-sm p-5 hover:border-primary/40 transition-all">
                    <div className="stat-figure text-primary bg-primary/10 p-3 rounded-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="stat-title text-xs font-bold text-base-content/60 uppercase tracking-wider">Problems Solved</div>
                    <div className="stat-value text-primary text-2xl md:text-3xl font-black mt-1">{totalProblemSolved}</div>
                </div>

                <div className="stat bg-base-100 border border-base-200/80 rounded-3xl shadow-sm p-5 hover:border-secondary/40 transition-all">
                    <div className="stat-figure text-secondary bg-secondary/10 p-3 rounded-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="stat-title text-xs font-bold text-base-content/60 uppercase tracking-wider">Rating Score</div>
                    <div className="stat-value text-secondary text-2xl md:text-3xl font-black mt-1">{rankScore}</div>
                </div>

                <div className="stat bg-base-100 border border-base-200/80 rounded-3xl shadow-sm p-5 hover:border-accent/40 transition-all">
                    <div className="stat-figure text-accent bg-accent/10 p-3 rounded-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <div className="stat-title text-xs font-bold text-base-content/60 uppercase tracking-wider">Total Submissions</div>
                    <div className="stat-value text-base-content text-2xl md:text-3xl font-black mt-1">{totalSubmissions}</div>
                </div>

                <div className="stat bg-base-100 border border-base-200/80 rounded-3xl shadow-sm p-5 hover:border-info/40 transition-all">
                    <div className="stat-figure text-info bg-info/10 p-3 rounded-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div className="stat-title text-xs font-bold text-base-content/60 uppercase tracking-wider">Acceptance Rate</div>
                    <div className="stat-value text-info text-2xl md:text-3xl font-black mt-1">{acceptanceRate}%</div>
                </div>
            </div>

            {/* Solved Problems Breakdown */}
            <div className="card bg-base-100 border border-base-200/80 shadow-sm p-6 space-y-4 rounded-3xl">
                <h3 className="text-base font-extrabold text-base-content flex items-center gap-2.5">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                    </div>
                    Solved Problems Breakdown
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-info/5 border border-info/20 flex flex-col justify-between hover:bg-info/10 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-info text-xs uppercase tracking-wider">Beginner</span>
                            <span className="badge badge-info badge-sm font-extrabold px-2 py-1">{difficultyCount?.beginner || 0}</span>
                        </div>
                        <progress className="progress progress-info w-full h-2" value={difficultyCount?.beginner || 0} max={Math.max(totalProblemSolved, 1)}></progress>
                    </div>

                    <div className="p-4 rounded-2xl bg-success/5 border border-success/20 flex flex-col justify-between hover:bg-success/10 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-success text-xs uppercase tracking-wider">Easy</span>
                            <span className="badge badge-success badge-sm font-extrabold px-2 py-1">{difficultyCount?.easy || 0}</span>
                        </div>
                        <progress className="progress progress-success w-full h-2" value={difficultyCount?.easy || 0} max={Math.max(totalProblemSolved, 1)}></progress>
                    </div>

                    <div className="p-4 rounded-2xl bg-warning/5 border border-warning/20 flex flex-col justify-between hover:bg-warning/10 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-warning text-xs uppercase tracking-wider">Medium</span>
                            <span className="badge badge-warning badge-sm font-extrabold px-2 py-1">{difficultyCount?.medium || 0}</span>
                        </div>
                        <progress className="progress progress-warning w-full h-2" value={difficultyCount?.medium || 0} max={Math.max(totalProblemSolved, 1)}></progress>
                    </div>

                    <div className="p-4 rounded-2xl bg-error/5 border border-error/20 flex flex-col justify-between hover:bg-error/10 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-error text-xs uppercase tracking-wider">Hard</span>
                            <span className="badge badge-error badge-sm font-extrabold px-2 py-1">{difficultyCount?.hard || 0}</span>
                        </div>
                        <progress className="progress progress-error w-full h-2" value={difficultyCount?.hard || 0} max={Math.max(totalProblemSolved, 1)}></progress>
                    </div>
                </div>
            </div>

            {/* RECENT SUBMISSIONS SECTION */}
            <div className="card bg-base-100 border border-base-200/80 shadow-sm p-6 space-y-4 rounded-3xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-base-content flex items-center gap-2.5">
                        <div className="bg-secondary/10 p-2 rounded-xl text-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        Recent Submissions
                    </h3>
                    <span className="text-xs font-mono font-medium text-base-content/50 bg-base-200/60 px-3 py-1 rounded-xl">Last 10 Activity Logs</span>
                </div>

                {submissionsLoading ? (
                    <div className="py-12 text-center space-y-2">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                        <p className="text-xs text-base-content/60 font-medium">Fetching recent activity...</p>
                    </div>
                ) : recentSubmissions.length === 0 ? (
                    <div className="text-center py-10 bg-base-200/40 rounded-2xl border border-base-200">
                        <p className="text-sm font-medium text-base-content/60">No recent submissions found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentSubmissions.map((sub) => (
                            <div 
                                key={sub._id} 
                                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-base-200/30 hover:bg-base-200/70 border border-base-200/80 transition-all duration-200 shadow-2xs hover:shadow-sm"
                            >
                                {/* Left Side: Status & Problem info */}
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="shrink-0">
                                        {getStatusBadge(sub.status?.description)}
                                    </div>
                                    <div className="min-w-0">
                                        {sub.problemId ? (
                                            <Link
                                                to={`/problem/${sub.problemId.problemNumber}`}
                                                className="font-bold text-sm text-base-content hover:text-primary transition-colors truncate block"
                                            >
                                                #{sub.problemId.problemNumber} — {sub.problemId.title}
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-base-content/40 italic">Unknown Problem</span>
                                        )}
                                        <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-base-content/50">
                                            <span className="text-base-content/70 font-semibold">{sub.languageId?.name || 'Code'}</span>
                                            <span>•</span>
                                            <span>{sub.time ?? 0}s / {sub.memory ?? 0} KB</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Date & Action button */}
                                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-base-300/40">
                                    <span className="text-xs font-mono text-base-content/40">
                                        {new Date(sub.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-outline btn-ghost font-mono text-xs rounded-xl px-3 cursor-pointer group-hover:border-primary group-hover:text-primary transition-colors"
                                        onClick={() => handleViewSubmission(sub._id)}
                                    >
                                        Inspect ↗
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SUBMISSION INSPECTION MODAL */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-base-100 rounded-3xl border border-base-200 shadow-2xl w-full max-w-2xl overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-base-200 pb-3">
                            <div>
                                <h3 className="font-extrabold text-base text-base-content">
                                    Submission #{selectedSubmission._id.substring(0, 8)}
                                </h3>
                                <p className="text-xs font-mono text-base-content/60 mt-0.5">
                                    {selectedSubmission.problemId?.title} • {selectedSubmission.languageId?.name}
                                </p>
                            </div>
                            <button
                                className="btn btn-sm btn-ghost btn-circle cursor-pointer hover:bg-base-200"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="py-12 text-center">
                                <span className="loading loading-spinner loading-md text-primary"></span>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                                <div className="flex flex-wrap items-center justify-between gap-3 bg-base-200/50 p-3.5 rounded-2xl border border-base-200 text-xs font-mono">
                                    <div>
                                        <span className="text-base-content/50">Status: </span>
                                        {getStatusBadge(selectedSubmission.status?.description)}
                                    </div>
                                    <div>
                                        <span className="text-base-content/50">Time: </span>
                                        <span className="font-bold">{selectedSubmission.time} s</span>
                                    </div>
                                    <div>
                                        <span className="text-base-content/50">Memory: </span>
                                        <span className="font-bold">{selectedSubmission.memory} KB</span>
                                    </div>
                                    <div>
                                        <span className="text-base-content/50">Passed: </span>
                                        <span className="font-bold text-success">
                                            {selectedSubmission.acceptedTestCases || 0} / {selectedSubmission.totalTestCases || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Source Code */}
                                <div className="space-y-1.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">Submitted Code:</span>
                                    <pre className="bg-base-300/70 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-base-200 text-base-content/90 max-h-64 shadow-inner">
                                        <code>{selectedSubmission.code}</code>
                                    </pre>
                                </div>

                                {/* Failed Testcase Details if available */}
                                {selectedSubmission.failedTestCase && (
                                    <div className="bg-error/10 border border-error/20 p-4 rounded-2xl font-mono text-xs space-y-1.5 text-error">
                                        <div className="font-bold text-sm">Failed Test Case Details:</div>
                                        {selectedSubmission.failedTestCase.input && (
                                            <div><span className="opacity-70">Input:</span> {selectedSubmission.failedTestCase.input}</div>
                                        )}
                                        {selectedSubmission.failedTestCase.expectedOutput && (
                                            <div><span className="opacity-70">Expected:</span> {selectedSubmission.failedTestCase.expectedOutput}</div>
                                        )}
                                        {selectedSubmission.failedTestCase.actualOutput && (
                                            <div><span className="opacity-70">Actual:</span> {selectedSubmission.failedTestCase.actualOutput}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT PROFILE MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-base-100 rounded-3xl border border-base-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-base-200 flex justify-between items-center">
                            <h3 className="font-extrabold text-lg text-base-content">Edit Profile</h3>
                            <button
                                className="btn btn-sm btn-ghost btn-circle cursor-pointer hover:bg-base-200"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                            {updateMessage.text && (
                                <div className={`alert ${updateMessage.type === 'error' ? 'alert-error' : 'alert-success'} text-xs font-semibold rounded-2xl`}>
                                    <span>{updateMessage.text}</span>
                                </div>
                            )}

                            {/* Avatar Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                                    Profile Picture
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-neutral text-neutral-content overflow-hidden flex items-center justify-center border border-base-300 shrink-0 shadow-sm">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                                        ) : profileImage?.url ? (
                                            <img src={profileImage.url} alt={name} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-xl font-bold">{initials}</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="file-input file-input-bordered file-input-sm w-full text-xs rounded-xl"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            {/* Bio Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                                    Bio
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Write a brief intro about yourself..."
                                    className="textarea textarea-bordered w-full text-sm rounded-2xl focus:outline-primary"
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-2.5 pt-4 border-t border-base-200">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm rounded-xl cursor-pointer"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm rounded-xl px-6 font-semibold cursor-pointer shadow-xs"
                                    disabled={updating}
                                >
                                    {updating ? <span className="loading loading-spinner loading-xs"></span> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}