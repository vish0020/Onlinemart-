
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    runTransaction, 
    Timestamp,
    writeBatch
} from "firebase/firestore";
import { 
    signInWithPopup, 
    signInWithRedirect,
    getRedirectResult,
    signOut, 
    onAuthStateChanged,
    User as FirebaseUser,
    AuthError
} from "firebase/auth";
import { db, auth, googleProvider } from "../firebase";
import { Product, User, Order, DeliverySettings, OrderStatus, HeroBanner, Review, Address } from '../types';
import { calculateDrivingDistance } from './mapService';
import { DEFAULT_STORE_LOCATION, DEFAULT_SETTINGS } from '../constants';

// --- Configuration ---
const ADMIN_EMAIL = "onlinemart0020@gmail.com";

export const PRODUCT_CATEGORIES: Record<string, string[]> = {
  "Electronics": ["Mobiles", "Mobile Accessories", "Laptops", "Smartwatches", "Headphones", "Speakers"],
  "Fashion": ["Men", "Women", "Kids", "Watches", "Shoes"],
  "Home & Kitchen": ["Decor", "Kitchenware", "Bedding", "Cleaning"],
  "Beauty & Personal Care": ["Makeup", "Skincare", "Haircare", "Grooming"],
  "Toys & Baby": ["Toys", "Baby Gear", "Clothing"],
  "Grocery": ["Snacks", "Beverages", "Staples"],
  "Sports": ["Fitness", "Outdoor"],
  "Books": ["Fiction", "Academic", "Stationery"]
};

export const MOCK_LOCATIONS = {
    countries: ["India", "USA", "UK", "Canada", "Australia"],
    states: ["Gujarat", "Maharashtra", "Karnataka", "Delhi", "Rajasthan", "Tamil Nadu", "West Bengal"],
    cities: ["Ahmedabad", "Mumbai", "Bangalore", "New Delhi", "Jaipur", "Chennai", "Kolkata", "Surat", "Pune"]
};

// --- Helper: Convert Firestore Doc to Object ---
const convertDoc = <T>(docSnap: any): T => {
    const data = docSnap.data();
    // Convert Timestamps to ISO strings
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
        if (key === 'cancelRequest' && data[key]?.requestedAt instanceof Timestamp) {
            data[key].requestedAt = data[key].requestedAt.toDate().toISOString();
        }
    });
    return { id: docSnap.id, ...data } as T;
};

// --- 4. Core User Logic (The Rebuilt Auth Handler) ---
const handleUserAuth = async (firebaseUser: FirebaseUser): Promise<User> => {
    if (!firebaseUser) throw new Error("No firebase user found");

    const uid = firebaseUser.uid;
    const userRef = doc(db, "users", uid);
    const now = new Date().toISOString();

    // 1. Identify Admin
    const isAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // 2. Prepare Base User Data
    const baseUserData = {
        uid: uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        isAdmin: isAdmin,
        lastLogin: now
    };

    try {
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // Update existing user: Update lastLogin and potentially photo/name if changed
            await updateDoc(userRef, {
                lastLogin: now,
                name: baseUserData.name,
                photoURL: baseUserData.photoURL,
                isAdmin: isAdmin // Ensure admin status is synced
            });
            // Return combined data (DB data takes priority for app-specific fields like 'phone')
            return { ...convertDoc<User>(userSnap), ...baseUserData }; 
        } else {
            // Create new user document
            const newUser = {
                ...baseUserData,
                id: uid,
                createdAt: now
            };
            await setDoc(userRef, newUser);
            return newUser;
        }
    } catch (error) {
        console.error("Firestore User Sync Error (Offline?):", error);
        // Fallback: If Firestore fails (e.g. offline), return the Auth data so the user can still 'login' in UI
        return {
            id: uid,
            ...baseUserData
        };
    }
};

export const api = {
  // --- 7. Helper: Get Current User ---
  getCurrentUser: () => {
      return auth.currentUser;
  },

  // --- Auth: Subscribe (Listener) ---
  subscribeToAuth: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
          try {
              const user = await handleUserAuth(firebaseUser);
              callback(user);
          } catch (e) {
              console.error("Auth State Change Error:", e);
              // Fallback to basic auth if sync fails
              callback({
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || '',
                  photoURL: firebaseUser.photoURL || '',
                  isAdmin: firebaseUser.email === ADMIN_EMAIL,
                  isAnonymous: false
              });
          }
      } else {
          callback(null);
      }
    });
  },

  // --- Auth: Google Popup (Desktop) ---
  loginGoogle: async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return await handleUserAuth(result.user);
    } catch (error: any) {
        const authError = error as AuthError;
        console.error("Google Login Error:", authError.code, authError.message);
        
        // Throw a user-friendly error message
        if (authError.code === 'auth/popup-blocked') {
            throw new Error("Popup blocked. Please allow popups for this site.");
        } else if (authError.code === 'auth/popup-closed-by-user') {
            throw new Error("Login cancelled by user.");
        } else if (authError.code === 'auth/unauthorized-domain') {
            throw new Error("Domain not authorized. Add to Firebase Console.");
        } else if (authError.code === 'auth/cancelled-popup-request') {
             throw new Error("Only one popup allowed at a time.");
        }
        
        throw new Error(authError.message || "Login failed.");
    }
  },

  // --- Auth: Google Redirect (Mobile) ---
  loginGoogleRedirect: async (): Promise<void> => {
      await signInWithRedirect(auth, googleProvider);
  },

  // --- Auth: Check Redirect Result (Mobile) ---
  checkRedirectLogin: async (): Promise<User | null> => {
      try {
          const result = await getRedirectResult(auth);
          if (result) {
              return await handleUserAuth(result.user);
          }
      } catch (error) {
          console.error("Redirect Result Error:", error);
      }
      return null;
  },

  // --- Auth: Logout ---
  logout: async () => {
      await signOut(auth);
  },

  // ---------------------------------------------------------
  // --- Existing Shop Functionality ---
  // ---------------------------------------------------------

  getProducts: async (): Promise<Product[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        return querySnapshot.docs.map(doc => convertDoc<Product>(doc));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
  },
  
  saveProduct: async (product: Product): Promise<void> => {
    const productRef = doc(db, "products", product.id || 'new');
    await setDoc(productRef, product, { merge: true });
  },

  deleteProduct: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "products", id));
  },

  getBanners: async (): Promise<HeroBanner[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "banners"));
        return querySnapshot.docs.map(doc => convertDoc<HeroBanner>(doc));
    } catch (error) { return []; }
  },

  saveBanner: async (banner: HeroBanner): Promise<void> => {
     await setDoc(doc(db, "banners", banner.id), banner, { merge: true });
  },

  deleteBanner: async (id: string): Promise<void> => {
     await deleteDoc(doc(db, "banners", id));
  },

  getAddresses: async (userId: string): Promise<Address[]> => {
    try {
        const q = query(collection(db, "users", userId, "addresses"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertDoc<Address>(doc));
    } catch (error) { return []; }
  },

  saveAddress: async (userId: string, address: Address): Promise<void> => {
    // Basic distance calc logic retained
    if (address.location) {
        const settings = await api.getDeliverySettings();
        if (settings.storeLocation) {
            try {
                const dist = await calculateDrivingDistance(settings.storeLocation, address.location);
                address.distanceFromStore = dist;
            } catch (e) { address.distanceFromStore = 5; }
        }
    } else if (address.distanceFromStore === undefined) {
         const pincodeVal = parseInt(address.pincode.slice(0, 5)) || 38000;
         address.distanceFromStore = (pincodeVal % 10) * 5 + 2; 
    }

    const batch = writeBatch(db);
    if (address.isDefault) {
        const existingRef = collection(db, "users", userId, "addresses");
        const existing = await getDocs(existingRef);
        existing.forEach(doc => { if (doc.data().isDefault) batch.update(doc.ref, { isDefault: false }); });
    }
    const addrRef = doc(db, "users", userId, "addresses", address.id);
    batch.set(addrRef, address);
    await batch.commit();
  },

  deleteAddress: async (userId: string, addressId: string): Promise<void> => {
    await deleteDoc(doc(db, "users", userId, "addresses", addressId));
  },

  getOrders: async (isAdmin: boolean, userId?: string): Promise<Order[]> => {
    try {
        let q;
        if (isAdmin) {
            q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        } else if (userId) {
            q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        } else { return []; }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertDoc<Order>(doc));
    } catch (error) { return []; }
  },

  createOrder: async (order: Order): Promise<void> => {
     await runTransaction(db, async (transaction) => {
         for (const item of order.items) {
             const productRef = doc(db, "products", item.id);
             const productSnap = await transaction.get(productRef);
             if (!productSnap.exists()) throw new Error(`Product ${item.name} not found`);
             const currentStock = productSnap.data().stock;
             if (currentStock < item.quantity) throw new Error(`Insufficient stock for ${item.name}`);
             transaction.update(productRef, { stock: currentStock - item.quantity });
         }
         const orderRef = doc(db, "orders", order.id);
         transaction.set(orderRef, order);
     });
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    await updateDoc(doc(db, "orders", orderId), { status });
  },

  requestOrderCancellation: async (orderId: string, reason: string): Promise<void> => {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
          cancelRequest: { reason, status: 'pending', requestedAt: new Date().toISOString() }
      });
  },

  rejectOrderCancellation: async (orderId: string): Promise<void> => {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { "cancelRequest.status": "rejected" });
  },

  getReviews: async (productId?: string): Promise<Review[]> => {
    try {
        let q = productId 
            ? query(collection(db, "reviews"), where("productId", "==", productId), orderBy("createdAt", "desc"))
            : query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => convertDoc<Review>(doc));
    } catch (error) { return []; }
  },

  addReview: async (review: Review): Promise<void> => {
     await runTransaction(db, async (transaction) => {
         const reviewRef = doc(db, "reviews", review.id);
         transaction.set(reviewRef, review);
         const prodRef = doc(db, "products", review.productId);
         const prodSnap = await transaction.get(prodRef);
         if (!prodSnap.exists()) return;
         const pData = prodSnap.data();
         const currentCount = pData.reviewCount || 0;
         const currentRating = pData.rating || 0;
         const newCount = currentCount + 1;
         const newAvg = ((currentRating * currentCount) + review.rating) / newCount;
         transaction.update(prodRef, { rating: parseFloat(newAvg.toFixed(1)), reviewCount: newCount });
     });
  },

  deleteReview: async (reviewId: string): Promise<void> => {
      await deleteDoc(doc(db, "reviews", reviewId));
  },

  getDeliverySettings: async (): Promise<DeliverySettings> => {
    try {
        const snap = await getDoc(doc(db, "settings", "delivery"));
        if (snap.exists()) return convertDoc<DeliverySettings>(snap);
        return DEFAULT_SETTINGS;
    } catch (error) { return DEFAULT_SETTINGS; }
  },

  saveDeliverySettings: async (settings: DeliverySettings): Promise<void> => {
    await setDoc(doc(db, "settings", "delivery"), settings);
  }
};
