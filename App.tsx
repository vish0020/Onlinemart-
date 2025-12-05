import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User as UserIcon, LayoutDashboard, Search, Box, ClipboardList, Layers, X, Clock, ArrowRight, Loader, Smartphone, ShieldCheck, LogIn, ChevronRight, LogOut, Mail, Lock, User } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import { api } from './services/mockService';
import { Logo, Button, Input } from './components/Shared';
import { HomePage, ProductDetailsPage, CartPage, CheckoutPage, ProfilePage } from './pages/UserPages';
import { AdminDashboard, AdminProducts, AdminOrdersPage, AdminReviewsPage } from './pages/AdminPages';
import { TermsPage, PrivacyPage } from './pages/InfoPages';
import { AppProvider, useAppContext } from './Context';

// --- Search Overlay Component ---
const SearchOverlay = ({ onClose }: { onClose: () => void }) => {
    const { state, dispatch } = useAppContext();
    const navigate = useNavigate();
    const [query, setQuery] = useState(state.searchQuery || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        if(inputRef.current) inputRef.current.focus();
        const stored = localStorage.getItem('om_search_history');
        if (stored) setRecentSearches(JSON.parse(stored));
    }, []);

    const handleSearch = (searchTerm: string) => {
        if (!searchTerm.trim()) return;
        const newHistory = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
        localStorage.setItem('om_search_history', JSON.stringify(newHistory));
        setRecentSearches(newHistory);
        dispatch({ type: 'SET_SEARCH', payload: searchTerm });
        onClose();
        navigate('/');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch(query);
    };

    const suggestions = query ? state.products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5) : [];

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 animate-fade-in flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b dark:border-gray-800">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                     <X size={24} className="text-gray-600 dark:text-gray-300"/>
                </button>
                <div className="flex-1 relative">
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for products..."
                        className="w-full text-lg bg-transparent outline-none dark:text-white placeholder-gray-400"
                    />
                </div>
                {query && (
                    <button onClick={() => setQuery('')} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} className="fill-current" /></button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {query === '' ? (
                    <div>
                        {recentSearches.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Searches</h3>
                                <div className="space-y-3">
                                    {recentSearches.map(term => (
                                        <div key={term} onClick={() => handleSearch(term)} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg -mx-2">
                                            <Clock size={16} className="text-gray-400" />
                                            <span>{term}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                         {suggestions.length > 0 ? (
                             <div className="space-y-2">
                                 {suggestions.map(p => (
                                     <div key={p.id} onClick={() => { navigate(`/product/${p.id}`); onClose(); }} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer -mx-2">
                                         <Search size={16} className="text-gray-400" />
                                         <div className="flex-1">
                                             <p className="text-sm font-medium dark:text-white line-clamp-1">{p.name}</p>
                                             <p className="text-xs text-gray-500">{p.category}</p>
                                         </div>
                                         <ArrowRight size={16} className="text-gray-300" />
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <p className="text-center text-gray-500 mt-10">No matches found.</p>
                         )}
                         <button onClick={() => handleSearch(query)} className="w-full mt-4 p-3 bg-primary/10 text-primary-dark font-bold rounded-lg">
                             See all results for "{query}"
                         </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Login Modal Component ---
const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { dispatch } = useAppContext();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if(isOpen) {
            setMode('login');
            setError('');
            setFormData({ name: '', email: '', password: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const user = await api.signInWithGoogle();
            dispatch({ type: 'SET_USER', payload: user });
            onClose();
        } catch (error: any) {
            setError(error.message || "Google Sign-in failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDemoAdmin = async () => {
        onClose();
        const user = await api.loginAsDemoAdmin();
        dispatch({ type: 'SET_USER', payload: user });
        navigate('/admin');
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'signup') {
                if(!formData.name) throw new Error("Name is required");
                const user = await api.signUpWithEmail(formData.name, formData.email, formData.password);
                dispatch({ type: 'SET_USER', payload: user });
            } else {
                const user = await api.loginWithEmail(formData.email, formData.password);
                dispatch({ type: 'SET_USER', payload: user });
            }
            onClose();
        } catch (error: any) {
            console.error(error);
            let msg = "Authentication failed";
            if(error.code === 'auth/email-already-in-use') msg = "Email already registered";
            if(error.code === 'auth/invalid-credential') msg = "Invalid email or password";
            if(error.code === 'auth/weak-password') msg = "Password should be at least 6 chars";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <Logo size="md" />
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                    <button 
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'login' ? 'bg-white dark:bg-gray-600 shadow text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => { setMode('signup'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'signup' ? 'bg-white dark:bg-gray-600 shadow text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
                    {mode === 'signup' && (
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-3 text-gray-400" />
                            <Input 
                                placeholder="Full Name" 
                                className="pl-10" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required={mode === 'signup'}
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                        <Input 
                            type="email" 
                            placeholder="Email Address" 
                            className="pl-10" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                        <Input 
                            type="password" 
                            placeholder="Password" 
                            className="pl-10" 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>

                    <Button type="submit" isLoading={loading} className="w-full py-3">
                        {mode === 'login' ? 'Login' : 'Create Account'}
                    </Button>
                </form>

                <div className="relative py-2 mb-4">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t dark:border-gray-700"></div></div>
                     <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or continue with</span></div>
                </div>

                <div className="space-y-3">
                    <Button type="button" onClick={handleGoogleLogin} variant="outline" className="w-full py-3">
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
                        Google
                    </Button>

                    <Button type="button" onClick={handleDemoAdmin} variant="secondary" className="w-full py-3 text-xs">
                        <ShieldCheck size={16} />
                        Demo Admin Access
                    </Button>

                    <button type="button" onClick={onClose} className="w-full text-center text-xs text-gray-500 hover:text-primary mt-2">
                        Skip & Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Content ---
const AppContent = () => {
    const { state, dispatch } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [showSearch, setShowSearch] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const isAdmin = state.user?.isAdmin;
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    useEffect(() => {
        // --- AUTH LISTENER ---
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userProfile = await api.syncUserToFirestore(firebaseUser);
                dispatch({ type: 'SET_USER', payload: userProfile });
                
                const addrs = await api.getAddresses(userProfile.id);
                dispatch({ type: 'SET_ADDRESSES', payload: addrs });
            } else {
                dispatch({ type: 'SET_USER', payload: null });
                dispatch({ type: 'SET_ADDRESSES', payload: [] });
                
                const localUid = localStorage.getItem('om_uid');
                if (localUid === 'demo_admin_user') {
                     const admin = await api.loginAsDemoAdmin();
                     dispatch({ type: 'SET_USER', payload: admin });
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const cartCount = state.cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-900/90 backdrop-blur-md border-b dark:border-gray-800 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                         <Logo size="sm" />
                    </div>

                    <div onClick={() => setShowSearch(true)} className="hidden md:flex flex-1 max-w-xl mx-4 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 items-center gap-2 text-gray-500 cursor-text hover:ring-2 ring-primary/50 transition-all">
                        <Search size={18} />
                        <span className="text-sm">Search for products...</span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button onClick={() => setShowSearch(true)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                            <Search size={22} />
                        </button>

                        <Link to="/cart" className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm animate-fade-in">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {!state.user ? (
                             <Button size="sm" onClick={() => setShowLoginModal(true)} className="text-xs px-4 py-2 h-auto">
                                 <LogIn size={14} /> <span className="hidden md:inline">Login</span>
                             </Button>
                        ) : (
                            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 py-1 px-2 rounded-full transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-gray-200">
                                    {state.user.photoURL ? <img src={state.user.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-primary-dark" />}
                                </div>
                                <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">{state.user.name}</span>
                            </Link>
                        )}
                    </div>
                </div>
                
                {state.addresses.length > 0 && (
                    <div className="bg-primary/10 dark:bg-gray-800 py-1.5 px-4 text-xs flex justify-center md:justify-start gap-2 items-center text-gray-600 dark:text-gray-300 border-b dark:border-gray-800">
                        <Smartphone size={12} className="text-primary-dark"/>
                        <span>Delivering to: <b>{state.addresses.find(a => a.isDefault)?.pincode || state.addresses[0].pincode}</b></span>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto min-h-[calc(100vh-64px)]">
                <div className="flex">
                    {isAdmin && isAdminRoute && (
                        <aside className="hidden md:block w-64 h-[calc(100vh-64px)] sticky top-16 bg-white dark:bg-gray-800 border-r dark:border-gray-700 overflow-y-auto">
                            <div className="p-4 space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase px-3 mb-2">Admin Panel</p>
                                <Link to="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><LayoutDashboard size={20}/> Dashboard</Link>
                                <Link to="/admin/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Box size={20}/> Products</Link>
                                <Link to="/admin/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ClipboardList size={20}/> Orders</Link>
                                <Link to="/admin/content" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Layers size={20}/> Content</Link>
                            </div>
                        </aside>
                    )}

                    <div className="flex-1 w-full">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/product/:id" element={<ProductDetailsPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            
                            {isAdmin && (
                                <>
                                    <Route path="/admin" element={<AdminDashboard />} />
                                    <Route path="/admin/products" element={<AdminProducts />} />
                                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                                    <Route path="/admin/content" element={<AdminReviewsPage />} />
                                </>
                            )}

                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />
                        </Routes>
                    </div>
                </div>
            </main>
            
            {!isAdminRoute && (
                <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-8 mb-16 md:mb-0">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                        <div className="flex gap-4">
                            <Link to="/terms" className="hover:text-primary">Terms & Conditions</Link>
                            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
                        </div>
                        <p>© 2024 OnlineMart. All rights reserved.</p>
                    </div>
                </footer>
            )}
        </div>
    );
};

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
}

export default App;