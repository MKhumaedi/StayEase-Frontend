export enum UserRole {
  USER = 'USER',
  TENANT = 'TENANT',
  ADMIN = 'ADMIN'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export interface TenantProfile {
  id: string;
  userId: string;
  companyName?: string;
  taxId?: string;
  phoneNumber?: string;
  address?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  isVerified?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  loyaltyPoints?: number;
  credits?: number;
  createdAt?: string;
  lastLoginAt?: string;
  settings?: any;
  tenantProfile?: TenantProfile;
}

export interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Property {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  categoryId: string;
  beds: number;
  baths: number;
  sqft: number;
  basePrice: number;
  rating: number;
  reviewCount: number;
  imageUrls: string[];
  amenities: string[];
  status: 'ACTIVE' | 'INACTIVE';
  city?: string;
  province?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  cleaningFee?: number;
  serviceFee?: number;
  securityDeposit?: number;
  guests?: number;
  category?: PropertyCategory;
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  peakMultiplier?: number;
  peakSeasonName?: string | null;
  originalBasePrice?: number;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  capacity: number;
  basePrice: number;
  status: 'Available' | 'Occupied' | 'Maintenance';
  wing?: string;
  floor?: string;
  image?: string;
}

export interface RoomAvailability {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  isBlocked: boolean;
  priceOverride?: number;
}

export interface PeakSeasonRate {
  id: string;
  propertyId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rateMultiplier: number; // e.g. 1.25 for 25% premium
  name: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  guestId: string;
  propertyId: string;
  roomId?: string;
  startDate: string;
  endDate: string;
  nights: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hasPaymentProof?: boolean;
  paymentProofUrl?: string;
  checkoutRequested?: boolean;
  actualCheckoutRequestAt?: string;
}

export interface Review {
  id: string;
  propertyId: string;
  guestId: string;
  guestName: string;
  guestAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  replyComment?: string;
  replyDate?: string;
  guest?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  property?: {
    id: string;
    name: string;
    tenantId: string;
  };
}

export interface ReportStats {
  totalRevenue: number;
  occupancyRate: number;
  pendingOrders: number;
  newReviews: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'price' | 'review' | 'maintenance';
  createdAt: string;
  read: boolean;
}
