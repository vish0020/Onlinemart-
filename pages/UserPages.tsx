
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Share2, Star, ShoppingBag, MapPin, Truck, CreditCard, 
  CheckCircle, Search, Mic, Loader, Moon, Sun, 
  Smartphone, Shirt, Home, Sparkles, Gamepad2, Gift, 
  ShoppingBasket, Wrench, Dumbbell, BookOpen, Zap, 
  Briefcase, Coffee, Watch, PenTool, PawPrint, MessageSquare, ThumbsUp, Camera, X, Edit2, Trash2, Plus, Minus, Heart, AlertTriangle, Clock, ArrowRight, RotateCcw, MoveHorizontal, Maximize, PlayCircle
} from 'lucide-react';
import { Product, CartItem, Order, DeliverySettings, Review, Address } from '../types';
import { Button, Input, ProductCard, Skeleton, ProductSkeleton, AddressForm } from '../components/Shared';
import { api, PRODUCT_CATEGORIES } from '../services/mockService';
import { useAppContext } from '../Context';

// --- Category Icons Mapping ---
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Electronics": <Smartphone />,
  "Fashion": <Shirt />,
  "Home & Kitchen": <Home />,
  "Beauty & Personal Care": <Sparkles />,
  "Bags, Shoes & Accessories": <Briefcase />,
  "Toys, Kids & Baby": <Gamepad2 />, 
  "Grocery & Food": <ShoppingBasket />,
  "Tools & Automotive": <Wrench />,
  "Sports & Fitness": <Dumbbell />,
  "Pet Supplies": <PawPrint />,
  "Books & Stationery": <BookOpen />,
  "Appliances": <Zap />,
  "Housekeeping & Cleaning": <Sparkles />, 
  "Gifts & Seasonal": <Gift />,
  "Gaming": <Gamepad2 />
};

// --- Helper Functions ---
const generateRepeatedList = (sourceList: Product[]): Product[] => {
  if (!sourceList || sourceList.length === 0) return [];
  // Repeat strictly 2 times (Original + 2 copies = 3x total)
  return [...sourceList, ...sourceList, ...sourceList];
};

const getVideoEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return url; 
};

// --- Helper Components ---
const SectionHeader = ({ title, onSeeAll }: { title: string, onSeeAll?: () => void }) => (
  <div className="flex justify-between items-center mb-3 px-4">
    <h2 className="font-bold text-lg dark:text-white">{title}</h2>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="text-primary text-sm font-semibold active:opacity-50"
      >
        See All
      </button>
    )}
  </div>
);

const HorizontalProductList = ({ products, onProductClick, onAdd, wishlist, onToggleWishlist }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToStart = () => {
      if (scrollRef.current) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
  };

  if (!products || products.length === 0) return null;

  return (
    <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4 items-stretch">
      {products.map((product: Product, index: number) => (
        <div key={`${product.id}-${index}`} className="min-w-[160px] w-[160px] flex-shrink-0">
          <ProductCard 
              product={product} 
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={() => onToggleWishlist(product.id)}
              onAdd={() => onAdd(product)}
              onClick={() => onProductClick(product)}
          />
        </div>
      ))}
      
      {/* Back to Start Button */}
      <div 
        className="min-w-[120px] w-[120px] flex-shrink-0 flex flex-col items-center justify-center cursor-pointer group rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary bg-gray-50 dark:bg-gray-800/50 transition-all" 
        onClick={scrollToStart}
      >
           <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
               <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
           </div>
           <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-3 group-hover:text-primary transition-colors text-center px-2">Go Back</span>
      </div>
    </div>
  );
};

// --- Review Components ---
const StarRatingInput = ({ rating, setRating, size = "md" }: { rating: number, setRating: (r: number) => void, size?: "sm"|"md" }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
        <Star 
          className={`${size === "sm" ? "w-6 h-6" : "w-8 h-8"} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      </button>
    ))}
  </div>
);

const ReviewModal = ({ isOpen, onClose, product, onSubmit }: { isOpen: boolean, onClose: () => void, product: Product | null, onSubmit: (review: any) => void }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen || !product) return null;

  const submit = () => {
    onSubmit({ rating, comment, images: [] });
    onClose();
    setRating(5);
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
            <h2 className="text-xl font-bold dark:text-white mb-2">Rate Product</h2>
            <p className="text-sm text-gray-500 mb-4">{product.name}</p>
            
            <div className="flex justify-center mb-6">
                <StarRatingInput rating={rating} setRating={setRating} />
            </div>
            
            <textarea 
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary dark:text-white resize-none h-24 mb-4"
                placeholder="Write your review here..."
                value={comment}
                onChange={e => setComment(e.target.value)}
            ></textarea>

            <Button onClick={submit} className="w-full">Submit Review</Button>
        </div>
    </div>
  );
};

// --- Order Details Modal ---
const OrderDetailsModal = ({ order, onClose, onRefresh, onSubmitReview }: { order: Order | null, onClose: () => void, onRefresh: () => void, onSubmitReview: (pid: string, rating: number, comment: string) => Promise<void> }) => {
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelInput, setShowCancelInput] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Inline Rating State
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [submittingReview, setSubmittingReview] = useState<Record<string, boolean>>({});
    const [submittedItems, setSubmittedItems] = useState<Record<string, boolean>>({});

    if (!order) return null;

    const timeline = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStatusIdx = timeline.indexOf(order.status);
    const isCancelled = order.status === 'Cancelled';
    const isDelivered = order.status === 'Delivered';

    const handleCancelRequest = async () => {
        if(!cancelReason.trim()) return alert("Please provide a reason.");
        setSubmitting(true);
        await api.requestOrderCancellation(order.id, cancelReason);
        setSubmitting(false);
        setShowCancelInput(false);
        onRefresh();
    };

    const handleRateItem = async (itemId: string) => {
        const rating = ratings[itemId];
        const comment = comments[itemId] || '';
        if(!rating) return;

        setSubmittingReview(prev => ({...prev, [itemId]: true}));
        await onSubmitReview(itemId, rating, comment);
        setSubmittingReview(prev => ({...prev, [itemId]: false}));
        setSubmittedItems(prev => ({...prev, [itemId]: true}));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg sm:rounded-2xl rounded-t-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hidden sm:block"><X/></button>

                <h2 className="text-xl font-bold dark:text-white mb-1">Order Details</h2>
                <p className="text-sm text-gray-500 mb-6">ID: #{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleDateString()}</p>

                {/* Timeline */}
                <div className="mb-8">
                    {isCancelled ? (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 font-bold border border-red-200">
                            <X size={20}/> Order Cancelled
                        </div>
                    ) : (
                        <div className="px-2">
                             <div className="flex justify-between items-center relative">
                                 <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                                 <div 
                                    className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-green-500 -z-10 transition-all duration-500" 
                                    style={{ width: `${(currentStatusIdx / (timeline.length - 1)) * 100}%` }}
                                 ></div>

                                 {timeline.map((status, idx) => {
                                     const isCompleted = idx <= currentStatusIdx;
                                     return (
                                         <div key={status} className="flex flex-col items-center gap-2">
                                             <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 z-10 flex items-center justify-center ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'}`}>
                                                 {isCompleted && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                             </div>
                                             <span className={`text-[10px] md:text-xs font-medium text-center absolute -bottom-6 w-20 ${isCompleted ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-400'}`}>
                                                {status}
                                             </span>
                                         </div>
                                     );
                                 })}
                             </div>
                             <div className="h-4"></div>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-6 mb-6">
                    {order.items.map(item => (
                        <div key={item.id} className="flex flex-col gap-3 pb-4 border-b dark:border-gray-700 last:border-0">
                            <div className="flex gap-4">
                                <img src={item.images[0]} className="w-16 h-16 rounded-lg bg-gray-100 object-cover" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm dark:text-white line-clamp-2">{item.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{item.quantity} x ₹{item.price}</p>
                                </div>
                                <span className="font-bold text-sm dark:text-white">₹{item.price * item.quantity}</span>
                            </div>
                            
                            {/* Inline Rating for Delivered Items */}
                            {isDelivered && !submittedItems[item.id] && (
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg animate-fade-in">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">Rate this product:</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} onClick={() => setRatings(p => ({...p, [item.id]: star}))}>
                                                    <Star 
                                                        size={24} 
                                                        className={`${(ratings[item.id] || 0) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {ratings[item.id] > 0 && (
                                            <Button 
                                                size="sm" 
                                                className="h-8 px-4 py-0 text-xs ml-auto"
                                                onClick={() => handleRateItem(item.id)}
                                                isLoading={submittingReview[item.id]}
                                            >
                                                Publish
                                            </Button>
                                        )}
                                    </div>
                                    {ratings[item.id] > 0 && (
                                        <input 
                                            className="w-full mt-2 text-xs p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Write a comment (optional)..."
                                            value={comments[item.id] || ''}
                                            onChange={e => setComments(p => ({...p, [item.id]: e.target.value}))}
                                        />
                                    )}
                                </div>
                            )}
                            {submittedItems[item.id] && (
                                <p className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Review Submitted</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bill */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2 text-sm mb-6">
                    <div className="flex justify-between dark:text-gray-300">
                        <span>Subtotal</span>
                        <span>₹{order.totalAmount - order.deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between dark:text-gray-300">
                        <span>Delivery</span>
                        <span>₹{order.deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base dark:text-white border-t dark:border-gray-600 pt-2">
                        <span>Total</span>
                        <span>₹{order.totalAmount}</span>
                    </div>
                </div>

                {/* Shipping Info & Actions */}
                <div className="mb-4">
                     <h3 className="font-bold text-sm dark:text-gray-300 mb-2">Shipping Address</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.shippingAddress.fullName}<br/>
                        {order.shippingAddress.line1}, {order.shippingAddress.area}<br/>
                        {order.shippingAddress.city} - {order.shippingAddress.pincode}<br/>
                        Phone: {order.shippingAddress.phone}
                     </p>
                </div>

                {!isCancelled && order.status !== 'Delivered' && !order.cancelRequest && (
                    <div className="pt-2 border-t dark:border-gray-700">
                         {!showCancelInput ? (
                             <button 
                                onClick={() => setShowCancelInput(true)}
                                className="w-full py-3 text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                             >
                                Request Cancellation
                             </button>
                         ) : (
                             <div className="space-y-3 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg animate-fade-in">
                                 <p className="text-sm font-bold text-red-700">Cancel Order?</p>
                                 <textarea 
                                    className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:text-white"
                                    placeholder="Please tell us why you want to cancel..."
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                 ></textarea>
                                 <div className="flex gap-2">
                                     <Button size="sm" variant="ghost" onClick={() => setShowCancelInput(false)} className="flex-1 bg-white">Back</Button>
                                     <Button size="sm" onClick={handleCancelRequest} isLoading={submitting} className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none">Confirm Cancel</Button>
                                 </div>
                             </div>
                         )}
                    </div>
                )}
                {order.cancelRequest && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-500">Cancellation Status: {order.cancelRequest.status.toUpperCase()}</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Reason: "{order.cancelRequest.reason}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const HomePage = () => {
    const { state, dispatch, setShowLoginModal } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [recentItems, setRecentItems] = useState<Product[]>([]);
    const [showReviewPopup, setShowReviewPopup] = useState(false);
    const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const navigate = useNavigate();
  
    useEffect(() => {
      const fetchData = async () => {
          try {
              let prods = state.products;
              if (state.products.length === 0) {
                  prods = await api.getProducts();
                  dispatch({ type: 'SET_PRODUCTS', payload: prods });
              }
              
              if (state.banners.length === 0) {
                  const banners = await api.getBanners();
                  dispatch({ type: 'SET_BANNERS', payload: banners });
              }
              
              const recentJSON = localStorage.getItem('om_recent');
              if (recentJSON) {
                  try {
                      setRecentItems(JSON.parse(recentJSON));
                  } catch (e) {
                      localStorage.removeItem('om_recent');
                  }
              }
      
              if (state.user) {
                  const orders = await api.getOrders(false, state.user.id);
                  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
                  if (deliveredOrders.length > 0) {
                      const lastOrder = deliveredOrders[0];
                      const hasShown = sessionStorage.getItem('om_review_popup_shown');
                      if (!hasShown) {
                           const p = state.products.find(p => p.id === lastOrder.items[0].id);
                           if (p) {
                               setReviewProduct(p);
                               setTimeout(() => setShowReviewPopup(true), 2000);
                               sessionStorage.setItem('om_review_popup_shown', 'true');
                           }
                      }
                  }
              }
          } catch (error) {
              console.error("Failed to load home page data", error);
          } finally {
              setLoading(false);
          }
      }
      fetchData();
    }, [state.user]);

    const visibleBanners = useMemo(() => state.banners.filter(b => b.isVisible), [state.banners]);

    useEffect(() => {
        if (visibleBanners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBannerIndex(prev => (prev + 1) % visibleBanners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [visibleBanners.length]);
  
    const handleSubmitReview = async (reviewData: any) => {
      if (!state.user || !reviewProduct) return;
      const review: Review = {
          id: 'rev_' + Date.now(),
          productId: reviewProduct.id,
          userId: state.user.id,
          userName: state.user.name,
          userPhoto: state.user.photoURL,
          rating: reviewData.rating,
          comment: reviewData.comment,
          images: reviewData.images,
          createdAt: new Date().toISOString(),
          verifiedPurchase: true,
          likes: 0
      };
      await api.addReview(review);
      const prods = await api.getProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: prods });
    };
  
    const categories = useMemo(() => {
       return Object.keys(PRODUCT_CATEGORIES);
    }, []);
  
    const displayedProducts = useMemo(() => {
      if (state.searchQuery) {
          return state.products.filter(p => 
              p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
              p.category.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
              p.subcategory?.toLowerCase().includes(state.searchQuery.toLowerCase())
          );
      }
  
      if (recentItems.length === 0) return state.products.slice(0, 8);
  
      const recentCategories = new Set(recentItems.map(i => i.category));
      const recentSubcategories = new Set(recentItems.map(i => i.subcategory));
  
      return [...state.products].sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          if (recentSubcategories.has(a.subcategory)) scoreA += 5;
          if (recentSubcategories.has(b.subcategory)) scoreB += 5;
          if (recentCategories.has(a.category)) scoreA += 2;
          if (recentCategories.has(b.category)) scoreB += 2;
          if (a.isFeatured) scoreA += 1;
          if (b.isFeatured) scoreB += 1;
          return scoreB - scoreA;
      }).slice(0, 8);
    }, [state.products, state.searchQuery, recentItems]);
  
    const handleCategoryClick = (cat: string) => {
      if (state.searchQuery === cat) {
          dispatch({ type: 'SET_SEARCH', payload: '' });
      } else {
          dispatch({ type: 'SET_SEARCH', payload: cat });
      }
    };
  
    const handleProductClick = (product: Product) => {
      const recentJSON = localStorage.getItem('om_recent');
      let recent: Product[] = recentJSON ? JSON.parse(recentJSON) : [];
      recent = recent.filter(p => p.id !== product.id);
      recent.unshift(product);
      recent = recent.slice(0, 10);
      localStorage.setItem('om_recent', JSON.stringify(recent));
      navigate(`/product/${product.id}`);
    };

    const handleToggleWishlist = (id: string) => {
        if (!state.user) {
            setShowLoginModal(true);
            return;
        }
        dispatch({ type: 'TOGGLE_WISHLIST', payload: id });
    };
  
    const getProductsByCategory = (cat: string) => {
        const products = state.products.filter(p => p.category === cat);
        return generateRepeatedList(products);
    };
  
    return (
      <div className="pb-20 space-y-8 animate-fade-in">
        <ReviewModal 
          isOpen={showReviewPopup} 
          onClose={() => setShowReviewPopup(false)} 
          product={reviewProduct} 
          onSubmit={handleSubmitReview}
        />
  
        {/* Hero Banner Carousel */}
        {visibleBanners.length > 0 ? (
            <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-gray-200 rounded-b-xl md:rounded-3xl md:mx-0 overflow-hidden shadow-md mx-0 group">
                {/* Slides Container */}
                <div 
                    className="flex h-full transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
                >
                    {visibleBanners.map(banner => (
                        <div key={banner.id} className="min-w-full h-full relative">
                             <img src={banner.imageUrl} className="w-full h-full object-cover" alt={banner.title} />
                             <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center px-4 md:px-12">
                                <div className="w-3/4 md:w-1/2 text-white">
                                    <h1 className="text-xl md:text-5xl font-extrabold mb-1 md:mb-2 leading-tight drop-shadow-md">
                                        {banner.title}
                                    </h1>
                                    <p className="text-xs md:text-xl mb-3 md:mb-4 font-medium text-gray-200 line-clamp-2">{banner.subtitle}</p>
                                    <Button variant="primary" onClick={() => dispatch({type: 'SET_SEARCH', payload: banner.link})} className="text-xs md:text-base py-1.5 md:py-2 px-4 md:px-6">
                                        Shop Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {visibleBanners.map((_, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setCurrentBannerIndex(idx)}
                            className={`h-2 rounded-full transition-all shadow-sm ${idx === currentBannerIndex ? 'bg-primary w-6' : 'bg-white/50 w-2 hover:bg-white'}`}
                        />
                    ))}
                </div>
            </div>
        ) : (
          !loading && (
              <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-gradient-to-r from-primary-light to-primary rounded-b-xl md:rounded-3xl overflow-hidden shadow-md">
                  <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12">
                  <div className="w-2/3 z-10">
                      <h1 className="text-2xl md:text-5xl font-extrabold text-black mb-2 leading-tight">
                      Welcome to <br/>
                      <span className="text-white drop-shadow-md">OnlineMart</span>
                      </h1>
                  </div>
                  </div>
              </div>
          )
        )}
  
        {/* Categories */}
        <div>
          <SectionHeader 
              title="Categories" 
              onSeeAll={() => dispatch({ type: 'SET_SEARCH', payload: '' })} 
          />
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
            {loading ? [1,2,3,4].map(i => <Skeleton key={i} className="w-20 h-20 flex-shrink-0 rounded-full" />) :
             categories.map(cat => {
              const isActive = state.searchQuery === cat;
              return (
                  <div key={cat} onClick={() => handleCategoryClick(cat)} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group select-none">
                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-sm transition-all duration-300 ${isActive ? 'bg-primary border-primary scale-110' : 'bg-white dark:bg-gray-800 border-primary/20 group-hover:border-primary'}`}>
                      <div className={`transition-colors ${isActive ? 'text-black' : 'text-primary'}`}>
                          {CATEGORY_ICONS[cat] || <ShoppingBag />}
                      </div>
                  </div>
                  <span className={`text-xs font-medium w-20 text-center truncate transition-colors ${isActive ? 'text-primary font-bold' : 'dark:text-gray-300'}`}>{cat}</span>
                  </div>
              );
            })}
          </div>
        </div>
  
        {/* Recommended / Search Results */}
        <div id="products" className="px-4">
          <h2 className="font-bold text-lg dark:text-white mb-4">
            {state.searchQuery 
              ? `Results for "${state.searchQuery}"` 
              : 'Recommended for You'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading 
              ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
              : displayedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    isWishlisted={state.wishlist.includes(product.id)}
                    onToggleWishlist={() => handleToggleWishlist(product.id)}
                    onAdd={() => dispatch({ type: 'ADD_TO_CART', payload: product })}
                    onClick={() => handleProductClick(product)}
                  />
                ))
            }
          </div>
          {displayedProducts.length === 0 && !loading && (
             <div className="text-center py-10 text-gray-500">No products found.</div>
          )}
        </div>
  
        {/* Extra Categories Sections */}
        {!state.searchQuery && !loading && (
          <div className="space-y-8 animate-slide-up">
              {getProductsByCategory('Electronics').length > 0 && (
                  <div>
                      <SectionHeader title="Best in Electronics" onSeeAll={() => dispatch({ type: 'SET_SEARCH', payload: 'Electronics' })} />
                      <HorizontalProductList 
                          products={getProductsByCategory('Electronics')}
                          onProductClick={handleProductClick}
                          onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                          wishlist={state.wishlist}
                          onToggleWishlist={handleToggleWishlist}
                      />
                  </div>
              )}
  
              {getProductsByCategory('Fashion').length > 0 && (
                  <div>
                      <SectionHeader title="Trending Fashion" onSeeAll={() => dispatch({ type: 'SET_SEARCH', payload: 'Fashion' })} />
                      <HorizontalProductList 
                          products={getProductsByCategory('Fashion')}
                          onProductClick={handleProductClick}
                          onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                          wishlist={state.wishlist}
                          onToggleWishlist={handleToggleWishlist}
                      />
                  </div>
              )}
  
               {getProductsByCategory('Home & Kitchen').length > 0 && (
                  <div>
                      <SectionHeader title="Home Essentials" onSeeAll={() => dispatch({ type: 'SET_SEARCH', payload: 'Home & Kitchen' })} />
                      <HorizontalProductList 
                          products={getProductsByCategory('Home & Kitchen')}
                          onProductClick={handleProductClick}
                          onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                          wishlist={state.wishlist}
                          onToggleWishlist={handleToggleWishlist}
                      />
                  </div>
              )}
          </div>
        )}
  
        {/* Recently Viewed */}
        {!loading && recentItems.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800/50 py-6 mt-4">
              <SectionHeader title="Recently Viewed" />
              <HorizontalProductList 
                  products={generateRepeatedList(recentItems)}
                  onProductClick={handleProductClick}
                  onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                  wishlist={state.wishlist}
                  onToggleWishlist={handleToggleWishlist}
              />
            </div>
        )}
      </div>
    );
};

export const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, dispatch, setShowLoginModal } = useAppContext();
    const product = state.products.find(p => p.id === id);
    const [activeImg, setActiveImg] = useState(0);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [sortOption, setSortOption] = useState('Most Helpful');
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Zoom & Tutorial State
    const [showTutorial, setShowTutorial] = useState(false);
    const [scale, setScale] = useState(1);
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const baseScale = useRef(1);
    const startDist = useRef<number | null>(null);

    const media = useMemo(() => {
        if(!product) return [];
        return product.video ? [...product.images, product.video] : product.images;
    }, [product]);

    useEffect(() => {
      window.scrollTo(0, 0);
      setActiveImg(0);
      if (id) {
          api.getReviews(id).then(setReviews);
      }
      
      const seen = localStorage.getItem('om_product_tutorial');
      if (!seen) {
          setShowTutorial(true);
      }
    }, [id]);

    const handleDismissTutorial = () => {
        setShowTutorial(false);
        localStorage.setItem('om_product_tutorial', 'true');
    };

    const handleShare = async () => {
        if (navigator.share && product) {
            try {
                await navigator.share({
                    title: product.name,
                    text: `Check out ${product.name} on OnlineMart!`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            alert('Link copied to clipboard!');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handleSuggestionClick = (p: Product) => {
        const recentJSON = localStorage.getItem('om_recent');
        let recent: Product[] = recentJSON ? JSON.parse(recentJSON) : [];
        recent = recent.filter(prod => prod.id !== p.id);
        recent.unshift(p);
        recent = recent.slice(0, 10);
        localStorage.setItem('om_recent', JSON.stringify(recent));
        navigate(`/product/${p.id}`);
        setScale(1);
    };

    const handleToggleWishlist = (id: string) => {
        if (!state.user) {
            setShowLoginModal(true);
            return;
        }
        dispatch({ type: 'TOGGLE_WISHLIST', payload: id });
    };
  
    const handleSubmitReview = async (reviewData: any) => {
      if (!state.user || !product) {
          setShowLoginModal(true);
          return;
      }
      const review: Review = {
          id: 'rev_' + Date.now(),
          productId: product.id,
          userId: state.user.id,
          userName: state.user.name,
          userPhoto: state.user.photoURL,
          rating: reviewData.rating,
          comment: reviewData.comment,
          images: reviewData.images,
          createdAt: new Date().toISOString(),
          verifiedPurchase: true,
          likes: 0
      };
      await api.addReview(review);
      const updatedReviews = await api.getReviews(product.id);
      setReviews(updatedReviews);
      
      const prods = await api.getProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: prods });
    };

    const similarProducts = useMemo(() => {
        if (!product) return [];
        const similar = state.products.filter(p => p.id !== product.id && p.category === product.category);
        return generateRepeatedList(similar);
    }, [product, state.products]);

    const recentAddedProducts = useMemo(() => {
         const recent = [...state.products].reverse();
         return generateRepeatedList(recent);
    }, [state.products]);

    const recommendedProducts = useMemo(() => {
        const recommended = state.products.filter(p => p.rating >= 4.5 || p.isFeatured);
        return generateRepeatedList(recommended);
    }, [state.products]);

    const recentlyViewed = useMemo(() => {
        const json = localStorage.getItem('om_recent');
        const list: Product[] = json ? JSON.parse(json) : [];
        const filtered = list.filter(p => p.id !== product?.id);
        return generateRepeatedList(filtered);
    }, [product]);
  
    const ratingsCount = useMemo(() => {
        const counts = {1:0, 2:0, 3:0, 4:0, 5:0};
        reviews.forEach(r => counts[r.rating as keyof typeof counts]++);
        return counts;
    }, [reviews]);
  
    const sortedReviews = useMemo(() => {
      let sorted = [...reviews];
      if (sortOption === 'Recent') {
          sorted.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortOption === 'Most Helpful') {
          sorted.sort((a,b) => b.likes - a.likes);
      } else if (sortOption === 'High Rating') {
          sorted.sort((a,b) => b.rating - a.rating);
      } else if (sortOption === 'Low Rating') {
          sorted.sort((a,b) => a.rating - b.rating);
      }
      return sorted;
    }, [reviews, sortOption]);

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            startDist.current = dist;
            baseScale.current = scale;
        } else if (e.touches.length === 1) {
            touchEnd.current = null; 
            touchStart.current = e.targetTouches[0].clientX;
        }
    }

    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && startDist.current) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const newScale = baseScale.current * (dist / startDist.current);
            setScale(Math.min(Math.max(1, newScale), 3)); 
        } else if (e.touches.length === 1) {
            touchEnd.current = e.targetTouches[0].clientX;
        }
    }

    const onTouchEnd = () => {
        if (startDist.current) {
            startDist.current = null;
            setScale(1); 
            return;
        }

        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const minSwipe = 50;
        const isLeftSwipe = distance > minSwipe;
        const isRightSwipe = distance < -minSwipe;
        
        if (product && isLeftSwipe) {
            setActiveImg(prev => (prev + 1) % media.length);
            setScale(1);
        }
        if (product && isRightSwipe) {
            setActiveImg(prev => (prev - 1 + media.length) % media.length);
            setScale(1);
        }
        
        touchStart.current = null;
        touchEnd.current = null;
    }

    const scrollToReviews = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const handleBuyNow = () => {
        if (!state.user) {
            setShowLoginModal(true);
            return;
        }
        if (product) {
            dispatch({ type: 'ADD_TO_CART', payload: product });
            navigate('/checkout');
        }
    }
  
    if (!product) return <div className="p-10 text-center"><Loader className="animate-spin mx-auto"/></div>;
    
    const isVideoActive = product.video && activeImg === media.length - 1;

    return (
      <div className="pb-10 bg-white dark:bg-gray-900 min-h-screen animate-fade-in relative">
        <ReviewModal 
           isOpen={showReviewModal} 
           onClose={() => setShowReviewModal(false)} 
           product={product} 
           onSubmit={handleSubmitReview}
        />

        {showTutorial && (
            <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in" onClick={handleDismissTutorial}>
                <div className="mb-8">
                    <MoveHorizontal size={48} className="mx-auto mb-2 animate-pulse" />
                    <p className="font-bold text-lg">Swipe to Change</p>
                    <p className="text-sm opacity-80">Slide left or right to see more photos</p>
                </div>
                <div className="mb-12">
                    <Maximize size={48} className="mx-auto mb-2 animate-pulse" />
                    <p className="font-bold text-lg">Pinch to Zoom</p>
                    <p className="text-sm opacity-80">Use two fingers to zoom in on details</p>
                </div>
                <div className="mb-8">
                    <Share2 size={48} className="mx-auto mb-2 animate-pulse" />
                    <p className="font-bold text-lg">Share Products</p>
                    <p className="text-sm opacity-80">Tap the top icon to share with friends</p>
                </div>
                <Button onClick={(e) => { e.stopPropagation(); handleDismissTutorial(); }} className="bg-white text-black px-8 rounded-full">Got it!</Button>
            </div>
        )}
        
        <div 
            className="relative w-full aspect-square bg-white dark:bg-gray-800 border-b dark:border-gray-800 overflow-hidden"
            onTouchStart={onTouchStart} 
            onTouchMove={onTouchMove} 
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            style={{ touchAction: 'pan-y' }}
        >
          {isVideoActive ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                  <iframe 
                    src={getVideoEmbedUrl(product.video!)} 
                    className="w-full h-full" 
                    allow="autoplay; encrypted-media" 
                    allowFullScreen
                    title={product.name}
                  ></iframe>
              </div>
          ) : (
             <>
                <div 
                   className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 scale-110"
                   style={{ backgroundImage: `url(${media[activeImg]})` }}
                ></div>
                <img 
                   src={media[activeImg]} 
                   className="relative z-10 w-full h-full object-contain p-4 mix-blend-multiply dark:mix-blend-normal transition-transform duration-100 ease-linear" 
                   style={{ transform: `scale(${scale})` }}
                   alt="" 
                />
             </>
          )}
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {media.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${i === activeImg ? 'bg-primary w-3' : 'bg-white/50'}`} />
            ))}
          </div>

          <button onClick={() => handleToggleWishlist(product.id)} className="absolute top-4 right-16 bg-white/80 dark:bg-black/50 backdrop-blur p-2.5 rounded-full shadow-md z-20 transition-transform active:scale-90">
              <Heart size={20} className={`${state.wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-800 dark:text-white'}`} />
          </button>

          <button onClick={handleShare} className="absolute top-4 right-4 bg-white/80 dark:bg-black/50 backdrop-blur p-2.5 rounded-full shadow-md z-20 transition-transform active:scale-90">
              <Share2 size={20} className="text-gray-800 dark:text-white"/>
          </button>
        </div>
        
        {/* Thumbnails if Video exists or > 1 image */}
        {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-4 border-b dark:border-gray-800 no-scrollbar">
                {media.map((src, i) => {
                    const isVid = product.video && i === media.length - 1;
                    return (
                        <div 
                            key={i} 
                            onClick={() => setActiveImg(i)}
                            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer relative ${activeImg === i ? 'border-primary' : 'border-transparent'}`}
                        >
                            {isVid ? (
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    <PlayCircle className="text-white"/>
                                </div>
                            ) : (
                                <img src={src} className="w-full h-full object-cover" />
                            )}
                        </div>
                    );
                })}
            </div>
        )}
  
        <div className="px-4 pt-4 space-y-4">
          <div>
            <div className="flex justify-between items-start">
                <p className="text-xs text-primary font-bold mb-1">{product.category}</p>
                <div className="flex items-center gap-1 cursor-pointer" onClick={scrollToReviews}>
                    <div className="flex text-yellow-400">
                        {Array(5).fill(0).map((_, i) => <Star key={i} size={14} fill={i < Math.round(product.rating) ? "currentColor" : "none"} />)}
                    </div>
                    <span className="text-xs text-blue-500">{product.reviewCount} reviews</span>
                </div>
            </div>
            
            <h1 className="text-xl font-medium text-gray-800 dark:text-gray-100 leading-snug">{product.name}</h1>
          </div>
  
          <div className="border-t border-b dark:border-gray-800 py-3">
             <div className="flex items-baseline gap-2">
                <span className="text-red-600 text-xl font-light">-{Math.round(((product.originalPrice || product.price * 1.2) - product.price) / (product.originalPrice || product.price * 1.2) * 100)}%</span>
                <span className="text-3xl font-medium text-gray-900 dark:text-white">
                    <sup className="text-base">₹</sup>{product.price}
                </span>
             </div>
             {product.originalPrice && (
                 <div className="text-gray-500 text-sm">
                    M.R.P.: <span className="line-through">₹{product.originalPrice}</span>
                 </div>
             )}
             <div className="text-sm mt-1">
                 Inclusive of all taxes
             </div>
          </div>
  
          <div className="space-y-2">
            <h3 className="font-bold text-sm dark:text-gray-200">About this item</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
              {product.description}
            </p>
          </div>
  
          <div className="flex flex-col gap-3 pt-2">
              <Button 
                  onClick={handleBuyNow} 
                  className="w-full rounded-full bg-yellow-400 hover:bg-yellow-500 text-black border-none shadow-none"
              >
                  Buy Now
              </Button>
              <Button 
                  variant="secondary"
                  onClick={() => {
                      dispatch({ type: 'ADD_TO_CART', payload: product });
                      if (navigator.vibrate) navigator.vibrate(50);
                  }} 
                  className="w-full rounded-full bg-black text-white hover:bg-gray-900 border-none font-bold"
              >
                  Add to Cart
              </Button>
          </div>
        </div>
  
        <div className="mt-8 border-t dark:border-gray-800 pt-6 px-4" ref={scrollRef}>
          <h3 className="font-bold text-xl dark:text-white mb-4">Customer Reviews</h3>
  
          <div className="flex items-start gap-4 mb-6">
              <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map(star => {
                      const count = ratingsCount[star as keyof typeof ratingsCount];
                      const percent = reviews.length ? (count / reviews.length) * 100 : 0;
                      return (
                          <div key={star} className="flex items-center gap-2 text-xs w-48">
                              <span className="w-8 text-blue-500 hover:underline cursor-pointer">{star} star</span>
                              <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-sm overflow-hidden border dark:border-gray-600">
                                  <div className="h-full bg-yellow-400 border-r border-yellow-500" style={{width: `${percent}%`}}></div>
                              </div>
                              <span className="w-8 text-right text-gray-500">{Math.round(percent)}%</span>
                          </div>
                      );
                  })}
              </div>
              <div className="flex-1 text-right">
                  <div className="flex flex-col items-end">
                      <div className="flex text-yellow-400">
                           {Array(5).fill(0).map((_, i) => <Star key={i} size={18} fill={i < Math.round(product.rating) ? "currentColor" : "none"} />)}
                      </div>
                      <span className="text-lg font-bold dark:text-white">{product.rating} out of 5</span>
                  </div>
              </div>
          </div>

          <div className="border-t border-b dark:border-gray-800 py-3 mb-4">
              <h4 className="font-bold text-sm mb-2 dark:text-white">Review this product</h4>
              <p className="text-xs text-gray-500 mb-3">Share your thoughts with other customers</p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => setShowReviewModal(true)}>Write a customer review</Button>
          </div>
  
          <div className="space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                 {['Most Helpful', 'Recent', 'High Rating', 'Low Rating'].map(opt => (
                     <button 
                        key={opt}
                        onClick={() => setSortOption(opt)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap ${sortOption === opt ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'bg-transparent border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400'}`}
                     >
                         {opt}
                     </button>
                 ))}
              </div>

              {sortedReviews.length === 0 ? <p className="text-center text-gray-500 py-4">No reviews yet.</p> : sortedReviews.map(review => (
                  <div key={review.id} className="pb-4 border-b dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                              {review.userPhoto ? <img src={review.userPhoto} className="w-full h-full object-cover"/> : review.userName[0]}
                          </div>
                          <p className="text-sm font-medium dark:text-white">{review.userName}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                          <div className="flex text-yellow-400">
                              {Array(5).fill(0).map((_, i) => <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />)}
                          </div>
                          {review.verifiedPurchase && <span className="text-xs text-orange-600 font-bold">Verified Purchase</span>}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toDateString()}</p>
                  </div>
              ))}
          </div>
        </div>

        <div className="space-y-6 mt-6 border-t-[8px] border-gray-100 dark:border-gray-800 pt-6">
            {similarProducts.length > 0 && (
                <div>
                    <SectionHeader title="Similar Products" />
                    <HorizontalProductList 
                        products={similarProducts}
                        onProductClick={handleSuggestionClick}
                        onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                        wishlist={state.wishlist}
                        onToggleWishlist={handleToggleWishlist}
                    />
                </div>
            )}
            
            {recentAddedProducts.length > 0 && (
                <div>
                    <SectionHeader title="Fresh Arrivals" />
                    <HorizontalProductList 
                        products={recentAddedProducts}
                        onProductClick={handleSuggestionClick}
                        onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                        wishlist={state.wishlist}
                        onToggleWishlist={handleToggleWishlist}
                    />
                </div>
            )}

            {recommendedProducts.length > 0 && (
                <div>
                    <SectionHeader title="Recommended for You" />
                    <HorizontalProductList 
                        products={recommendedProducts}
                        onProductClick={handleSuggestionClick}
                        onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                        wishlist={state.wishlist}
                        onToggleWishlist={handleToggleWishlist}
                    />
                </div>
            )}

            {recentlyViewed.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 py-4">
                    <SectionHeader title="Your Browsing History" />
                    <HorizontalProductList 
                        products={recentlyViewed}
                        onProductClick={handleSuggestionClick}
                        onAdd={(p: Product) => dispatch({ type: 'ADD_TO_CART', payload: p })}
                        wishlist={state.wishlist}
                        onToggleWishlist={handleToggleWishlist}
                    />
                </div>
            )}
        </div>
      </div>
    );
};

export const CartPage = () => {
  const { state, dispatch, setShowLoginModal, setPendingRedirect } = useAppContext();
  const navigate = useNavigate();

  const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliverySettings = state.deliverySettings;
  const isFreeDelivery = total >= deliverySettings.freeDeliveryAbove;
  
  const defaultAddress = state.addresses.find(a => a.isDefault);

  if (state.cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <ShoppingBag className="w-20 h-20 text-gray-300" />
        <h2 className="text-xl font-semibold dark:text-white">Your cart is empty</h2>
        <Button onClick={() => navigate('/')}>Start Shopping</Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4 animate-slide-up">
      {state.user && defaultAddress && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
             <MapPin size={16} />
             <div className="flex-1 truncate">
                Deliver to <b>{defaultAddress.fullName}</b> - {defaultAddress.pincode}
             </div>
             <button onClick={() => navigate('/profile')} className="font-bold text-xs uppercase tracking-wide border border-blue-200 rounded px-2 py-1">Change</button>
          </div>
      )}

      <h1 className="text-2xl font-bold dark:text-white">My Cart ({state.cart.length})</h1>
      
      <div className="space-y-4">
        {state.cart.map(item => (
          <div key={item.id} className="flex gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm">
            <img 
                src={item.images?.[0] || 'https://via.placeholder.com/80'} 
                className="w-20 h-20 object-cover rounded-lg bg-gray-100 cursor-pointer" 
                alt={item.name}
                onClick={() => navigate(`/product/${item.id}`)}
            />
            <div className="flex-1 flex flex-col justify-between">
              <div onClick={() => navigate(`/product/${item.id}`)} className="cursor-pointer">
                <h3 className="font-semibold line-clamp-1 dark:text-white">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold dark:text-primary">₹{item.price * item.quantity}</span>
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                  <button onClick={() => dispatch({type: 'UPDATE_CART_QTY', payload: {id: item.id, delta: -1}})}><span className="font-bold">-</span></button>
                  <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => dispatch({type: 'UPDATE_CART_QTY', payload: {id: item.id, delta: 1}})}><span className="font-bold text-primary">+</span></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl space-y-3 text-sm">
        <h3 className="font-bold text-gray-500 uppercase tracking-wider text-xs">Bill Details</h3>
        <div className="flex justify-between dark:text-gray-300">
          <span>Item Total</span>
          <span>₹{total}</span>
        </div>
        <div className="flex justify-between dark:text-gray-300">
          <span>Delivery Charge</span>
          <span className={isFreeDelivery ? 'text-green-500' : ''}>
            {isFreeDelivery ? 'FREE' : `calculated at checkout`}
          </span>
        </div>
        <div className="border-t dark:border-gray-700 pt-3 flex justify-between font-bold text-lg dark:text-white">
          <span>Subtotal</span>
          <span>₹{total}</span>
        </div>
      </div>

      <div className="flex justify-end pt-4">
         {/* Button removed from here and placed below */}
      </div>

      <div className="pt-4 pb-4">
          <Button 
              className="w-full shadow-lg" 
              onClick={() => {
                  if (state.user) {
                      navigate('/checkout');
                  } else {
                      setPendingRedirect('/checkout');
                      setShowLoginModal(true);
                  }
              }}
          >
            Proceed to Buy ({state.cart.length} items)
          </Button>
      </div>
    </div>
  );
};

export const CheckoutPage = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
      state.addresses.find(a => a.isDefault)?.id || ''
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const selectedAddress = state.addresses.find(a => a.id === selectedAddressId);

  useEffect(() => {
    if (state.addresses.length === 0) {
        setIsAddingNewAddress(true);
    }
  }, [state.addresses]);

  useEffect(() => {
    if (selectedAddress) {
        setLoading(true);
        setTimeout(() => {
            const settings = state.deliverySettings;
            let distance = 0;

            if (selectedAddress.distanceFromStore !== undefined) {
                distance = selectedAddress.distanceFromStore;
            } else {
                // Fallback for old addresses
                const pincodeVal = parseInt(selectedAddress.pincode.slice(0, 5)) || 38000;
                distance = (pincodeVal % 10) * 5 + 2; 
            }

            const cost = settings.baseCharge + (distance * settings.perKmCharge);
            const cartTotal = state.cart.reduce((a,b) => a + (b.price * b.quantity), 0);
            
            setDeliveryDistance(distance);

            if (cartTotal >= settings.freeDeliveryAbove) {
                setDeliveryCost(0);
            } else {
                setDeliveryCost(Math.round(cost));
            }
            setLoading(false);
        }, 300);
    }
  }, [selectedAddress, state.deliverySettings, state.cart]);

  const handleSaveNewAddress = async (newAddr: Address) => {
    if (state.user) {
        const addr = { ...newAddr, id: 'addr_' + Date.now() };
        await api.saveAddress(state.user.id, addr);
        const updated = await api.getAddresses(state.user.id);
        dispatch({ type: 'SET_ADDRESSES', payload: updated });
        setSelectedAddressId(addr.id);
        setIsAddingNewAddress(false);
    }
  };

  const placeOrder = async () => {
    if (!state.user) return alert("Please login");
    if (!selectedAddress) return alert("Select an address");

    setLoading(true);
    const cartTotal = state.cart.reduce((a,b) => a + (b.price * b.quantity), 0);
    const order: Order = {
      id: 'ord_' + Date.now(),
      userId: state.user.id,
      items: [...state.cart],
      totalAmount: cartTotal + deliveryCost,
      deliveryCharge: deliveryCost,
      status: 'Ordered',
      createdAt: new Date().toISOString(),
      shippingAddress: selectedAddress,
      paymentMethod: paymentMethod // Uses state
    };

    await api.createOrder(order);
    dispatch({ type: 'CLEAR_CART' });
    setLoading(false);
    navigate('/profile'); 
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold dark:text-white">Checkout</h1>
      
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10"></div>
        {[1, 2, 3].map(s => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-primary text-black' : 'bg-gray-200 text-gray-500'}`}>
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2"><MapPin size={20}/> Shipping Address</h2>
          
          {isAddingNewAddress ? (
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                <AddressForm 
                    onSave={handleSaveNewAddress} 
                    onCancel={() => {
                        if (state.addresses.length > 0) {
                            setIsAddingNewAddress(false);
                        } else {
                            // If no addresses exist and user cancels, go back to cart/product
                            navigate(-1);
                        }
                    }} 
                />
             </div>
          ) : (
             <div className="space-y-3">
                 {state.addresses.map(addr => (
                     <div 
                        key={addr.id} 
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                     >
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-primary' : 'border-gray-400'}`}>
                                {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                            </div>
                            <span className="font-bold dark:text-white">{addr.fullName}</span>
                            <span className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-0.5 rounded">{addr.country}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 ml-7">
                            {addr.line1}, {addr.area} <br/>
                            {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-sm font-medium ml-7 mt-1">Phone: {addr.phone}</p>
                     </div>
                 ))}

                 <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAddingNewAddress(true)}>
                    <Plus size={16} /> Add New Address
                 </Button>
             </div>
          )}
          
          {selectedAddress && !isAddingNewAddress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex flex-col gap-2 text-sm text-blue-700 dark:text-blue-300 animate-fade-in">
              <div className="flex items-center gap-2">
                  {loading ? <Loader className="animate-spin w-4 h-4"/> : <Truck className="w-4 h-4" />}
                  <span className="font-bold">
                      {loading ? "Calculating delivery..." : deliveryCost === 0 ? "Eligible for Free Delivery!" : `Delivery Charge: ₹${deliveryCost}`}
                  </span>
              </div>
              {!loading && deliveryCost > 0 && (
                  <div className="text-xs ml-6 opacity-80 border-l-2 border-blue-200 dark:border-blue-800 pl-2">
                      <p>Distance from Store: {deliveryDistance} km</p>
                      <p>Formula: Base (₹{state.deliverySettings.baseCharge}) + {deliveryDistance}km × ₹{state.deliverySettings.perKmCharge}/km</p>
                  </div>
              )}
              {!loading && deliveryCost === 0 && (
                  <div className="text-xs ml-6 opacity-80">
                       Free delivery applied (Order above ₹{state.deliverySettings.freeDeliveryAbove})
                  </div>
              )}
            </div>
          )}

          {!isAddingNewAddress && (
              <Button disabled={!selectedAddress} className="w-full mt-4" onClick={() => setStep(2)}>Next: Summary</Button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
           <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
               <AlertTriangle className="flex-shrink-0" />
               <div className="text-sm">
                   <p className="font-bold mb-1">Please confirm your delivery address</p>
                   <p className="mb-2">Your order will be delivered to: <br/> <b>{selectedAddress?.fullName}, {selectedAddress?.line1}, {selectedAddress?.city} - {selectedAddress?.pincode}</b></p>
                   <p className="text-xs opacity-80">Make sure all details (house no, area, phone) are correct to avoid delays.</p>
               </div>
           </div>

           <h2 className="text-xl font-semibold dark:text-white">Order Summary</h2>
           <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
             {state.cart.map(i => (
               <div key={i.id} className="flex justify-between text-sm dark:text-gray-300">
                 <span>{i.quantity} x {i.name}</span>
                 <span>₹{i.price * i.quantity}</span>
               </div>
             ))}
             <div className="border-t pt-2 mt-2 flex justify-between font-bold dark:text-white">
                <span>Delivery</span>
                <span>{deliveryCost === 0 ? 'FREE' : `₹${deliveryCost}`}</span>
             </div>
             <div className="border-t border-black pt-2 flex justify-between font-bold text-lg dark:text-primary">
                <span>Total</span>
                <span>₹{state.cart.reduce((a,b) => a + (b.price * b.quantity), 0) + deliveryCost}</span>
             </div>
           </div>
           <Button className="w-full" onClick={() => setStep(3)}>Next: Payment</Button>
           <button onClick={() => setStep(1)} className="w-full text-center text-gray-500 py-2">Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2"><CreditCard size={20}/> Payment</h2>
          
          {state.deliverySettings.codEnabled && (
              <div 
                onClick={() => setPaymentMethod('COD')}
                className={`border p-4 rounded-lg flex items-center gap-3 bg-white dark:bg-gray-800 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-primary' : 'border-gray-400'}`}>
                    {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </div>
                <div>
                  <p className="font-bold dark:text-white">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay using cash or UPI upon delivery.</p>
                </div>
              </div>
          )}

          <div 
            onClick={() => setPaymentMethod('Online')}
            className={`border p-4 rounded-lg flex items-center gap-3 bg-white dark:bg-gray-800 cursor-pointer transition-all ${paymentMethod === 'Online' ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700'}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Online' ? 'border-primary' : 'border-gray-400'}`}>
                {paymentMethod === 'Online' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
            </div>
            <div>
              <p className="font-bold dark:text-white">Online Payment</p>
              <p className="text-xs text-gray-500">Credit/Debit Card, Netbanking, UPI.</p>
            </div>
          </div>
          
          <div className="text-xs text-center text-gray-400 mt-4">
            By placing this order, you agree to our Terms. No Return Policy applies.
          </div>

          <Button isLoading={loading} className="w-full text-lg" onClick={placeOrder}>
            {paymentMethod === 'COD' ? 'Place Order' : 'Pay Now'}
          </Button>
          <button onClick={() => setStep(2)} className="w-full text-center text-gray-500 py-2">Back</button>
        </div>
      )}
    </div>
  );
};

export const ProfilePage = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isAddingAddr, setIsAddingAddr] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (state.user) {
      loadOrders();
    }
  }, [state.user]);

  const loadOrders = () => {
      if(!state.user) return;
      api.getOrders(false, state.user.id).then(setOrders);
  };

  const handleSaveAddress = async (addr: Address) => {
      if (!state.user) return;
      const finalAddr = { ...addr, id: addr.id || 'addr_' + Date.now() };
      await api.saveAddress(state.user.id, finalAddr);
      const updated = await api.getAddresses(state.user.id);
      dispatch({ type: 'SET_ADDRESSES', payload: updated });
      setEditingAddress(null);
      setIsAddingAddr(false);
  };

  const handleDeleteAddress = async (id: string) => {
      if (!state.user) return;
      if (confirm("Delete this address?")) {
          await api.deleteAddress(state.user.id, id);
          const updated = await api.getAddresses(state.user.id);
          dispatch({ type: 'SET_ADDRESSES', payload: updated });
      }
  };

  const handleSubmitInlineReview = async (pid: string, rating: number, comment: string) => {
      if (!state.user) return;
      const review: Review = {
          id: 'rev_' + Date.now(),
          productId: pid,
          userId: state.user.id,
          userName: state.user.name,
          userPhoto: state.user.photoURL,
          rating: rating,
          comment: comment,
          images: [],
          createdAt: new Date().toISOString(),
          verifiedPurchase: true,
          likes: 0
      };
      await api.addReview(review);
  };

  // Sort Addresses: Default first
  const sortedAddresses = useMemo(() => {
      return [...state.addresses].sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
  }, [state.addresses]);

  // Wishlist Items
  const wishlistItems = useMemo(() => {
      return state.products.filter(p => state.wishlist.includes(p.id));
  }, [state.products, state.wishlist]);

  if (!state.user) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 p-6 text-center">
      <div className="bg-primary/20 p-4 rounded-full mb-2">
         <Smartphone size={40} className="text-primary-dark"/>
      </div>
      <h2 className="text-xl font-bold dark:text-white">Welcome to OnlineMart</h2>
      <p className="text-gray-500 text-sm mb-4">Login to view orders, manage addresses, and get personalized recommendations.</p>
      <Button onClick={() => navigate('/')}>Start Shopping</Button>
    </div>
  );

  return (
    <div className="p-4 pb-20 space-y-6">
      <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onRefresh={loadOrders}
          onSubmitReview={handleSubmitInlineReview}
      />

      <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-xl">
        <img src={state.user.photoURL} className="w-16 h-16 rounded-full" alt="Profile" />
        <div>
          <h1 className="text-xl font-bold dark:text-white">{state.user.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{state.user.email}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
            {state.darkMode ? <Moon className="text-blue-400" /> : <Sun className="text-orange-500" />}
            <span className="font-medium dark:text-white">Dark Mode</span>
        </div>
        <button 
            onClick={() => dispatch({type: 'TOGGLE_THEME'})}
            className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${state.darkMode ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
        >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
        </button>
      </div>

      {/* Wishlist Section */}
      <div className="space-y-4">
          <h2 className="font-bold text-lg dark:text-white">My Wishlist ({wishlistItems.length})</h2>
          {wishlistItems.length === 0 ? (
              <p className="text-gray-500 text-sm">Your wishlist is empty.</p>
          ) : (
              <div className="grid grid-cols-2 gap-4">
                  {wishlistItems.map(p => (
                      <ProductCard 
                          key={p.id}
                          product={p}
                          isWishlisted={true}
                          onToggleWishlist={() => dispatch({type: 'TOGGLE_WISHLIST', payload: p.id})}
                          onAdd={() => dispatch({type: 'ADD_TO_CART', payload: p})}
                          onClick={() => navigate(`/product/${p.id}`)}
                      />
                  ))}
              </div>
          )}
      </div>

      {/* Address Book */}
      <div className="space-y-4">
         <div className="flex justify-between items-center">
             <h2 className="font-bold text-lg dark:text-white">My Addresses</h2>
             {!isAddingAddr && !editingAddress && (
                 <Button size="sm" variant="outline" onClick={() => setIsAddingAddr(true)}>Add New</Button>
             )}
         </div>

         {isAddingAddr && (
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                 <AddressForm onSave={handleSaveAddress} onCancel={() => setIsAddingAddr(false)} />
             </div>
         )}
         
         {editingAddress && (
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                 <AddressForm initialData={editingAddress} onSave={handleSaveAddress} onCancel={() => setEditingAddress(null)} />
             </div>
         )}

         {!isAddingAddr && !editingAddress && (
             <div className="space-y-3">
                 {sortedAddresses.length === 0 && <p className="text-gray-500 text-sm">No saved addresses.</p>}
                 {sortedAddresses.map(addr => (
                     <div key={addr.id} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border relative group ${addr.isDefault ? 'border-primary' : 'border-gray-100 dark:border-gray-700'}`}>
                         <div className="flex justify-between items-start">
                             <div>
                                 <p className="font-bold dark:text-white flex items-center gap-2">
                                     {addr.fullName} 
                                     {addr.isDefault && <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">Default</span>}
                                 </p>
                                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{addr.line1}, {addr.area}, {addr.city} - {addr.pincode}</p>
                                 <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">Ph: {addr.phone}</p>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => setEditingAddress(addr)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-blue-600"><Edit2 size={16}/></button>
                                 <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-red-600"><Trash2 size={16}/></button>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-lg dark:text-white">My Orders</h2>
        {orders.length === 0 ? <p className="text-gray-500">No past orders.</p> : (
          <div className="space-y-3">
             {orders.map(order => (
               <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform cursor-pointer"
               >
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="text-lg font-bold dark:text-white line-clamp-1 flex-1 mr-4">{order.items[0].name} {order.items.length > 1 && `+ ${order.items.length - 1} more`}</h3>
                   <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</span>
                 </div>
                 
                 <div className="flex justify-between items-center mt-2">
                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                         order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                         order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                         'bg-yellow-100 text-yellow-800'
                     }`}>
                         {order.status}
                     </span>
                     <div className="flex items-center text-primary text-sm font-semibold gap-1">
                         View Details <ArrowRight size={14}/>
                     </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
      
      <Button variant="outline" className="w-full text-red-500 border-red-200" onClick={() => dispatch({type: 'LOGOUT'})}>
        Logout
      </Button>
    </div>
  );
};
