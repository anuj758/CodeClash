import { Link, NavLink } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';

export default function Navigation() {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    // Base navigation links
    const navItems = [
        { name: 'Problems', path: '/problemset' },
        { name: 'Contests', path: '/contest' },
        { name: 'Battle', path: '/battle' },
    ];

    // Conditionally include Admin link in primary nav if role is admin
    if (isAuthenticated && user?.role === 'admin') {
        navItems.push({ name: 'Admin Dashboard', path: '/admin/dashboard' });
    }

    return (
        <header className="navbar bg-base-100/90 border-b border-base-200 px-4 md:px-12 sticky top-0 z-50 backdrop-blur-md">
            
            {/* Left Section: Logo & Mobile Menu */}
            <div className="navbar-start gap-2">
                {/* Mobile Dropdown Menu - Only rendered if authenticated */}
                {isAuthenticated && (
                    <div className="dropdown lg:hidden">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </div>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 border border-base-200 rounded-2xl w-52">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <NavLink to={item.path}>{item.name}</NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Logo */}
                <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
                    <img 
                        src="https://res.cloudinary.com/gfvrxcdv/image/upload/v1784555764/code_clash_logo_final_dtmhrz.png" 
                        alt="CodeClash" 
                        className="w-32 md:w-36 h-auto object-contain"
                    />
                </Link>
            </div>

            {/* Middle Section: Desktop Nav Links - Only rendered if authenticated */}
            <div className="navbar-center hidden lg:flex">
                {isAuthenticated && (
                    <ul className="menu menu-horizontal px-1 gap-1">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink 
                                    to={item.path}
                                    className={({ isActive }) => 
                                        `text-sm font-semibold transition-colors px-4 py-2 rounded-xl ${
                                            isActive 
                                                ? 'bg-primary/10 text-primary' 
                                                : 'text-base-content/70 hover:text-base-content hover:bg-base-200/50'
                                        }`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Right Section: Auth State / Profile */}
            <div className="navbar-end gap-3">
                {isAuthenticated ? (
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border border-base-200">
                            <div className="w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                {user?.username ? user.username[0].toUpperCase() : 'U'}
                            </div>
                        </div>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 border border-base-200 rounded-2xl w-52 space-y-1">
                            <li className="px-3 py-2 border-b border-base-200 text-xs font-semibold text-base-content/60">
                                <div className="flex items-center justify-between">
                                    <span>Signed in as</span>
                                    {user?.role === 'admin' && (
                                        <span className="badge badge-primary badge-xs text-[9px] uppercase font-bold">Admin</span>
                                    )}
                                </div>
                                <span className="text-base-content font-bold text-sm block truncate">{user?.username || 'User'}</span>
                            </li>

                            <li>
                                <Link to="/profile" className="py-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profile
                                </Link>
                            </li>

                            {/* Show Admin Dashboard Link inside Avatar Dropdown */}
                            {user?.role === 'admin' && (
                                <li>
                                    <Link to="/admin/dashboard" className="py-2 text-primary font-semibold">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Admin Dashboard
                                    </Link>
                                </li>
                            )}

                            <li>
                                <button onClick={handleLogout} className="text-error hover:bg-error/10 py-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-ghost btn-sm text-base-content/80 hover:text-base-content font-medium">
                            Log In
                        </Link>
                        <Link to="/signup" className="btn btn-primary btn-sm px-5 font-semibold shadow-md shadow-primary/20">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>

        </header>
    );
}