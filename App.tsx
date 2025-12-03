
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, ShoppingCart, User as UserIcon, LayoutDashboard, Search, Box, ClipboardList, Layers, LogIn, Mail, Lock, UserPlus, Shield } from 'lucide-react';
import { AppState, Address } from './types';
import { api } from './services/mockService';
import { Logo, Button, AddressForm, Input } from './components/Shared';
import { HomePage, ProductDetailsPage, CartPage, CheckoutPage, ProfilePage } from './pages/UserPages';
import { AdminDashboard, AdminProducts, AdminOrdersPage, AdminReviewsPage } from './pages/AdminPages';
import { TermsPage, PrivacyPage } from './pages/InfoPages';
import { AppProvider, useAppContext } from './Context';

// --- Layout Components ---

const NavBar = () => {
  const { state, dispatch, setShowLoginModal } = useAppContext();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Search Toggle */}
            <button 
                onClick={() => setShowSearch(!showSearch)} 
                className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-gray-100 dark:bg-gray-800 text-primary' : 'text-gray-600 dark:text-gray-300'}`}
            >
                <Search size={22} />
            </button>
            
            {!state.user ? (
               <Button size="sm" className="py-1 px-3 text-sm" onClick={() => setShowLoginModal(true)}>
                 <LogIn className="w-4 h-4" /> Login
               </Button>
            ) : (
               <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-black border border-white shadow-sm cursor-pointer" onClick={() => navigate(state.user?.isAdmin ? '/admin' : '/profile')}>
                  {state.user.name[0]}
               </div>
            )}
            
            <Link to="/cart" className="relative p-2 text-gray-700 dark:text-white">
              <ShoppingCart />
              {state.cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-bounce">
                  {state.cart.length}
                </span>
              )}
            </Link>
          </div>
        </div>
        
        {/* Expandable Search Input */}
        {showSearch && (
          <div className="px-4 pb-3 animate-slide-up">
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="Search for products, brands..." 
                 autoFocus
                 className="w-full bg-gray-100 dark:bg-gray-800 px-4 py-2 pl-10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white border border-transparent"
                 value={state.searchQuery}
                 onChange={(e) => dispatch({type: 'SET_SEARCH', payload: e.target.value})}
               />
               <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            </div>
          </div>
        )}
      </header>
    </>
  );
};

const BottomNav = () => {
  const { pathname } = useLocation();
  const { state } = useAppContext();
  const isAdmin = state.user?.isAdmin;

  // Only show Bottom Nav for Admins
  if (!isAdmin) return null;

  if (pathname.includes('/product/')) return null;

  const navItemClass = (active: boolean) => 
    `flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`;

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t dark:border-gray-800 z-40 flex justify-around pb-safe">
      <Link to="/admin" className={navItemClass(pathname === '/admin')}>
        <LayoutDashboard size={22} /> <span className="text-[10px]">Dash</span>
      </Link>
      <Link to="/admin/orders" className={navItemClass(pathname === '/admin/orders')}>
        <ClipboardList size={22} /> <span className="text-[10px]">Orders</span>
      </Link>
      <Link to="/admin/products" className={navItemClass(pathname === '/admin/products')}>
        <Box size={22} /> <span className="text-[10px]">Products</span>
      </Link>
      <Link to="/admin/reviews" className={navItemClass(pathname === '/admin/reviews')}>
        <Layers size={22} /> <span className="text-[10px]">Content</span>
      </Link>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 py-10 mt-10 text-center text-sm md:mb-0 mb-16">
    <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
      <div>
        <h3 className="text-white font-bold mb-4 text-lg">OnlineMart</h3>
        <p className="text-xs leading-relaxed">Your favorite local store, now online. Experience superfast delivery and premium quality.</p>
      </div>
      <div>
        <h3 className="text-white font-bold mb-4">Policy</h3>
        <ul className="space-y-2 text-xs">
          <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
          <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
          <li className="text-red-400">No Return Policy</li>
        </ul>
      </div>
      <div>
        <h3 className="text-white font-bold mb-4">Contact</h3>
        <p className="text-xs">support@onlinemart.com</p>
        <p className="text-xs">+91 98765 43210</p>
      </div>
    </div>
    <div className="mt-8 pt-8 border-t border-gray-800">
      © 2024 OnlineMart. All rights reserved.
    </div>
  </footer>
);

// --- Main App Logic ---

const MainContent = () => {
  const { state, dispatch, showLoginModal, setShowLoginModal, pendingRedirect, setPendingRedirect } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAddressOnboarding, setShowAddressOnboarding] = useState(false);
  
  // Login Modal State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Auth Subscription
  useEffect(() => {
    setLoading(true);
    // Subscribe to Auth changes (Handles Popup, Redirect & Refresh)
    const unsubscribe = api.subscribeToAuth((user) => {
        if (user) {
            dispatch({ type: 'SET_USER', payload: user });
        } else {
            dispatch({ type: 'SET_USER', payload: null });
        }
        setLoading(false);
    });

    // Load Initial Settings
    const loadInit = async () => {
      const settings = await api.getDeliverySettings();
      dispatch({type: 'SET_SETTINGS', payload: settings});
    };
    loadInit();

    return () => unsubscribe();
  }, []);

  // Post-Login Actions (Fetch Data & Redirect)
  useEffect(() => {
    const user = state.user;
    if (user) {
        // Fetch User Data
        if (!user.isAdmin) {
             api.getAddresses(user.id).then(addresses => {
                 dispatch({ type: 'SET_ADDRESSES', payload: addresses });
                 if (addresses.length === 0 && !user.isAnonymous) {
                     setShowAddressOnboarding(true);
                 }
             });
        }
        
        setShowLoginModal(false);

        // Handle Redirection
        if (user.isAdmin) {
             // Only redirect to admin if not already there
             if (!window.location.hash.includes('/admin')) {
                navigate('/admin');
             }
        } else if (pendingRedirect) {
             navigate(pendingRedirect);
             setPendingRedirect(null);
        }
    }
  }, [state.user]);

  const handleAuth = async (method: 'google' | 'email' | 'anonymous') => {
    setLoading(true);
    try {
        let user;
        if (method === 'google') {
            // Check if mobile width
            if (window.innerWidth < 768) {
                // Triggers redirect - flow continues in useEffect after reload
                await api.loginGoogleRedirect();
                return; 
            } else {
                // Popup - user returned immediately
                user = await api.login();
            }
        } else if (method === 'email') {
            if (authMode === 'signup') {
                if (!name) throw new Error("Name is required");
                user = await api.registerEmail(name, email, password);
            } else {
                user = await api.loginEmail(email, password);
            }
        } else if (method === 'anonymous') {
            user = await api.loginAnonymous();
        }

        // Note: For popup/email auth, the subscription will also fire
        // but we can set state here for immediate feedback if needed.
        // The useEffect will reconcile it.
    } catch (error: any) {
        console.error(error);
        alert(error.message || "Authentication failed");
        setLoading(false);
    }
  };

  const handleSaveFirstAddress = async (newAddr: Address) => {
    if (state.user) {
        const addr = { ...newAddr, id: 'addr_' + Date.now(), isDefault: true };
        await api.saveAddress(state.user.id, addr);
        const updated = await api.getAddresses(state.user.id);
        dispatch({ type: 'SET_ADDRESSES', payload: updated });
        setShowAddressOnboarding(false);
        
        if (pendingRedirect) {
            navigate(pendingRedirect);
            setPendingRedirect(null);
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <NavBar />
      <div className="max-w-7xl mx-auto md:px-4 min-h-[80vh]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          
          {/* Admin Routes */}
          {state.user?.isAdmin && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            </>
          )}
        </Routes>
      </div>
      <BottomNav />
      <Footer />

      {/* Login Modal (Global) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
              
              <div className="text-center mb-6">
                <Logo size="lg" />
                <h2 className="mt-4 text-xl font-bold dark:text-white">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              </div>
              
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
                  <button onClick={() => setAuthMode('login')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${authMode === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Log In</button>
                  <button onClick={() => setAuthMode('signup')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${authMode === 'signup' ? 'bg-white text-black shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Sign Up</button>
              </div>

              <div className="space-y-3">
                 {authMode === 'signup' && (
                     <div className="relative">
                         <UserIcon size={16} className="absolute left-3 top-3 text-gray-400"/>
                         <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border dark:bg-gray-700 dark:border-gray-600 rounded-lg py-2.5 pl-10 text-sm outline-none dark:text-white"/>
                     </div>
                 )}
                 <div className="relative">
                     <Mail size={16} className="absolute left-3 top-3 text-gray-400"/>
                     <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-50 border dark:bg-gray-700 dark:border-gray-600 rounded-lg py-2.5 pl-10 text-sm outline-none dark:text-white"/>
                 </div>
                 <div className="relative">
                     <Lock size={16} className="absolute left-3 top-3 text-gray-400"/>
                     <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 border dark:bg-gray-700 dark:border-gray-600 rounded-lg py-2.5 pl-10 text-sm outline-none dark:text-white"/>
                 </div>

                 <Button isLoading={loading} onClick={() => handleAuth('email')} className="w-full">
                     {authMode === 'login' ? 'Log In' : 'Sign Up'}
                 </Button>

                 <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t dark:border-gray-700"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or continue with</span></div>
                 </div>

                 <Button 
                    isLoading={loading} 
                    onClick={() => handleAuth('google')} 
                    variant="outline"
                    className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white"
                 >
                   <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                   Google
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Address Onboarding Modal */}
      {showAddressOnboarding && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                 <button 
                    onClick={() => setShowAddressOnboarding(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider border border-gray-300 px-2 py-1 rounded"
                 >
                    Skip
                 </button>
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold dark:text-white">Welcome! 🎉</h2>
                    <p className="text-gray-500">Add your delivery address to start shopping faster.</p>
                 </div>
                 <AddressForm 
                    onSave={handleSaveFirstAddress} 
                    onCancel={() => setShowAddressOnboarding(false)} 
                 />
             </div>
          </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <MainContent />
      </HashRouter>
    </AppProvider>
  );
}
