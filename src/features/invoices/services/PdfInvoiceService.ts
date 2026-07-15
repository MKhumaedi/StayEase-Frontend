import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { InvoiceBooking } from '../types/invoice.types';

function drawText(doc: jsPDF, text: string, x: number, y: number, size = 9, isBold = false, color = [15, 23, 42]): void {
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(text, x, y);
}

function drawTextRight(doc: jsPDF, text: string, x: number, y: number, size = 9, isBold = false, color = [15, 23, 42]): void {
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(text, x, y, { align: 'right' });
}

async function safeLoadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      try { resolve(canvas.toDataURL('image/jpeg')); } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawPropertyText(doc: jsPDF, booking: InvoiceBooking, imgData: string | null): void {
  const y = 47;
  if (imgData) {
    doc.addImage(imgData, 'JPEG', 110, y, 16, 16);
  } else {
    doc.setFillColor(248, 250, 252);
    doc.rect(110, y, 16, 16, 'F');
    drawText(doc, '[Bed]', 114, y + 9, 6, false, [100, 116, 139]);
  }
  drawText(doc, booking.property.name, 129, y + 1, 8, true, [15, 23, 42]);
  drawText(doc, booking.room?.name || 'Standard Suite Package', 129, y + 5, 8, false, [100, 116, 139]);
  drawText(doc, booking.property.address || booking.property.location, 129, y + 9, 7, false, [100, 116, 139]);
  
  const hostName = booking.property.tenant?.name || 'StayEase Landlord';
  drawText(doc, `Managed by ${hostName}`, 129, y + 13, 7, false, [100, 116, 139]);
  drawText(doc, 'Verified Host', 129, y + 17, 7, true, [16, 185, 129]);
}

function drawCustomerAndProperty(doc: jsPDF, booking: InvoiceBooking, imgData: string | null): void {
  drawText(doc, 'CUSTOMER INFORMATION', 15, 42, 9, true, [67, 56, 202]);
  drawText(doc, `Guest Name: ${booking.guestName}`, 15, 47, 8, false, [15, 23, 42]);
  drawText(doc, `Email: ${booking.guestEmail}`, 15, 51, 8, false, [100, 116, 139]);
  drawText(doc, `Phone: ${booking.guestPhone}`, 15, 55, 8, false, [100, 116, 139]);
  drawText(doc, 'PROPERTY INFORMATION', 110, 42, 9, true, [67, 56, 202]);
  drawPropertyText(doc, booking, imgData);
}

function drawColumn(doc: jsPDF, label: string, val: string, x: number, y: number): void {
  drawText(doc, label, x, y + 6, 7, true, [100, 116, 139]);
  drawText(doc, val, x, y + 13, 9, true, [15, 23, 42]);
}

interface ParsedProof {
  id: string;
  url: string;
  status: string;
  method: string;
  updatedAt: string;
  originalName?: string;
}

function parsePaymentProof(proofUrl: string | undefined): ParsedProof | null {
  if (!proofUrl) return null;
  const trimmed = proofUrl.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        id: parsed.id || parsed.webpName || '',
        url: parsed.url || '',
        status: parsed.status || 'PAID',
        method: parsed.method || (parsed.url?.includes('midtrans') ? 'midtrans' : 'manual'),
        updatedAt: parsed.updatedAt || parsed.createdAt || '',
        originalName: parsed.originalName
      };
    } catch (e) {
      console.error('Failed to parse payment proof JSON:', e);
    }
  }
  
  // fallback for plain strings
  const isMidtr = trimmed.startsWith('midtrans://') || trimmed.includes('midtrans');
  return {
    id: isMidtr ? trimmed.replace('midtrans://', '') : 'manual-proof',
    url: trimmed,
    status: 'PAID',
    method: isMidtr ? 'midtrans' : 'manual',
    updatedAt: ''
  };
}

function getHumanReadablePaymentMethod(method: string | undefined): string {
  if (!method) return 'Bank Transfer';
  const m = method.toLowerCase();
  if (m === 'midtrans') return 'Midtrans Payment Gateway';
  if (m === 'manual' || m === 'bank_transfer' || m === 'bank transfer') return 'Bank Transfer';
  if (m === 'virtual_account' || m === 'va' || m === 'virtual account') return 'Virtual Account';
  if (m === 'qris') return 'QRIS';
  if (m === 'credit_card' || m === 'credit card') return 'Credit Card';
  if (m === 'gopay') return 'GoPay';
  
  return method.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function formatSettlementTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'Verified';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Verified';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    const pad = (num: number) => String(num).padStart(2, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${day} ${month} ${year} • ${hours}:${minutes} WIB`;
  } catch (err) {
    return 'Verified';
  }
}

function formatGuests(guestCount: number | undefined | null): string {
  const count = Number(guestCount) || 1;
  return count === 1 ? '1 Guest' : `${count} Guests`;
}

function drawMethodColumn(doc: jsPDF, booking: InvoiceBooking, x: number, y: number): void {
  const parsedProof = parsePaymentProof(booking.paymentProof?.proofUrl);
  const method = getHumanReadablePaymentMethod(parsedProof?.method);
  drawText(doc, 'Payment Method', x, y + 6, 7, true, [100, 116, 139]);
  drawText(doc, method, x, y + 13, 8, true, [67, 56, 202]);
}

function drawReservationDetails(doc: jsPDF, booking: InvoiceBooking): void {
  const y = 70;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y, 180, 20, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, y, 180, 20, 'S');
  drawColumn(doc, 'Check-In', booking.startDate, 20, y);
  drawColumn(doc, 'Check-Out', booking.endDate, 56, y);
  drawColumn(doc, 'Nights', `${booking.nights} Night(s)`, 92, y);
  drawColumn(doc, 'Guests', formatGuests(booking.guestCount), 124, y);
  drawMethodColumn(doc, booking, 150, y);
}

interface PricingSummary {
  roomTotal: number;
  cleaningFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
}

function getPricingSummary(booking: InvoiceBooking): PricingSummary {
  const total = Number(booking.totalAmount);
  const nights = Number(booking.nights);
  const cleaningFee = Number(booking.property?.cleaningFee || 0);
  const serviceFee = Number(booking.property?.serviceFee || 0);
  const basePrice = Number(booking.room?.basePrice || 0);
  const calcBase = basePrice > 0 ? basePrice : Math.round((total - cleaningFee - serviceFee) / nights);
  const roomTotal = calcBase * nights;
  const baseSum = roomTotal + cleaningFee + serviceFee;
  const tax = total > baseSum ? total - baseSum : 0;
  const discount = total < baseSum ? baseSum - total : 0;
  const paid = booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? total : 0;
  return { roomTotal, cleaningFee, serviceFee, tax, discount, total, paid, balance: total - paid };
}

function formatIDR(val: number): string {
  return 'IDR ' + Math.round(val).toLocaleString('id-ID');
}

function drawTableRow(doc: jsPDF, label: string, amount: number, x: number, y: number, isSub = false): void {
  drawText(doc, label, x, y, 8, false, [15, 23, 42]);
  const displayAmount = isSub ? `-${formatIDR(amount)}` : formatIDR(amount);
  const color = isSub ? [220, 38, 38] : [15, 23, 42];
  drawTextRight(doc, displayAmount, 192, y, 8, false, color);
}

function drawOptionalRows(doc: jsPDF, sum: PricingSummary, y: number): number {
  let currY = y;
  if (sum.cleaningFee > 0) { currY += 7; drawTableRow(doc, 'Standard Cleaning Fee', sum.cleaningFee, 18, currY); }
  if (sum.serviceFee > 0) { currY += 7; drawTableRow(doc, 'StayEase Service Fee', sum.serviceFee, 18, currY); }
  if (sum.tax > 0) { currY += 7; drawTableRow(doc, 'Surcharges and Taxes', sum.tax, 18, currY); }
  if (sum.discount > 0) { currY += 7; drawTableRow(doc, 'Campaign Promo Discount', sum.discount, 18, currY, true); }
  return currY;
}

function drawTotalsBlock(doc: jsPDF, sum: PricingSummary, y: number): void {
  drawText(doc, 'Total Booking Rate:', 130, y, 8, false, [100, 116, 139]);
  drawTextRight(doc, formatIDR(sum.total), 192, y, 8, false, [15, 23, 42]);
  drawText(doc, 'Total Amount Paid:', 130, y + 5, 8, false, [100, 116, 139]);
  drawTextRight(doc, formatIDR(sum.paid), 192, y + 5, 8, false, [15, 23, 42]);
  drawText(doc, 'Outstanding Balance:', 130, y + 10, 8, true, [15, 23, 42]);
  const color = sum.balance > 0 ? [220, 38, 38] : [16, 185, 129];
  drawTextRight(doc, formatIDR(sum.balance), 192, y + 10, 8, true, color);
}

function drawPaymentSummary(doc: jsPDF, booking: InvoiceBooking): void {
  const sum = getPricingSummary(booking);
  let y = 98;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y, 180, 7, 'F');
  drawText(doc, 'BILLING ITEM DESCRIPTION', 18, y + 5, 7, true, [100, 116, 139]);
  drawTextRight(doc, 'AMOUNT', 192, y + 5, 7, true, [100, 116, 139]);
  y += 12;
  drawTableRow(doc, `Lodging Accommodation (${booking.nights} nights)`, sum.roomTotal, 18, y);
  const finalY = drawOptionalRows(doc, sum, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, finalY + 4, 195, finalY + 4);
  drawTotalsBlock(doc, sum, finalY + 9);
}

function drawKeyValuePair(doc: jsPDF, label: string, value: string, x: number, y: number, isBadge = false, badgeColors?: { bg: number[], fg: number[] }): void {
  drawText(doc, label, x, y, 8, true, [100, 116, 139]);
  
  if (isBadge && badgeColors) {
    const badgeW = 22;
    const badgeH = 5;
    doc.setFillColor(badgeColors.bg[0], badgeColors.bg[1], badgeColors.bg[2]);
    doc.rect(x + 40, y - 3.5, badgeW, badgeH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(badgeColors.fg[0], badgeColors.fg[1], badgeColors.fg[2]);
    doc.text(value, x + 40 + (badgeW / 2), y - 3.5 + 3.5, { align: 'center' });
  } else {
    drawText(doc, value, x + 40, y, 8, false, [15, 23, 42]);
  }
}

function drawGatewayDetails(doc: jsPDF, booking: InvoiceBooking, y: number): void {
  drawText(doc, 'PAYMENT & TRANSACTION DETAILS', 15, y, 9, true, [67, 56, 202]);

  const parsedProof = parsePaymentProof(booking.paymentProof?.proofUrl);

  const paymentGateway = parsedProof?.method === 'midtrans' 
    ? 'Midtrans Payment Gateway' 
    : 'StayEase Bank Transfer Audit';

  let rawTxId = parsedProof?.id || 'N/A';
  if (rawTxId.startsWith('midtrans://')) {
    rawTxId = rawTxId.replace('midtrans://', '');
  }
  const transactionId = rawTxId.toUpperCase();

  const referenceNumber = booking.paymentProof?.id || parsedProof?.id || 'N/A';

  const paymentMethod = getHumanReadablePaymentMethod(parsedProof?.method);

  const status = booking.status;
  let paymentStatus = 'PENDING';
  let badgeColors = { bg: [254, 243, 199], fg: [180, 83, 9] };
  
  if (status === 'CONFIRMED' || status === 'COMPLETED') {
    paymentStatus = 'PAID';
    badgeColors = { bg: [209, 250, 229], fg: [16, 185, 129] };
  } else if (status === 'CANCELLED' || status === 'AUTO_EXPIRED') {
    paymentStatus = 'CANCELLED';
    badgeColors = { bg: [254, 226, 226], fg: [239, 68, 68] };
  } else if (status === 'FAILED') {
    paymentStatus = 'FAILED';
    badgeColors = { bg: [254, 226, 226], fg: [239, 68, 68] };
  } else if (status === 'REFUNDED') {
    paymentStatus = 'REFUNDED';
    badgeColors = { bg: [219, 234, 254], fg: [37, 99, 235] };
  }

  const settlementTime = formatSettlementTime(booking.paymentProof?.createdAt || booking.updatedAt);

  let rowY = y + 5;
  drawKeyValuePair(doc, 'Payment Gateway', paymentGateway, 15, rowY);
  rowY += 4.5;
  drawKeyValuePair(doc, 'Transaction ID', transactionId, 15, rowY);
  rowY += 4.5;
  drawKeyValuePair(doc, 'Reference Number', referenceNumber, 15, rowY);
  rowY += 4.5;
  drawKeyValuePair(doc, 'Payment Method', paymentMethod, 15, rowY);
  rowY += 4.5;
  drawKeyValuePair(doc, 'Payment Status', paymentStatus, 15, rowY, true, badgeColors);
  rowY += 4.5;
  drawKeyValuePair(doc, 'Settlement Time', settlementTime, 15, rowY);
}

async function drawQrCodeOnDocument(doc: jsPDF, booking: InvoiceBooking, y: number): Promise<void> {
  const parsedProof = parsePaymentProof(booking.paymentProof?.proofUrl);
  let txId = 'MANUAL-TRANSFER';
  if (parsedProof) {
    let rawId = parsedProof.id;
    if (rawId.startsWith('midtrans://')) {
      rawId = rawId.replace('midtrans://', '');
    }
    txId = rawId || 'MANUAL-TRANSFER';
  }
  const qrContent = `Booking ID: ${booking.id}\nBooking Code: ${booking.bookingCode}\nTransaction ID: ${txId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1, width: 120 });
    doc.addImage(qrDataUrl, 'PNG', 165, y, 30, 30);
    drawText(doc, 'Scan to Verify', 167, y + 33, 7, true, [100, 116, 139]);
  } catch (err) {
    console.error('QR fail', err);
  }
}

async function drawFooterAndQr(doc: jsPDF, booking: InvoiceBooking): Promise<void> {
  const py = 215;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, py, 195, py);
  drawText(doc, 'StayEase Platform', 15, py + 6, 9, true, [15, 23, 42]);
  drawText(doc, 'Automated Billing Desk', 15, py + 10, 7.5, false, [100, 116, 139]);
  drawText(doc, 'Inquiries support: support@stayease.com', 15, py + 14, 7.5, false, [100, 116, 139]);
  drawText(doc, 'This document serves as official reservation & payment receipt.', 15, py + 19, 7.5, false, [100, 116, 139]);
  await drawQrCodeOnDocument(doc, booking, py + 4);
}

async function drawHeader(doc: jsPDF, booking: InvoiceBooking): Promise<void> {
  doc.setFillColor(67, 56, 202);
  doc.rect(0, 0, 210, 5, 'F');
  drawText(doc, 'StayEase', 15, 18, 20, true, [67, 56, 202]);
  drawText(doc, 'Premium Hospitality Platform', 15, 23, 7, false, [100, 116, 139]);
  drawTextRight(doc, 'INVOICE', 195, 18, 22, true, [15, 23, 42]);
  const issueDate = new Date(booking.createdAt).toLocaleDateString('id-ID');
  drawTextRight(doc, `Invoice No: SE-INV-${booking.bookingCode}`, 195, 24, 8, false, [100, 116, 139]);
  drawTextRight(doc, `Booking Code: ${booking.bookingCode}`, 195, 28, 8, true, [15, 23, 42]);
  drawTextRight(doc, `Issue Date: ${issueDate}`, 195, 32, 8, false, [100, 116, 139]);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 36, 195, 36);
}

export async function generateInvoicePdf(booking: InvoiceBooking): Promise<void> {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const imgUrl = booking.property.imageUrls?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  const imgData = await safeLoadImage(imgUrl);
  await drawHeader(doc, booking);
  drawCustomerAndProperty(doc, booking, imgData);
  drawReservationDetails(doc, booking);
  drawPaymentSummary(doc, booking);
  drawGatewayDetails(doc, booking, 164);
  await drawFooterAndQr(doc, booking);
  doc.save(`STAYEASE-INVOICE-${booking.bookingCode}.pdf`);
}
