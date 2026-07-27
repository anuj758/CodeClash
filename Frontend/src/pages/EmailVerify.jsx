import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

export default function VerifyEmail() {
    const LOGO_SRC = "https://res.cloudinary.com/gfvrxcdv/image/upload/v1784556354/codeclash_login_logo_une2xl.png";
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Status states: 'verifying' | 'success' | 'error'
    const [status, setStatus] = useState('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    // Resend Timer State (120 seconds = 2 mins)
    const [cooldown, setCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    // Email verification on initial load
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setErrorMessage('Invalid verification link. Token is missing.');
                return;
            }

            try {
                // Post token to backend verification endpoint
                const response = await axiosClient.post('/verify-email', { token });
                
                if (response.status === 200) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMessage(response.data?.message || 'Verification failed.');
                }
            } catch (err) {
                setStatus('error');
                setErrorMessage(
                    err.response?.data?.message || 'Verification link is invalid or has expired.'
                );
            }
        };

        verifyToken();
    }, [token]);

    // Countdown interval effect for the 2-minute timer
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    // Helper to format seconds as "2:00" or "0:45"
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Handler to resend email link
    const handleResend = async () => {
        if (!email || cooldown > 0) return;

        setIsResending(true);
        setResendMessage('');

        try {
            // Backend expects req.body.emailId
            const res = await axiosClient.post('/resend-link', { emailId: email });
            setResendMessage(res.data?.message || 'Verification link sent! Check your inbox.');
            setCooldown(120); // Lock button for 2 minutes
        } catch (err) {
            setResendMessage(err.response?.data?.message || 'Failed to resend link. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center p-4 bg-base-300 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] text-base-content'>
            <div className='card w-full max-w-sm bg-base-100 shadow-xl border border-base-200 rounded-3xl overflow-hidden'>
                <div className='card-body items-center p-8 text-center'>
                    
                    {/* Logo Header */}
                    <img 
                        src={LOGO_SRC} 
                        className="w-28 h-auto object-contain mx-auto mb-2" 
                        alt="CodeClash Logo"
                    />

                    {/* State 1: Verifying Spinner */}
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center space-y-4 py-4">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                            <h2 className="text-lg font-bold text-base-content">Verifying Your Email...</h2>
                            <p className="text-xs text-base-content/60">
                                Please wait a moment while we confirm your credentials.
                            </p>
                        </div>
                    )}

                    {/* State 2: Success Green Tick */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center space-y-4 py-2 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-bold text-base-content">Email Verified!</h2>
                            <p className="text-xs text-base-content/70 leading-relaxed">
                                Your email address has been successfully confirmed. You can now access all features on CodeClash.
                            </p>

                            <div className="w-full pt-4">
                                <button 
                                    onClick={() => navigate('/login')} 
                                    className="btn btn-primary w-full font-semibold shadow-md shadow-primary/20"
                                >
                                    Proceed to Login
                                </button>
                            </div>
                        </div>
                    )}

                    {/* State 3: Error Handling with Resend Option */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center space-y-3 py-2 animate-in fade-in zoom-in duration-300 w-full">
                            <div className="w-16 h-16 rounded-full bg-error/15 border border-error/30 flex items-center justify-center text-error mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-bold text-base-content">Verification Failed</h2>
                            <p className="text-xs text-error font-bold tracking-wide">
                                {errorMessage}
                            </p>

                            {/* Resend Status Message */}
                            {resendMessage && (
                                <p className="text-xs font-semibold text-primary mt-1">
                                    {resendMessage}
                                </p>
                            )}

                            <div className="w-full pt-3 space-y-2">
                                {/* Resend Button */}
                                {email && (
                                    <button 
                                        onClick={handleResend}
                                        disabled={cooldown > 0 || isResending}
                                        className={`btn btn-primary btn-sm w-full font-semibold ${isResending ? 'loading' : ''}`}
                                    >
                                        {cooldown > 0 
                                            ? `Resend Link in ${formatTime(cooldown)}` 
                                            : 'Resend Verification Link'
                                        }
                                    </button>
                                )}

                                <button 
                                    onClick={() => navigate('/login')} 
                                    className="btn btn-ghost btn-xs w-full text-base-content/60 hover:text-base-content"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}