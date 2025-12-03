
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Truck, DollarSign, Users, Trash2, Edit2, Plus, Save, XCircle, Image as ImageIcon, MessageSquare, Filter, Star, Layout, ArrowUp, ArrowDown, X, AlertOctagon, Eye, EyeOff, Video, Info, MapPin } from 'lucide-react';
import { Product, Order, DeliverySettings, OrderStatus, HeroBanner, Review, Location } from '../types';
import { api, PRODUCT_CATEGORIES } from '../services/mockService';
import { Button, Input } from '../components/Shared';
import { MapPicker } from '../components/MapPicker';
import { useAppContext } from '../Context';
import { DEFAULT_STORE_LOCATION } from '../constants';

export const AdminDashboard = () => {
    const { state } = useAppContext();
    const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 12 });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    
    useEffect(() => {
        api.getOrders(true).then(orders => {
            setRecentOrders(orders.slice(0, 5));
            const revenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
            setStats(s => ({ ...s, revenue, orders: orders.length }));
        });
    }, []);

    return (
        <div className="p-6 space-y-6 pb-20 dark:text-gray-100">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full text-primary-dark"><DollarSign /></div>
                    <div><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold">₹{stats.revenue}</p></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600"><Package /></div>
                    <div><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{stats.orders}</p></div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full text-green-600"><Users /></div>
                    <div><p className="text-sm text-gray-500">Total Visitors</p><p className="text-2xl font-bold">1,204</p></div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 font-bold">Recent Orders</div>
                <div className="divide-y dark:divide-gray-700">
                    {recentOrders.map(order => (
                        <div key={order.id} className="p-4 flex justify-between items-center">
                            <div><p className="font-medium text-sm">#{order.id.slice(-6)}</p><p className="text-xs text-gray-500">{order.items.length} items</p></div>
                            <span className={`w-2 h-2 rounded-full ${order.status === 'Ordered' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const AdminProducts = () => {
  const { state, dispatch } = useAppContext();
  const [editing, setEditing] = useState<Product | null>(null);
  const [tempImage, setTempImage] = useState('');

  const handleDelete = async (id: string) => {
    if(confirm("Delete product?")) {
      await api.deleteProduct(id);
      dispatch({type: 'DELETE_PRODUCT', payload: id});
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const product = { ...editing, id: editing.id || 'p_' + Date.now() };
    await api.saveProduct(product);
    const all = await api.getProducts();
    dispatch({type: 'SET_PRODUCTS', payload: all});
    setEditing(null);
  };

  const handleAddImage = () => {
      if (tempImage && editing) {
          setEditing({ ...editing, images: [...editing.images, tempImage] });
          setTempImage('');
      }
  };

  const removeImage = (index: number) => {
      if (editing) {
          const newImages = editing.images.filter((_, i) => i !== index);
          setEditing({ ...editing, images: newImages });
      }
  };

  const calculateDiscount = () => {
      if (!editing || !editing.originalPrice || editing.originalPrice <= editing.price) return 0;
      return Math.round(((editing.originalPrice - editing.price) / editing.originalPrice) * 100);
  };

  return (
    <div className="p-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Product Manager</h1>
        <Button onClick={() => {
            setEditing({
                id: '', name: '', price: 0, originalPrice: 0, description: '', category: '', subcategory: '', images: ['https://picsum.photos/200'], stock: 10, rating: 0, reviewCount: 0, video: ''
            });
            setTempImage('');
        }}><Plus size={20}/> Add Product</Button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold dark:text-white">{editing.id ? 'Edit' : 'New'} Product</h2>
            <Input placeholder="Name" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} required />
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Selling Price (₹)</label>
                  <Input type="number" placeholder="Price" value={editing.price} onChange={e => setEditing({...editing, price: Number(e.target.value)})} required />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">MRP (₹)</label>
                  <Input type="number" placeholder="MRP" value={editing.originalPrice || ''} onChange={e => setEditing({...editing, originalPrice: Number(e.target.value)})} />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Stock Qty</label>
                  <Input type="number" placeholder="Stock" value={editing.stock} onChange={e => setEditing({...editing, stock: Number(e.target.value)})} required />
              </div>
            </div>

            {editing.originalPrice && editing.originalPrice > editing.price && (
                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    Customer gets <span className="font-bold">{calculateDiscount()}% OFF</span>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
                    <select 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-3 outline-none dark:text-white"
                        value={editing.category}
                        onChange={e => setEditing({...editing, category: e.target.value, subcategory: ''})}
                        required
                    >
                        <option value="">Select Category</option>
                        {Object.keys(PRODUCT_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Subcategory</label>
                    <select 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-3 outline-none dark:text-white"
                        value={editing.subcategory}
                        onChange={e => setEditing({...editing, subcategory: e.target.value})}
                        disabled={!editing.category}
                    >
                        <option value="">Select Subcategory</option>
                        {editing.category && PRODUCT_CATEGORIES[editing.category]?.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Image Management */}
            <div className="space-y-2">
                <label className="text-xs font-bold dark:text-gray-300">Product Images</label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Add Image URL (https://...)" 
                        value={tempImage} 
                        onChange={e => setTempImage(e.target.value)} 
                    />
                    <Button type="button" onClick={handleAddImage} className="whitespace-nowrap">Add</Button>
                </div>
                <div className="flex gap-2 overflow-x-auto p-1">
                    {editing.images.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 flex-shrink-0 group">
                            <img src={img} className="w-full h-full object-cover rounded border dark:border-gray-600" />
                            <button 
                                type="button" 
                                onClick={() => removeImage(idx)} 
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={10}/>
                            </button>
                        </div>
                    ))}
                    {editing.images.length === 0 && <span className="text-xs text-gray-500 italic">No images added</span>}
                </div>
            </div>

            {/* Video Input */}
            <div>
                <label className="text-xs font-bold dark:text-gray-300 flex items-center gap-1 mb-1">
                    <Video size={12}/> Video URL (Optional)
                </label>
                <Input 
                    placeholder="Video Link (YouTube, MP4, etc.)" 
                    value={editing.video || ''} 
                    onChange={e => setEditing({...editing, video: e.target.value})} 
                />
            </div>

            <textarea 
              className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" 
              placeholder="Description" 
              value={editing.description} 
              onChange={e => setEditing({...editing, description: e.target.value})}
            ></textarea>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {state.products.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center gap-4 shadow-sm border dark:border-gray-700">
             <img src={p.images[0]} className="w-16 h-16 rounded object-cover" alt="" />
             <div className="flex-1">
               <h3 className="font-bold dark:text-white">{p.name}</h3>
               <div className="text-sm text-gray-500 flex items-center gap-2">
                   <span className="font-medium text-black dark:text-white">₹{p.price}</span>
                   {p.originalPrice && <span className="line-through text-xs">₹{p.originalPrice}</span>}
                   <span>• {p.category}</span>
               </div>
               {p.video && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">VIDEO</span>}
             </div>
             <div className="flex gap-2">
               <button onClick={() => { setEditing(p); setTempImage(''); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Edit2 size={18}/></button>
               <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={18}/></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminOrdersPage = () => {
    const { state } = useAppContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    api.getOrders(true).then(orders => {
        setOrders(orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
  }

  const updateStatus = async (id: string, status: OrderStatus) => {
    if (status === 'Cancelled' && !confirm('Are you sure you want to cancel this order? User will be notified.')) return;
    
    await api.updateOrderStatus(id, status);
    loadOrders();
    if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? {...prev, status} : null);
    }
  };

  const handleRejectCancellation = async (id: string) => {
      await api.rejectOrderCancellation(id);
      loadOrders();
      if (selectedOrder?.id === id) {
          setSelectedOrder(prev => prev && prev.cancelRequest ? {...prev, cancelRequest: {...prev.cancelRequest, status: 'rejected'}} : null);
      }
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Order Management</h1>
      
      <div className="space-y-4">
        {orders.length === 0 && <p className="text-gray-500 text-center py-10">No orders yet.</p>}
        {orders.map(order => (
          <div key={order.id} onClick={() => setSelectedOrder(order)} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden ${order.cancelRequest?.status === 'pending' ? 'border-red-500 border-2' : 'border-gray-100 dark:border-gray-700'}`}>
            {order.cancelRequest?.status === 'pending' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg">Cancellation Requested</div>}
            
            <div className="flex justify-between items-start mb-2">
               <div>
                  <span className="font-bold dark:text-white block">#{order.id.slice(-6)}</span>
                  <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
               </div>
               <span className={`px-2 py-1 rounded text-xs font-bold ${
                 order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                 order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                 'bg-yellow-100 text-yellow-800'
               }`}>
                 {order.status}
               </span>
            </div>
            <div className="text-sm dark:text-gray-300 mb-2">
               <p className="font-semibold">{order.shippingAddress.fullName}</p>
               <p className="text-gray-500 text-xs">{order.items.length} items</p>
            </div>
            <div className="flex justify-between items-center border-t dark:border-gray-700 pt-2 mt-2">
               <span className="font-bold text-primary-dark dark:text-primary">₹{order.totalAmount}</span>
               <span className="text-xs text-blue-500 font-medium">View Details &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedOrder(null)}>
           <div className="bg-white dark:bg-gray-800 w-full max-w-lg sm:rounded-2xl rounded-t-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
              <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hidden sm:block"><XCircle/></button>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold dark:text-white">Order Details</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                        selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-800'
                    }`}>{selectedOrder.status}</span>
                </div>
                <p className="text-sm text-gray-500">ID: {selectedOrder.id}</p>
              </div>

              {selectedOrder.cancelRequest && selectedOrder.status !== 'Cancelled' && (
                  <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900">
                      <div className="flex items-start gap-3">
                          <AlertOctagon className="text-red-500 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-red-700 dark:text-red-400">Cancellation Request</h3>
                              <p className="text-sm dark:text-gray-300 mt-1">Reason: "{selectedOrder.cancelRequest.reason}"</p>
                              <p className="text-xs text-gray-500 mt-1">Requested: {new Date(selectedOrder.cancelRequest.requestedAt).toLocaleString()}</p>
                              
                              {selectedOrder.cancelRequest.status === 'pending' ? (
                                  <div className="flex gap-2 mt-3">
                                      <Button size="sm" onClick={() => updateStatus(selectedOrder.id, 'Cancelled')} className="bg-red-600 text-white hover:bg-red-700 border-none">Approve & Cancel</Button>
                                      <Button size="sm" variant="outline" onClick={() => handleRejectCancellation(selectedOrder.id)}>Reject Request</Button>
                                  </div>
                              ) : (
                                  <div className="mt-2 text-sm font-bold text-red-800 dark:text-red-300">
                                      Request {selectedOrder.cancelRequest.status.toUpperCase()}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-2">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Information</h3>
                      <div>
                          <p className="font-bold dark:text-white text-lg">{selectedOrder.shippingAddress.fullName}</p>
                          <p className="dark:text-gray-300">{selectedOrder.shippingAddress.line1}</p>
                          <p className="dark:text-gray-300">{selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.pincode}</p>
                          <div className="flex items-center gap-2 mt-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 w-fit px-2 py-1 rounded text-sm">
                             <span>📞 {selectedOrder.shippingAddress.phone}</span>
                          </div>
                      </div>
                  </div>

                  {/* Order Items */}
                  <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Items</h3>
                      <div className="space-y-3">
                          {selectedOrder.items.map(item => (
                              <div key={item.id} className="flex justify-between items-center">
                                  <div className="flex gap-3">
                                      <img src={item.images[0]} className="w-12 h-12 rounded bg-gray-100 object-cover" />
                                      <div>
                                          <p className="font-medium text-sm dark:text-white line-clamp-1">{item.name}</p>
                                          <p className="text-xs text-gray-500">{item.quantity} x ₹{item.price}</p>
                                      </div>
                                  </div>
                                  <p className="font-bold text-sm dark:text-white">₹{item.price * item.quantity}</p>
                              </div>
                          ))}
                      </div>
                      <div className="border-t dark:border-gray-700 mt-4 pt-3 flex justify-between font-bold text-lg dark:text-white">
                          <span>Total Amount</span>
                          <span>₹{selectedOrder.totalAmount}</span>
                      </div>
                      <p className="text-xs text-gray-400 text-right mt-1">Payment: {selectedOrder.paymentMethod}</p>
                  </div>

                  {/* Actions */}
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && !selectedOrder.cancelRequest && (
                      <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Status</h3>
                          <div className="grid grid-cols-2 gap-3">
                              {selectedOrder.status === 'Ordered' && (
                                  <Button variant="outline" onClick={() => updateStatus(selectedOrder.id, 'Shipped')}>Mark Shipped</Button>
                              )}
                              {selectedOrder.status === 'Shipped' && (
                                  <Button variant="outline" onClick={() => updateStatus(selectedOrder.id, 'Out for Delivery')}>Mark Out for Delivery</Button>
                              )}
                              {selectedOrder.status === 'Out for Delivery' && (
                                  <Button variant="outline" onClick={() => updateStatus(selectedOrder.id, 'Delivered')}>Mark Delivered</Button>
                              )}
                              
                              <Button 
                                className="w-full bg-red-500 hover:bg-red-600 text-white border-none col-span-2" 
                                onClick={() => updateStatus(selectedOrder.id, 'Cancelled')}
                              >
                                Cancel Order Forcefully
                              </Button>
                          </div>
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export const AdminReviewsPage = () => {
    // --- Unified Content Management Page (Reviews, Banners & Delivery) ---
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = useState<'reviews' | 'banners' | 'delivery'>('reviews');
    
    // Reviews State
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filterRating, setFilterRating] = useState<number | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Banners State
    const [isAddingBanner, setIsAddingBanner] = useState(false);
    const [newBanner, setNewBanner] = useState<HeroBanner>({ id: '', title: '', subtitle: '', imageUrl: '', link: '', isVisible: true });

    // Delivery State
    const [dSettings, setDSettings] = useState<DeliverySettings>(state.deliverySettings);

    useEffect(() => {
        api.getReviews().then(setReviews);
        if (state.banners.length === 0) {
             api.getBanners().then(b => dispatch({type: 'SET_BANNERS', payload: b}));
        }
    }, []);

    useEffect(() => {
        setDSettings(state.deliverySettings);
    }, [state.deliverySettings]);

    // Review Handlers
    const handleDeleteReview = async (id: string) => {
        if(confirm('Delete review?')) {
            await api.deleteReview(id);
            setReviews(reviews.filter(r => r.id !== id));
        }
    };

    const filteredReviews = reviews
        .filter(r => filterRating === 'all' ? true : Math.round(r.rating) === filterRating)
        .sort((a,b) => sortOrder === 'newest' 
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

    // Banner Handlers
    const handleSaveBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        const banner = { ...newBanner, id: newBanner.id || 'b_' + Date.now() };
        await api.saveBanner(banner);
        
        const updatedBanners = await api.getBanners();
        dispatch({type: 'SET_BANNERS', payload: updatedBanners});
        
        setNewBanner({ id: '', title: '', subtitle: '', imageUrl: '', link: '', isVisible: true });
        setIsAddingBanner(false);
    };

    const toggleBannerVisibility = async (banner: HeroBanner) => {
        const updated = { ...banner, isVisible: !banner.isVisible };
        await api.saveBanner(updated);
        const banners = await api.getBanners();
        dispatch({ type: 'SET_BANNERS', payload: banners });
    }

    const handleDeleteBanner = async (id: string) => {
        if(confirm('Delete this banner?')) {
            await api.deleteBanner(id);
            dispatch({type: 'DELETE_BANNER', payload: id});
        }
    };

    // Delivery Handlers
    const saveDeliverySettings = async () => {
        await api.saveDeliverySettings(dSettings);
        dispatch({type: 'SET_SETTINGS', payload: dSettings});
        alert('Settings Saved');
    }

    const handleStoreLocationSelect = (loc: Location) => {
        setDSettings({...dSettings, storeLocation: loc});
    }

    return (
        <div className="p-6 pb-20">
            <h1 className="text-2xl font-bold mb-6 dark:text-white">Content Management</h1>
            
            <div className="flex gap-4 mb-6 border-b dark:border-gray-700 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-2 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'reviews' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Customer Reviews
                </button>
                <button 
                    onClick={() => setActiveTab('banners')}
                    className={`pb-2 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'banners' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Hero Banners
                </button>
                 <button 
                    onClick={() => setActiveTab('delivery')}
                    className={`pb-2 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'delivery' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Delivery Config
                </button>
            </div>

            {activeTab === 'reviews' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 items-center mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <Filter size={16} className="text-gray-500"/>
                        <span className="text-xs font-bold dark:text-gray-300">Filter:</span>
                        {['all', 5, 4, 3, 2, 1].map(r => (
                            <button 
                                key={r}
                                onClick={() => setFilterRating(r as any)}
                                className={`px-2 py-1 rounded text-xs border ${filterRating === r ? 'bg-primary border-primary text-black' : 'bg-transparent border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}
                            >
                                {r === 'all' ? 'All' : `${r} ★`}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-gray-300 mx-2"></div>
                        <button onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} className="flex items-center gap-1 text-xs dark:text-gray-300">
                            {sortOrder === 'newest' ? <ArrowDown size={14}/> : <ArrowUp size={14}/>} 
                            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                        </button>
                    </div>

                    {filteredReviews.length === 0 && <p className="text-gray-500">No reviews found.</p>}
                    {filteredReviews.map(review => (
                        <div key={review.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                 <div className="flex gap-3">
                                     <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                         {review.userName[0]}
                                     </div>
                                     <div>
                                         <p className="font-bold text-sm dark:text-white">{review.userName}</p>
                                         <div className="flex text-yellow-500 my-0.5">
                                             {Array(5).fill(0).map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />)}
                                         </div>
                                         <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{review.comment}</p>
                                         <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                                     </div>
                                 </div>
                                 <button onClick={() => handleDeleteReview(review.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'banners' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold dark:text-white">Active Banners</h2>
                        <Button size="sm" onClick={() => setIsAddingBanner(true)}><Plus size={16}/> Add Banner</Button>
                    </div>

                    {isAddingBanner && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 mb-4">
                            <h3 className="font-bold mb-3 dark:text-white">New Banner Details</h3>
                            <form onSubmit={handleSaveBanner} className="space-y-3">
                                <Input placeholder="Title (e.g., Flash Sale)" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} required/>
                                <Input placeholder="Subtitle (e.g., 50% Off)" value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} required/>
                                <Input placeholder="Image URL (Landscape)" value={newBanner.imageUrl} onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} required/>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Link Category (e.g., Electronics)" value={newBanner.link} onChange={e => setNewBanner({...newBanner, link: e.target.value})} required/>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="w-5 h-5 accent-primary" checked={newBanner.isVisible} onChange={e => setNewBanner({...newBanner, isVisible: e.target.checked})}/>
                                        <span className="text-sm dark:text-white">Visible?</span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingBanner(false)}>Cancel</Button>
                                    <Button type="submit">Save</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {state.banners.map(banner => (
                            <div key={banner.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border dark:border-gray-700 relative group">
                                <img src={banner.imageUrl} className={`w-full h-32 object-cover ${!banner.isVisible ? 'opacity-50 grayscale' : ''}`} alt={banner.title} />
                                <div className="absolute inset-0 bg-black/40 flex items-center px-6">
                                    <div className="text-white">
                                        <h3 className="font-bold text-lg">{banner.title} {banner.isVisible ? '' : '(Hidden)'}</h3>
                                        <p className="text-sm opacity-90">{banner.subtitle}</p>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleBannerVisibility(banner)} className="bg-white p-2 rounded-full shadow text-gray-700">
                                        {banner.isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}
                                    </button>
                                    <button onClick={() => { setIsAddingBanner(true); setNewBanner(banner); }} className="bg-white p-2 rounded-full shadow text-blue-500"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDeleteBanner(banner.id)} className="bg-white p-2 rounded-full shadow text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'delivery' && (
                <div className="animate-fade-in space-y-6">
                    <h2 className="font-bold dark:text-white mb-2">Delivery Settings</h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl space-y-6 shadow-sm border dark:border-gray-700">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                            <h3 className="font-bold mb-2 flex items-center gap-2"><Info size={16}/> Calculation Formula</h3>
                            <p className="font-mono bg-blue-100 dark:bg-blue-900/40 p-2 rounded">Total = Base Charge + (Distance × Per KM Charge)</p>
                            <p className="mt-2 text-xs opacity-80">* Distance is calculated from the <b>Store Location</b> below to the customer's delivery address using OpenRouteService.</p>
                        </div>
                        
                        {/* Store Location Map */}
                        <div className="space-y-2">
                             <label className="text-sm font-bold flex items-center gap-2 dark:text-gray-200"><MapPin size={16}/> Set Store Location</label>
                             <MapPicker 
                                initialLocation={dSettings.storeLocation || DEFAULT_STORE_LOCATION} 
                                onLocationSelect={handleStoreLocationSelect}
                                height="250px"
                             />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Base Delivery Charge (₹)</label>
                                <p className="text-xs text-gray-500 mb-2">Fixed fee applied to every order.</p>
                                <Input type="number" value={dSettings.baseCharge} onChange={e => setDSettings({...dSettings, baseCharge: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Per KM Charge (₹)</label>
                                <p className="text-xs text-gray-500 mb-2">Additional fee per kilometer.</p>
                                <Input type="number" value={dSettings.perKmCharge} onChange={e => setDSettings({...dSettings, perKmCharge: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Free Delivery Above (₹)</label>
                                <p className="text-xs text-gray-500 mb-2">Cart value threshold for free shipping.</p>
                                <Input type="number" value={dSettings.freeDeliveryAbove} onChange={e => setDSettings({...dSettings, freeDeliveryAbove: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estimated Days</label>
                                <p className="text-xs text-gray-500 mb-2">Delivery time shown to users.</p>
                                <Input value={dSettings.estimatedDays} onChange={e => setDSettings({...dSettings, estimatedDays: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <input 
                                type="checkbox" 
                                id="cod" 
                                className="w-5 h-5 accent-primary cursor-pointer" 
                                checked={dSettings.codEnabled} 
                                onChange={e => setDSettings({...dSettings, codEnabled: e.target.checked})} 
                            />
                            <label htmlFor="cod" className="font-medium cursor-pointer flex-1">Enable Cash on Delivery (COD)</label>
                        </div>

                        <Button onClick={saveDeliverySettings} className="w-full mt-4 text-lg"><Save className="w-5 h-5"/> Save Settings</Button>
                    </div>
                </div>
            )}
        </div>
    );
};
