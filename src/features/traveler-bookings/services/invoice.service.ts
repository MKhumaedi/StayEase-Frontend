import { TravelerBooking } from '../types/travelerBookings.types';

export const invoiceService = {
  downloadInvoice(booking: TravelerBooking): void {
    const text = getLines(booking).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INVOICE-${booking.bookingCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

function getLines(b: TravelerBooking): string[] {
  return [
    '==================================================',
    '                STAYEASE INC. RECEIPT             ',
    '==================================================',
    `Invoice: ${b.bookingCode} | Date: ${new Date().toLocaleDateString()}`,
    `Guest  : ${b.guestName} (${b.guestEmail})`,
    `Stay   : ${b.property.name} (${b.property.city})`,
    `Room   : ${b.room?.name || 'Standard Package Suite'}`,
    `Period : ${b.startDate} to ${b.endDate} (${b.nights} Nights)`,
    `Guests : ${b.guestCount} Guest(s)`,
    '--------------------------------------------------',
    `Total  : IDR ${b.totalAmount.toLocaleString()}`,
    '==================================================',
    'Thank you for staying with us!'
  ];
}
