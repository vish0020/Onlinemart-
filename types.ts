
export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  isAdmin: boolean;
  phone?: string;
  isAnonymous?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  subcategory?: string;
  images: string[]; // URLs
  video?: string; // Optional Video URL
  stock: number;
  rating: number;
  reviewCount: number;
  tags?: string[];
  isFeatured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus = 'Ordered' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  country: string;
  state: string;
  city: string;
  area: string;
  landmark: string;
  line1: string; // House No, Building, Street
  isDefault: boolean;
  location?: Location; // Stored coordinates
  distanceFromStore?: number; // Calculated distance in km
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  deliveryCharge: number;
  status: OrderStatus;
  createdAt: string; // ISO String
  shippingAddress: Address;
  paymentMethod: 'COD' | 'Online';
  cancelRequest?: {
    reason: string;
    status: 'pending' | 'rejected' | 'approved';
    requestedAt: string;
  };
}

export interface DeliverySettings {
  baseCharge: number;
  perKmCharge: number;
  freeDeliveryAbove: number;
  codEnabled: boolean;
  estimatedDays: string;
  serviceablePincodes: string[];
  storeLocation: Location; // Admin store location
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  isVisible: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1-5
  comment: string;
  images: string[];
  createdAt: string;
  verifiedPurchase: boolean;
  likes: number;
}

export interface AppState {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  user: User | null;
  addresses: Address[];
  deliverySettings: DeliverySettings;
  wishlist: string[]; // Product IDs
  darkMode: boolean;
  searchQuery: string;
  banners: HeroBanner[];
}
