

export interface UserProfile {
  uid: string;
  handle: string; // @handle
  photoURL: string | null;
  createdAt: number;
  isVerified: boolean;
  isAdmin: boolean;
  isBanned?: boolean; // New: Ban status
  following: string[]; // UIDs I follow
  followers: string[]; // UIDs following me
  savedPosts: string[]; // Array of Post IDs
  bio?: string;
  walletBalance?: number;
  role?: string;
  xp?: number;
  level?: number;
  walletId?: string; // Unique wallet ID for transfers
  
  // NFT System
  // ownedNfts is now deprecated in favor of querying the 'nfts' collection by ownerUid
  selectedNftId?: string | null; // ID of currently equipped NFT Instance (not template)

  privacySettings?: {
    showOnline: boolean;
    allowDirectMessages?: boolean;
  };
  premiumUntil?: number;
}

// The "Blueprint" for an NFT in the primary shop
export interface NFTTemplate {
  id: string; // 'void_walker'
  name: string;
  description: string;
  cssGradient: string; 
  imageUrl: string; // New: URL for the visual asset (GIF/Video/Image)
  accentColor: string;
  price: number; // Mint price
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Artifact';
}

// The actual unique item owned by a user
export interface NFTInstance {
  id: string; // Unique Firestore ID
  templateId: string; // Links back to template
  ownerUid: string;
  serialNumber: number; // #1, #2, #3...
  isListed: boolean;
  listPrice?: number;
  mintedAt: number;
  
  // Snapshot of visual data to avoid heavy lookups
  name: string;
  cssGradient: string;
  imageUrl: string; // New
  accentColor: string;
  rarity: string;
}

export interface Post {
  id: string;
  authorUid: string;
  authorHandle: string;
  authorPhotoURL: string | null;
  authorIsVerified?: boolean; 
  content: string;
  mediaURL?: string; 
  mediaURLs?: string[]; 
  mediaType?: 'image' | 'video';
  isReel?: boolean; 
  createdAt: number;
  likes: string[]; 
  likesCount: number; 
  commentsCount: number;
  viewsCount?: number; 
  
  // Repost Fields
  isRepost?: boolean;
  originalAuthorHandle?: string;
  originalAuthorPhotoURL?: string | null;
  originalAuthorUid?: string;
  originalPostId?: string;

  // Promotion System
  promotedUntil?: number; // Timestamp when promotion expires

  // Smart Giveaway System
  type?: 'regular' | 'giveaway' | 'ad';
  adLink?: string;
  prizePool?: number;
  giveawayEndsAt?: number;
  winnerUid?: string | null;
  winnerHandle?: string | null;
  isGiveawayProcessed?: boolean;

  // Poll System
  poll?: {
    question: string;
    options: { text: string; votes: string[] }[]; // Array of UIDs who voted
    expiresAt: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorUid: string;
  authorHandle: string;
  authorPhotoURL: string | null;
  text: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  photoURL: string | null;
  createdBy: string;
  createdAt: number;
  members: string[];
  lastMessage?: string;
  lastMessageTime?: number;
}

export interface GroupMessage {
  id: string;
  senderUid: string;
  senderHandle: string;
  senderPhotoURL: string | null;
  text: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  participants: string[]; 
  lastMessage?: string;
  lastMessageTime?: number;
  participantDetails?: {
    [uid: string]: {
      handle: string;
      photoURL: string | null;
    }
  };
  unreadCounts?: {
    [uid: string]: number;
  };
}

export interface DirectMessage {
  id: string;
  senderUid: string;
  text?: string;
  audioURL?: string;
  giftId?: string;
  userGiftId?: string;
  createdAt: number;
}

export interface VerificationRequest {
  id: string;
  uid: string;
  handle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface PaymentRequest {
  id: string;
  uid: string;
  senderName: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number; // Amount in RUB
  amountSk?: number; // Amount in SK
  createdAt: number;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  amount: number;
  card: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface Report {
  id: string;
  type: 'post' | 'user';
  targetId: string;
  reason: string;
  reportedBy: string; // UID
  createdAt: number;
  status: 'pending' | 'resolved';
  
  // Snapshots for display in Admin Console
  targetContent?: string; // For post content
  targetHandle?: string; // For user handle
}

export interface WalletTransaction {
  id: string;
  uid: string;
  type: 'transfer_in' | 'transfer_out' | 'withdrawal' | 'purchase' | 'gift_send' | 'gift_receive';
  amount: number;
  skCoinPriceAtTime: number;
  counterpartyId?: string; // Wallet ID or User UID
  status: 'pending' | 'completed' | 'failed';
  createdAt: number;
}

export interface Gift {
  id: string;
  name: string;
  icon?: string; // Emoji or Icon name
  imageUrl?: string;
  price: number; // in SK Coins
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'Common' | 'Rare' | 'Epic' | 'Legendary';
  animation?: 'float' | 'pulse' | 'launch' | 'bounce' | 'spin' | 'pop';
}

export interface UserGift {
  id: string;
  giftId: string;
  ownerUid: string;
  senderUid?: string;
  receivedAt: number;
  isExchanged: boolean;
  isPinned?: boolean;
  background?: string | null;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  senderUid: string;
  senderHandle: string;
  senderPhotoURL: string | null;
  type: 'like' | 'follow' | 'comment' | 'transfer' | 'gift' | 'mention';
  targetId?: string; // Post ID or other relevant ID
  text?: string; // Optional text (e.g. comment snippet)
  isRead: boolean;
  createdAt: number;
}
