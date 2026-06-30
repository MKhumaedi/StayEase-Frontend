export interface PropertyInfo {
  id: string;
  name: string;
  imageUrls: string[];
  city: string;
}

export interface RoomInfo {
  id: string;
  name: string;
}

export interface ReviewInfo {
  id: string;
  rating: number;
  comment: string;
}

export interface PaymentProof {
  id: string;
  proofUrl: string;
  createdAt: string;
}

export interface TravelerBooking {
  id: string;
  bookingCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  nights: number;
  guestCount: number;
  totalAmount: number;
  paymentMethod?: string;
  status: string; // WAITING_PAYMENT, WAITING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED, AUTO_EXPIRED
  createdAt: string;
  property: PropertyInfo;
  room?: RoomInfo;
  paymentProof?: PaymentProof;
  review?: ReviewInfo;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkoutRequested?: boolean;
  actualCheckoutRequestAt?: string;
}

export interface BookingFilters {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export interface BookingStats {
  totalReservations: number;
  activeReservations: number;
  completedReservations: number;
  waitingPaymentReservations: number;
}
