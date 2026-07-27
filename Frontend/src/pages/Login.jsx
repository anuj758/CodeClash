import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { loginUser, clearError } from '../store/slices/authSlice';

const loginSchema = z.object({
    identity: z
        .string()
        .trim()
        .min(1, "Username or Email is required")
        .min(3, "Must be at least 3 characters")
        .superRefine((val, ctx) => {
            if (val.includes('@')) {
                const emailResult = z.string().email("Invalid email address").safeParse(val);
                if (!emailResult.success) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Invalid email address format"
                    });
                }
            } else {
                const usernameRegex = /^[a-z][a-z0-9_]*$/;
                if (!usernameRegex.test(val)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Username must start with a lowercase letter and contain only lowercase letters, numbers, or underscores"
                    });
                }
            }
        }),

    password: z
        .string()
        .trim()
        .min(1, "Password is required")
});

export default function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Pull authentication states from Redux
    const { isAuthenticated, loading, error: serverError } = useSelector((state) => state.auth);
    
    const [showPassword, setShowPassword] = useState(false);
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    // Clear previous auth errors when landing on login page
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    // Redirect verified authenticated users straight to problemset
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/problemset');
        }
    }, [isAuthenticated, navigate]);

    
    const onSubmit = async (data) => {
        const resultAction = await dispatch(loginUser(data));

        // If login was rejected due to unverified email (403 status)
        if (loginUser.rejected.match(resultAction) && resultAction.payload?.isUnverified) {
            navigate('/verify-email-pending');
        }
    };

    return (
        <div className='min-h-screen flex flex-col justify-between p-4 bg-base-300 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] text-base-content'>
            
            {/* Centered Login Card */}
            <div className='flex-1 flex items-center justify-center -translate-y-6 md:-translate-y-10'>
                <div className='card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200 rounded-3xl overflow-hidden'>
                    <div className='card-body items-center p-6 md:p-8'>
                        
                        {/* Header Logo */}
                        <img 
                            src="https://res.cloudinary.com/gfvrxcdv/image/upload/v1784556354/codeclash_login_logo_une2xl.png" 
                            className="w-28 h-auto object-contain mx-auto mb-2" 
                            alt="CodeClash Logo"
                        />
                        
                        {/* Server Error Alert */}
                        {serverError && (
                            <div className="alert alert-error text-xs font-bold py-2 px-3 mb-2 w-full rounded-xl text-left flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4 mt-0.5" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{serverError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col space-y-4">

                            {/* Identity Input (Username or Email) */}
                            <div className="form-control w-full">
                                <label className={`input input-bordered flex items-center gap-2 w-full ${errors.identity ? 'input-error' : ''}`}>
                                    <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <input
                                        type="text"
                                        className="grow text-sm"
                                        placeholder="Username or E-mail"
                                        {...register('identity')}
                                    />
                                </label>
                                {errors.identity && (
                                    <span className='text-error font-semibold text-xs mt-1 tracking-wide text-left'>
                                        {errors.identity.message}
                                    </span>
                                )}
                            </div>

                            {/* Password Input */}
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
                                {errors.password && (
                                    <span className='text-error font-semibold text-xs mt-1 tracking-wide text-left'>
                                        {errors.password.message}
                                    </span>
                                )}
                            </div>
                            
                            {/* Submit Button */}
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    className={`btn btn-primary w-full font-semibold shadow-md shadow-primary/20 ${loading ? 'loading' : ''}`} 
                                    disabled={loading}
                                >
                                    {loading ? 'Logging In...' : 'Login'}
                                </button>
                            </div>

                            {/* Footer Link */}
                            <p className="text-xs text-base-content/70 text-center pt-2">
                                Don't have an account?{" "}
                                <Link to="/signup" className="link link-primary link-hover font-bold">
                                    Sign Up
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