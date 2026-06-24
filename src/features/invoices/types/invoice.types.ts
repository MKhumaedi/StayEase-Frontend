export interface InvoiceBooking {
  id: string;
  bookingCode: string;
  startDate: string;
  endDate: string;
  nights: number;
  guestCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  property: {
    id: string;
    name: string;
    address: string;
    location: string;
    city: string;
    province: string;
    cleaningFee?: number;
    serviceFee?: number;
    imageUrls: string[];
    tenant?: {
      id: string;
      name: string;
      email: string;
    };
  };
  room?: {
    id: string;
    name: string;
    basePrice: number;
  } | null;
  paymentProof?: {
    id: string;
    proofUrl: string;
    createdAt: string;
  } | null;
}
