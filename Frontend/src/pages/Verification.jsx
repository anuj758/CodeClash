import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { setCredentials, checkAuth } from '../store/slices/authSlice';

export default function PendingVerification() {
    const LOGO_SRC = "https://res.cloudinary.com/gfvrxcdv/image/upload/v1784556354/codeclash_login_logo_une2xl.png";

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Pull temporary user details and sessionId from Redux
    const { tempUser, sessionId } = useSelector((state) => state.auth);

    const [cooldown, setCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState({ type: '', message: '' });

    // 1. Polling Effect: Checks backend every 3 seconds to see if verified on phone/another tab
    useEffect(() => {
        if (!sessionId) return;

        const pollInterval = setInterval(async () => {
            try {
                // Post to /verification-status as defined in authRouter
                const response = await axiosClient.post('/verification-status', { sessionId });

                if (response.data?.isVerified) {
                    clearInterval(pollInterval);
                    
                    // Fetch full authenticated user using token cookie set by backend
                    const authResult = await dispatch(checkAuth());

                    if (checkAuth.fulfilled.match(authResult)) {
                        navigate('/problemset');
                    } else if (tempUser) {
                        // Fallback if checkAuth delays: set credentials from tempUser
                        dispatch(setCredentials({ user: tempUser }));
                        navigate('/problemset');
                    }
                }
            } catch (err) {
                // If session key expired (20 min Redis limit) or invalid, stop polling
                if (err.response?.status === 400 || err.response?.status === 404) {
                    clearInterval(pollInterval);
                }
            }
        }, 3000);

        // Cleanup interval on unmount
        return () => clearInterval(pollInterval);
    }, [sessionId, tempUser, dispatch, navigate]);

    // 2. 2-Minute Cooldown Timer for Resend Button
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Handler to trigger resend email API
    const handleResendLink = async () => {
        const targetEmail = tempUser?.emailId;
        if (!targetEmail || cooldown > 0) return;

        setIsResending(true);
        setResendStatus({ type: '', message: '' });

        try {
            // Post to /resend-link as defined in authRouter
            const res = await axiosClient.post('/resend-link', { emailId: targetEmail });
            setResendStatus({ 
                type: 'success', 
                message: res.data?.message || 'Fresh link sent to your inbox!' 
            });
            setCooldown(120); // 2 minute lockdown
        } catch (err) {
            setResendStatus({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to send email. Please try again.' 
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-base-300 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] text-base-content">
            <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-200 rounded-3xl overflow-hidden relative">
                <div className="card-body items-center p-8 text-center">
                    
                    {/* Header Logo */}
                    <img 
                        src={LOGO_SRC} 
                        className="w-28 h-auto object-contain mx-auto mb-2" 
                        alt="CodeClash Logo"
                    />

                    {/* Mail Icon Highlight */}
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary my-2 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    {/* Main Copy */}
                    <h2 className="text-2xl font-extrabold text-base-content tracking-tight">
                        Check Your Inbox
                    </h2>
                    
                    <p className="text-sm text-base-content/70 mt-1 leading-relaxed">
                        We've sent an activation link to <br />
                        <span className="font-bold text-primary font-mono">{tempUser?.emailId || 'your email address'}</span>.
                    </p>

                    <p className="text-xs text-base-content/50 mt-2 bg-base-200/50 p-3 rounded-xl border border-base-300/50">
                        Click the link in the email to activate your account. This page will automatically update once confirmed.
                    </p>

                    {/* Resend Status Message Alert */}
                    {resendStatus.message && (
                        <div className={`text-xs font-semibold mt-3 ${resendStatus.type === 'error' ? 'text-error' : 'text-success'}`}>
                            {resendStatus.message}
                        </div>
                    )}

                    {/* Action Controls */}
                    <div className="w-full pt-6 space-y-3">
                        <button 
                            onClick={handleResendLink}
                            disabled={cooldown > 0 || isResending || !tempUser?.emailId}
                            className={`btn btn-primary btn-sm w-full font-semibold shadow-md shadow-primary/20 ${isResending ? 'loading' : ''}`}
                        >
                            {cooldown > 0 
                                ? `Resend Link in ${formatTime(cooldown)}` 
                                : 'Resend Verification Link'
                            }
                        </button>

                        <button 
                            onClick={() => navigate('/login')} 
                            className="btn btn-ghost btn-xs w-full text-base-content/60 hover:text-base-content"
                        >
                            Back to Login
                        </button>
                    </div>

                    {/* Live Listening Status Pulse */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-base-200 text-[11px] text-base-content/40 font-mono">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Waiting for verification...
                    </div>

                </div>
            </div>
        </div>
    );
}

