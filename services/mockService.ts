
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
    serverTimestamp,
    limitToLast
} from "firebase/database";
import { 
    signInWithPopup, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile 
} from "firebase/auth";
import { db, auth, googleProvider } from "../firebase";
import { Product, User, Order, DeliverySettings, OrderStatus, HeroBanner, Review, Address, PaymentSettings } from '../types';
import { calculateDrivingDistance } from './mapService';
import { DEFAULT_SETTINGS, DEFAULT_PAYMENT_SETTINGS } from '../constants';

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

// --- CATEGORY DATA STRUCTURE ---
interface CategoryConfig {
    subcategories: string[];
    fields: string[];
}

export const CATEGORY_DATA: Record<string, CategoryConfig> = {
  "Electronics": {
    subcategories: ["Smart TVs", "Speakers", "Headphones", "Smartwatches", "Cameras", "Powerbanks"],
    fields: ["Brand", "Model", "Color", "Warranty", "Battery Capacity", "Connectivity", "In-Box Items", "Return Policy"]
  },
  "Mobiles & Accessories": {
    subcategories: ["Smartphones", "Feature Phones", "Mobile Cases", "Chargers", "USB Cables", "Screen Guards", "Earbuds"],
    fields: ["Brand", "RAM", "Storage", "Color", "Battery", "OS Version", "Warranty", "Box Contents", "Compatible Models"]
  },
  "Computers & Laptops": {
    subcategories: ["Laptops", "Desktops", "Monitors", "Keyboards", "Mouse", "Printers", "Laptop Bags"],
    fields: ["Processor", "RAM", "Storage", "Graphics", "Screen Size", "Warranty", "OS", "Port Types"]
  },
  "Home Appliances": {
    subcategories: ["Refrigerators", "Washing Machines", "AC", "Fans", "Mixer Grinder", "Heaters"],
    fields: ["Brand", "Capacity", "Energy Rating", "Color", "Power Consumption", "Warranty"]
  },
  "Fashion": {
    subcategories: ["Shirts", "T-Shirts", "Jeans", "Kurti", "Saree", "Dresses", "Shorts", "Jackets"],
    fields: ["Gender", "Fabric", "Color", "Size", "Pattern", "Fit Type", "Sleeve Type", "Occasion", "Wash Care"]
  },
  "Beauty & Personal Care": {
    subcategories: ["Makeup", "Skincare", "Haircare", "Perfume", "Grooming"],
    fields: ["Brand", "Skin Type", "Color", "Volume", "Ingredients", "Shelf Life"]
  },
  "Grocery & Essentials": {
    subcategories: ["Oil & Ghee", "Rice & Grains", "Spices", "Snacks", "Beverages", "Breakfast Items"],
    fields: ["Weight", "Brand", "Shelf Life", "Ingredients"]
  },
  "Furniture": {
    subcategories: ["Sofa", "Bed", "Table", "Chair", "Wardrobe"],
    fields: ["Material", "Color", "Dimensions", "Weight Capacity", "Warranty", "Assembly Required"]
  },
  "Home & Kitchen": {
    subcategories: ["Cookware", "Storage Containers", "Kitchen Tools", "Dinner Sets"],
    fields: ["Material", "Color", "Size", "Capacity", "Pack Count"]
  },
  "Sports & Fitness": {
    subcategories: ["Gym Equipment", "Bicycles", "Yoga Mats", "Sports Shoes"],
    fields: ["Size", "Material", "Color", "Weight Capacity"]
  },
  "Toys, Baby & Kids": {
    subcategories: ["Toys", "Baby Clothes", "School Bags", "Diapers"],
    fields: ["Age Group", "Material", "Color", "Size", "Safety Info"]
  },
  "Books & Stationery": {
    subcategories: ["Books", "Notebooks", "Pens", "Office Supplies"],
    fields: ["Author", "Language", "Pages", "Binding Type"]
  },
  "Automotive": {
    subcategories: ["Car Accessories", "Bike Accessories", "Helmets", "Oils & Lubricants"],
    fields: ["Vehicle Type", "Material", "Color", "Compatibility"]
  },
  "Jewellery": {
    subcategories: ["Rings", "Earrings", "Necklaces", "Bracelets"],
    fields: ["Material", "Color", "Size", "Weight", "Occasion"]
  },
  "Footwear": {
    subcategories: ["Sports Shoes", "Casual Shoes", "Sandals", "Slippers"],
    fields: ["Size", "Color", "Material", "Sole Type"]
  },
  "Bags, Luggage & Travel": {
    subcategories: ["Backpacks", "Suitcases", "Handbags"],
    fields: ["Capacity", "Material", "Color", "Warranty"]
  },
  "Pet Supplies": {
    subcategories: ["Dog Food", "Cat Food", "Toys", "Leashes"],
    fields: ["Breed Size", "Weight", "Age Range"]
  },
  "Tools & Industrial": {
    subcategories: ["Power Tools", "Hand Tools", "Safety Equipment"],
    fields: ["Material", "Warranty", "Power Rating"]
  },
  "Health & Wellness": {
    subcategories: ["Supplements", "Medicine (non-prescription)", "Fitness Trackers"],
    fields: ["Ingredients", "Weight", "Expiry"]
  },
  "Home Decor": {
    subcategories: ["Wall Art", "Showpieces", "Lamps", "Clocks"],
    fields: ["Material", "Color", "Size", "Weight"]
  }
};

// Backwards compatibility export if needed, though we will use CATEGORY_DATA primarily
export const PRODUCT_CATEGORIES = Object.keys(CATEGORY_DATA).reduce((acc, key) => {
    acc[key] = CATEGORY_DATA[key].subcategories;
    return acc;
}, {} as Record<string, string[]>);


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

  // --- AUTH: Email Sign Up ---
  signUpWithEmail: async (name: string, email: string, pass: string): Promise<User> => {
      try {
          const result = await createUserWithEmailAndPassword(auth, email, pass);
          // Update profile with name immediately
          await updateProfile(result.user, { displayName: name });
          return await api.syncUserToFirestore({ ...result.user, displayName: name });
      } catch (error) {
          console.error("Sign Up Error", error);
          throw error;
      }
  },

  // --- AUTH: Email Login ---
  loginWithEmail: async (email: string, pass: string): Promise<User> => {
      try {
          const result = await signInWithEmailAndPassword(auth, email, pass);
          return await api.syncUserToFirestore(result.user);
      } catch (error) {
          console.error("Login Error", error);
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

    // 🔥 FIX: remove undefined values before saving to Firebase
    const safeOrder: any = { ...order };

    if (order.paymentDetails) {
        safeOrder.paymentDetails = {
            method: order.paymentDetails.method ?? "COD",
            status: order.paymentDetails.status ?? "PENDING",
            transactionId: order.paymentDetails.transactionId ?? "",
            verifiedAmount: order.paymentDetails.verifiedAmount ?? null,
        };
    } else {
        delete safeOrder.paymentDetails;
    }

    // Save order (Firebase-safe)
    await set(ref(db, `orders/${order.id}`), safeOrder);
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
  },

  // --- Payment Settings ---
  getPaymentSettings: async (): Promise<PaymentSettings> => {
    try {
        const snapshot = await get(ref(db, "settings/payment"));
        if (snapshot.exists()) return snapshot.val();
        return DEFAULT_PAYMENT_SETTINGS;
    } catch (error) { return DEFAULT_PAYMENT_SETTINGS; }
  },

  savePaymentSettings: async (settings: PaymentSettings): Promise<void> => {
    await set(ref(db, "settings/payment"), settings);
  },

  // --- Unique Amount Generator for Payments ---
  getUniquePaymentAmount: async (baseAmount: number): Promise<number> => {
     try {
         // Fetch last 50 orders to check recent amounts
         const snapshot = await get(query(ref(db, 'orders'), limitToLast(50)));
         const orders = snapshotToArray<Order>(snapshot);
         
         const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
         
         // Find decimals used for the SAME base amount in the last 10 minutes
         const usedDecimals = new Set<number>();
         
         orders.forEach(o => {
             const orderTime = new Date(o.createdAt).getTime();
             if (orderTime > tenMinutesAgo) {
                 const total = o.paymentDetails?.verifiedAmount || o.totalAmount;
                 if (Math.floor(total) === Math.floor(baseAmount)) {
                     // Extract decimal part (e.g., 200.15 -> 15)
                     const decimal = Math.round((total - Math.floor(total)) * 100);
                     if (decimal > 0) usedDecimals.add(decimal);
                 }
             }
         });

         // Find a random free slot between .10 and .99
         let attempts = 0;
         while (attempts < 50) {
             const randomDecimal = Math.floor(Math.random() * 90) + 10; // 10 to 99
             if (!usedDecimals.has(randomDecimal)) {
                 return Number((Math.floor(baseAmount) + (randomDecimal / 100)).toFixed(2));
             }
             attempts++;
         }
         
         // Fallback if super crowded (very unlikely)
         return Number((Math.floor(baseAmount) + 0.11).toFixed(2));

     } catch (e) {
         // If DB fail, just add random .11
         return Number((Math.floor(baseAmount) + 0.11).toFixed(2));
     }
  }
};
