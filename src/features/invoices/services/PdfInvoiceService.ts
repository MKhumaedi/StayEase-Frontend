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
  drawText(doc, `Host: ${booking.property.tenant?.name || 'StayEase Landlord'}`, 129, y + 13, 7, false, [67, 56, 202]);
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

function drawMethodColumn(doc: jsPDF, booking: InvoiceBooking, x: number, y: number): void {
  const isMidtr = booking.paymentProof?.proofUrl?.startsWith('midtrans://') || booking.paymentProof?.proofUrl?.includes('midtrans');
  const method = isMidtr ? 'Midtrans' : 'Manual Transfer';
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
  drawColumn(doc, 'Guests', `${booking.guestCount} Guest(s)`, 124, y);
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

function drawPaymentStatusBadge(doc: jsPDF, booking: InvoiceBooking, y: number): void {
  const status = booking.status;
  let text = 'PENDING';
  let bg = [254, 243, 199];
  let fg = [180, 83, 9];
  if (status === 'CONFIRMED' || status === 'COMPLETED') {
    text = 'PAID'; bg = [209, 250, 229]; fg = [16, 185, 129];
  } else if (status === 'CANCELLED' || status === 'AUTO_EXPIRED') {
    text = 'CANCELLED'; bg = [254, 226, 226]; fg = [239, 68, 68];
  }
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.rect(15, y, 32, 7, 'F');
  drawText(doc, text, 18, y + 5, 8, true, fg);
}

function drawMidtransDetails(doc: jsPDF, booking: InvoiceBooking, y: number): void {
  const proofUrl = booking.paymentProof?.proofUrl || '';
  const txId = proofUrl.replace('midtrans://', '') || 'MIDTRANS-TX-' + booking.bookingCode;
  drawText(doc, 'Gateway: Midtrans Systems', 15, y, 7.5, false, [100, 116, 139]);
  drawText(doc, `Order ID: ${booking.bookingCode}`, 15, y + 4, 7.5, false, [100, 116, 139]);
  drawText(doc, `Transaction ID: ${txId}`, 15, y + 8, 7.5, false, [15, 23, 42]);
  const setTime = booking.paymentProof ? new Date(booking.paymentProof.createdAt).toLocaleString('id-ID') : 'Verified';
  drawText(doc, `Settlement Time: ${setTime}`, 15, y + 12, 7.5, false, [100, 116, 139]);
}

function drawManualDetails(doc: jsPDF, booking: InvoiceBooking, y: number): void {
  const transDate = booking.paymentProof ? new Date(booking.paymentProof.createdAt).toLocaleDateString('id-ID') : 'N/A';
  const verDate = new Date(booking.updatedAt).toLocaleDateString('id-ID');
  drawText(doc, 'Pathway: Manual Bank Transfer Inquiry', 15, y, 7.5, false, [100, 116, 139]);
  drawText(doc, `Transfer Slip Uploaded: ${transDate}`, 15, y + 4, 7.5, false, [100, 116, 139]);
  drawText(doc, `Verification Stamp: ${verDate}`, 15, y + 8, 7.5, false, [15, 23, 42]);
  drawText(doc, 'Ledger Auditing Status: Approved & Reconciled', 15, y + 12, 7.5, false, [16, 185, 129]);
}

function drawGatewayDetails(doc: jsPDF, booking: InvoiceBooking, y: number): void {
  const isMidtr = booking.paymentProof?.proofUrl?.startsWith('midtrans://') || booking.paymentProof?.proofUrl?.includes('midtrans');
  drawText(doc, 'TRANSACTION PROCESSOR DETAILS', 15, y, 8, true, [67, 56, 202]);
  if (isMidtr) {
    drawMidtransDetails(doc, booking, y + 5);
  } else {
    drawManualDetails(doc, booking, y + 5);
  }
}

async function drawQrCodeOnDocument(doc: jsPDF, booking: InvoiceBooking, y: number): Promise<void> {
  const proofUrl = booking.paymentProof?.proofUrl || '';
  const txId = proofUrl.startsWith('midtrans://') ? proofUrl.replace('midtrans://', '') : 'MANUAL-TRANSFER';
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
  drawPaymentStatusBadge(doc, booking, 145);
  drawGatewayDetails(doc, booking, 158);
  await drawFooterAndQr(doc, booking);
  doc.save(`STAYEASE-INVOICE-${booking.bookingCode}.pdf`);
}
