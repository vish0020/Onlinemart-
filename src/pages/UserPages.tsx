
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Share2, Star, ShoppingBag, MapPin, Truck, CreditCard, 
  CheckCircle, Search, Mic, Loader, Moon, Sun, 
  Smartphone, Shirt, Home, Sparkles, Gamepad2, Gift, 
  ShoppingBasket, Wrench, Dumbbell, BookOpen, Zap, 
  Briefcase, Coffee, Watch, PenTool, PawPrint, MessageSquare, ThumbsUp, Camera, X, Edit2, Trash2, Plus, Minus, Heart, AlertTriangle, Clock, ArrowRight, RotateCcw, MoveHorizontal, Maximize, PlayCircle, LayoutDashboard, UserCog, ShieldCheck, LogOut, Laptop, Tv, Car, Smile, TrendingUp, Award, Flame, ShoppingCart, ChevronDown, ChevronUp, Copy, QrCode, Check, Timer, Download, QrCode as QrIcon, Package, XCircle, ArrowLeft, ClipboardList, PenLine, Hand, MousePointer2, User
} from 'lucide-react';
import { Product, CartItem, Order, DeliverySettings, Review, Address, PaymentSettings } from '../types';
import { Button, Input, ProductCard, Skeleton, ProductSkeleton, AddressForm, Logo } from '../components/Shared';
import { api, CATEGORY_DATA } from '../services/mockService';
import { useAppContext } from '../Context';
import { DEFAULT_PAYMENT_SETTINGS } from '../constants';

// --- CATEGORY ICONS ---
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Electronics": <Zap />,
  "Mobiles & Accessories": <Smartphone />,
  "Computers & Laptops": <Laptop />,
  "Home Appliances": <Tv />,
  "Fashion": <Shirt />,
  "Beauty & Personal Care": <Sparkles />,
  "Grocery & Essentials": <ShoppingBasket />,
  "Furniture": <Home />, 
  "Home & Kitchen": <Coffee />, 
  "Sports & Fitness": <Dumbbell />,
  "Toys, Baby & Kids": <Gamepad2 />,
  "Books & Stationery": <BookOpen />,
  "Automotive": <Car />,
  "Jewellery": <Watch />, 
  "Footwear": <ShoppingBag />, 
  "Bags, Luggage & Travel": <Briefcase />,
  "Pet Supplies": <PawPrint />,
  "Tools & Industrial": <Wrench />,
  "Health & Wellness": <Heart />,
  "Home Decor": <Home />
};

// --- Helper Functions ---
const generateRepeatedList = (sourceList: Product[]): Product[] => {
  if (!sourceList || sourceList.length === 0) return [];
  if (sourceList.length > 5) return sourceList;
  return [...sourceList, ...sourceList];
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
const SectionHeader = ({ title, icon: Icon, onSeeAll }: { title: string, icon?: any, onSeeAll?: () => void }) => (
  <div className="flex justify-between items-center mb-4 px-4">
    <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
      {Icon && <Icon size={20} className="text-primary" />}
      {title}
    </h2>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="text-primary text-sm font-semibold active:opacity-50 hover:underline transition-all"
      >
        See All
      </button>
    )}
  </div>
);

const Accordion: React.FC<{ title: string, children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left font-bold text-base dark:text-white group"
      >
        {title}
        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400 group-hover:text-primary transition-colors" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

const RatingBar: React.FC<{ star: number, count: number, total: number }> = ({ star, count, total }) => {
    const percentage = total === 0 ? 0 : (count / total) * 100;
    return (
        <div className="flex items-center gap-3 text-xs mb-1">
            <div className="w-4 font-bold flex items-center">{star} <Star size={8} className="fill-gray-400 text-gray-400 ml-0.5"/></div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="w-8 text-right text-gray-500">{Math.round(percentage)}%</div>
        </div>
    );
};

const HorizontalProductList = ({ products, onProductClick, onAdd, wishlist, onToggleWishlist }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToStart = () => {
      if (scrollRef.current) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
  };

  if (!products || products.length === 0) return null;

  return (
    <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4 items-stretch scroll-smooth">
      {products.map((product: Product, index: number) => (
        <div key={`${product.id}-${index}`} className="min-w-[160px] w-[160px] flex-shrink-0 animate-scale-up" style={{ animationDelay: `${index * 0.05}s` }}>
          <ProductCard 
              product={product} 
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={() => onToggleWishlist(product.id)}
              onAdd={() => onAdd(product)}
              onClick={() => onProductClick(product)}
          />
        </div>
      ))}
      <div 
        className="min-w-[120px] w-[120px] flex-shrink-0 flex flex-col items-center justify-center cursor-pointer group rounded-xl glass-card hover:border-primary transition-all animate-scale-up border-2 border-dashed border-gray-200 dark:border-gray-700" 
        onClick={scrollToStart}
      >
           <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
               <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
           </div>
           <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-3 group-hover:text-primary transition-colors text-center px-2">Go Back</span>
      </div>
    </div>
  );
};

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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="glass-card bg-white/95 dark:bg-gray-800/95 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-slide-up">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:rotate-90 transition-transform"><X /></button>
            <h2 className="text-xl font-bold dark:text-white mb-2">Rate Product</h2>
            <p className="text-sm text-gray-500 mb-4">{product.name}</p>
            
            <div className="flex justify-center mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
               <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110 hover:-translate-y-1">
                        <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'text-gray-300'}`} />
                    </button>
                ))}
               </div>
            </div>
            
            <textarea 
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary dark:text-white resize-none h-24 mb-4 transition-shadow"
                placeholder="Write your review here..."
                value={comment}
                onChange={e => setComment(e.target.value)}
            ></textarea>

            <Button onClick={submit} className="w-full">Submit Review</Button>
        </div>
    </div>
  );
};

// --- Gesture Handled Image Gallery (1071x1489 PIXEL ASPECT RATIO) ---
const ImageGallery = ({ images, alt }: { images: string[], alt: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [scale, setScale] = useState(1);
    
    // Zoom Logic
    const touchStartDist = useRef<number>(0);
    const startScale = useRef<number>(1);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartDist.current = dist;
            startScale.current = scale;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault(); // Prevent standard scroll while zooming
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const ratio = dist / touchStartDist.current;
            const newScale = Math.min(Math.max(1, startScale.current * ratio), 4); // Limit zoom 1x to 4x
            setScale(newScale);
        }
    };

    const handleTouchEnd = () => {
        if (scale < 1.1) setScale(1); // Snap back if slightly zoomed out or minimal
    };

    const handleScroll = () => {
        if (containerRef.current) {
            const scrollLeft = containerRef.current.scrollLeft;
            const width = containerRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setActiveIndex(index);
            // Reset scale on scroll
            if(scale !== 1) setScale(1);
        }
    };

    return (
        <div 
            className="relative w-full bg-white dark:bg-gray-800 overflow-hidden group"
            style={{ aspectRatio: '1071 / 1489' }}
        >
            <div 
                ref={containerRef}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x"
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {images.map((img, idx) => (
                    <div key={idx} className="min-w-full h-full snap-center flex items-center justify-center relative">
                        <img 
                            src={img} 
                            alt={`${alt} - ${idx}`} 
                            className="w-full h-full object-cover transition-transform duration-100 ease-out"
                            style={{ 
                                transform: activeIndex === idx ? `scale(${scale})` : 'scale(1)',
                                cursor: 'grab' 
                            }}
                        />
                    </div>
                ))}
            </div>
            
            {/* Dots */}
            {images.length > 1 && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-2 z-10 glass px-2 py-1 rounded-full">
                    {images.map((_, idx) => (
                        <div 
                           key={idx} 
                           className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex ? 'bg-primary w-4' : 'bg-gray-400'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ... [Rest of components like OrderDetailsModal, HomePage remain unchanged] ...
const OrderDetailsModal = ({ order, onClose, onRefresh, onSubmitReview }: { order: Order | null, onClose: () => void, onRefresh: () => void, onSubmitReview: (pid: string, rating: number, comment: string) => Promise<void> }) => {
    // ... [Content kept exactly as previously implemented]
    const { showToast } = useAppContext();
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelInput, setShowCancelInput] = useState(false);
    const [reviewInput, setReviewInput] = useState<{id: string, rating: number, comment: string} | null>(null);

    if (!order) return null;

    const steps = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStepIndex = steps.indexOf(order.status);
    const isCancelled = order.status === 'Cancelled';
    
    let progress = 0;
    if (!isCancelled) {
        progress = Math.max(0, Math.min(100, (currentStepIndex / (steps.length - 1)) * 100));
    }

    const handleCancelRequest = () => {
        if(!cancelReason.trim()) {
            showToast("Please provide a reason", "error");
            return;
        }
        api.requestOrderCancellation(order.id, cancelReason);
        setShowCancelInput(false);
        onRefresh();
        showToast("Cancellation requested successfully", "success");
    };

    const submitItemReview = async () => {
        if (reviewInput) {
            await onSubmitReview(reviewInput.id, reviewInput.rating, reviewInput.comment);
            setReviewInput(null);
            showToast("Review submitted!", "success");
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Delivered': return 'text-green-600 bg-green-50 border-green-200';
            case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200';
            case 'Shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Out for Delivery': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    const downloadInvoice = () => {
        showToast("Downloading Invoice...", "success");
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-card bg-white/95 dark:bg-gray-900/95 w-full max-w-3xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-up flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10 flex justify-between items-center rounded-t-2xl backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            Order Details
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>{order.status}</span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">ID: #{order.id} • {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X/></button>
                </div>
                <div className="p-4 sm:p-6 space-y-8">
                    {!isCancelled ? (
                        <div className="relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full -z-0"></div>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full transition-all duration-700 z-0" style={{ width: `${progress}%` }}></div>
                            <div className="flex justify-between relative z-10">
                                {steps.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;
                                    return (
                                        <div key={step} className="flex flex-col items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-300'}`}>
                                                {isCompleted ? <Check size={16} strokeWidth={3}/> : <div className="w-2 h-2 rounded-full bg-gray-300"/>}
                                            </div>
                                            <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${isCurrent ? 'text-green-600 font-bold' : 'text-gray-500'}`}>{step}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="sm:hidden text-center mt-4">
                                <p className="text-sm font-bold text-green-600">{order.status}</p>
                                <p className="text-xs text-gray-500">{currentStepIndex < steps.length - 1 ? `Next: ${steps[currentStepIndex + 1]}` : 'Package delivered'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-4 text-red-700 dark:text-red-300">
                            <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full"><XCircle size={24}/></div>
                            <div>
                                <h4 className="font-bold text-lg">Order Cancelled</h4>
                                <p className="text-sm opacity-80">{order.cancelRequest?.reason ? `Reason: ${order.cancelRequest.reason}` : 'This order was cancelled.'}</p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-xl shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><MapPin size={18} className="text-primary"/> Delivery Address</h3>
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <p className="font-bold text-base dark:text-white">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.line1}</p>
                                <p>{order.shippingAddress.area}, {order.shippingAddress.landmark}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                <p className="mt-2 font-medium">Phone: {order.shippingAddress.phone}</p>
                            </div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><CreditCard size={18} className="text-primary"/> Payment Information</h3>
                                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    <div className="flex justify-between"><span>Payment Method</span><span className="font-medium dark:text-white">{order.paymentMethod === 'Online' ? 'UPI / Online' : 'Cash on Delivery'}</span></div>
                                    <div className="flex justify-between"><span>Payment Status</span><span className={`font-bold ${order.paymentDetails?.verifiedAmount ? 'text-green-600' : 'text-gray-600'}`}>{order.paymentDetails?.verifiedAmount ? 'Completed' : 'Pending'}</span></div>
                                    {order.paymentDetails?.upiId && <div className="flex justify-between"><span>UPI ID</span><span className="font-mono text-xs">{order.paymentDetails.upiId}</span></div>}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={downloadInvoice} className="mt-4 w-full"><Download size={16}/> Download Invoice</Button>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Package size={18} className="text-primary"/> Order Items</h3>
                        <div className="space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50">
                                    <div className="w-20 h-20 bg-white rounded-lg p-2 border dark:border-gray-700 flex-shrink-0">
                                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain"/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{item.category} • Qty: {item.quantity}</p>
                                        <p className="font-bold text-lg dark:text-white">₹{item.price}</p>
                                    </div>
                                    {order.status === 'Delivered' && (
                                        <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                            {reviewInput?.id === item.id ? (
                                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 w-full sm:w-64 animate-fade-in">
                                                    <div className="flex gap-1 mb-2 justify-center">
                                                        {[1,2,3,4,5].map(s => (
                                                            <Star key={s} size={20} className={`${s <= reviewInput.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} onClick={() => setReviewInput({...reviewInput, rating: s})} />
                                                        ))}
                                                    </div>
                                                    <input className="w-full text-xs p-2 border rounded mb-2 dark:bg-gray-700 dark:text-white" placeholder="Comment..." value={reviewInput.comment} onChange={e => setReviewInput({...reviewInput, comment: e.target.value})} />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={submitItemReview} className="flex-1 text-xs">Submit</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setReviewInput(null)} className="flex-1 text-xs">Cancel</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => setReviewInput({id: item.id, rating: 5, comment: ''})} className="w-full sm:w-auto"><Star size={16}/> Write Review</Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-xl shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between dark:text-gray-300"><span>Item Total</span><span>₹{order.totalAmount - order.deliveryCharge}</span></div>
                            <div className="flex justify-between dark:text-gray-300"><span>Delivery Charge</span><span className="text-green-600 font-medium">{order.deliveryCharge === 0 ? 'FREE' : `+ ₹${order.deliveryCharge}`}</span></div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg dark:text-white mt-2"><span>Grand Total</span><span>₹{order.totalAmount}</span></div>
                        </div>
                    </div>
                    {!isCancelled && order.status !== 'Delivered' && order.status !== 'Out for Delivery' && !order.cancelRequest && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                             {!showCancelInput ? (
                                 <button onClick={() => setShowCancelInput(true)} className="text-red-500 font-semibold text-sm hover:underline">Cancel this order</button>
                             ) : (
                                 <div className="space-y-3 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-800 animate-slide-up">
                                     <h4 className="font-bold text-red-700 dark:text-red-300 text-sm">Request Cancellation</h4>
                                     <textarea className="w-full p-3 text-sm border border-red-200 rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-red-500" placeholder="Please tell us why you want to cancel..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3}></textarea>
                                     <div className="flex gap-3">
                                        <Button size="sm" onClick={handleCancelRequest} className="bg-red-600 hover:bg-red-700 text-white">Confirm Cancellation</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowCancelInput(false)} className="text-gray-600">Dismiss</Button>
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}
                     {order.cancelRequest && order.status !== 'Cancelled' && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm font-medium border border-yellow-200 dark:border-yellow-800">
                            Cancellation request is pending approval.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const HomePage = () => {
    // ... [HomePage Implementation remains unchanged]
    const { state, dispatch, setShowLoginModal, showToast } = useAppContext();
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
      showToast("Thanks for your review!", "success");
    };
  
    const availableCategories = useMemo(() => Object.keys(CATEGORY_DATA), []);
  
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

    const newArrivals = useMemo(() => state.products.slice(-8).reverse(), [state.products]);
    const topRated = useMemo(() => state.products.filter(p => p.rating >= 4.0).sort((a,b) => b.rating - a.rating).slice(0, 8), [state.products]);
    const bestSellers = useMemo(() => state.products.filter(p => p.reviewCount > 0).sort((a,b) => b.reviewCount - a.reviewCount).slice(0, 8), [state.products]);
  
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
        const exists = state.wishlist.includes(id);
        showToast(exists ? "Removed from Wishlist" : "Added to Wishlist", "info");
    };

    const handleAddToCart = (product: Product) => {
        if (!state.user) {
            setShowLoginModal(true);
            return;
        }
        dispatch({ type: 'ADD_TO_CART', payload: product });
        showToast("Added to Cart", "success");
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
        {!state.searchQuery && visibleBanners.length > 0 && (
            <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-gray-200 rounded-b-xl md:rounded-3xl md:mx-0 overflow-hidden shadow-md mx-0 group animate-slide-up">
                <div 
                    className="flex h-full transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
                >
                    {visibleBanners.map(banner => (
                        <div key={banner.id} className="min-w-full h-full relative">
                             <img src={banner.imageUrl} className="w-full h-full object-cover" alt={banner.title} />
                             <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center px-4 md:px-12">
                                <div className="w-3/4 md:w-1/2 text-white animate-slide-in-right">
                                    <h1 className="text-xl md:text-5xl font-extrabold mb-1 md:mb-2 leading-tight drop-shadow-md">
                                        {banner.title}
                                    </h1>
                                    <p className="text-xs md:text-xl mb-3 md:mb-4 font-medium text-gray-200 line-clamp-2">{banner.subtitle}</p>
                                    <Button variant="primary" onClick={() => dispatch({type: 'SET_SEARCH', payload: banner.link})} className="text-xs md:text-base py-1.5 md:py-2 px-4 md:px-6 shadow-lg hover:scale-105 transition-transform">
                                        Shop Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
        )}

        {/* Categories (Only show if no search query) */}
        {!state.searchQuery && (
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <SectionHeader 
                title="Categories" 
                onSeeAll={() => dispatch({ type: 'SET_SEARCH', payload: '' })} 
            />
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                {availableCategories.map((cat, index) => {
                const isActive = state.searchQuery === cat;
                return (
                    <div key={cat} onClick={() => handleCategoryClick(cat)} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group select-none animate-scale-up" style={{ animationDelay: `${index * 0.03}s` }}>
                    <div className={`w-16 h-16 rounded-full border border-white/20 glass flex items-center justify-center shadow-sm transition-all duration-300 ${isActive ? 'bg-primary border-primary scale-110' : 'bg-white/40 dark:bg-gray-800/40 group-hover:border-primary group-hover:-translate-y-1'}`}>
                        <div className={`transition-colors duration-300 ${isActive ? 'text-black' : 'text-primary'}`}>
                            {CATEGORY_ICONS[cat] || <ShoppingBag />}
                        </div>
                    </div>
                    <span className={`text-xs font-medium w-20 text-center truncate transition-colors ${isActive ? 'text-primary font-bold' : 'dark:text-gray-300'}`}>{cat}</span>
                    </div>
                );
                })}
            </div>
            </div>
        )}
  
        {/* Recommended / Search Results */}
        <div id="products" className="px-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-bold text-lg dark:text-white mb-4">
            {state.searchQuery 
              ? `Results for "${state.searchQuery}"` 
              : 'Recommended for You'}
          </h2>
           {state.searchQuery && (
               <div className="flex items-center gap-2 mb-4 animate-fade-in">
                    <button 
                        onClick={() => dispatch({type: 'SET_SEARCH', payload: ''})}
                        className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-white transition-colors"
                    >
                        Clear Search <X size={14}/>
                    </button>
               </div>
           )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedProducts.map((product, index) => (
                  <div key={product.id} className="animate-scale-up" style={{ animationDelay: `${index * 0.05}s` }}>
                      <ProductCard 
                        product={product} 
                        isWishlisted={state.wishlist.includes(product.id)}
                        onToggleWishlist={() => handleToggleWishlist(product.id)}
                        onAdd={() => handleAddToCart(product)}
                        onClick={() => handleProductClick(product)}
                      />
                  </div>
                ))
            }
          </div>
          {displayedProducts.length === 0 && (
             <div className="text-center py-10 text-gray-500 animate-fade-in">
                 <Search size={48} className="mx-auto mb-2 opacity-20"/>
                 <p>No products found matching your criteria.</p>
                 <Button variant="ghost" className="mt-2 text-primary" onClick={() => dispatch({type: 'SET_SEARCH', payload: ''})}>See all products</Button>
             </div>
          )}
        </div>
  
        {/* New Sections */}
        {!state.searchQuery && (
          <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {bestSellers.length > 0 && (
                  <div>
                      <SectionHeader title="Top Selling" icon={TrendingUp} />
                      <HorizontalProductList 
                          products={bestSellers}
                          onProductClick={handleProductClick}
                          onAdd={handleAddToCart}
                          wishlist={state.wishlist}
                          onToggleWishlist={handleToggleWishlist}
                      />
                  </div>
              )}
              {newArrivals.length > 0 && (
                  <div>
                      <SectionHeader title="New Arrivals" icon={Sparkles} />
                      <HorizontalProductList 
                          products={newArrivals}
                          onProductClick={handleProductClick}
                          onAdd={handleAddToCart}
                          wishlist={state.wishlist}
                          onToggleWishlist={handleToggleWishlist}
                      />
                  </div>
              )}
              {topRated.length > 0 && (
                  <div>
                      <SectionHeader title="Top Rated" icon={Award} />
                      <HorizontalProductList 
                          products={topRated}
                          onProductClick={handleProductClick}
                          onAdd={handleAddToCart}
                          wishlist={state.wishlist}
                          onToggleWishlist={handleToggleWishlist}
                      />
                  </div>
              )}
          </div>
        )}
      </div>
    );
};

export const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, dispatch, showToast, setShowLoginModal } = useAppContext();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setLoading(true);
            let p = state.products.find(p => p.id === id);
            if (!p) {
                const all = await api.getProducts();
                p = all.find(item => item.id === id);
            }
            if (p) {
                setProduct(p);
                const revs = await api.getReviews(p.id);
                setReviews(revs);
                
                // Tutorial Logic
                const hasSeenTutorial = localStorage.getItem('om_pdp_tutorial');
                if (!hasSeenTutorial) {
                    setShowTutorial(true);
                }
            }
            setLoading(false);
        };
        load();
        window.scrollTo(0,0);
    }, [id, state.products]);

    const closeTutorial = () => {
        localStorage.setItem('om_pdp_tutorial', 'true');
        setShowTutorial(false);
    };

    const handleAddToCart = () => {
        if (!product) return;
        if (!state.user) { setShowLoginModal(true); return; }
        dispatch({ type: 'ADD_TO_CART', payload: product });
        showToast("Added to Cart", "success");
    };

    const handleBuyNow = () => {
        if (!product) return;
        if (!state.user) { setShowLoginModal(true); return; }
        dispatch({ type: 'ADD_TO_CART', payload: product });
        navigate('/cart');
    };

    const handleToggleWishlist = (id: string) => {
        if (!state.user) { setShowLoginModal(true); return; }
        dispatch({ type: 'TOGGLE_WISHLIST', payload: id });
        const exists = state.wishlist.includes(id);
        showToast(exists ? "Removed from Wishlist" : "Added to Wishlist", "info");
    };

    const handleWishlist = () => {
        if (product) handleToggleWishlist(product.id);
    };

    const handleReviewSubmit = async (reviewData: any) => {
        if (!state.user || !product) return;
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
        setReviews([review, ...reviews]);
        showToast("Review submitted!", "success");
    };

    const topSelling = useMemo(() => state.products.filter(p => p.reviewCount > 0).sort((a,b) => b.reviewCount - a.reviewCount).slice(0, 8), [state.products]);
    const newArrivals = useMemo(() => state.products.slice(-8).reverse(), [state.products]);
    const topRated = useMemo(() => state.products.filter(p => p.rating >= 4.0).sort((a,b) => b.rating - a.rating).slice(0, 8), [state.products]);

    const handleProductClick = (product: Product) => {
        navigate(`/product/${product.id}`);
    };

    const scrollToReviews = () => {
        const reviewsSection = document.getElementById('reviews-section');
        if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleCategoryClick = (cat: string) => {
        dispatch({ type: 'SET_SEARCH', payload: cat });
        navigate('/');
    };

    if (loading) return <div className="p-8"><ProductSkeleton /><div className="mt-4 space-y-2"><Skeleton className="h-6 w-full"/><Skeleton className="h-20 w-full"/></div></div>;
    if (!product) return <div className="p-8 text-center text-gray-500">Product not found. <Button variant="ghost" onClick={() => navigate('/')}>Go Home</Button></div>;

    // Calculate rating counts
    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
            ratingCounts[5 - r.rating]++;
        }
    });

    return (
        <div className="pb-24 min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in relative">
             <ReviewModal 
                isOpen={showReviewModal} 
                onClose={() => setShowReviewModal(false)} 
                product={product} 
                onSubmit={handleReviewSubmit}
             />

             {/* Tutorial Overlay */}
             {showTutorial && (
                 <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-white text-center animate-fade-in cursor-pointer" onClick={closeTutorial}>
                     <div className="space-y-12 max-w-sm pointer-events-none">
                         <div className="flex flex-col items-center gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                             <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-bounce-slow">
                                 <Hand size={32} className="rotate-45" />
                             </div>
                             <p className="font-bold text-lg">Swipe Left/Right</p>
                             <p className="text-sm opacity-80">Browse product images</p>
                         </div>
                         <div className="flex flex-col items-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                             <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                 <div className="flex gap-1 animate-pulse">
                                     <MousePointer2 size={24} className="-rotate-12 translate-y-1"/>
                                     <MousePointer2 size={24} className="rotate-12 -translate-y-1"/>
                                 </div>
                             </div>
                             <p className="font-bold text-lg">Pinch with 2 Fingers</p>
                             <p className="text-sm opacity-80">Zoom into details</p>
                         </div>
                     </div>
                     <p className="mt-12 text-sm opacity-50 animate-pulse">Tap anywhere to close</p>
                 </div>
             )}

             <div className="max-w-4xl mx-auto relative">
                 
                 {/* Breadcrumbs Bar (Above Image, Single Line, Clickable) */}
                 <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 overflow-x-auto whitespace-nowrap border-b border-gray-100 dark:border-gray-700 shadow-sm sticky top-16 z-30">
                    <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors flex-shrink-0"><Home size={12} /> Home</Link>
                    <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                    <span onClick={() => handleCategoryClick(product.category)} className="hover:text-primary transition-colors cursor-pointer flex-shrink-0">{product.category}</span>
                    {product.subcategory && (
                        <>
                            <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                            <span onClick={() => handleCategoryClick(product.subcategory!)} className="hover:text-primary transition-colors cursor-pointer flex-shrink-0">{product.subcategory}</span>
                        </>
                    )}
                    <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white font-bold truncate max-w-[150px]">{product.name}</span>
                 </div>

                 {/* Image Section - 1071x1489 Aspect Ratio */}
                 <ImageGallery images={product.images} alt={product.name} />

                 {/* Product Info Card with Reflection Shadow & Glassmorphism */}
                 <div className="p-6 bg-white/75 dark:bg-gray-900/75 backdrop-blur-2xl rounded-t-[2.5rem] -mt-24 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] border-t border-white/30">
                     {/* Title & Actions Row */}
                     <div className="flex justify-between items-start mb-2 gap-4">
                         <h1 className="text-2xl font-extrabold dark:text-white leading-tight">{product.name}</h1>
                         <div className="flex gap-3 shrink-0 pt-1">
                            <button onClick={handleWishlist} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <Heart className={`w-6 h-6 ${state.wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-300'}`} />
                            </button>
                            <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-500 dark:text-gray-300">
                                <Share2 size={24} />
                            </button>
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-2 mb-4">
                         <span className="flex items-center gap-1 bg-green-700 text-white text-xs font-bold px-2 py-1 rounded">
                             {product.rating} <Star size={10} fill="currentColor"/>
                         </span>
                         {/* Clickable Reviews Link */}
                         <button onClick={scrollToReviews} className="text-sm text-gray-500 underline decoration-gray-400 hover:text-primary hover:decoration-primary transition-colors cursor-pointer">
                             {product.reviewCount} Reviews
                         </button>
                     </div>

                     {/* Price */}
                     <div className="flex items-end gap-3 mb-1">
                         <span className="text-3xl font-extrabold text-black dark:text-white">₹{product.price}</span>
                         {product.originalPrice && <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}</span>}
                         {product.originalPrice && <span className="text-green-600 font-bold text-lg">{Math.round(((product.originalPrice - product.price)/product.originalPrice)*100)}% off</span>}
                     </div>
                     
                     {/* Stock Warning */}
                     {product.stock > 0 && product.stock < 10 && (
                         <p className="text-sm text-red-500 font-bold mb-4">Only {product.stock} left in stock!</p>
                     )}
                     {product.stock === 0 && (
                         <p className="text-sm text-red-500 font-bold mb-4">Out of Stock</p>
                     )}

                     {/* Action Buttons */}
                     <div className="flex flex-col gap-3 my-6">
                         <Button onClick={handleBuyNow} className="w-full py-4 text-base bg-primary text-black hover:bg-primary-dark font-bold shadow-none" disabled={product.stock === 0}>
                             Buy Now
                         </Button>
                         <Button onClick={handleAddToCart} variant="secondary" className="w-full py-4 text-base font-bold shadow-none" disabled={product.stock === 0}>
                             Add to Cart
                         </Button>
                     </div>

                     {/* Accordions */}
                     <div className="space-y-1">
                         <Accordion title="Description" defaultOpen={true}>
                             {product.description}
                         </Accordion>
                         <Accordion title="Features & Specifications">
                             {product.features ? (
                                 <p>{product.features}</p>
                             ) : (
                                 <ul className="list-disc pl-5 space-y-1">
                                     {product.attributes && Object.entries(product.attributes).map(([key, val]) => (
                                         <li key={key}><span className="font-bold">{key}:</span> {String(val)}</li>
                                     ))}
                                     <li>Category: {product.category}</li>
                                 </ul>
                             )}
                         </Accordion>
                     </div>
                 </div>

                 {/* Explore More Sections */}
                 <div className="py-6 space-y-8 bg-gray-50 dark:bg-gray-900">
                     <div className="pl-0">
                         <h3 className="font-bold text-xl px-4 mb-4 dark:text-white">Explore More</h3>
                         
                         <div className="mb-6">
                             <div className="flex items-center gap-2 px-4 mb-3 text-yellow-600 font-bold">
                                 <TrendingUp size={20}/> Top Selling
                             </div>
                             <HorizontalProductList 
                                products={topSelling} 
                                onProductClick={handleProductClick}
                                onAdd={handleAddToCart}
                                wishlist={state.wishlist}
                                onToggleWishlist={handleToggleWishlist}
                             />
                         </div>

                         <div className="mb-6">
                             <div className="flex items-center gap-2 px-4 mb-3 text-orange-500 font-bold">
                                 <Flame size={20}/> New Arrivals
                             </div>
                             <HorizontalProductList 
                                products={newArrivals} 
                                onProductClick={handleProductClick}
                                onAdd={handleAddToCart}
                                wishlist={state.wishlist}
                                onToggleWishlist={handleToggleWishlist}
                             />
                         </div>

                         <div className="mb-6">
                             <div className="flex items-center gap-2 px-4 mb-3 text-yellow-500 font-bold">
                                 <Award size={20}/> Top Rated
                             </div>
                             <HorizontalProductList 
                                products={topRated} 
                                onProductClick={handleProductClick}
                                onAdd={handleAddToCart}
                                wishlist={state.wishlist}
                                onToggleWishlist={handleToggleWishlist}
                             />
                         </div>
                     </div>
                 </div>

                 {/* Customer Reviews - Added ID for scrolling */}
                 <div id="reviews-section" className="p-4 bg-white dark:bg-gray-800 pb-10">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-xl dark:text-white">Customer Reviews</h3>
                         <Button size="sm" onClick={() => { if(!state.user) { setShowLoginModal(true); return; } setShowReviewModal(true); }} className="gap-2 text-xs">
                             <PenLine size={14}/> Write a Review
                         </Button>
                     </div>

                     <div className="flex items-center gap-8 mb-8">
                         <div className="text-center">
                             <div className="text-5xl font-bold dark:text-white mb-1">{product.rating.toFixed(1)}</div>
                             <div className="flex justify-center text-yellow-400 mb-1">
                                 {[1,2,3,4,5].map(s => (
                                     <Star key={s} size={16} className={s <= Math.round(product.rating) ? "fill-current" : "text-gray-300"} />
                                 ))}
                             </div>
                             <p className="text-xs text-gray-500">{product.reviewCount} Ratings</p>
                         </div>
                         <div className="flex-1">
                             {[5, 4, 3, 2, 1].map((star, idx) => (
                                 <RatingBar key={star} star={star} count={ratingCounts[idx]} total={reviews.length} />
                             ))}
                         </div>
                     </div>

                     {reviews.length > 0 ? (
                         <div className="space-y-6">
                             {reviews.slice(0, 3).map(rev => (
                                 <div key={rev.id} className="border-b dark:border-gray-700 pb-4 last:border-0">
                                     <div className="flex items-center gap-2 mb-2">
                                         <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xs">
                                             {rev.userPhoto ? <img src={rev.userPhoto} className="w-full h-full rounded-full object-cover"/> : rev.userName[0]}
                                         </div>
                                         <div className="flex-1">
                                             <p className="text-sm font-bold dark:text-white">{rev.userName}</p>
                                             <div className="flex items-center gap-2">
                                                 <div className="flex text-yellow-400">
                                                     {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= rev.rating ? "fill-current" : "text-gray-300"} />)}
                                                 </div>
                                                 {rev.verifiedPurchase && <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle size={10}/> Verified</span>}
                                             </div>
                                         </div>
                                         <span className="text-xs text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                     </div>
                                     <p className="text-sm text-gray-600 dark:text-gray-300 pl-10">{rev.comment}</p>
                                 </div>
                             ))}
                             {reviews.length > 3 && (
                                 <button className="w-full py-2 text-primary font-bold text-sm">View All Reviews</button>
                             )}
                         </div>
                     ) : (
                         <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                             <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                 <PenLine size={24} className="text-gray-400"/>
                             </div>
                             <p className="font-bold dark:text-white">No reviews yet</p>
                             <p className="text-xs text-gray-500">Be the first to share your thoughts!</p>
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
};
// ... (Rest of the file remains unchanged)
