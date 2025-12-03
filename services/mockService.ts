
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
    limit, 
    runTransaction, 
    Timestamp,
    addDoc,
    writeBatch
} from "firebase/firestore";
import { 
    signInWithPopup, 
    signInWithRedirect,
    getRedirectResult,
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInAnonymously,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser
} from "firebase/auth";
import { db, auth, googleProvider } from "../firebase";
import { Product, User, Order, DeliverySettings, OrderStatus, HeroBanner, Review, Address } from '../types';
import { calculateDrivingDistance } from './mapService';
import { DEFAULT_STORE_LOCATION } from '../constants';

// --- Constants (Preserved for UI) ---

export const PRODUCT_CATEGORIES: Record<string, string[]> = {
  "Electronics": ["Mobiles", "Mobile Accessories", "Laptops", "Laptop Accessories", "Smartwatches", "Headphones & Earbuds", "Speakers", "Tablets", "Power Banks", "Cameras", "Camera Accessories", "Televisions", "Smart Home Devices", "Computer Components"],
  "Fashion": [
    "Men - T-Shirts", "Men - Shirts", "Men - Jeans", "Men - Trousers", "Men - Shorts", "Men - Watches", "Men - Shoes",
    "Women - Kurtis", "Women - Sarees", "Women - Tops", "Women - Jeans", "Women - Dresses", "Women - Footwear", "Women - Jewelry",
    "Kids - Boys Clothing", "Kids - Girls Clothing", "Kids - Footwear"
  ],
  "Home & Kitchen": ["Bedsheets", "Pillow Covers", "Kitchen Storage", "Cookware", "Wall Decor", "Tableware & Dinner Set", "Home Cleaning", "Tools", "Home Appliances"],
  "Beauty & Personal Care": ["Makeup", "Skincare", "Haircare", "Perfumes", "Grooming", "Beard Care", "Bath & Body", "Beauty Tools"],
  "Bags, Shoes & Accessories": ["Backpacks", "Handbags", "Sling Bags", "Wallets", "Travel Bags", "Luggage", "Belts", "Caps", "Sunglasses", "Shoes", "Sandals"],
  "Toys, Kids & Baby": ["Toys", "Baby Clothing", "Baby Care", "Learning Toys", "Soft Toys"],
  "Grocery & Food": ["Snacks", "Beverages", "Dry Fruits", "Household supplies", "Grains & Spices", "Oils & Ghee", "Tea & Coffee", "Biscuits"],
  "Tools & Automotive": ["Tools", "Automotive Accessories", "Car Care", "Bike Accessories"],
  "Sports & Fitness": ["Yoga Mats", "Dumbbells", "Fitness Bands", "Sportswear"],
  "Pet Supplies": ["Dog Food", "Cat Food", "Pet Grooming", "Toys", "Leashes"],
  "Books & Stationery": ["Books", "Notebooks", "Pens & Pencils", "Art Supplies", "Office Supplies"],
  "Appliances": ["Small appliances", "Large appliances", "Kitchen appliances"],
  "Housekeeping & Cleaning": ["Mops", "Cleaning liquids", "Brooms", "Dustbins"],
  "Gifts & Seasonal": ["Birthday gifts", "Anniversary gifts", "Festival specials", "Decorative hampers"],
  "Gaming": ["Gaming accessories", "Gamepads", "Gaming earphones"]
};

export const MOCK_LOCATIONS = {
  countries: ["India", "United States", "United Kingdom", "Canada", "Australia", "UAE"],
  states: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry"
  ],
  cities: [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", 
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Delhi", "Bangalore", "Hyderabad", "Chennai", 
    "Kolkata", "Jaipur", "Lucknow", "Kanpur", "Indore", "Bhopal", "Patna", "Ludhiana", "Agra"
  ]
};

const DEFAULT_SETTINGS: DeliverySettings = {
    baseCharge: 40,
    perKmCharge: 4,
    freeDeliveryAbove: 999,
    codEnabled: true,
    estimatedDays: "4–7",
    serviceablePincodes: [],
    storeLocation: DEFAULT_STORE_LOCATION
};

// --- Helper Functions ---

const convertDoc = <T>(docSnap: any): T => {
    const data = docSnap.data();
    // Convert Firestore Timestamps to ISO strings for UI
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
        // Handle nested timestamp in cancelRequest
        if (key === 'cancelRequest' && data[key]?.requestedAt instanceof Timestamp) {
            data[key].requestedAt = data[key].requestedAt.toDate().toISOString();
        }
    });
    return { id: docSnap.id, ...data } as T;
};

// Helper to handle user document creation/retrieval for any auth method
const handleUserAuth = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let userData: User;

    if (userSnap.exists()) {
        userData = convertDoc<User>(userSnap);
    } else {
        // Create new user
        userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'User'),
            photoURL: firebaseUser.photoURL || '',
            isAdmin: false, // Default to false. Must be set manually in Firestore Console.
            isAnonymous: firebaseUser.isAnonymous
        };
        await setDoc(userRef, userData);
    }

    return userData;
};

// --- API Service (Firebase Implementation) ---

export const api = {
  // Products
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
    try {
        const productRef = doc(db, "products", product.id || 'new');
        await setDoc(productRef, product, { merge: true });
    } catch (error) {
        console.error("Error saving product:", error);
        throw error;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "products", id));
  },

  // Banners
  getBanners: async (): Promise<HeroBanner[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "banners"));
        return querySnapshot.docs.map(doc => convertDoc<HeroBanner>(doc));
    } catch (error) {
        console.error("Error fetching banners:", error);
        return [];
    }
  },

  saveBanner: async (banner: HeroBanner): Promise<void> => {
     await setDoc(doc(db, "banners", banner.id), banner, { merge: true });
  },

  deleteBanner: async (id: string): Promise<void> => {
     await deleteDoc(doc(db, "banners", id));
  },

  // Auth Subscription (Handles Redirect & Persistence)
  subscribeToAuth: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
            const user = await handleUserAuth(firebaseUser);
            callback(user);
        } catch (e) {
            console.error("Auth state change error", e);
            callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  // Auth - Google
  login: async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return await handleUserAuth(result.user);
    } catch (error: any) {
        console.error("Login failed:", error);
        if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
            throw new Error("Google Sign-In is not enabled. Please enable it in Firebase Console.");
        }
        if (error.code === 'auth/popup-closed-by-user') {
             throw new Error("Login cancelled.");
        }
        if (error.code === 'auth/unauthorized-domain') {
             throw new Error(`Domain not authorized. Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized Domains.`);
        }
        throw error;
    }
  },

  // Auth - Google Redirect (For Mobile)
  loginGoogleRedirect: async (): Promise<void> => {
      await signInWithRedirect(auth, googleProvider);
  },

  checkRedirectLogin: async (): Promise<User | null> => {
      try {
          const result = await getRedirectResult(auth);
          if (result) {
              return await handleUserAuth(result.user);
          }
      } catch (error: any) {
          console.error("Redirect Login Error:", error);
           if (error.code === 'auth/unauthorized-domain') {
             throw new Error(`Domain not authorized. Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized Domains.`);
        }
      }
      return null;
  },

  // Auth - Email/Password
  loginEmail: async (email: string, pass: string): Promise<User> => {
      try {
          const result = await signInWithEmailAndPassword(auth, email, pass);
          return await handleUserAuth(result.user);
      } catch (error: any) {
          console.error("Email Login Error:", error);
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') throw new Error("Invalid email or password.");
          if (error.code === 'auth/user-not-found') throw new Error("User not found.");
          throw error;
      }
  },

  registerEmail: async (name: string, email: string, pass: string): Promise<User> => {
      try {
          const result = await createUserWithEmailAndPassword(auth, email, pass);
          await updateProfile(result.user, { displayName: name });
          return await handleUserAuth(result.user);
      } catch (error: any) {
          console.error("Registration Error:", error);
          if (error.code === 'auth/email-already-in-use') throw new Error("Email already in use.");
          if (error.code === 'auth/weak-password') throw new Error("Password should be at least 6 characters.");
          throw error;
      }
  },

  // Auth - Anonymous
  loginAnonymous: async (): Promise<User> => {
      try {
          const result = await signInAnonymously(auth);
          return await handleUserAuth(result.user);
      } catch (error: any) {
          console.error("Anonymous Login Error:", error);
          if (error.code === 'auth/operation-not-allowed') throw new Error("Anonymous auth is not enabled in Firebase Console.");
          throw error;
      }
  },

  logout: async () => {
      await signOut(auth);
  },

  // Addresses
  getAddresses: async (userId: string): Promise<Address[]> => {
    try {
        const q = query(collection(db, "users", userId, "addresses"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertDoc<Address>(doc));
    } catch (error) {
        console.error("Error fetching addresses:", error);
        return [];
    }
  },

  saveAddress: async (userId: string, address: Address): Promise<void> => {
    // 1. Calculate distance before saving if location is present
    if (address.location) {
        const settings = await api.getDeliverySettings();
        if (settings.storeLocation) {
            try {
                const dist = await calculateDrivingDistance(settings.storeLocation, address.location);
                address.distanceFromStore = dist;
            } catch (e) {
                console.error("Distance Calc Error", e);
                address.distanceFromStore = 5; 
            }
        }
    } else if (address.distanceFromStore === undefined) {
         // Fallback logic
         const pincodeVal = parseInt(address.pincode.slice(0, 5)) || 38000;
         address.distanceFromStore = (pincodeVal % 10) * 5 + 2; 
    }

    const batch = writeBatch(db);

    // 2. If default, unset others
    if (address.isDefault) {
        const existingRef = collection(db, "users", userId, "addresses");
        const existing = await getDocs(existingRef);
        existing.forEach(doc => {
            if (doc.data().isDefault) {
                batch.update(doc.ref, { isDefault: false });
            }
        });
    }

    // 3. Save new address
    const addrRef = doc(db, "users", userId, "addresses", address.id);
    batch.set(addrRef, address);
    
    await batch.commit();
  },

  deleteAddress: async (userId: string, addressId: string): Promise<void> => {
    await deleteDoc(doc(db, "users", userId, "addresses", addressId));
  },

  // Orders
  getOrders: async (isAdmin: boolean, userId?: string): Promise<Order[]> => {
    try {
        let q;
        if (isAdmin) {
            q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        } else if (userId) {
            q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        } else {
            return [];
        }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertDoc<Order>(doc));
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
  },

  createOrder: async (order: Order): Promise<void> => {
     try {
         await runTransaction(db, async (transaction) => {
             for (const item of order.items) {
                 const productRef = doc(db, "products", item.id);
                 const productSnap = await transaction.get(productRef);
                 
                 if (!productSnap.exists()) {
                     throw new Error(`Product ${item.name} does not exist!`);
                 }
                 
                 const currentStock = productSnap.data().stock;
                 if (currentStock < item.quantity) {
                     throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}`);
                 }
                 
                 transaction.update(productRef, { stock: currentStock - item.quantity });
             }

             const orderRef = doc(db, "orders", order.id);
             transaction.set(orderRef, order);
         });
     } catch (error) {
         console.error("Order creation failed:", error);
         throw error;
     }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    await updateDoc(doc(db, "orders", orderId), { status });
  },

  requestOrderCancellation: async (orderId: string, reason: string): Promise<void> => {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
          cancelRequest: {
              reason,
              status: 'pending',
              requestedAt: new Date().toISOString()
          }
      });
  },

  rejectOrderCancellation: async (orderId: string): Promise<void> => {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
          "cancelRequest.status": "rejected"
      });
  },

  // Reviews
  getReviews: async (productId?: string): Promise<Review[]> => {
    try {
        let q;
        if (productId) {
            q = query(collection(db, "reviews"), where("productId", "==", productId), orderBy("createdAt", "desc"));
        } else {
            q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        }
        const snap = await getDocs(q);
        return snap.docs.map(doc => convertDoc<Review>(doc));
    } catch (error) {
        console.error("Error getting reviews:", error);
        return [];
    }
  },

  addReview: async (review: Review): Promise<void> => {
     try {
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

             transaction.update(prodRef, {
                 rating: parseFloat(newAvg.toFixed(1)),
                 reviewCount: newCount
             });
         });
     } catch (error) {
         console.error("Error adding review:", error);
         throw error;
     }
  },

  deleteReview: async (reviewId: string): Promise<void> => {
      await deleteDoc(doc(db, "reviews", reviewId));
  },

  // Settings
  getDeliverySettings: async (): Promise<DeliverySettings> => {
    try {
        const snap = await getDoc(doc(db, "settings", "delivery"));
        if (snap.exists()) {
            return convertDoc<DeliverySettings>(snap);
        }
        return DEFAULT_SETTINGS;
    } catch (error) {
        return DEFAULT_SETTINGS;
    }
  },

  saveDeliverySettings: async (settings: DeliverySettings): Promise<void> => {
    await setDoc(doc(db, "settings", "delivery"), settings);
  }
};
