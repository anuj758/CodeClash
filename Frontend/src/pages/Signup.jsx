import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { registerUser, clearError } from '../store/slices/authSlice';

const signupSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(30, "Name cannot exceed 30 characters")
        .regex(/^[^0-9]*$/, { message: "Name should not contain numbers" }),
    username: z
        .string()
        .trim()
        .min(3, { message: "Username must be at least 3 characters long" })
        .max(20, { message: "Username cannot exceed 20 characters" })
        .regex(/^[a-z][a-z0-9_]*$/, { 
            message: "Must start with a lowercase letter and contain only lowercase letters, numbers, or underscores"
        }),
    emailId: z.string().trim().email("Invalid Email address"),
    password: z
        .string()
        .trim()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Must contain an uppercase letter" })
        .regex(/[a-z]/, { message: "Must contain a lowercase letter" })
        .regex(/[0-9]/, { message: "Must contain a number" })
        .regex(/[^A-Za-z0-9]/, { message: "Must contain a special character" }),
    confirmPassword: z.string().trim()
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], 
});

export default function Signup() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Pull states directly from Redux auth slice
    const { isAuthenticated, loading, error: serverError } = useSelector((state) => state.auth);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Username Debouncing & Availability States
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null); // true | false | null

    const { 
        register, 
        handleSubmit, 
        watch, 
        setError, 
        clearErrors, 
        formState: { errors } 
    } = useForm({
        resolver: zodResolver(signupSchema),
        mode: "onChange"
    });

    const watchedUsername = watch('username');

    // 1. Debounced Username Availability Checking
    useEffect(() => {
        // Reset state if input is empty or invalid length/regex
        if (!watchedUsername || watchedUsername.length < 3) {
            setIsCheckingUsername(false);
            setUsernameAvailable(null);
            return;
        }

        const usernameRegex = /^[a-z][a-z0-9_]*$/;
        if (!usernameRegex.test(watchedUsername)) {
            setIsCheckingUsername(false);
            setUsernameAvailable(null);
            return;
        }

        setIsCheckingUsername(true);
        setUsernameAvailable(null);

        // Debounce timer (500ms)
        const timer = setTimeout(async () => {
            try {
                const response = await axiosClient.post(`/check-username/${watchedUsername}`);
                
                if (response.data.available) {
                    setUsernameAvailable(true);
                    clearErrors('username');
                } else {
                    setUsernameAvailable(false);
                    setError('username', {
                        type: 'manual',
                        message: response.data.message || 'Username is already taken'
                    });
                }
            } catch (err) {
                setUsernameAvailable(false);
                setError('username', {
                    type: 'manual',
                    message: err.response?.data?.message || 'Error checking username availability'
                });
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);

        // Cleanup timer on every keystroke
        return () => clearTimeout(timer);
    }, [watchedUsername, setError, clearErrors]);

    // Clear lingering Redux errors on mount
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    // Redirect to main platform if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/problemset');
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = async (data) => {
        if (usernameAvailable === false) return;

        const { confirmPassword, ...formData } = data;
        const resultAction = await dispatch(registerUser(formData));

        if (registerUser.fulfilled.match(resultAction)) {
            navigate('/verify-email-pending');
        }
    };

    return (
        <div className='min-h-screen flex flex-col justify-between p-4 bg-base-300 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] text-base-content'>
            
            {/* Centered Signup Card */}
            <div className='flex-1 flex items-center justify-center py-6'>
                <div className='card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200 rounded-3xl overflow-hidden'>
                    <div className='card-body items-center p-6 md:p-8'>
                        
                        {/* Header Logo */}
                        <img 
                            src="https://res.cloudinary.com/gfvrxcdv/image/upload/v1784556354/codeclash_login_logo_une2xl.png" 
                            className="w-28 h-auto object-contain mx-auto mb-2" 
                            alt="CodeClash Logo"
                        />
                        
                        {/* Global server error alert */}
                        {serverError && (
                            <div className="alert alert-error text-xs font-bold py-2 px-3 mb-2 w-full rounded-xl text-left flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4 mt-0.5" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{serverError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-3.5">

                            {/* Field 1: Full Name */}
                            <div className="form-control w-full">
                                <label className={`input input-bordered flex items-center gap-2 w-full ${errors.name ? 'input-error' : ''}`}>
                                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <input type="text" className="grow text-sm" placeholder="Full Name" {...register('name')} />
                                </label>
                                {errors.name && <span className='text-error font-semibold text-xs mt-1 text-left'>{errors.name.message}</span>}
                            </div>

                            {/* Field 2: Username with Live Debounced Availability */}
                            <div className="form-control w-full">
                                <label className={`input input-bordered flex items-center gap-2 pr-3 w-full ${errors.username ? 'input-error' : usernameAvailable ? 'input-success' : ''}`}>
                                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                                        <circle cx="12" cy="12" r="2"></circle>
                                    </svg>
                                    <input
                                        type="text"
                                        className="grow text-sm"
                                        placeholder="Username"
                                        {...register('username')}
                                    />

                                    {/* Spinner when checking */}
                                    {isCheckingUsername && (
                                        <span className="loading loading-spinner loading-xs text-primary"></span>
                                    )}

                                    {/* Green Tick when available */}
                                    {!isCheckingUsername && usernameAvailable === true && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </label>

                                {/* Success message tag */}
                                {!isCheckingUsername && usernameAvailable === true && !errors.username && (
                                    <span className='text-success font-semibold text-xs mt-1 text-left'>
                                        Username is available!
                                    </span>
                                )}

                                {/* Validation or availability error */}
                                {errors.username && (
                                    <span className='text-error font-semibold text-xs mt-1 text-left'>
                                        {errors.username.message}
                                    </span>
                                )}
                            </div>

                            {/* Field 3: Email */}
                            <div className="form-control w-full">
                                <label className={`input input-bordered flex items-center gap-2 w-full ${errors.emailId ? 'input-error' : ''}`}>
                                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                    </svg>
                                    <input type="email" className="grow text-sm" placeholder="mail@site.com" {...register('emailId')} />
                                </label>
                                {errors.emailId && <span className='text-error font-semibold text-xs mt-1 text-left'>{errors.emailId.message}</span>}
                            </div>

                            {/* Field 4: Password */}
                            <div className="form-control w-full">
                                <label className={`input input-bordered flex items-center gap-2 pr-2 w-full ${errors.password ? 'input-error' : ''}`}>
                                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                                    </svg>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="grow text-sm"
                                        placeholder="Password"
                                        {...register('password')}
                                    />
                                    <button 
                                        type="button" 
                                        className="btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100 transition-opacity"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </label>
                                {errors.password && <span className='text-error font-semibold text-xs mt-1 text-left'>{errors.password.message}</span>}
                            </div>

                            {/* Field 5: Confirm Password */}
                            <div className="form-control w-full">
                                <label className={`input input-bordered flex items-center gap-2 pr-2 w-full ${errors.confirmPassword ? 'input-error' : ''}`}>
                                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                                    </svg>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="grow text-sm"
                                        placeholder="Confirm password"
                                        {...register('confirmPassword')}
                                    />
                                    <button 
                                        type="button" 
                                        className="btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100 transition-opacity"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </label>
                                {errors.confirmPassword && <span className='text-error font-semibold text-xs mt-1 text-left'>{errors.confirmPassword.message}</span>}
                            </div>

                            {/* Submission Button */}
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    className={`btn btn-primary w-full font-semibold shadow-md shadow-primary/20 ${loading ? 'loading' : ''}`} 
                                    disabled={loading || isCheckingUsername || usernameAvailable === false}
                                >
                                    {loading ? 'Creating Account...' : 'Sign Up'}
                                </button>
                            </div>

                            <p className="text-xs text-base-content/70 text-center pt-1">
                                Already have an account?{" "}
                                <Link to="/login" className="link link-primary link-hover font-bold">
                                    Login
                                </Link>
                            </p>

                        </form>
                    </div>
                </div>
            </div>

            {/* Page Footer */}
            <footer className="text-center py-3 text-xs text-base-content/50">
                © {new Date().getFullYear()} CodeClash. All rights reserved.
            </footer>
        </div>
    );
}