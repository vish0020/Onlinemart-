
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, DollarSign, Users, Trash2, Edit2, Plus, Save, XCircle, Filter, Star, Layout, ArrowUp, ArrowDown, X, AlertOctagon, Eye, EyeOff, Video, Info, MapPin, Box, ClipboardList, Layers, LayoutDashboard, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, ExternalLink, Sliders, QrCode } from 'lucide-react';
import { Product, Order, DeliverySettings, OrderStatus, HeroBanner, Review, Location, PaymentSettings } from '../types';
import { api, CATEGORY_DATA } from '../services/mockService';
import { Button, Input } from '../components/Shared';
import { MapPicker } from '../components/MapPicker';
import { useAppContext } from '../Context';
import { DEFAULT_STORE_LOCATION, DEFAULT_PAYMENT_SETTINGS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export const AdminDashboard = () => {
    const { state } = useAppContext();
    const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 12 });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    
    useEffect(() => {
        api.getOrders(true).then(orders => {
            setRecentOrders(orders.slice(0, 5));
            const revenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
            setStats(s => ({ ...s, revenue, orders: orders.length }));

            // Process data for charts (Last 7 days)
            const days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const data = days.map(day => {
                const dayOrders = orders.filter(o => o.createdAt.startsWith(day));
                return {
                    name: new Date(day).toLocaleDateString('en-US', {weekday: 'short'}),
                    sales: dayOrders.reduce((acc, o) => acc + o.totalAmount, 0),
                    orders: dayOrders.length
                };
            });
            setChartData(data);
        });

        api.getProducts().then(products => {
            setLowStockProducts(products.filter(p => p.stock < 5));
        });
    }, []);

    return (
        <div className="p-6 space-y-6 pb-20 dark:text-gray-100 animate-fade-in">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* Navigation Grid for Mobile/Tablet */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
                 <Link to="/admin/products" className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all hover:scale-105 shadow-sm">
                     <Box size={24} />
                     <span className="font-bold text-sm">Products</span>
                 </Link>
                 <Link to="/admin/orders" className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex flex-col items-center justify-center gap-2 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-all hover:scale-105 shadow-sm">
                     <ClipboardList size={24} />
                     <span className="font-bold text-sm">Orders</span>
                 </Link>
                 <Link to="/admin/content" className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex flex-col items-center justify-center gap-2 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all hover:scale-105 shadow-sm">
                     <Layers size={24} />
                     <span className="font-bold text-sm">Content</span>
                 </Link>
                 <Link to="/admin/settings" className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl flex flex-col items-center justify-center gap-2 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all hover:scale-105 shadow-sm">
                     <QrCode size={24} />
                     <span className="font-bold text-sm">Payment Settings</span>
                 </Link>
            </div>

            <h2 className="text-lg font-bold mt-8 mb-2">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100 dark:border-gray-700">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full text-primary-dark"><DollarSign /></div>
                    <div><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold">₹{stats.revenue}</p></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100 dark:border-gray-700">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600"><Package /></div>
                    <div><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{stats.orders}</p></div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100 dark:border-gray-700">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full text-green-600"><Users /></div>
                    <div><p className="text-sm text-gray-500">Total Visitors</p><p className="text-2xl font-bold">1,204</p></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {/* Sales Chart */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-80">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><TrendingUp size={18}/> Sales (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="sales" fill="#FFD700" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Inventory Alert */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-80 overflow-y-auto">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm text-red-600"><AlertTriangle size={18}/> Low Stock Alert</h3>
                    {lowStockProducts.length === 0 ? (
                        <p className="text-green-600 text-sm text-center py-10">All products are well stocked.</p>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img src={p.images[0]} className="w-8 h-8 rounded object-cover" />
                                        <div>
                                            <p className="text-sm font-bold dark:text-white line-clamp-1">{p.name}</p>
                                            <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                                        </div>
                                    </div>
                                    <Link to="/admin/products" className="text-xs font-bold text-blue-500 hover:underline">Restock</Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="p-4 border-b dark:border-gray-700 font-bold flex justify-between items-center">
                    <span>Recent Orders</span>
                    <Link to="/admin/orders" className="text-xs text-primary font-bold">View All</Link>
                </div>
                <div className="divide-y dark:divide-gray-700">
                    {recentOrders.length === 0 && <p className="p-4 text-gray-500 text-sm">No orders yet.</p>}
                    {recentOrders.map(order => (
                        <div key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <div>
                                <p className="font-medium text-sm">#{order.id.slice(-6)} <span className="text-gray-400">• {order.shippingAddress.fullName}</span></p>
                                <p className="text-xs text-gray-500">{order.items.length} items • ₹{order.totalAmount}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.status === 'Ordered' ? 'bg-yellow-100 text-yellow-800' : 
                                order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const AdminProducts = () => {
  const { state, dispatch, showToast } = useAppContext();
  const [editing, setEditing] = useState<Product | null>(null);
  const [tempImage, setTempImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async (id: string) => {
    if(confirm("Delete product?")) {
      try {
        await api.deleteProduct(id);
        dispatch({type: 'DELETE_PRODUCT', payload: id});
        showToast("Product deleted", "info");
      } catch (error) {
        showToast("Failed to delete", "error");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (state.user?.id === 'demo_admin_user') {
        showToast("Demo Mode: Cannot save changes", "error");
        return;
    }

    setIsSaving(true);
    try {
        const newId = editing.id || `p_${Date.now()}`;
        const product = { ...editing, id: newId };
        
        await api.saveProduct(product);
        
        const all = await api.getProducts();
        dispatch({type: 'SET_PRODUCTS', payload: all});
        setEditing(null);
        showToast("Product Saved Successfully", "success");
    } catch (error: any) {
        console.error("Save Error:", error);
        showToast("Failed to save product", "error");
    } finally {
        setIsSaving(false);
    }
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

  const handleAttributeChange = (key: string, value: string) => {
      if (!editing) return;
      setEditing({
          ...editing,
          attributes: {
              ...editing.attributes,
              [key]: value
          }
      });
  };

  // Get dynamic fields based on selected category
  const dynamicFields = useMemo(() => {
      if (!editing || !editing.category) return [];
      return CATEGORY_DATA[editing.category]?.fields || [];
  }, [editing?.category]);

  const availableSubcategories = useMemo(() => {
      if (!editing || !editing.category) return [];
      return CATEGORY_DATA[editing.category]?.subcategories || [];
  }, [editing?.category]);

  return (
    <div className="p-6 pb-20 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <Link to="/admin" className="md:hidden p-2 -ml-2 text-gray-500"><ChevronLeft/></Link>
            <h1 className="text-2xl font-bold dark:text-white">Product Manager</h1>
        </div>
        <Button onClick={() => {
            setEditing({
                id: '', name: '', price: 0, originalPrice: 0, description: '', features: '', category: '', subcategory: '', images: ['https://picsum.photos/200'], stock: 10, rating: 0, reviewCount: 0, video: '', attributes: {}
            });
            setTempImage('');
        }}><Plus size={20}/> <span className="hidden sm:inline">Add Product</span></Button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <h2 className="text-xl font-bold dark:text-white">{editing.id ? 'Edit' : 'New'} Product</h2>
            <Input placeholder="Name" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} required />
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Price (₹)</label>
                  <Input type="number" placeholder="Price" value={editing.price} onChange={e => setEditing({...editing, price: Number(e.target.value)})} required />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">MRP (₹)</label>
                  <Input type="number" placeholder="MRP" value={editing.originalPrice || ''} onChange={e => setEditing({...editing, originalPrice: Number(e.target.value)})} />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Stock</label>
                  <Input type="number" placeholder="Stock" value={editing.stock} onChange={e => setEditing({...editing, stock: Number(e.target.value)})} required />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
                    <select 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-3 outline-none dark:text-white"
                        value={editing.category}
                        onChange={e => setEditing({...editing, category: e.target.value, subcategory: '', attributes: {}})}
                        required
                    >
                        <option value="">Select Category</option>
                        {Object.keys(CATEGORY_DATA).map(cat => (
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
                        {availableSubcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dynamic Fields Section */}
            {dynamicFields.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border dark:border-gray-600 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-2 dark:text-white"><Sliders size={16}/> Product Specifications</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {dynamicFields.map(field => (
                            <div key={field}>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">{field}</label>
                                <Input 
                                    placeholder={field} 
                                    value={editing.attributes?.[field] || ''} 
                                    onChange={e => handleAttributeChange(field, e.target.value)}
                                    className="py-2 text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold dark:text-gray-300">Images</label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Image URL" 
                        value={tempImage} 
                        onChange={e => setTempImage(e.target.value)} 
                    />
                    <Button type="button" onClick={handleAddImage}>Add</Button>
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
                </div>
            </div>

            <textarea 
              className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 min-h-[80px]" 
              placeholder="Description" 
              value={editing.description} 
              onChange={e => setEditing({...editing, description: e.target.value})}
            ></textarea>

            <textarea 
              className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 min-h-[80px]" 
              placeholder="Features (Optional additional text)" 
              value={editing.features || ''} 
              onChange={e => setEditing({...editing, features: e.target.value})}
            ></textarea>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" isLoading={isSaving}>{isSaving ? 'Saving...' : 'Save Product'}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {state.products.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center gap-4 shadow-sm border dark:border-gray-700 animate-slide-up hover:shadow-md transition-shadow">
             <img src={p.images[0]} className="w-16 h-16 rounded object-cover bg-gray-100" alt="" />
             <div className="flex-1">
               <h3 className="font-bold dark:text-white line-clamp-1">{p.name}</h3>
               <div className="text-sm text-gray-500 flex items-center gap-2">
                   <span className="font-medium text-black dark:text-white">₹{p.price}</span>
                   <span className="hidden sm:inline">• {p.category}</span>
                   {p.stock < 5 && <span className="text-red-500 text-xs font-bold bg-red-50 px-1 rounded">Low Stock: {p.stock}</span>}
               </div>
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
    const { state, dispatch, showToast } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'All'>('All');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const data = await api.getOrders(true);
        setOrders(data);
    };

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            showToast(`Order status updated to ${newStatus}`, "success");
            loadOrders();
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (e) {
            showToast("Failed to update status", "error");
        }
    };

    const handleRejectCancel = async (orderId: string) => {
        try {
            await api.rejectOrderCancellation(orderId);
            showToast("Cancellation request rejected", "success");
            loadOrders();
        } catch (e) {
            showToast("Failed to reject cancellation", "error");
        }
    };

    const filteredOrders = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus);

    return (
        <div className="p-6 pb-20 animate-fade-in">
             <div className="flex items-center gap-2 mb-6">
                <Link to="/admin" className="md:hidden p-2 -ml-2 text-gray-500"><ChevronLeft/></Link>
                <h1 className="text-2xl font-bold dark:text-white">Order Management</h1>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {['All', 'Ordered', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterStatus === status ? 'bg-primary text-black' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredOrders.length === 0 && <p className="text-center py-10 text-gray-500">No orders found.</p>}
                {filteredOrders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 animate-slide-up">
                        <div className="flex justify-between items-start mb-4 border-b dark:border-gray-700 pb-3">
                            <div>
                                <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                                    #{order.id.slice(-6)}
                                    {order.cancelRequest && order.cancelRequest.status === 'pending' && (
                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded animate-pulse">Cancel Requested</span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                                className={`text-xs font-bold px-2 py-1 rounded border-none outline-none cursor-pointer ${
                                    order.status === 'Ordered' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}
                            >
                                {['Ordered', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1 space-y-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">Items</h4>
                                {order.items.map(item => (
                                    <div key={item.id} className="flex gap-3 items-center">
                                        <img src={item.images[0]} className="w-10 h-10 rounded bg-gray-100 object-cover" />
                                        <div>
                                            <p className="text-sm font-medium dark:text-white line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity} x ₹{item.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 space-y-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase">Shipping & Payment</h4>
                                <p className="text-sm dark:text-gray-300">
                                    {order.shippingAddress.fullName}<br/>
                                    {order.shippingAddress.line1}, {order.shippingAddress.city}<br/>
                                    Phone: {order.shippingAddress.phone}
                                </p>
                                <p className="text-sm font-bold mt-2">
                                    Total: ₹{order.totalAmount} <span className="text-xs font-normal text-gray-500">({order.paymentMethod})</span>
                                </p>
                                {order.paymentDetails?.verifiedAmount && (
                                    <p className="text-xs text-green-600 font-bold">Verified Amount: ₹{order.paymentDetails.verifiedAmount}</p>
                                )}
                            </div>
                        </div>

                        {order.cancelRequest && order.cancelRequest.status === 'pending' && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-red-700 dark:text-red-300">Cancellation Reason:</p>
                                    <p className="text-sm text-red-600 dark:text-red-200">{order.cancelRequest.reason}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'Cancelled')} className="bg-red-600 hover:bg-red-700 text-white">Approve</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleRejectCancel(order.id)} className="border-red-200 text-red-600 hover:bg-red-50">Reject</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AdminPaymentSettingsPage = () => {
    const { showToast, state } = useAppContext();
    const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.getPaymentSettings().then(data => {
            setSettings(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (state.user?.id === 'demo_admin_user') {
            showToast("Demo Mode: Cannot save settings", "error");
            return;
        }

        setSaving(true);
        try {
            await api.savePaymentSettings(settings);
            showToast("Payment Settings Saved", "success");
        } catch (e) {
            showToast("Failed to save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleApp = (appKey: keyof typeof settings.supportedApps) => {
        setSettings({
            ...settings,
            supportedApps: {
                ...settings.supportedApps,
                [appKey]: !settings.supportedApps[appKey]
            }
        });
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div className="p-6 pb-20 animate-fade-in max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
                <Link to="/admin" className="md:hidden p-2 -ml-2 text-gray-500"><ChevronLeft/></Link>
                <h1 className="text-2xl font-bold dark:text-white">Payment Settings</h1>
            </div>

            <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                <div className="space-y-4">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <DollarSign size={20} className="text-primary"/> UPI Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">UPI ID (VPA)</label>
                            <Input 
                                placeholder="e.g. merchant@upi" 
                                value={settings.upiId} 
                                onChange={e => setSettings({...settings, upiId: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Merchant Name</label>
                            <Input 
                                placeholder="e.g. Online Mart" 
                                value={settings.merchantName} 
                                onChange={e => setSettings({...settings, merchantName: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">QR Code Image URL</label>
                        <Input 
                            placeholder="https://..." 
                            value={settings.qrImageUrl} 
                            onChange={e => setSettings({...settings, qrImageUrl: e.target.value})}
                        />
                        {settings.qrImageUrl && (
                            <img src={settings.qrImageUrl} alt="QR Preview" className="mt-2 w-32 h-32 object-contain border rounded-lg bg-gray-50" />
                        )}
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <Sliders size={20} className="text-primary"/> Configuration
                    </h3>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <span className="text-sm font-medium dark:text-white">Enable QR Code Payment</span>
                        <input 
                            type="checkbox" 
                            checked={settings.enableQr} 
                            onChange={e => setSettings({...settings, enableQr: e.target.checked})}
                            className="w-5 h-5 accent-primary"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <span className="text-sm font-medium dark:text-white">Enable Deep Links (Direct App Open)</span>
                        <input 
                            type="checkbox" 
                            checked={settings.enableDeepLink} 
                            onChange={e => setSettings({...settings, enableDeepLink: e.target.checked})}
                            className="w-5 h-5 accent-primary"
                        />
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg dark:text-white">Supported Payment Apps</h3>
                    <p className="text-xs text-gray-500">Toggle which apps appear in the payment options.</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {Object.keys(settings.supportedApps).map((key) => {
                            const appKey = key as keyof typeof settings.supportedApps;
                            return (
                                <div key={key} className="flex items-center gap-2 p-2 border dark:border-gray-700 rounded-lg">
                                    <input 
                                        type="checkbox" 
                                        id={key}
                                        checked={settings.supportedApps[appKey]}
                                        onChange={() => handleToggleApp(appKey)}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <label htmlFor={key} className="text-sm capitalize cursor-pointer flex-1 dark:text-gray-300">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave} isLoading={saving} className="w-full">Save Settings</Button>
                </div>
            </div>
        </div>
    );
};

export const AdminReviewsPage = () => {
    const { showToast } = useAppContext();
    const [reviews, setReviews] = useState<Review[]>([]);
    
    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        const data = await api.getReviews();
        setReviews(data);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this review?")) {
            try {
                await api.deleteReview(id);
                showToast("Review deleted", "info");
                loadReviews();
            } catch (e) {
                showToast("Failed to delete review", "error");
            }
        }
    };

    return (
        <div className="p-6 pb-20 animate-fade-in">
             <div className="flex items-center gap-2 mb-6">
                <Link to="/admin" className="md:hidden p-2 -ml-2 text-gray-500"><ChevronLeft/></Link>
                <h1 className="text-2xl font-bold dark:text-white">Content Moderation</h1>
            </div>

            <div className="space-y-4">
                <h2 className="font-bold text-lg dark:text-white">Customer Reviews</h2>
                {reviews.length === 0 && <p className="text-gray-500">No reviews found.</p>}
                
                <div className="grid gap-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex text-yellow-400">
                                        {Array(5).fill(0).map((_, i) => (
                                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-300" : ""} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold dark:text-white">{review.userName}</span>
                                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{review.comment}</p>
                                <p className="text-xs text-gray-400">Product ID: {review.productId}</p>
                            </div>
                            <button onClick={() => handleDelete(review.id)} className="text-red-400 hover:text-red-600 p-2 h-fit">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
