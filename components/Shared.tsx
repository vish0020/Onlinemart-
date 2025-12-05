
import React, { useState } from 'react';
import { ShoppingCart, Star, Heart, Plus, Minus, Loader, CheckCircle, MapPin, X } from 'lucide-react';
import { Product, Address, Location } from '../types';
import { MOCK_LOCATIONS } from '../services/mockService';
import { MapPicker } from './MapPicker';
import { reverseGeocode } from '../services/mapService';

export const Logo: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
  const sizes = { sm: "h-8 w-8", md: "h-12 w-12", lg: "h-20 w-20" };
  const textSizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} bg-primary rounded-full flex items-center justify-center shadow-lg relative overflow-hidden`}>
         <div className="absolute inset-0 bg-yellow-300 opacity-20 transform rotate-45"></div>
         <ShoppingCart className="text-black w-1/2 h-1/2" strokeWidth={2.5} />
      </div>
      <span className={`font-bold tracking-tight text-secondary dark:text-white ${textSizes[size]}`}>
        online<span className="text-primary">Mart</span>
      </span>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', className = '', isLoading, ...props 
}) => {
  
  const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-3 text-sm",
      lg: "px-6 py-4 text-base"
  };

  const base = `rounded-lg font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]}`;
  
  const variants = {
    primary: "bg-primary text-black shadow-md hover:bg-primary-dark",
    secondary: "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black",
    outline: "border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
    {...props}
  />
);

interface ProductCardProps {
  product: Product; 
  onAdd: (e: React.MouseEvent) => void;
  onToggleWishlist: (e: React.MouseEvent) => void;
  isWishlisted: boolean;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, onToggleWishlist, isWishlisted, onClick }) => (
  <div onClick={onClick} className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative border border-gray-100 dark:border-gray-700">
    <button 
      onClick={(e) => { e.stopPropagation(); onToggleWishlist(e); }}
      className="absolute top-2 right-2 z-10 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full shadow-sm"
    >
      <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`} />
    </button>

    <div className="relative aspect-[1/1] overflow-hidden bg-gray-100 dark:bg-gray-900">
      <img 
        src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300?text=No+Image'} 
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
      />
      {product.stock < 5 && product.stock > 0 && (
        <span className="absolute bottom-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          Only {product.stock} left!
        </span>
      )}
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white font-bold uppercase tracking-wider">Out of Stock</span>
        </div>
      )}
    </div>

    <div className="p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.category}</p>
      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight h-10 mb-2">
        {product.name}
      </h3>
      
      <div className="flex items-center gap-1 mb-3">
        <Star className="w-4 h-4 fill-primary text-primary" />
        <span className="text-sm font-medium dark:text-gray-200">{product.rating}</span>
        <span className="text-xs text-gray-400">({product.reviewCount})</span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onAdd(e); }}
          className="bg-primary text-black p-2 rounded-lg hover:bg-primary-dark transition-colors shadow-md active:scale-90"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
);

export const Skeleton: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export const ProductSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
    <Skeleton className="aspect-[1/1] w-full rounded-lg mb-4" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  </div>
);

// --- New Address Form Component ---
interface AddressFormProps {
  initialData?: Address | null;
  onSave: (address: Address) => void;
  onCancel: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Address>(initialData || {
    id: '',
    fullName: '',
    phone: '',
    pincode: '',
    country: 'India',
    state: '',
    city: '',
    area: '',
    landmark: '',
    line1: '',
    isDefault: false
  });
  
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLocation, setTempLocation] = useState<Location | undefined>(formData.location);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleMapConfirmation = async () => {
      if (!tempLocation) {
          setShowMapModal(false);
          return;
      }

      setFormData(prev => ({ ...prev, location: tempLocation }));
      setShowMapModal(false);

      // Auto-fill address details using Reverse Geocoding
      setLoadingLoc(true);
      const addressData = await reverseGeocode(tempLocation.lat, tempLocation.lng);
      setLoadingLoc(false);

      if (addressData) {
          setFormData(prev => ({
              ...prev,
              pincode: addressData.postcode || prev.pincode,
              city: addressData.city || addressData.town || addressData.village || prev.city,
              state: addressData.state || prev.state,
              country: addressData.country || prev.country,
              line1: addressData.road ? `${addressData.house_number || ''} ${addressData.road}`.trim() : prev.line1,
              area: addressData.suburb || addressData.neighbourhood || prev.area
          }));
      }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in pb-10">
        <h3 className="text-lg font-bold dark:text-white flex justify-between items-center">
          {initialData ? 'Edit Address' : 'Add New Address'}
          {loadingLoc && <span className="text-xs text-primary flex items-center gap-1"><Loader className="animate-spin w-3 h-3"/> Fetching details...</span>}
        </h3>

        <Button type="button" variant="outline" onClick={() => setShowMapModal(true)} className="w-full flex items-center gap-2 py-4 border-dashed dark:border-gray-600">
           <MapPin className="text-red-500" />
           {formData.location ? "Change Location on Map" : "Choose on Map"}
        </Button>
        {formData.location && (
            <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                <CheckCircle size={12}/> Location pinned successfully
            </p>
        )}
        
        <Input placeholder="Full Name (Required)" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
        <Input placeholder="Mobile Number (Required)" type="tel" maxLength={10} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})} required />
        
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Pincode (Required)" maxLength={6} value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g,'')})} required />
          <div className="relative">
               <input 
                 list="countries"
                 className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 outline-none dark:text-white"
                 placeholder="Country"
                 value={formData.country}
                 onChange={e => setFormData({...formData, country: e.target.value})}
               />
               <datalist id="countries">
                  {MOCK_LOCATIONS.countries.map(c => <option key={c} value={c} />)}
               </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="relative">
               <input 
                 list="states"
                 className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 outline-none dark:text-white"
                 placeholder="State"
                 value={formData.state}
                 onChange={e => setFormData({...formData, state: e.target.value})}
                 required
               />
               <datalist id="states">
                  {MOCK_LOCATIONS.states.map(s => <option key={s} value={s} />)}
               </datalist>
          </div>
          <div className="relative">
               <input 
                 list="cities"
                 className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 outline-none dark:text-white"
                 placeholder="City"
                 value={formData.city}
                 onChange={e => setFormData({...formData, city: e.target.value})}
                 required
               />
               <datalist id="cities">
                  {MOCK_LOCATIONS.cities.map(c => <option key={c} value={c} />)}
               </datalist>
          </div>
        </div>

        <Input placeholder="House No., Building Name (Required)" value={formData.line1} onChange={e => setFormData({...formData, line1: e.target.value})} required />
        <Input placeholder="Road Name, Area, Colony (Required)" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required />
        <Input placeholder="Landmark (Optional)" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
        
        <div className="flex items-center gap-2 p-3 border rounded-lg dark:border-gray-700">
           <input 
             type="checkbox" 
             id="defaultAddr" 
             checked={formData.isDefault} 
             onChange={e => setFormData({...formData, isDefault: e.target.checked})} 
             className="w-5 h-5 accent-primary"
           />
           <label htmlFor="defaultAddr" className="dark:text-white text-sm">Make this my default address</label>
        </div>

        <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save Address</Button>
        </div>
      </form>

      {/* Map Modal */}
      {showMapModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
              <div className="bg-white dark:bg-gray-800 w-full h-[80vh] sm:h-[600px] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col relative animate-slide-up">
                   <button onClick={() => setShowMapModal(false)} className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 p-2 rounded-full shadow-md text-gray-500">
                       <X size={20}/>
                   </button>
                   
                   <div className="p-4 border-b dark:border-gray-700">
                       <h3 className="font-bold text-lg dark:text-white">Pin your delivery location</h3>
                       <p className="text-xs text-gray-500">Drag marker to exact location</p>
                   </div>
                   
                   <div className="flex-1 relative">
                        <MapPicker 
                           initialLocation={tempLocation || { lat: 20.5937, lng: 78.9629 }}
                           onLocationSelect={setTempLocation}
                           height="100%"
                        />
                   </div>

                   <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 sm:rounded-b-2xl">
                       <Button onClick={handleMapConfirmation} className="w-full py-3">
                           Confirm Location
                       </Button>
                   </div>
              </div>
          </div>
      )}
    </>
  );
};
