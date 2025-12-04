
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
import { signInWithPopup } from "firebase/auth";
import { db, auth, googleProvider } from "../firebase";
import { Product, User, Order, DeliverySettings, OrderStatus, HeroBanner, Review, Address } from '../types';
import { calculateDrivingDistance } from './mapService';
import { DEFAULT_STORE_LOCATION, DEFAULT_SETTINGS } from '../constants';

// --- Configuration ---
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

export const api = {
  
  // --- AUTH: Google Login ---
  signInWithGoogle: async (): Promise<User> => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          const isAdmin = user.email === 'onlinemart0020@gmail.com';
          
          const userData: User = {
              id: user.uid,
              name: user.displayName || 'User',
              email: user.email || '',
              photoURL: user.photoURL || '',
              isAdmin: isAdmin,
              isAnonymous: false,
              lastLogin: new Date().toISOString()
          };

          // Save/Update user in Firestore
          await setDoc(doc(db, "users", user.uid), userData, { merge: true });
          localStorage.setItem('om_uid', user.uid);
          return userData;
      } catch (error) {
          console.error("Google Sign-In Error", error);
          throw error;
      }
  },

  // --- AUTH: Demo Admin Login ---
  loginAsDemoAdmin: async (): Promise<User> => {
      const uid = 'demo_admin_user';
      const userData: User = {
          id: uid,
          name: 'Demo Admin',
          email: 'admin@demo.com',
          photoURL: 'https://ui-avatars.com/api/?name=Admin&background=FFD700&color=000',
          isAdmin: true,
          isAnonymous: false,
          lastLogin: new Date().toISOString()
      };
      
      // Save to Firestore to ensure rules pass
      await setDoc(doc(db, "users", uid), userData, { merge: true });
      localStorage.setItem('om_uid', uid);
      return userData;
  },

  // --- SESSION: Initialize Guest/Persistent User ---
  initializeSession: async (): Promise<User> => {
      let uid = localStorage.getItem('om_uid');
      
      // Check if it's the demo admin ID
      if (uid === 'demo_admin_user') {
           const adminUser = await api.loginAsDemoAdmin();
           return adminUser;
      }

      if (!uid) {
          uid = 'user_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('om_uid', uid);
      }

      // Default Local Guest Object
      const localUser: User = {
          id: uid,
          name: "Guest User",
          email: "guest@onlinemart.com",
          photoURL: "",
          isAdmin: false,
          isAnonymous: true,
          lastLogin: new Date().toISOString()
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return localUser;
      }

      const userRef = doc(db, "users", uid);
      
      try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
              const userData = convertDoc<User>(userSnap);
              updateDoc(userRef, { lastLogin: new Date().toISOString() }).catch(() => {});
              return userData;
          } else {
              // Create new Guest User in DB
              await setDoc(userRef, localUser);
              return localUser;
          }
      } catch (e) {
          return localUser;
      }
  },

  // --- Update User Profile (Name/Admin Status) ---
  updateUserProfile: async (userId: string, data: Partial<User>): Promise<void> => {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, data);
      } catch (e) {
          console.warn("Update profile failed:", e);
      }
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
