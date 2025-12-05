import { 
    ref, 
    get, 
    set, 
    update, 
    remove, 
    query, 
    orderByChild, 
    equalTo, 
    push, 
    child, 
    runTransaction,
    serverTimestamp
} from "firebase/database";
import { signInWithPopup, signOut } from "firebase/auth";
import { db, auth, googleProvider } from "../firebase";
import { Product, User, Order, DeliverySettings, OrderStatus, HeroBanner, Review, Address } from '../types';
import { calculateDrivingDistance } from './mapService';
import { DEFAULT_SETTINGS } from '../constants';

// --- Configuration ---
export const MOCK_LOCATIONS = {
  countries: ["India"],
  states: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Delhi"
  ],
  cities: [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", 
    "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", 
    "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", 
    "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", 
    "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", 
    "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", 
    "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubballi-Dharwad", 
    "Bareilly", "Moradabad", "Mysore", "Gurgaon", "Aligarh", "Jalandhar", "Tiruchirappalli", 
    "Bhubaneswar", "Salem", "Mira-Bhayandar", "Warangal", "Thiruvananthapuram", "Bhiwandi", 
    "Saharanpur", "Guntur", "Amravati", "Bikaner", "Noida", "Jamshedpur", "Bhilai", "Cuttack", 
    "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", 
    "Rourkela", "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", 
    "Loni", "Siliguri", "Jhansi", "Ulhasnagar", "Jammu", "Sangli-Miraj & Kupwad", "Mangalore", 
    "Erode", "Belgaum", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", 
    "Maheshtala"
  ]
};

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

// --- Helper: Convert Object Map to Array ---
const snapshotToArray = <T>(snapshot: any): T[] => {
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ ...data[key], id: key }));
};

export const api = {
  
  // --- AUTH: Google Login & Sync ---
  signInWithGoogle: async (): Promise<User> => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;
          return await api.syncUserToFirestore(firebaseUser);
      } catch (error) {
          console.error("Google Sign-In Error", error);
          throw error;
      }
  },

  // --- AUTH: Sync Firebase User to Realtime DB ---
  syncUserToFirestore: async (firebaseUser: any): Promise<User> => {
      const isHardcodedAdmin = firebaseUser.email === 'onlinemart0020@gmail.com';
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      const userData: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          isAdmin: isHardcodedAdmin, 
          isAnonymous: false,
          lastLogin: new Date().toISOString()
      };

      if (!snapshot.exists()) {
          await set(userRef, { ...userData, createdAt: new Date().toISOString() });
      } else {
          // Force update isAdmin if it's the hardcoded email
          const updates: any = { lastLogin: new Date().toISOString() };
          if (isHardcodedAdmin) {
              updates.isAdmin = true;
          }
          await update(userRef, updates);

          const existingData = snapshot.val();
          
          // CRITICAL FIX: Ensure we use true if either hardcoded or DB says true
          const finalIsAdmin = isHardcodedAdmin || existingData.isAdmin === true;
          
          return { 
              ...userData, 
              ...existingData, 
              id: firebaseUser.uid,
              isAdmin: finalIsAdmin 
          } as User;
      }
      return userData;
  },

  // --- AUTH: Logout ---
  logout: async (): Promise<void> => {
      await signOut(auth);
      localStorage.removeItem('om_uid');
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
      
      // Persist login state
      localStorage.setItem('om_uid', uid);

      try {
        // Attempt to save to DB, but ignore error if permission denied (no auth)
        await set(ref(db, `users/${uid}`), userData);
      } catch (e) {
        console.log("Demo admin DB sync skipped due to permissions (expected for guest)");
      }
      
      return userData;
  },

  // --- DB: Get User Profile ---
  getUserProfile: async (uid: string): Promise<User | null> => {
      try {
          const snapshot = await get(ref(db, `users/${uid}`));
          if (snapshot.exists()) return { ...snapshot.val(), id: uid };
          return null;
      } catch (e) { return null; }
  },

  updateUserProfile: async (userId: string, data: Partial<User>): Promise<void> => {
      await update(ref(db, `users/${userId}`), data);
  },

  // ---------------------------------------------------------
  // --- Shop Functionality (Realtime DB) ---
  // ---------------------------------------------------------

  getProducts: async (): Promise<Product[]> => {
    try {
        const snapshot = await get(ref(db, 'products'));
        return snapshotToArray<Product>(snapshot);
    } catch (error) { return []; }
  },
  
  saveProduct: async (product: Product): Promise<void> => {
    const productId = product.id || push(ref(db, 'products')).key || 'new';
    const productData = { ...product, id: productId };
    await set(ref(db, `products/${productId}`), productData);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await remove(ref(db, `products/${id}`));
  },

  getBanners: async (): Promise<HeroBanner[]> => {
    try {
        const snapshot = await get(ref(db, 'banners'));
        return snapshotToArray<HeroBanner>(snapshot);
    } catch (error) { return []; }
  },

  saveBanner: async (banner: HeroBanner): Promise<void> => {
     const bannerId = banner.id || push(ref(db, 'banners')).key || 'new';
     const bannerData = { ...banner, id: bannerId };
     await set(ref(db, `banners/${bannerId}`), bannerData);
  },

  deleteBanner: async (id: string): Promise<void> => {
     await remove(ref(db, `banners/${id}`));
  },

  getAddresses: async (userId: string): Promise<Address[]> => {
    try {
        const snapshot = await get(ref(db, `users/${userId}/addresses`));
        return snapshotToArray<Address>(snapshot);
    } catch (error) { return []; }
  },

  saveAddress: async (userId: string, address: Address): Promise<void> => {
    // Distance Calculation Logic
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

    const updates: any = {};
    const addrId = address.id || push(ref(db, `users/${userId}/addresses`)).key || 'new';
    
    // Handle Default Address Logic (Reset others if this is default)
    if (address.isDefault) {
        const snapshot = await get(ref(db, `users/${userId}/addresses`));
        if (snapshot.exists()) {
            snapshot.forEach((childSnap) => {
                if (childSnap.val().isDefault) {
                    updates[`users/${userId}/addresses/${childSnap.key}/isDefault`] = false;
                }
            });
        }
    }
    
    updates[`users/${userId}/addresses/${addrId}`] = { ...address, id: addrId };
    await update(ref(db), updates);
  },

  deleteAddress: async (userId: string, addressId: string): Promise<void> => {
    await remove(ref(db, `users/${userId}/addresses/${addressId}`));
  },

  getOrders: async (isAdmin: boolean, userId?: string): Promise<Order[]> => {
    try {
        let orderRef;
        if (isAdmin) {
             const snapshot = await get(query(ref(db, 'orders'), orderByChild('createdAt')));
             return snapshotToArray<Order>(snapshot).reverse(); // Newest first
        } else if (userId) {
             const snapshot = await get(query(ref(db, 'orders'), orderByChild('userId'), equalTo(userId)));
             return snapshotToArray<Order>(snapshot).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return [];
    } catch (error) { return []; }
  },

  createOrder: async (order: Order): Promise<void> => {
      // Use Transaction to handle stock deduction
      for (const item of order.items) {
          const productRef = ref(db, `products/${item.id}`);
          await runTransaction(productRef, (currentData) => {
              if (currentData) {
                  if (currentData.stock < item.quantity) {
                      throw new Error(`Insufficient stock for ${item.name}`);
                  }
                  currentData.stock -= item.quantity;
              }
              return currentData;
          });
      }
      // Save order
      await set(ref(db, `orders/${order.id}`), order);
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    await update(ref(db, `orders/${orderId}`), { status });
  },

  requestOrderCancellation: async (orderId: string, reason: string): Promise<void> => {
      await update(ref(db, `orders/${orderId}`), {
          cancelRequest: { reason, status: 'pending', requestedAt: new Date().toISOString() }
      });
  },

  rejectOrderCancellation: async (orderId: string): Promise<void> => {
      await update(ref(db, `orders/${orderId}/cancelRequest`), { status: "rejected" });
  },

  getReviews: async (productId?: string): Promise<Review[]> => {
    try {
        let q = productId 
            ? query(ref(db, "reviews"), orderByChild("productId"), equalTo(productId))
            : ref(db, "reviews");
        
        const snapshot = await get(q);
        return snapshotToArray<Review>(snapshot).reverse();
    } catch (error) { return []; }
  },

  addReview: async (review: Review): Promise<void> => {
     const reviewId = review.id;
     await set(ref(db, `reviews/${reviewId}`), review);
     
     // Update Product Rating
     const productRef = ref(db, `products/${review.productId}`);
     await runTransaction(productRef, (product) => {
         if (product) {
             const newCount = (product.reviewCount || 0) + 1;
             const newAvg = ((product.rating || 0) * (product.reviewCount || 0) + review.rating) / newCount;
             product.rating = parseFloat(newAvg.toFixed(1));
             product.reviewCount = newCount;
         }
         return product;
     });
  },

  deleteReview: async (reviewId: string): Promise<void> => {
      await remove(ref(db, `reviews/${reviewId}`));
  },

  getDeliverySettings: async (): Promise<DeliverySettings> => {
    try {
        const snapshot = await get(ref(db, "settings/delivery"));
        if (snapshot.exists()) return snapshot.val();
        return DEFAULT_SETTINGS;
    } catch (error) { return DEFAULT_SETTINGS; }
  },

  saveDeliverySettings: async (settings: DeliverySettings): Promise<void> => {
    await set(ref(db, "settings/delivery"), settings);
  }
};