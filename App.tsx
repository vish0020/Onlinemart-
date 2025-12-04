
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, ShoppingCart, User as UserIcon, LayoutDashboard, Search, Box, ClipboardList, Layers, LogIn, Mail, Lock, UserPlus, Shield, X, Clock, ArrowRight, Loader, Smartphone, AlertCircle } from 'lucide-react';
import { AppState, Address } from './types';
import { api } from './services/mockService';
import { Logo, Button, AddressForm, Input } from './components/Shared';
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

// --- Login Modal (Rebuilt for Google Only Focus) ---
const LoginModal = ({ onClose }: { onClose: () => void }) => {
    const { dispatch, pendingRedirect, setPendingRedirect } = useAppContext();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = (user: any) => {
        dispatch({ type: 'SET_USER', payload: user });
        onClose();
        if (pendingRedirect) {
            navigate(pendingRedirect);
            setPendingRedirect(null);
        } else {
            navigate('/profile');
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                await api.loginGoogleRedirect();
            } else {
                const user = await api.loginGoogle();
                handleSuccess(user);
            }
        } catch (e: any) {
            console.error(e);
            setError("Login failed. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
             <div className="bg-white dark:bg-gray-800 w-full max-w-sm p-8 rounded-2xl shadow-xl relative text-center" onClick={e => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
                 
                 <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <UserIcon size={32} className="text-primary-dark" />
                 </div>
                 <h2 className="text-2xl font-bold dark:text-white mb-2">Login to OnlineMart</h2>
                 <p className="text-gray-500 text-sm mb-6">Access your orders, wishlist, and profile.</p>

                 {error && (
                     <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2 justify-center">
                         <AlertCircle size={16} /> {error}
                     </div>
                 )}

                 <Button onClick={handleGoogleLogin} isLoading={isLoading} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm">
                     <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                     Sign in with Google
                 </Button>

                 <p className="text-xs text-gray-400 mt-6">
                     By continuing, you agree to our Terms & Privacy Policy.
                 </p>
             </div>
        </div>
    );
};

// --- Main App Content ---
const AppContent = () => {
    const { state, dispatch, showLoginModal, setShowLoginModal } = useAppContext();
    const navigate = useNavigate();
    const [showSearch, setShowSearch] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    const isAdmin = state.user?.isAdmin;
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    useEffect(() => {
        // 1. Check for Redirect Login (Mobile)
        api.checkRedirectLogin().then(user => {
            if (user) {
                dispatch({ type: 'SET_USER', payload: user });
                navigate('/profile');
            }
        });

        // 2. Auth State Listener
        const unsubscribe = api.subscribeToAuth((user) => {
            dispatch({ type: 'SET_USER', payload: user });
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const cartCount = state.cart.reduce((acc, item) => acc + item.quantity, 0);

    if (authLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader className="animate-spin text-primary w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

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

                        {state.user ? (
                            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 py-1 px-2 rounded-full transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-gray-200">
                                    {state.user.photoURL ? <img src={state.user.photoURL} className="w-full h-full object-cover"/> : <span className="font-bold text-xs">{state.user.name[0]}</span>}
                                </div>
                                <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">{state.user.name.split(' ')[0]}</span>
                            </Link>
                        ) : (
                            <Button size="sm" onClick={() => setShowLoginModal(true)} className="flex px-4 py-2 rounded-full text-xs md:text-sm">
                                Login
                            </Button>
                        )}
                    </div>
                </div>
                
                {state.user && state.addresses.length > 0 && (
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
