import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp,
  documentId,
  increment,
  deleteDoc,
  runTransaction
} from "firebase/firestore";
import "firebase/compat/storage";
import { firebaseConfig } from "../components/firebaseConfig";
import { UserProfile, Post, Chat, Comment, Group, GroupMessage, NFTTemplate, NFTInstance, Report, WalletTransaction, WithdrawalRequest, AppNotification } from "../types";

// Initialize Firebase (Safely)
const app = firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = getFirestore(app as any);
export const storage = firebase.storage();

// --- Auth Helpers ---

export const resetPassword = async (email: string) => {
  await auth.sendPasswordResetEmail(email);
};

export const updateUserPassword = async (newPassword: string) => {
  if (!auth.currentUser) throw new Error("No user logged in");
  await auth.currentUser.updatePassword(newPassword);
};

// --- NFT Catalog (Templates) ---
export interface Gift {
  id: string;
  name: string;
  price: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation?: 'float' | 'pulse' | 'launch' | 'bounce' | 'spin' | 'pop';
}

export const GIFTS: Gift[] = [
  { id: 'g1', name: 'Мишка', price: 1500, icon: '🧸', rarity: 'rare', animation: 'bounce' },
  { id: 'g2', name: 'Ракета', price: 10000, icon: '🚀', rarity: 'legendary', animation: 'launch' },
  { id: 'g3', name: 'Луна', price: 5000, icon: '🌙', rarity: 'epic', animation: 'float' },
];

const BEAR_BACKGROUNDS = [
  'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
  'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)'
];

// Note: imageUrl is now empty string because we use Generative CSS <NFTVisual />
export const NFT_TEMPLATES: NFTTemplate[] = [
  // --- TIER 1: BASICS ---
  {
    id: 'solar_flare',
    name: 'SOLAR FLARE',
    description: 'Энергия звезды в чистом виде.',
    cssGradient: '', 
    imageUrl: '', 
    accentColor: '#FF4500',
    price: 5000,
    rarity: 'Common'
  },
  {
    id: 'deep_ocean',
    name: 'DEEP OCEAN',
    description: 'Спокойствие глубины.',
    cssGradient: '',
    imageUrl: '', 
    accentColor: '#00BFFF',
    price: 10000,
    rarity: 'Common'
  },
  
  // --- TIER 2: ELEMENTS ---
  {
    id: 'emerald_roots',
    name: 'EMERALD ROOTS',
    description: 'Сила природы. Живая материя.',
    cssGradient: '',
    imageUrl: '', 
    accentColor: '#2ECC71',
    price: 20000,
    rarity: 'Rare'
  },
  {
    id: 'zeus_bolt',
    name: 'ZEUS BOLT',
    description: 'Электрический разряд богов.',
    cssGradient: '',
    imageUrl: '', 
    accentColor: '#FFD700',
    price: 30000,
    rarity: 'Rare'
  },

  // --- TIER 3: LEGENDS ---
  {
    id: 'frozen_shard',
    name: 'FROZEN SHARD',
    description: 'Вечный холод. Кристальная чистота.',
    cssGradient: '',
    imageUrl: '',
    accentColor: '#A5F2F3',
    price: 50000,
    rarity: 'Legendary'
  },
  {
    id: 'neon_glitch',
    name: 'NEON GLITCH',
    description: 'Ошибка в коде реальности.',
    cssGradient: '',
    imageUrl: '', 
    accentColor: '#FF00FF',
    price: 75000,
    rarity: 'Legendary'
  },
  {
    id: 'midas_touch',
    name: 'MIDAS TOUCH',
    description: 'Символ абсолютной власти и богатства.',
    cssGradient: '',
    imageUrl: '', 
    accentColor: '#DAA520',
    price: 100000,
    rarity: 'Legendary'
  },

  // --- TIER 4: GODLIKE ---
  {
    id: 'void_genesis',
    name: 'VOID GENESIS',
    description: 'Изначальная материя. The Architect\'s Choice.',
    cssGradient: '',
    imageUrl: '', 
    accentColor: '#FFFFFF', 
    price: 1000000, 
    rarity: 'Artifact'
  },
  {
    id: 'diamond_heart',
    name: 'DIAMOND HEART',
    description: 'Символ чистой любви и преданности.',
    cssGradient: '',
    imageUrl: '',
    accentColor: '#E91E63',
    price: 500,
    rarity: 'Common'
  },
  {
    id: 'golden_crown',
    name: 'GOLDEN CROWN',
    description: 'Для истинных королей чата.',
    cssGradient: '',
    imageUrl: '',
    accentColor: '#FFD700',
    price: 5000,
    rarity: 'Rare'
  }
];

// --- Helpers ---
export const getTemplateById = (id: string) => NFT_TEMPLATES.find(t => t.id === id);

// --- System / Maintenance ---

export const setMaintenanceMode = async (enabled: boolean) => {
  try {
    await setDoc(doc(db, "settings", "global"), {
      maintenanceMode: enabled,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    console.error("Failed to set maintenance mode", e);
    throw e;
  }
};

export const setSkCoinPrice = async (price: number) => {
  try {
    await setDoc(doc(db, "settings", "global"), {
      skCoinPrice: price,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    console.error("Failed to set SK Coin price", e);
    throw e;
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the app, but we log it clearly
}

export const subscribeToSystemStatus = (callback: (status: { maintenanceMode: boolean, skCoinPrice: number }) => void) => {
  return onSnapshot(doc(db, "settings", "global"), (doc) => {
    const defaultStatus = { maintenanceMode: false, skCoinPrice: 0.000123 };
    if (doc.exists()) {
      const data = doc.data();
      callback({
        maintenanceMode: data.maintenanceMode ?? false,
        skCoinPrice: data.skCoinPrice ?? 0.000123
      });
    } else {
      callback(defaultStatus);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, "settings/global");
    callback({ maintenanceMode: false, skCoinPrice: 0.000123 });
  });
};

// --- Admin Stats ---
export const subscribeToAppStats = (callback: (stats: { total: number, online: number }) => void) => {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    const total = snapshot.size;
    const online = snapshot.docs.filter(d => {
       const data = d.data() as UserProfile;
       return data.privacySettings?.showOnline !== false; 
    }).length;
    callback({ total, online });
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, "users");
    callback({ total: 0, online: 0 });
  });
};

// --- Reporting System ---

export const submitReport = async (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => {
  await addDoc(collection(db, "reports"), {
    ...report,
    status: 'pending',
    createdAt: Date.now()
  });
};

export const subscribeToReports = (callback: (reports: Report[]) => void) => {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
    callback(reports);
  });
};

export const resolveReport = async (reportId: string) => {
  await updateDoc(doc(db, "reports", reportId), {
    status: 'resolved'
  });
};

// --- Payment Requests ---

export const submitPaymentRequest = async (uid: string, senderName: string, amountRub: number, amountSk: number) => {
  await addDoc(collection(db, "payment_requests"), {
    uid,
    senderName,
    amount: amountRub,
    amountSk,
    status: 'pending',
    createdAt: Date.now()
  });
};

export const subscribeToPaymentRequests = (callback: (requests: PaymentRequest[]) => void) => {
  const q = query(collection(db, "payment_requests"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRequest));
    callback(requests);
  }, (error) => {
    console.error("Payment requests error (possibly missing index):", error);
    callback([]);
  });
};

export const approvePaymentRequest = async (requestId: string, uid: string, amountSk?: number) => {
  await runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "payment_requests", requestId);
    const userRef = doc(db, "users", uid);

    transaction.update(requestRef, { status: 'approved' });
    
    // If it was a top-up request
    if (amountSk && amountSk > 0) {
      transaction.update(userRef, {
        walletBalance: increment(amountSk)
      });
      
      // Log transaction
      const transRef = doc(collection(db, "wallet_transactions"));
      transaction.set(transRef, {
        uid,
        type: 'purchase',
        amount: amountSk,
        skCoinPriceAtTime: 0, // Not relevant for manual top-up
        status: 'completed',
        createdAt: Date.now()
      });
    } else {
      // Default behavior: Premium for 1 month (30 days)
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      const premiumUntil = Date.now() + oneMonth;
      
      transaction.update(userRef, { 
        isVerified: true, 
        role: 'Premium',
        premiumUntil: premiumUntil
      });
    }
  });
};

export const banUser = async (uid: string) => {
  await updateDoc(doc(db, "users", uid), {
    isBanned: true,
    bio: "⛔ ACCCOUNT SUSPENDED BY ARCHITECT ⛔"
  });
};

// --- User Management ---

export const checkHandleAvailability = async (handle: string): Promise<boolean> => {
  const q = query(collection(db, "users"), where("handle", "==", handle));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

export const getUserByHandle = async (handle: string): Promise<UserProfile | null> => {
  // Handles are unique
  const q = query(collection(db, "users"), where("handle", "==", handle));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile;
};

export const getUserByIdOrHandle = async (idOrHandle: string): Promise<UserProfile | null> => {
  if (!idOrHandle) return null;
  
  const normalized = idOrHandle.trim();

  // Try by handle first (if it starts with @)
  if (normalized.startsWith('@')) {
    return getUserByHandle(normalized);
  }
  
  // Try as SK Wallet ID
  if (normalized.toUpperCase().startsWith('SK-')) {
    const q = query(collection(db, "users"), where("walletId", "==", normalized.toUpperCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile;
    }
  }

  // Try as UID
  try {
    const userDoc = await getDoc(doc(db, "users", normalized));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
  } catch (e) {
    // Not a valid UID or other error
  }
  
  // Try as handle without @
  return getUserByHandle('@' + normalized);
};

export const createUserDocument = async (uid: string, data: Pick<UserProfile, 'handle' | 'photoURL' | 'isVerified' | 'isAdmin' | 'role'>) => {
  // Logic for Admins balance
  let startBalance = 50; // New users get 50 SK
  if (data.handle === '@amir' || data.handle === '@skwiz') {
    data.isVerified = true;
    data.isAdmin = true;
    startBalance = 1000000000;
  }
  
  await setDoc(doc(db, "users", uid), {
    uid,
    ...data,
    following: [],
    followers: [],
    savedPosts: [],
    selectedNftId: null,
    bio: '',
    walletBalance: startBalance,
    walletId: `SK-${uid.slice(0, 6).toUpperCase()}`,
    xp: 0,
    level: 1,
    privacySettings: {
      showOnline: true,
      allowDirectMessages: true
    },
    createdAt: Date.now()
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data() as UserProfile;
      // Auto-Admin balance fix
      if ((userData.handle === '@amir' || userData.handle === '@skwiz') && (userData.walletBalance || 0) < 1000000000) {
          updateDoc(docRef, {
             walletBalance: 1000000000,
             isAdmin: true,
             isVerified: true
          }).catch(console.error);
          userData.walletBalance = 1000000000;
          userData.isAdmin = true;
          userData.isVerified = true;
      }
      return userData;
    }
    return null;
  } catch (e) {
    console.error("Error getting user profile:", e);
    return null;
  }
};

export const subscribeToUserProfile = (uid: string, callback: (user: UserProfile) => void) => {
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    }
  });
};

export const updateUserAvatar = async (uid: string, file: File): Promise<string> => {
  const compressed = await compressImage(file);
  const url = await uploadFile(compressed, `avatars/${uid}_${Date.now()}`);
  await updateDoc(doc(db, "users", uid), { photoURL: url });
  return url;
};

export const updateUserBio = async (uid: string, bio: string) => {
  await updateDoc(doc(db, "users", uid), { bio });
};

export const updateUserHandle = async (uid: string, newHandle: string) => {
  const isAvailable = await checkHandleAvailability(newHandle);
  if (!isAvailable) throw new Error("Handle занят");
  await updateDoc(doc(db, "users", uid), { handle: newHandle });
};

export const updatePrivacySettings = async (uid: string, settings: { showOnline?: boolean, allowDirectMessages?: boolean }) => {
  await updateDoc(doc(db, "users", uid), { privacySettings: settings });
};

export const deleteUserAccount = async (targetUid: string) => {
  await deleteDoc(doc(db, "users", targetUid));
  const q = query(collection(db, "posts"), where("authorUid", "==", targetUid));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

// --- Notifications ---

export const createNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
  await addDoc(collection(db, "notifications"), {
    ...notification,
    isRead: false,
    createdAt: Date.now()
  });
};

export const subscribeToNotifications = (uid: string, callback: (notifications: AppNotification[]) => void) => {
  const q = query(
    collection(db, "notifications"),
    where("recipientUid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as AppNotification));
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, "notifications");
    callback([]);
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true
  });
};

export const markAllNotificationsAsRead = async (uid: string) => {
  const q = query(collection(db, "notifications"), where("recipientUid", "==", uid), where("isRead", "==", false));
  const snapshot = await getDocs(q);
  const batch = snapshot.docs.map(doc => updateDoc(doc.ref, { isRead: true }));
  await Promise.all(batch);
};

export const subscribeToUnreadNotificationsCount = (uid: string, callback: (count: number) => void) => {
  const q = query(collection(db, "notifications"), where("recipientUid", "==", uid), where("isRead", "==", false));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, "notifications");
    callback(0);
  });
};

// --- Leaderboard ---

export const subscribeToLeaderboard = (callback: (users: UserProfile[]) => void) => {
  const q = query(
    collection(db, "users"),
    orderBy("walletBalance", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    callback(users);
  }, (error) => {
    console.error("Leaderboard error (possibly missing index):", error);
    callback([]);
  });
};

// --- Wallet, Transfers & Market ---

// 1. Send Money
export const transferSkCoins = async (senderUid: string, recipientIdOrHandle: string, amount: number) => {
  if (amount <= 0) throw new Error("Сумма должна быть больше нуля");
  
  // Find recipient
  const recipient = await getUserByIdOrHandle(recipientIdOrHandle);
  if (!recipient) throw new Error("Пользователь не найден");
  if (recipient.uid === senderUid) throw new Error("Нельзя отправить самому себе");

  await runTransaction(db, async (transaction) => {
    const senderRef = doc(db, "users", senderUid);
    const recipientRef = doc(db, "users", recipient.uid);

    const senderDoc = await transaction.get(senderRef);
    if (!senderDoc.exists()) throw new Error("Ошибка отправителя");
    
    const currentBalance = senderDoc.data().walletBalance || 0;
    if (currentBalance < amount) {
      throw new Error("Недостаточно средств");
    }

    const fee = Math.floor(amount * 0.02);
    const netAmount = amount - fee;

    transaction.update(senderRef, { walletBalance: increment(-amount) });
    transaction.update(recipientRef, { walletBalance: increment(netAmount) });
    
    // Log transactions
    const transOutRef = doc(collection(db, "wallet_transactions"));
    transaction.set(transOutRef, {
      uid: senderUid,
      type: 'transfer_out',
      amount,
      counterpartyId: recipient.handle,
      status: 'completed',
      createdAt: Date.now()
    });

    const transInRef = doc(collection(db, "wallet_transactions"));
    transaction.set(transInRef, {
      uid: recipient.uid,
      type: 'transfer_in',
      amount: netAmount,
      counterpartyId: (senderDoc.data() as UserProfile).handle,
      status: 'completed',
      createdAt: Date.now()
    });

    // Create Notification (Outside transaction or via Cloud Function is better, but we do it here for simplicity)
    // Note: Since we are in a transaction, we can't easily call createNotification which uses addDoc.
    // We'll add it to the transaction.
    const notifRef = doc(collection(db, "notifications"));
    transaction.set(notifRef, {
      recipientUid: recipient.uid,
      senderUid: senderUid,
      senderHandle: (senderDoc.data() as UserProfile).handle,
      senderPhotoURL: (senderDoc.data() as UserProfile).photoURL,
      type: 'transfer',
      text: `${netAmount} SK`,
      isRead: false,
      createdAt: Date.now()
    });
  });
};

export const sendGift = async (senderUid: string, recipientIdOrHandle: string, gift: any): Promise<{ userGiftId: string, background?: string | null }> => {
  const amount = gift.price;
  if (amount <= 0) throw new Error("Сумма должна быть больше нуля");
  
  const recipient = await getUserByIdOrHandle(recipientIdOrHandle);
  if (!recipient) throw new Error("Пользователь не найден");

  let userGiftId = "";
  let background: string | null = null;

  await runTransaction(db, async (transaction) => {
    const senderRef = doc(db, "users", senderUid);
    const recipientRef = doc(db, "users", recipient.uid);

    const senderDoc = await transaction.get(senderRef);
    if (!senderDoc.exists()) throw new Error("Ошибка отправителя");
    
    const currentBalance = senderDoc.data().walletBalance || 0;
    if (currentBalance < amount) {
      throw new Error("Недостаточно средств");
    }

    transaction.update(senderRef, { walletBalance: increment(-amount) });
    
    // Create UserGift record
    const userGiftRef = doc(collection(db, "user_gifts"));
    userGiftId = userGiftRef.id;
    background = gift.id === 'g1' ? BEAR_BACKGROUNDS[Math.floor(Math.random() * BEAR_BACKGROUNDS.length)] : null;
    
    transaction.set(userGiftRef, {
      id: userGiftRef.id,
      giftId: gift.id,
      ownerUid: recipient.uid,
      senderUid: senderUid,
      receivedAt: Date.now(),
      isExchanged: false,
      isPinned: false,
      background: background
    });
    
    // Log transactions
    const transOutRef = doc(collection(db, "wallet_transactions"));
    transaction.set(transOutRef, {
      uid: senderUid,
      type: 'gift_send',
      amount,
      counterpartyId: recipient.handle,
      giftName: gift.name,
      status: 'completed',
      createdAt: Date.now()
    });

    const transInRef = doc(collection(db, "wallet_transactions"));
    transaction.set(transInRef, {
      uid: recipient.uid,
      type: 'gift_receive',
      amount: 0, 
      counterpartyId: (senderDoc.data() as UserProfile).handle,
      giftName: gift.name,
      status: 'completed',
      createdAt: Date.now()
    });

    // Notification
    const notifRef = doc(collection(db, "notifications"));
    transaction.set(notifRef, {
      recipientUid: recipient.uid,
      senderUid: senderUid,
      senderHandle: (senderDoc.data() as UserProfile).handle,
      senderPhotoURL: (senderDoc.data() as UserProfile).photoURL,
      type: 'gift',
      text: `отправил вам подарок: ${gift.name}`,
      isRead: false,
      createdAt: Date.now()
    });
  });

  return { userGiftId, background };
};

export const exchangeGift = async (uid: string, userGiftId: string) => {
  const adminWalletId = "SK-FVZ6YW";
  const adminQ = query(collection(db, "users"), where("walletId", "==", adminWalletId));
  const adminSnapshot = await getDocs(adminQ);
  const adminDoc = adminSnapshot.empty ? null : adminSnapshot.docs[0];

  await runTransaction(db, async (transaction) => {
    const userGiftRef = doc(db, "user_gifts", userGiftId);
    const userGiftDoc = await transaction.get(userGiftRef);
    
    if (!userGiftDoc.exists()) throw new Error("Подарок не найден");
    const giftData = userGiftDoc.data();
    if (giftData.ownerUid !== uid) throw new Error("Вы не владелец этого подарка");
    if (giftData.isExchanged) throw new Error("Подарок уже обменян");

    const giftTemplate = GIFTS.find(g => g.id === giftData.giftId);
    if (!giftTemplate) throw new Error("Шаблон подарка не найден");

    const exchangeValue = Math.floor(giftTemplate.price * 0.8); // 80% return
    const commission = Math.floor(exchangeValue * 0.02); // 2% commission
    const netReturn = exchangeValue - commission;

    const userRef = doc(db, "users", uid);
    
    if (adminDoc) {
      const adminRef = doc(db, "users", adminDoc.id);
      transaction.update(adminRef, { walletBalance: increment(commission) });
    }

    transaction.update(userRef, { walletBalance: increment(netReturn) });
    transaction.update(userGiftRef, { isExchanged: true, isPinned: false });

    // Log transaction
    const transRef = doc(collection(db, "wallet_transactions"));
    transaction.set(transRef, {
      uid,
      type: 'purchase',
      amount: netReturn,
      status: 'completed',
      createdAt: Date.now()
    });
  });
};

export const toggleGiftPin = async (uid: string, userGiftId: string, pinned: boolean) => {
  const userGiftRef = doc(db, "user_gifts", userGiftId);
  const userGiftDoc = await getDoc(userGiftRef);
  
  if (!userGiftDoc.exists()) throw new Error("Подарок не найден");
  if (userGiftDoc.data().ownerUid !== uid) throw new Error("Не ваш подарок");
  if (userGiftDoc.data().isExchanged) throw new Error("Подарок уже обменян");

  await updateDoc(userGiftRef, { isPinned: pinned });
};

export const subscribeToUserGifts = (uid: string, callback: (gifts: any[]) => void) => {
  const q = query(collection(db, "user_gifts"), where("ownerUid", "==", uid), where("isExchanged", "==", false));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeToPinnedGifts = (uid: string, callback: (gifts: any[]) => void) => {
  const q = query(collection(db, "user_gifts"), where("ownerUid", "==", uid), where("isPinned", "==", true), where("isExchanged", "==", false));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const submitWithdrawalRequest = async (uid: string, amount: number, card: string) => {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", uid);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) throw new Error("User not found");
    
    const balance = userDoc.data().walletBalance || 0;
    if (balance < amount) throw new Error("Insufficient balance");
    
    transaction.update(userRef, { walletBalance: increment(-amount) });
    
    const requestRef = doc(collection(db, "withdrawal_requests"));
    transaction.set(requestRef, {
      uid,
      amount,
      card,
      status: 'pending',
      createdAt: Date.now()
    });
    
    const transRef = doc(collection(db, "wallet_transactions"));
    transaction.set(transRef, {
      uid,
      type: 'withdrawal',
      amount,
      status: 'pending',
      createdAt: Date.now()
    });
  });
};

export const subscribeToWithdrawalRequests = (callback: (requests: WithdrawalRequest[]) => void) => {
  const q = query(collection(db, "withdrawal_requests"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
    callback(requests);
  }, (error) => {
    console.error("Withdrawal requests error (possibly missing index):", error);
    callback([]);
  });
};

export const approveWithdrawalRequest = async (requestId: string) => {
  await updateDoc(doc(db, "withdrawal_requests", requestId), {
    status: 'approved'
  });
  
  // Find the transaction and mark it as completed
  const q = query(collection(db, "wallet_transactions"), where("type", "==", "withdrawal"), where("status", "==", "pending"), limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    await updateDoc(snapshot.docs[0].ref, { status: 'completed' });
  }
};

export const subscribeToWalletTransactions = (uid: string, callback: (transactions: WalletTransaction[]) => void) => {
  const q = query(collection(db, "wallet_transactions"), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
    callback(transactions);
  }, (error) => {
    console.error("Wallet transactions error (possibly missing index):", error);
    callback([]);
  });
};

export const updateWalletBalance = async (uid: string, newBalance: number) => {
  await updateDoc(doc(db, "users", uid), { walletBalance: newBalance });
};

export const createWalletTransaction = async (transaction: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
  await addDoc(collection(db, "wallet_transactions"), {
    ...transaction,
    createdAt: Date.now()
  });
};

export const getUserByWalletId = async (walletId: string): Promise<UserProfile | null> => {
  const q = query(collection(db, "users"), where("walletId", "==", walletId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as UserProfile;
};

// 2. Mint New NFT (Primary Market)
export const mintNft = async (uid: string, template: NFTTemplate) => {
  await runTransaction(db, async (transaction) => {
     const userRef = doc(db, "users", uid);
     const userDoc = await transaction.get(userRef);
     if (!userDoc.exists()) throw new Error("User not found");
     
     const balance = userDoc.data().walletBalance || 0;
     if (balance < template.price) throw new Error("Недостаточно средств");

     // Get Serial Number
     const q = query(collection(db, "nfts"), where("templateId", "==", template.id));
     const snapshot = await getDocs(q); 
     const nextSerial = snapshot.size + 1;

     const newNftRef = doc(collection(db, "nfts"));
     const newNftData: NFTInstance = {
        id: newNftRef.id,
        templateId: template.id,
        ownerUid: uid,
        serialNumber: nextSerial,
        isListed: false,
        mintedAt: Date.now(),
        name: template.name,
        cssGradient: template.cssGradient,
        imageUrl: template.imageUrl, 
        accentColor: template.accentColor,
        rarity: template.rarity
     };

     transaction.update(userRef, { walletBalance: increment(-template.price) });
     transaction.set(newNftRef, newNftData);
  });
};

// 3. Transfer NFT (Gift)
export const transferNft = async (senderUid: string, recipientHandle: string, nftId: string) => {
   const recipient = await getUserByHandle(recipientHandle);
   if (!recipient) throw new Error("Пользователь не найден");
   
   const nftRef = doc(db, "nfts", nftId);
   const nftSnap = await getDoc(nftRef);
   if (!nftSnap.exists()) throw new Error("Артефакт не найден");
   if (nftSnap.data().ownerUid !== senderUid) throw new Error("Вы не владелец");
   if (nftSnap.data().isListed) throw new Error("Снимите с продажи перед отправкой");

   // If sender has this equipped, unequip it
   const senderRef = doc(db, "users", senderUid);
   const senderSnap = await getDoc(senderRef);
   if (senderSnap.data()?.selectedNftId === nftId) {
      await updateDoc(senderRef, { selectedNftId: null });
   }

   await updateDoc(nftRef, { ownerUid: recipient.uid });
};

// 4. List NFT for Sale
export const listNftForSale = async (nftId: string, uid: string, price: number) => {
    if (price <= 0) throw new Error("Цена должна быть выше 0");
    const nftRef = doc(db, "nfts", nftId);
    const nftSnap = await getDoc(nftRef);
    
    if (!nftSnap.exists()) throw new Error("NFT error");
    if (nftSnap.data().ownerUid !== uid) throw new Error("Not owner");

    // Unequip if equipped
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.data()?.selectedNftId === nftId) {
       await updateDoc(userRef, { selectedNftId: null });
    }

    await updateDoc(nftRef, {
        isListed: true,
        listPrice: price
    });
};

// 5. Delist NFT
export const delistNft = async (nftId: string, uid: string) => {
    const nftRef = doc(db, "nfts", nftId);
    const nftSnap = await getDoc(nftRef);
    if (nftSnap.data()?.ownerUid !== uid) throw new Error("Not owner");
    await updateDoc(nftRef, { isListed: false, listPrice: 0 });
};

// 6. Buy Secondary NFT
export const buySecondaryNft = async (buyerUid: string, nftId: string) => {
  await runTransaction(db, async (transaction) => {
      const nftRef = doc(db, "nfts", nftId);
      const nftDoc = await transaction.get(nftRef);
      if (!nftDoc.exists()) throw new Error("Артефакт пропал");

      const nftData = nftDoc.data() as NFTInstance;
      if (!nftData.isListed || !nftData.listPrice) throw new Error("Уже не продается");
      if (nftData.ownerUid === buyerUid) throw new Error("Вы уже владелец");

      const buyerRef = doc(db, "users", buyerUid);
      const sellerRef = doc(db, "users", nftData.ownerUid);

      const buyerDoc = await transaction.get(buyerRef);
      const sellerDoc = await transaction.get(sellerRef);

      if (!buyerDoc.exists()) throw new Error("Ошибка покупателя");
      const buyerBalance = buyerDoc.data().walletBalance || 0;
      
      if (buyerBalance < nftData.listPrice) throw new Error("Недостаточно средств");

      // Execute Trade
      const fee = Math.floor(nftData.listPrice * 0.02);
      const netAmount = nftData.listPrice - fee;

      transaction.update(buyerRef, { walletBalance: increment(-nftData.listPrice) });
      transaction.update(sellerRef, { walletBalance: increment(netAmount) });
      
      // Find commission recipient
      const commissionWalletId = "SK-FVZ6YW";
      const commissionUser = await getUserByWalletId(commissionWalletId);
      
      if (commissionUser && fee > 0) {
        const commissionRef = doc(db, "users", commissionUser.uid);
        transaction.update(commissionRef, { walletBalance: increment(fee) });
      }
      
      transaction.update(nftRef, {
          ownerUid: buyerUid,
          isListed: false,
          listPrice: 0
      });
  });
};

// --- Subscriptions (Wallet) ---

export const subscribeToMyNfts = (uid: string, callback: (nfts: NFTInstance[]) => void) => {
    const q = query(collection(db, "nfts"), where("ownerUid", "==", uid));
    return onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => d.data() as NFTInstance);
        callback(items);
    });
};

export const subscribeToMarketplace = (callback: (nfts: NFTInstance[]) => void) => {
    const q = query(collection(db, "nfts"), where("isListed", "==", true));
    return onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => d.data() as NFTInstance);
        callback(items);
    });
};

export const equipNft = async (uid: string, nftId: string | null) => {
  await updateDoc(doc(db, "users", uid), {
    selectedNftId: nftId
  });
};

export const selectNft = async (uid: string, nftId: string) => {
  await updateDoc(doc(db, "users", uid), { selectedNftId: nftId });
};

export const getEquippedNft = async (nftId: string | null): Promise<NFTInstance | null> => {
    if (!nftId) return null;
    try {
        const snap = await getDoc(doc(db, "nfts", nftId));
        return snap.exists() ? snap.data() as NFTInstance : null;
    } catch {
        return null;
    }
};

export const exchangeNftForCoins = async (uid: string, nftId: string) => {
  await runTransaction(db, async (transaction) => {
    const nftRef = doc(db, "nfts", nftId);
    const userRef = doc(db, "users", uid);
    
    const nftDoc = await transaction.get(nftRef);
    const userDoc = await transaction.get(userRef);
    
    if (!nftDoc.exists()) throw new Error("Артефакт не найден");
    if (nftDoc.data().ownerUid !== uid) throw new Error("Вы не владелец");
    
    const template = getTemplateById(nftDoc.data().templateId);
    if (!template) throw new Error("Ошибка шаблона");
    
    // Exchange for 80% of original price
    const exchangeValue = Math.floor(template.price * 0.8);
    const fee = Math.floor(exchangeValue * 0.02);
    const netAmount = exchangeValue - fee;
    
    transaction.delete(nftRef);
    transaction.update(userRef, { 
      walletBalance: increment(netAmount),
      selectedNftId: userDoc.data()?.selectedNftId === nftId ? null : userDoc.data()?.selectedNftId
    });
    
    // Find commission recipient
    const commissionWalletId = "SK-FVZ6YW";
    const commissionUser = await getUserByWalletId(commissionWalletId);
    if (commissionUser && fee > 0) {
      const commissionRef = doc(db, "users", commissionUser.uid);
      transaction.update(commissionRef, { walletBalance: increment(fee) });
    }
  });
};

// --- Follow System ---

export const followUser = async (currentUid: string, targetUid: string) => {
  const currentUserSnap = await getDoc(doc(db, "users", currentUid));
  const currentUser = currentUserSnap.data() as UserProfile;

  await updateDoc(doc(db, "users", currentUid), {
    following: arrayUnion(targetUid)
  });
  
  // Reward the target user for gaining a follower (+5 SK)
  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayUnion(currentUid),
    walletBalance: increment(5) 
  });

  // Create Notification
  await createNotification({
    recipientUid: targetUid,
    senderUid: currentUid,
    senderHandle: currentUser.handle,
    senderPhotoURL: currentUser.photoURL,
    type: 'follow'
  });
};

export const unfollowUser = async (currentUid: string, targetUid: string) => {
  await updateDoc(doc(db, "users", currentUid), {
    following: arrayRemove(targetUid)
  });
  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayRemove(currentUid)
  });
};

// --- Storage & Compression ---

export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if(file.type.startsWith('video/')) {
        resolve(file);
        return;
    }

    const maxWidth = 1920;
    const maxHeight = 1080;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
  const isVideo = file instanceof File ? file.type.startsWith('video/') : false;
  const formData = new FormData();
  
  if (isVideo) {
    formData.append('file', file);
    // Cloudinary credentials provided by user
    const apiKey = '995679447561865';
    const apiSecret = '6mELgxaWUrw5gaqhc9_2WFaa2nc';
    const cloudName = 'skwiz'; // Default cloud name, should be in env
    
    formData.append('api_key', apiKey);
    formData.append('timestamp', (Date.now() / 1000 | 0).toString());
    formData.append('upload_preset', 'ml_default'); // Common default preset
    
    try {
      // For a real production app, signing should happen on the server.
      // Here we use the provided keys as requested.
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.secure_url) return data.secure_url;
      
      // Fallback to ImgBB if Cloudinary fails (e.g. wrong cloud name)
      console.warn("Cloudinary upload failed, falling back to ImgBB", data);
      const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=0942cbf257298607fe2e846aac2ea221`, {
        method: 'POST',
        body: formData,
      });
      const imgbbData = await imgbbResponse.json();
      if (imgbbData.success) return imgbbData.data.url;
      
      throw new Error('Video Upload Failed');
    } catch (error) {
      console.error('Video Upload Error:', error);
      throw error;
    }
  }

  formData.append('image', file);
  const apiKey = '0942cbf257298607fe2e846aac2ea221'; 

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'ImgBB Upload Failed');
    }
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// --- Feeds & Posts ---

export const createPost = async (postData: any): Promise<string> => {
  const safePostData = Object.fromEntries(
    Object.entries(postData).map(([k, v]) => [k, v === undefined ? null : v])
  );

  const docRef = await addDoc(collection(db, "posts"), {
    ...safePostData,
    likes: [],
    likesCount: 0, 
    commentsCount: 0,
    viewsCount: 0, 
    createdAt: Date.now()
  });
  
  return docRef.id;
};

export const createAdPost = async (postData: any, link: string) => {
  const cost = 200;
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", postData.authorUid);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists()) throw new Error("User not found");
    
    const currentBalance = userDoc.data().walletBalance || 0;
    if (currentBalance < cost) {
      throw new Error("Недостаточно SK Coins для рекламы (нужно 200 SK)");
    }

    const newPostRef = doc(collection(db, "posts"));
    
    const safePostData = Object.fromEntries(
      Object.entries(postData).map(([k, v]) => [k, v === undefined ? null : v])
    );

    transaction.set(newPostRef, {
      ...safePostData,
      type: 'ad',
      adLink: link,
      createdAt: Date.now(),
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0
    });

    transaction.update(userRef, { walletBalance: increment(-cost) });
  });
};

export const voteInPoll = async (postId: string, optionIndex: number, uid: string) => {
  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, "posts", postId);
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) return;

    const poll = postDoc.data().poll;
    if (!poll) return;

    // Remove previous votes from this user
    poll.options.forEach((opt: any) => {
      opt.votes = opt.votes.filter((id: string) => id !== uid);
    });

    // Add new vote
    poll.options[optionIndex].votes.push(uid);

    transaction.update(postRef, { poll });
  });
};

export const addXP = async (uid: string, amount: number) => {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    const newXP = (data.xp || 0) + amount;
    const currentLevel = data.level || 1;
    const nextLevelXP = currentLevel * 100;

    if (newXP >= nextLevelXP) {
      transaction.update(userRef, { 
        xp: newXP - nextLevelXP, 
        level: currentLevel + 1 
      });
    } else {
      transaction.update(userRef, { xp: newXP });
    }
  });
};

// --- Smart Giveaway System ---

export const createGiveawayPost = async (postData: any, amount: number, durationHours: number) => {
    if (amount <= 0) throw new Error("Сумма должна быть больше 0");
    if (durationHours <= 0) throw new Error("Время должно быть больше 0");

    await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", postData.authorUid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) throw new Error("User not found");
        
        const currentBalance = userDoc.data().walletBalance || 0;
        if (currentBalance < amount) {
            throw new Error("Недостаточно средств для розыгрыша");
        }

        const newPostRef = doc(collection(db, "posts"));
        
        const safePostData = Object.fromEntries(
            Object.entries(postData).map(([k, v]) => [k, v === undefined ? null : v])
        );

        const giveawayEndsAt = Date.now() + (durationHours * 60 * 60 * 1000);

        transaction.set(newPostRef, {
            ...safePostData,
            type: 'giveaway',
            prizePool: amount,
            giveawayEndsAt,
            winnerUid: null,
            isGiveawayProcessed: false,
            likes: [],
            likesCount: 0,
            commentsCount: 0,
            createdAt: Date.now()
        });

        transaction.update(userRef, { walletBalance: increment(-amount) });
    });
};

export const processGiveawayWinner = async (postId: string) => {
    await runTransaction(db, async (transaction) => {
        const postRef = doc(db, "posts", postId);
        const postDoc = await transaction.get(postRef);

        if (!postDoc.exists()) throw new Error("Post not found");
        const postData = postDoc.data() as Post;

        if (postData.isGiveawayProcessed || postData.winnerUid) {
            return; // Already processed
        }

        if (!postData.giveawayEndsAt || Date.now() < postData.giveawayEndsAt) {
            return; // Not finished yet
        }

        const participants = postData.likes || [];
        const prize = postData.prizePool || 0;

        if (participants.length === 0) {
            // Refund author if no participants
            const authorRef = doc(db, "users", postData.authorUid);
            transaction.update(authorRef, { walletBalance: increment(prize) });
            transaction.update(postRef, { 
                isGiveawayProcessed: true, 
                content: postData.content + "\n\n[Розыгрыш отменен: нет участников. Средства возвращены.]" 
            });
            return;
        }

        // Pick random winner
        const randomIndex = Math.floor(Math.random() * participants.length);
        const winnerUid = participants[randomIndex];

        const winnerRef = doc(db, "users", winnerUid);
        const winnerDoc = await transaction.get(winnerRef);
        
        if (!winnerDoc.exists()) {
             // Edge case: winner account deleted? Try again or refund. Simplification: refund author.
             const authorRef = doc(db, "users", postData.authorUid);
             transaction.update(authorRef, { walletBalance: increment(prize) });
             transaction.update(postRef, { isGiveawayProcessed: true });
             return;
        }

        const winnerHandle = winnerDoc.data().handle;

        // Execute Transfer
        transaction.update(winnerRef, { walletBalance: increment(prize) });
        transaction.update(postRef, { 
            winnerUid, 
            winnerHandle, 
            isGiveawayProcessed: true 
        });

        // Notifications (Simulated via System Chat)
        // 1. To Winner
        const winnerChatId = [postData.authorUid, winnerUid].sort().join('_'); 
        // Note: Creating a chat inside transaction is complex, we'll skip chat creation and rely on the post update visuals for now.
        // A robust system would use Cloud Functions for side effects like notifications.
    });
};

export const repostPost = async (originalPost: Post, currentUser: UserProfile) => {
  const isChain = !!originalPost.isRepost;
  
  const originalAuthorUid = isChain 
    ? (originalPost.originalAuthorUid || originalPost.authorUid) 
    : originalPost.authorUid;

  const originalAuthorHandle = isChain 
    ? (originalPost.originalAuthorHandle || originalPost.authorHandle) 
    : originalPost.authorHandle;

  const originalAuthorPhotoURL = isChain 
    ? (originalPost.originalAuthorPhotoURL || originalPost.authorPhotoURL) 
    : originalPost.authorPhotoURL;

  const repostData = {
    authorUid: currentUser.uid,
    authorHandle: currentUser.handle,
    authorPhotoURL: currentUser.photoURL || null,
    authorIsVerified: currentUser.isVerified || false,
    content: originalPost.content || '',
    mediaURLs: originalPost.mediaURLs || [], 
    mediaURL: originalPost.mediaURL || null,
    mediaType: originalPost.mediaType || null,
    viewsCount: 0,
    
    isRepost: true,
    originalAuthorHandle: originalAuthorHandle || 'Unknown',
    originalAuthorPhotoURL: originalAuthorPhotoURL || null,
    originalAuthorUid: originalAuthorUid || 'unknown_uid',
    originalPostId: originalPost.id 
  };

  await createPost(repostData);
};

export const deletePost = async (postId: string) => {
  try {
     const postRef = doc(db, "posts", postId);
     const postSnap = await getDoc(postRef);
     
     if (postSnap.exists()) {
         const data = postSnap.data() as Post;
         if (data.type === 'giveaway' && !data.isGiveawayProcessed) {
             throw new Error("Нельзя удалить активный розыгрыш до его завершения.");
         }
     }

     await deleteDoc(postRef);
  } catch(e) {
     console.error("Error deleting post:", e);
     throw e;
  }
};

export const updatePost = async (postId: string, content: string) => {
  await updateDoc(doc(db, "posts", postId), {
    content,
    isEdited: true 
  });
};

export const incrementPostView = async (postId: string) => {
  try {
     const postRef = doc(db, "posts", postId);
     await updateDoc(postRef, {
       viewsCount: increment(1)
     });
  } catch (e) {
     console.warn("Failed to increment view", e);
  }
};

export const toggleLike = async (postId: string, uid: string, isLiked: boolean) => {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  const postData = postSnap.data() as Post;

  if (isLiked) {
    await updateDoc(postRef, {
      likes: arrayRemove(uid),
      likesCount: increment(-1) 
    });
  } else {
    await updateDoc(postRef, {
      likes: arrayUnion(uid),
      likesCount: increment(1) 
    });
    await addXP(uid, 5); // 5 XP for a like

    // Create Notification if not liking own post
    if (postData.authorUid !== uid) {
      const currentUserSnap = await getDoc(doc(db, "users", uid));
      const currentUser = currentUserSnap.data() as UserProfile;
      
      await createNotification({
        recipientUid: postData.authorUid,
        senderUid: uid,
        senderHandle: currentUser.handle,
        senderPhotoURL: currentUser.photoURL,
        type: 'like',
        targetId: postId
      });
    }
  }
};

export const subscribeToFeed = (
  feedType: 'popular' | 'following', 
  followingUids: string[] = [], 
  callback: (posts: any[]) => void
) => {
  let q;
  try {
    if (feedType === 'following') {
      if (followingUids.length === 0) {
        callback([]);
        return () => {};
      }
      const safeFollowing = followingUids.slice(-10);
      q = query(
        collection(db, "posts"),
        where("authorUid", "in", safeFollowing),
        limit(100)
      );
      
      return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Standard sort for following
        posts.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        callback(posts);
      });

    } else {
      // POPULAR (DEFAULT) FEED: WEIGHTED RANDOM LOGIC
      // 1. Fetch a larger pool of posts to allow meaningful filtering (200 items)
      q = query(collection(db, "posts"), limit(200));

      let feedOrder: string[] = []; // Store the ID order for this session

      return onSnapshot(q, (snapshot) => {
        const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 1. If first load (no order saved), generate the random mix
        if (feedOrder.length === 0) {
            // Define Pools
            // Popular: Top 60 by likes
            const popularPool = [...allPosts].sort((a: any, b: any) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 60);
            // New: Top 60 by creation date
            const newPool = [...allPosts].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 60);
            // Discovery (Old & Unpopular): Bottom by date AND low likes (< 5), taken from oldest up
            const oldPool = [...allPosts]
                .filter((p: any) => (p.likesCount || 0) < 5)
                .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0)) // Ascending date
                .slice(0, 60);

            // Select Counts (Target Feed Size: ~30 items for immediate view)
            const TARGET_SIZE = 30;
            const countPop = Math.round(TARGET_SIZE * 0.5); // 50%
            const countNew = Math.round(TARGET_SIZE * 0.4); // 40%
            const countOld = Math.round(TARGET_SIZE * 0.1); // 10%

            const finalFeed: any[] = [];
            const seenIds = new Set<string>();

            const addFromPool = (pool: any[], count: number) => {
                // Shuffle the pool itself to pick random items from that category
                const shuffled = pool.sort(() => Math.random() - 0.5);
                let added = 0;
                for (const post of shuffled) {
                    if (added >= count) break;
                    if (!seenIds.has(post.id)) {
                        seenIds.add(post.id);
                        finalFeed.push(post);
                        added++;
                    }
                }
            };

            // Fill the feed
            addFromPool(popularPool, countPop);
            addFromPool(newPool, countNew);
            addFromPool(oldPool, countOld);

            // Fill remainder if duplicates reduced size (optional, fills up to target with randoms)
            if (finalFeed.length < TARGET_SIZE) {
                 const remaining = allPosts.filter(p => !seenIds.has(p.id)).sort(() => Math.random() - 0.5);
                 remaining.slice(0, TARGET_SIZE - finalFeed.length).forEach(p => finalFeed.push(p));
            }

            // Final Shuffle of the mixed feed
            finalFeed.sort(() => Math.random() - 0.5);
            
            // Save order for subsequent updates
            feedOrder = finalFeed.map(p => p.id);
            
            callback(finalFeed);
        } else {
            // 2. If update (snapshot triggered by likes/comments), preserve order
            const postMap = new Map(allPosts.map(p => [p.id, p]));
            
            // Reconstruct feed using the saved order, updating data
            const updatedFeed = feedOrder
                .map(id => postMap.get(id))
                .filter(p => p !== undefined);
            
            callback(updatedFeed);
        }
      });
    }
  } catch (e) {
    console.error("Feed Error:", e);
    callback([]);
    return () => {};
  }
};

export const subscribeToPromotedPosts = (callback: (posts: any[]) => void) => {
  try {
    const q = query(
      collection(db, "posts"),
      where("promotedUntil", ">", Date.now()),
      orderBy("promotedUntil", "desc"),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(posts);
    }, (error) => {
      console.warn("Promoted posts subscription error (index might be missing):", error);
      callback([]);
    });
  } catch (e) {
    console.warn("Failed to subscribe to promoted posts", e);
    callback([]);
    return () => {};
  }
};

export const promotePost = async (postId: string, uid: string, durationHours: number, cost: number) => {
  await runTransaction(db, async (transaction) => {
     const userRef = doc(db, "users", uid);
     const postRef = doc(db, "posts", postId);
     
     const userDoc = await transaction.get(userRef);
     const postDoc = await transaction.get(postRef);
     
     if (!userDoc.exists() || !postDoc.exists()) {
       throw new Error("Data missing");
     }

     const currentBalance = userDoc.data().walletBalance || 0;
     if (currentBalance < cost) {
       throw new Error("Недостаточно средств (SK Coins)");
     }

     const promotionExpiry = Date.now() + (durationHours * 60 * 60 * 1000);

     transaction.update(userRef, { walletBalance: increment(-cost) });
     transaction.update(postRef, { promotedUntil: promotionExpiry });
  });
};

export const subscribeToUserPosts = (uid: string, callback: (posts: any[]) => void) => {
  const q = query(
    collection(db, "posts"),
    where("authorUid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  });
};

export const subscribeToSkReels = (callback: (posts: any[]) => void) => {
  const q = query(
    collection(db, "posts"),
    where("mediaType", "==", "video"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  }, (error) => {
    console.error("SkReels subscription error:", error);
    // If index is missing, return empty or handle gracefully
    callback([]);
  });
};

export const addComment = async (postId: string, commentData: any) => {
  await addDoc(collection(db, "posts", postId, "comments"), {
    ...commentData,
    createdAt: Date.now()
  });
  await updateDoc(doc(db, "posts", postId), {
    commentsCount: increment(1)
  });
  await addXP(commentData.authorUid, 15); // 15 XP for a comment

  // Create Notification if not commenting on own post
  const postSnap = await getDoc(doc(db, "posts", postId));
  const postData = postSnap.data() as Post;
  
  if (postData.authorUid !== commentData.authorUid) {
    await createNotification({
      recipientUid: postData.authorUid,
      senderUid: commentData.authorUid,
      senderHandle: commentData.authorHandle,
      senderPhotoURL: commentData.authorPhotoURL,
      type: 'comment',
      targetId: postId,
      text: commentData.text.substring(0, 50)
    });
  }
};

export const subscribeToComments = (postId: string, callback: (comments: Comment[]) => void) => {
  const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
    callback(comments);
  });
};

export const toggleSavePost = async (postId: string, uid: string, isSaved: boolean) => {
  const userRef = doc(db, "users", uid);
  if (isSaved) {
    await updateDoc(userRef, {
      savedPosts: arrayRemove(postId)
    });
  } else {
    await updateDoc(userRef, {
      savedPosts: arrayUnion(postId)
    });
  }
};

export const getSavedPosts = async (postIds: string[]): Promise<Post[]> => {
  if (!postIds || postIds.length === 0) return [];
  const posts: Post[] = [];
  const recentIds = postIds.slice(-20).reverse(); 
  for (const id of recentIds) {
    const pDoc = await getDoc(doc(db, "posts", id));
    if (pDoc.exists()) {
      posts.push({ id: pDoc.id, ...pDoc.data() } as Post);
    }
  }
  return posts;
};

export const searchUsers = async (term: string): Promise<UserProfile[]> => {
  if (!term) return [];
  const q = query(
    collection(db, "users"), 
    where("handle", ">=", term),
    where("handle", "<=", term + '\uf8ff'),
    limit(10)
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
};

export const getOrCreateChat = async (currentUid: string, targetUid: string, targetUser: UserProfile): Promise<string> => {
  const participants = [currentUid, targetUid].sort();
  const chatId = participants.join('_');
  
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    const currentUserSnap = await getDoc(doc(db, "users", currentUid));
    const currentUser = currentUserSnap.data() as UserProfile;

    await setDoc(chatRef, {
      id: chatId,
      participants,
      participantDetails: {
        [currentUid]: { handle: currentUser.handle, photoURL: currentUser.photoURL },
        [targetUid]: { handle: targetUser.handle, photoURL: targetUser.photoURL }
      },
      unreadCounts: {
        [currentUid]: 0,
        [targetUid]: 0
      },
      lastMessageTime: Date.now()
    });
  }
  return chatId;
};

export const getChat = async (chatId: string): Promise<Chat | null> => {
  const snap = await getDoc(doc(db, "chats", chatId));
  if (snap.exists()) return { id: snap.id, ...snap.data() } as Chat;
  return null;
};

export const subscribeToChats = (uid: string, callback: (chats: Chat[]) => void) => {
  const q = query(
    collection(db, "chats"), 
    where("participants", "array-contains", uid),
    orderBy("lastMessageTime", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
    callback(chats);
  });
};

export const subscribeToTotalUnreadMessages = (uid: string, callback: (count: number) => void) => {
    try {
        const q = query(collection(db, "chats"), where("participants", "array-contains", uid));
        return onSnapshot(q, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Chat;
                if (data.unreadCounts && typeof data.unreadCounts[uid] === 'number') {
                    total += data.unreadCounts[uid];
                }
            });
            callback(total);
        }, (err) => {
            console.warn("Unread messages subscription failed", err);
            callback(0);
        });
    } catch(e) {
        console.warn("Subscribing to messages failed", e);
        callback(0);
        return () => {};
    }
};

export const sendDirectMessage = async (chatId: string, senderUid: string, receiverUid: string, text?: string, audioURL?: string, giftId?: string, userGiftId?: string, background?: string) => {
  const messageData: any = {
    senderUid,
    createdAt: Date.now()
  };
  if (text) messageData.text = text;
  if (audioURL) messageData.audioURL = audioURL;
  if (giftId) messageData.giftId = giftId;
  if (userGiftId) messageData.userGiftId = userGiftId;
  if (background) messageData.background = background;

  await addDoc(collection(db, "chats", chatId, "messages"), messageData);
  
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: giftId ? "🎁 Подарок" : (audioURL ? "🎙 Голосовое сообщение" : text),
    lastMessageTime: Date.now(),
    [`unreadCounts.${receiverUid}`]: increment(1)
  });
};

export const markChatAsRead = async (chatId: string, uid: string) => {
    await updateDoc(doc(db, "chats", chatId), {
        [`unreadCounts.${uid}`]: 0
    });
};

export const subscribeToDirectMessages = (chatId: string, callback: (msgs: any[]) => void) => {
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(msgs);
  });
};

export const createGroup = async (groupData: any, avatarFile?: File) => {
  let photoURL = null;
  if (avatarFile) {
     const compressed = await compressImage(avatarFile);
     photoURL = await uploadFile(compressed, `groups/${Date.now()}_avatar`);
  }

  await addDoc(collection(db, "groups"), {
    ...groupData,
    photoURL,
    createdAt: Date.now(),
    lastMessageTime: Date.now()
  });
};

export const subscribeToGroups = (callback: (groups: Group[]) => void) => {
  const q = query(collection(db, "groups"), orderBy("lastMessageTime", "desc"));
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    callback(groups);
  });
};

export const joinGroup = async (groupId: string, uid: string) => {
    await updateDoc(doc(db, "groups", groupId), {
        members: arrayUnion(uid)
    });
};

export const sendGroupMessage = async (groupId: string, sender: UserProfile, text: string) => {
    await addDoc(collection(db, "groups", groupId, "messages"), {
        senderUid: sender.uid,
        senderHandle: sender.handle,
        senderPhotoURL: sender.photoURL,
        text,
        createdAt: Date.now()
    });
    
    await updateDoc(doc(db, "groups", groupId), {
        lastMessage: text,
        lastMessageTime: Date.now()
    });
};

export const subscribeToGroupMessages = (groupId: string, callback: (msgs: GroupMessage[]) => void) => {
    const q = query(collection(db, "groups", groupId, "messages"), orderBy("createdAt", "asc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupMessage));
        callback(msgs);
    });
};

export const requestVerification = async (uid: string, handle: string) => {
  await addDoc(collection(db, "verification_requests"), {
    uid,
    handle,
    status: 'pending',
    createdAt: Date.now()
  });
};

export const subscribeToVerificationRequests = (callback: (reqs: any[]) => void) => {
  const q = query(collection(db, "verification_requests"), where("status", "==", "pending"));
  return onSnapshot(q, (snapshot) => {
    const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(reqs);
  });
};

export const approveVerification = async (reqId: string, uid: string) => {
  await updateDoc(doc(db, "verification_requests", reqId), { status: 'approved' });
  await updateDoc(doc(db, "users", uid), { isVerified: true });
};

export const purchaseVerificationBadge = async (uid: string): Promise<{success: boolean, message: string}> => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { success: false, message: 'User not found' };
  const data = snap.data() as UserProfile;
  const balance = data.walletBalance || 0;
  if (data.isVerified) return { success: false, message: 'У вас уже есть галочка.' };
  if (balance < 2000) return { success: false, message: 'Недостаточно SK Coin (нужно 2000).' };
  await updateDoc(userRef, {
    walletBalance: increment(-2000),
    isVerified: true
  });
  return { success: true, message: 'Verification purchased successfully' };
};

export const mapAuthCodeToMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email уже используется.';
    case 'auth/invalid-email': return 'Некорректный Email.';
    case 'auth/weak-password': return 'Пароль слишком простой.';
    case 'auth/user-not-found': return 'Пользователь не найден.';
    case 'auth/wrong-password': return 'Неверный пароль.';
    case 'auth/too-many-requests': return 'Слишком много попыток. Попробуйте позже.';
    default: return 'Ошибка авторизации. Проверьте данные.';
  }
};