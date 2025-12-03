import React, { createContext, useContext, useReducer, useState, ReactNode, PropsWithChildren } from 'react';
import { AppState, Product, User, DeliverySettings, HeroBanner, Address, CartItem } from './types';
import { DEFAULT_STORE_LOCATION } from './constants';

// --- State Management ---
export const initialState: AppState = {
  products: [],
  orders: [],
  cart: [],
  user: null,
  addresses: [],
  deliverySettings: { 
    baseCharge: 0, 
    perKmCharge: 0, 
    freeDeliveryAbove: 0, 
    codEnabled: true, 
    estimatedDays: '', 
    serviceablePincodes: [],
    storeLocation: DEFAULT_STORE_LOCATION
  },
  wishlist: [],
  darkMode: false,
  searchQuery: '',
  banners: []
};

export type Action = 
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ADDRESSES'; payload: Address[] }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'UPDATE_CART_QTY'; payload: { id: string; delta: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_WISHLIST'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SETTINGS'; payload: DeliverySettings }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_BANNERS'; payload: HeroBanner[] }
  | { type: 'DELETE_BANNER'; payload: string };

export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_PRODUCTS': return { ...state, products: action.payload };
    case 'SET_USER': return { ...state, user: action.payload };
    case 'SET_ADDRESSES': return { ...state, addresses: action.payload };
    case 'ADD_TO_CART': {
      const existing = state.cart.find(item => item.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(item => item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item)
        };
      }
      return { ...state, cart: [...state.cart, { ...action.payload, quantity: 1 }] };
    }
    case 'UPDATE_CART_QTY': {
      return {
        ...state,
        cart: state.cart.map(item => {
          if (item.id === action.payload.id) {
            return { ...item, quantity: Math.max(0, item.quantity + action.payload.delta) };
          }
          return item;
        }).filter(item => item.quantity > 0)
      };
    }
    case 'CLEAR_CART': return { ...state, cart: [] };
    case 'TOGGLE_WISHLIST': {
      const exists = state.wishlist.includes(action.payload);
      return {
        ...state,
        wishlist: exists ? state.wishlist.filter(id => id !== action.payload) : [...state.wishlist, action.payload]
      };
    }
    case 'TOGGLE_THEME': {
      const newMode = !state.darkMode;
      if (newMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return { ...state, darkMode: newMode };
    }
    case 'SET_SEARCH': return { ...state, searchQuery: action.payload };
    case 'SET_SETTINGS': return { ...state, deliverySettings: action.payload };
    case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'LOGOUT': return { ...state, user: null, cart: [], wishlist: [], addresses: [] };
    case 'SET_BANNERS': return { ...state, banners: action.payload };
    case 'DELETE_BANNER': return { ...state, banners: state.banners.filter(b => b.id !== action.payload) };
    default: return state;
  }
};

const AppContext = createContext<{ 
  state: AppState; 
  dispatch: React.Dispatch<Action>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  pendingRedirect: string | null;
  setPendingRedirect: (path: string | null) => void;
} | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      showLoginModal, 
      setShowLoginModal,
      pendingRedirect,
      setPendingRedirect
    }}>
      {children}
    </AppContext.Provider>
  );
};